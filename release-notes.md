## Minor Changes

### View Transitions

We're excited to officially release experimental support for the the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition) in React Router! You can now trigger navigational DOM updates to be wrapped in `document.startViewTransition` to enable CSS animated transitions on SPA navigations in your application. ([#10916](https://github.com/remix-run/react-router/pull/10916))

The simplest approach to enabling a View Transition in your React Router app is via the new `<Link unstable_viewTransition>` prop. This will cause the navigation DOM update to be wrapped in `document.startViewTransition` which will enable transitions for the DOM update. Without any additional CSS styles, you'll get a basic cross-fade animation for your page.

If you need to apply more fine-grained styles for your animations, you can leverage the `unstable_useViewTransitionState` hook which will tell you when a transition is in progress and you can use that to apply classes or styles:

```jsx
function ImageLink(to, src, alt) {
  const isTransitioning = unstable_useViewTransitionState(to);
  return (
    <Link to={to} unstable_viewTransition>
      <img
        src={src}
        alt={alt}
        style={{
          viewTransitionName: isTransitioning ? "image-expand" : "",
        }}
      />
    </Link>
  );
}
```

You can also use the `<NavLink unstable_viewTransition>` shorthand which will manage the hook usage for you and automatically add a `transitioning` class to the `<a>` during the transition:

```css
a.transitioning img {
  view-transition-name: "image-expand";
}
```

```jsx
<NavLink to={to} unstable_viewTransition>
  <img src={src} alt={alt} />
</NavLink>
```

For an example usage of View Transitions with React Router, check out [our fork](https://github.com/brophdawg11/react-router-records) of the [Astro Records](https://github.com/Charca/astro-records) demo.

For more information on using the View Transitions API, please refer to the [Smooth and simple transitions with the View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) guide from the Google Chrome team.

### Stable `createRemixStub`

After real-world experience, we're confident in the `createRemixStub` API and ready to commit to it, so in `2.1.0` we've removed the `unstable_` prefix. ([#7647](https://github.com/remix-run/remix/pull/7647))

⚠️ Please note that this did involve 1 _small_ breaking change - the `<RemixStub remixConfigFuture>` prop has been renamed to `<RemixStub future>` to decouple the `future` prop from a specific file location.

## Patch Changes

- Log a warning and fail gracefully in `ScrollRestoration` when `sessionStorage` is unavailable ([#10848](https://github.com/remix-run/react-router/pull/10848))
- Fix `RouterProvider` `future` prop type to be a `Partial<FutureConfig>` so that not all flags must be specified ([#10900](https://github.com/remix-run/react-router/pull/10900))
- Allow 404 detection to leverage root route error boundary if path contains a URL segment ([#10852](https://github.com/remix-run/react-router/pull/10852))
- Fix `ErrorResponse` type to avoid leaking internal field ([#10876](https://github.com/remix-run/react-router/pull/10876))

**Full Changelog**: [`6.16.0...6.17.0`](https://github.com/remix-run/react-router/compare/react-router@6.16.0...react-router@6.17.0)

---

## Minor Changes

### View Transitions

We're excited to officially release experimental support for the the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition) in Remix! You can now trigger navigational DOM updates to be wrapped in `document.startViewTransition` to enable CSS animated transitions on SPA navigations in your application. ([#10916](https://github.com/remix-run/react-router/pull/10916))

The simplest approach to enabling a View Transition in your Remix app is via the new `<Link unstable_viewTransition>` prop. This will cause the navigation DOM update to be wrapped in `document.startViewTransition` which will enable transitions for the DOM update. Without any additional CSS styles, you'll get a basic cross-fade animation for your page.

If you need to apply more fine-grained styles for your animations, you can leverage the `unstable_useViewTransitionState` hook which will tell you when a transition is in progress and you can use that to apply classes or styles:

```jsx
function ImageLink(to, src, alt) {
  const isTransitioning = unstable_useViewTransitionState(to);
  return (
    <Link to={to} unstable_viewTransition>
      <img
        src={src}
        alt={alt}
        style={{
          viewTransitionName: isTransitioning ? "image-expand" : "",
        }}
      />
    </Link>
  );
}
```

You can also use the `<NavLink unstable_viewTransition>` shorthand which will manage the hook usage for you and automatically add a `transitioning` class to the `<a>` during the transition:

```css
a.transitioning img {
  view-transition-name: "image-expand";
}
```

```jsx
<NavLink to={to} unstable_viewTransition>
  <img src={src} alt={alt} />
</NavLink>
```

For an example usage of View Transitions, check out [our fork](https://github.com/brophdawg11/react-router-records) of the [Astro Records](https://github.com/Charca/astro-records) demo (which uses React Router but so does Remix 😉).

For more information on using the View Transitions API, please refer to the [Smooth and simple transitions with the View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) guide from the Google Chrome team.

## Patch Changes

- Emulate types for `JSON.parse(JSON.stringify(x))` in `SerializeFrom` ([#7605](https://github.com/remix-run/remix/pull/7605))
  - Notably, type fields that are only assignable to `undefined` after serialization are now omitted since `JSON.stringify |> JSON.parse` will omit them. See test cases for examples
  - This fixes type errors when upgrading to v2 from 1.19
- Avoid mutating `meta` object when `tagName` is specified ([#7594](https://github.com/remix-run/remix/pull/7594))
- Fix FOUC on subsequent client-side navigations to `route.lazy` routes ([#7576](https://github.com/remix-run/remix/pull/7576))
- Export the proper Remix `useMatches` wrapper to fix `UIMatch` typings ([#7551](https://github.com/remix-run/remix/pull/7551))
- `@remix-run/cloudflare` - sourcemap takes into account special chars in output file ([#7574](https://github.com/remix-run/remix/pull/7574))
- `@remix-run/express` - Flush headers for `text/event-stream` responses ([#7619](https://github.com/remix-run/remix/pull/7619))

## Changes by Package

- [`create-remix`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/create-remix/CHANGELOG.md#210)
- [`@remix-run/architect`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-architect/CHANGELOG.md#210)
- [`@remix-run/cloudflare`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-cloudflare/CHANGELOG.md#210)
- [`@remix-run/cloudflare-pages`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-cloudflare-pages/CHANGELOG.md#210)
- [`@remix-run/cloudflare-workers`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-cloudflare-workers/CHANGELOG.md#210)
- [`@remix-run/css-bundle`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-css-bundle/CHANGELOG.md#210)
- [`@remix-run/deno`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-deno/CHANGELOG.md#210)
- [`@remix-run/dev`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-dev/CHANGELOG.md#210)
- [`@remix-run/eslint-config`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-eslint-config/CHANGELOG.md#210)
- [`@remix-run/express`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-express/CHANGELOG.md#210)
- [`@remix-run/node`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-node/CHANGELOG.md#210)
- [`@remix-run/react`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-react/CHANGELOG.md#210)
- [`@remix-run/serve`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-serve/CHANGELOG.md#210)
- [`@remix-run/server-runtime`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-server-runtime/CHANGELOG.md#210)
- [`@remix-run/testing`](https://github.com/remix-run/remix/blob/remix%402.1.0/packages/remix-testing/CHANGELOG.md#210)

---

**Full Changelog**: [`2.0.1...2.1.0`](https://github.com/remix-run/remix/compare/remix@2.0.1...remix@2.1.0)
