# What's Next?

Well, up to this point, we have looked at compiling a simple component like

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

into

```js
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

We have seen the implementation that compiles this.

What should we look at next?

## Where Are We Now?

Let's briefly review what we need to do and the steps involved.

#### Things to Do

- **Look at the implementation that produces the output**
- **Read the contents of the generated code**

#### Steps

1. Write a Vue.js SFC
2. Run it through the Vapor Mode compiler
3. Look at the output (understand the overview)
4. Look at the compiler's implementation
5. Read the contents of the generated code
6. Return to step 1

First, up to this point, we have completed the first part of what we need to do: "Look at the implementation that produces the output." In terms of the steps, we have completed 1 to 4 (for a simple component).

## Going Forward

Let's organize what we need to do next.

### Code Surrounding the SFC Compiler

#### Surrounding Code

At this point, we have only been able to see the part:

```js
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

However, the actual output was like:

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

We are missing a bit.

Since the most complex part seems to be over, it would be good to briefly look at how the surrounding code is generated. We will touch on this briefly on the next page.

#### Where the Compiler is Configured and Called

In fact, we haven't explained this part in much detail. Although we have read about the implementation details of the parser, transformer, and codegen functions that the compiler has, we have yet to see where they are configured, how they are connected, and how they operate. Let's look into this as well.

### Runtime

And this is important.

Assuming we understand that code like the following is generated:

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

We still haven't seen "how this code works." We haven't yet looked into why passing a `Block` to the render function results in rendering the screen, among other aspects.

This is the so-called "runtime" part, and its implementation is in `runtime-vapor`. To deepen our understanding of the implementation of Vapor Mode, understanding this runtime is essential.

Let's delve into this as well. In terms of our steps, this corresponds to step 5.

If we break down this part a bit more:

1. Look at what helper functions used in the generated code (e.g., `template`) are
2. See how this component is connected to Vue.js's internal implementation
3. Look at the internal implementation

Something like that.

### Components with Various Patterns

Currently,

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

we have only dealt with a simple component like this.

When it comes to Vue.js components, they have various features such as having a `<script>` section, stateful components, mustaches, directives, and more. \
Let's explore these as well, following the steps 1 to 6 above.

Let's aim for complete mastery! (Haha)
