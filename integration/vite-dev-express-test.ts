import fs from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { createFixtureProject, js } from "./helpers/create-fixture.js";
import { kill, node } from "./helpers/dev.js";

let projectDir: string;
let dev: { pid: number; port: number };

test.beforeAll(async () => {
  let port = await getPort();
  let hmrPort = await getPort();
  projectDir = await createFixtureProject({
    compiler: "vite",
    files: {
      "vite.config.mjs": js`
        import { defineConfig } from "vite";
        import { unstable_vitePlugin as remix } from "@remix-run/dev";

        export default defineConfig({
          server: {
            hmr: {
              port: ${hmrPort}
            }
          },
          optimizeDeps: {
            include: ["react", "react-dom/client"],
          },
          plugins: [remix()],
        });
      `,
      "server.mjs": js`
        import {
          unstable_createViteServer,
          unstable_loadViteServerBuild,
        } from "@remix-run/dev";
        import { createRequestHandler } from "@remix-run/express";
        import { installGlobals } from "@remix-run/node";
        import express from "express";

        installGlobals();

        let vite =
          process.env.NODE_ENV === "production"
            ? undefined
            : await unstable_createViteServer();

        const app = express();

        if (vite) {
          app.use(vite.middlewares);
        } else {
          app.use(
            "/build",
            express.static("public/build", { immutable: true, maxAge: "1y" })
          );
        }
        app.use(express.static("public", { maxAge: "1h" }));

        app.all(
          "*",
          createRequestHandler({
            build: vite
              ? () => unstable_loadViteServerBuild(vite)
              : await import("./build/index.js"),
          })
        );

        const port = ${port};
        app.listen(port, () => console.log('http://localhost:' + port));
      `,
      "app/root.tsx": js`
        import { Links, Meta, Outlet, Scripts, LiveReload } from "@remix-run/react";

        export default function Root() {
          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <div id="content">
                  <h1>Root</h1>
                  <Outlet />
                </div>
                <LiveReload />
                <Scripts />
              </body>
            </html>
          );
        }
      `,
      "app/routes/_index.tsx": js`
        // imports
        import { useState, useEffect } from "react";

        // loader

        export default function IndexRoute() {
          // hooks
          const [mounted, setMounted] = useState(false);
          useEffect(() => {
            setMounted(true);
          }, []);

          return (
            <div id="index">
              <h2 data-title>Index</h2>
              <input />
              <p data-mounted>Mounted: {mounted ? "yes" : "no"}</p>
              <p data-hmr>HMR updated: 0</p>
              {/* elements */}
            </div>
          );
        }
      `,
    },
  });
  dev = await node(projectDir, ["./server.mjs"], { port });
});

test.afterAll(async () => {
  await kill(dev.pid);
});

test("Vite custom server HMR & HDR", async ({ page }) => {
  // setup: initial render
  await page.goto(`http://localhost:${dev.port}/`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("#index [data-title]")).toHaveText("Index");

  // setup: hydration
  await expect(page.locator("#index [data-mounted]")).toHaveText(
    "Mounted: yes"
  );

  // setup: browser state
  let hmrStatus = page.locator("#index [data-hmr]");
  await expect(hmrStatus).toHaveText("HMR updated: 0");
  let input = page.locator("#index input");
  await expect(input).toBeVisible();
  await input.type("stateful");

  // route: HMR
  await edit("app/routes/_index.tsx", (contents) =>
    contents.replace("HMR updated: 0", "HMR updated: 1")
  );
  await page.waitForLoadState("networkidle");
  await expect(hmrStatus).toHaveText("HMR updated: 1");
  await expect(input).toHaveValue("stateful");

  // route: add loader
  await edit("app/routes/_index.tsx", (contents) =>
    contents
      .replace(
        "// imports",
        `// imports\nimport { json } from "@remix-run/node";\nimport { useLoaderData } from "@remix-run/react"`
      )
      .replace(
        "// loader",
        `// loader\nexport const loader = () => json({ message: "HDR updated: 0" });`
      )
      .replace(
        "// hooks",
        "// hooks\nconst { message } = useLoaderData<typeof loader>();"
      )
      .replace(
        "{/* elements */}",
        `{/* elements */}\n<p data-hdr>{message}</p>`
      )
  );
  await page.waitForLoadState("networkidle");
  let hdrStatus = page.locator("#index [data-hdr]");
  await expect(hdrStatus).toHaveText("HDR updated: 0");
  // React Fast Refresh cannot preserve state for a component when hooks are added or removed
  await expect(input).toHaveValue("");
  await input.type("stateful");

  // route: HDR
  await edit("app/routes/_index.tsx", (contents) =>
    contents.replace("HDR updated: 0", "HDR updated: 1")
  );
  await page.waitForLoadState("networkidle");
  await expect(hdrStatus).toHaveText("HDR updated: 1");
  await expect(input).toHaveValue("stateful");

  // route: HMR + HDR
  await edit("app/routes/_index.tsx", (contents) =>
    contents
      .replace("HMR updated: 1", "HMR updated: 2")
      .replace("HDR updated: 1", "HDR updated: 2")
  );
  await page.waitForLoadState("networkidle");
  await expect(hmrStatus).toHaveText("HMR updated: 2");
  await expect(hdrStatus).toHaveText("HDR updated: 2");
  await expect(input).toHaveValue("stateful");

  // create new non-route component module
  await fs.writeFile(
    path.join(projectDir, "app/component.tsx"),
    js`
    export function MyComponent() {
      return <p data-component>Component HMR: 0</p>;
    }
    `,
    "utf8"
  );
  await edit("app/routes/_index.tsx", (contents) =>
    contents
      .replace(
        "// imports",
        `// imports\nimport { MyComponent } from "../component";`
      )
      .replace("{/* elements */}", "{/* elements */}\n<MyComponent />")
  );
  await page.waitForLoadState("networkidle");
  let component = page.locator("#index [data-component]");
  await expect(component).toBeVisible();
  await expect(component).toHaveText("Component HMR: 0");
  await expect(input).toHaveValue("stateful");

  // non-route: HMR
  await edit("app/component.tsx", (contents) =>
    contents.replace("Component HMR: 0", "Component HMR: 1")
  );
  await page.waitForLoadState("networkidle");
  await expect(component).toHaveText("Component HMR: 1");
  await expect(input).toHaveValue("stateful");

  // create new non-route server module
  await fs.writeFile(
    path.join(projectDir, "app/indirect-hdr-dep.ts"),
    js`export const indirect = "indirect 0"`,
    "utf8"
  );
  await fs.writeFile(
    path.join(projectDir, "app/direct-hdr-dep.ts"),
    js`
      import { indirect } from "./indirect-hdr-dep"
      export const direct = "direct 0 & " + indirect
    `,
    "utf8"
  );
  await edit("app/routes/_index.tsx", (contents) =>
    contents
      .replace(
        "// imports",
        `// imports\nimport { direct } from "../direct-hdr-dep"`
      )
      .replace(
        `json({ message: "HDR updated: 2" })`,
        `json({ message: "HDR updated: " + direct })`
      )
  );
  await page.waitForLoadState("networkidle");
  await expect(hdrStatus).toHaveText("HDR updated: direct 0 & indirect 0");
  await expect(input).toHaveValue("stateful");

  // non-route: HDR for direct dependency
  await edit("app/direct-hdr-dep.ts", (contents) =>
    contents.replace("direct 0 &", "direct 1 &")
  );
  await page.waitForLoadState("networkidle");
  await expect(hdrStatus).toHaveText("HDR updated: direct 1 & indirect 0");
  await expect(input).toHaveValue("stateful");

  // non-route: HDR for indirect dependency
  await edit("app/indirect-hdr-dep.ts", (contents) =>
    contents.replace("indirect 0", "indirect 1")
  );
  await page.waitForLoadState("networkidle");
  await expect(hdrStatus).toHaveText("HDR updated: direct 1 & indirect 1");
  await expect(input).toHaveValue("stateful");

  // everything everywhere all at once
  await Promise.all([
    edit("app/routes/_index.tsx", (contents) =>
      contents
        .replace("HMR updated: 2", "HMR updated: 3")
        .replace("HDR updated: ", "HDR updated: route & ")
    ),
    edit("app/component.tsx", (contents) =>
      contents.replace("Component HMR: 1", "Component HMR: 2")
    ),
    edit("app/direct-hdr-dep.ts", (contents) =>
      contents.replace("direct 1 &", "direct 2 &")
    ),
    edit("app/indirect-hdr-dep.ts", (contents) =>
      contents.replace("indirect 1", "indirect 2")
    ),
  ]);
  await page.waitForLoadState("networkidle");
  await expect(hmrStatus).toHaveText("HMR updated: 3");
  await expect(component).toHaveText("Component HMR: 2");
  await expect(hdrStatus).toHaveText(
    "HDR updated: route & direct 2 & indirect 2"
  );
  await expect(input).toHaveValue("stateful");
});

async function edit(file: string, transform: (contents: string) => string) {
  let filepath = path.join(projectDir, file);
  let contents = await fs.readFile(filepath, "utf8");
  await fs.writeFile(filepath, transform(contents), "utf8");
}
