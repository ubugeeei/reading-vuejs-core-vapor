# Reading a Simple Component

Let's use the Playground to read the simplest component.

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

The output result will be as follows. \
*Note: Code related to HMR may be output, but we will omit it this time as it is not relevant.*

```js
const _sfc_main = {};
import { template as _template } from "vue/vapor"; // *Note: Due to Vite's constraints, this actually points to a path on the filesystem, but we'll simplify it here.*
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
import _export_sfc from "/@id/__x00__plugin-vue:export-helper";
export default /*#__PURE__*/ _export_sfc(_sfc_main, [
  ["render", _sfc_render],
  ["vapor", true],
  ["__file", "/path/to/App.vue"],
]);
```

The latter part may be a bit confusing, so think of it roughly as the following.

```js
const _sfc_main = {};
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

Let's interpret this. \
As explained in the approach, what we should read are the "implementation that produces the output" and the "content of the generated code". The steps are:

1. Write a Vue.js SFC
2. Run it through the Vapor Mode compiler
3. Look at the output (understand the overview)
4. Look at the compiler's implementation
5. Read the contents of the output code
6. Return to step 1

So far, we've done steps 1 and 2, so let's look at the overview of the output next.

## Understanding the Overview of the Output

First, when you write a component, you might do something like:

```ts
export default {
  /* options */
};
```

or

```ts
export default defineComponent({
  /* options */
});
```

which exports a component object as the default export.

In the output code:

```js
const _sfc_main = {};
// ...
export default _sfc_main;
```

This is exactly that. \
And you can see that `_sfc_render` is set as the render option of this object.

```js
_sfc_main.render = _sfc_render;
```

So far, there's not much difference from traditional Vue.js. \
Now, let's look at the content of `_sfc_render`, which is the crux of Vapor.

```js
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

Using a function `template` exported from `vue/vapor`, we define a template, generate a Node, and use that as the result of the render function. \
As you might guess from `t0` and `n0`, when we define more complex templates, we'll have `t1`, `n1`, and so on. \
These `n0`, `n1`, etc., can be thought of roughly as `HTMLElement`. In this case, a `p` element will go in there.

I think you now understand the overview of the output.

---

In summary, the compiler compiles:

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

into:

```js
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

Next, let's actually look at the implementation of the compiler. \
To do that, it's important to grasp the overview of the compiler's implementation first.
