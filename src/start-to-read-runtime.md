# Start Reading the Runtime

Now that we have followed through the implementation that compiles

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

we can now look at how the resulting code

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

actually works!

## vue/vapor

We've been overlooking it, but we haven't explained this package yet.\
This is the entry point for Vapor Mode.

The source code is located in [packages/vue/vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue/vapor).

There is another entry package for Vapor Mode called [packages/vue-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue-vapor), but `vue/vapor` simply imports this package.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue-vapor/package.json#L2

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue/vapor/index.mjs#L1

We import the helper functions necessary for the Vapor runtime from this `vue/vapor`.

## template Function

This is one of the helper functions for Vapor.

```js
import { template } from "vue/vapor";
const t0 = template("<p>Hello, Vapor!</p>");
const n0 = t0();
```

This is how you declare a template and obtain a `Block`.

Let's look at the implementation of the `template` function.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/template.ts#L2-L11

It stores the string passed as an argument into the `innerHTML` of a temporary `template` element and obtains the `Block` by reading the `firstChild` of the `template`.\
The node created once is kept as a local variable of this function, and subsequent calls result in a `cloneNode`.

```js
import { template } from "vue/vapor";
const t0 = template("<p>Hello, Vapor!</p>");
const n0 = t0();
const n1 = t0(); // clone node
```

As seen in the following code,

```js
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

in Vapor Mode, the render function of the component just returns a DOM element for this code.

## Application Entry Point

Now, let's understand the application's entry point to see how this component works.

When building an app with Vue.js, it is often written like this:

```ts
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

The same applies to Vapor Mode. We use `createVaporApp` instead of `createApp`.

```ts
import { createVaporApp } from "vue/vapor";
import App from "./App.vue";

createVaporApp(App).mount("#app");
```

In other words, if we read the implementation of `createVaporApp`, we can understand how this component works.

## createVaporApp

The implementation is located in [packages/runtime-vapor/src/apiCreateVaporApp.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts).

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L22-L25

It is almost the same as `createApp` in `runtime-core`.

First, it creates the application's context and creates an `App` instance.\
This `App` instance has a method called `mount`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L38

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L43-L51

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L112

There are also `component` functions for registering components and `use` functions for using plugins.\
It is mostly the same as traditional Vue.js.

## App.mount

Let's look at the process of the `mount` function.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L112-L151

It treats the selector or element passed as an argument as a container.

The implementation of the `normalizeContainer` function is like this:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L114-L118

After that, it performs `createComponentInstance`, `setupComponent`, and `render` (initial) to complete the mount process.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L123-L131

## createComponentInstance

`createComponentInstance` creates an object called `ComponentInternalInstance`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L262-L269

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L151-L151

`ComponentInternalInstance` holds internal component information, such as registered lifecycle, props, emit information, state, etc.
It also holds the definition of the provided component.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L191-L234

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L167-L181

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L288

This is also mostly the same as `runtime-core`.

In `createComponentInstance`, it not only generates a `ComponentInternalInstance` object but also creates an `EffectScope` and initializes `props`, `emit`, and `slot`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L360-L364

A unique implementation for Vapor is that it holds a `block`.\
Traditionally, it held a `VNode` (virtual DOM) as `subTree` or `next`, but in Vapor, it holds a `Block`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L158

Traditional:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/component.ts#L324-L332

From now on, the `Block` will be stored here when rendered.

We'll revisit props, emit, and slot handling when we run components that use them.\
We'll skip them for now.

## setupComponent

Now, let's move on to the rendering process.\
This is the essence of Vapor Mode.

Previously, in the file [`renderer.ts`](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/renderer.ts), the [`patch` process of the `VNode`](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/renderer.ts#L386-L396) was performed.

In Vapor Mode, there is no VNode or patch, so the initial setup process is everything.\
Subsequent updates directly manipulate the DOM (Block) via the reactivity system.

For now, since we don't have any state, let's see how the Block obtained from the render function is handled.

This function is located in a file called [packages/runtime-vapor/src/apiRender.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts), which implements the rendering processes.

First, as soon as we enter `setupComponent`, we set the `currentInstance` to the target component.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L40

Next, various setups are executed within the effectScope generated in `createComponentInstance`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L41

We won't go into detail about effectScope since it's part of the Vue.js API, but for those who don't know, it's essentially "a way to collect effects and make them easier to clean up later."

https://vuejs.org/api/reactivity-advanced.html#effectscope

By forming various effects within this scope, we can clean up when the component is unmounted by stopping the effectScope.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L155-L161

Now, let's see what exactly is done within the effectScope.

## setupComponent > effectScope

First is handling the setup function.\
If the component itself is a function, it is executed as a function component.\
If it is an object, the setup function is extracted.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L50

Then, this function is executed.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L56-L61

The result will be either a state or a Node.

If the result is a Node (or a fragment or component), it is stored in a variable called `block`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L65-L74

After this, if there is still nothing in the `block` variable, it attempts to obtain the block from the render function.\
In this component, it enters this branch, and the render function is executed, storing the block (`n0`).

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L78-L87

At this point, the block is stored in `instance.block`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L96

And that's it for setting up the screen update.\
As we'll see when looking at the compilation results of more complex components, most update processes are directly described as effects in the component.

Therefore, rendering a component is as simple as executing the setup function (which defines the state) and generating the block with the render function (where the effect is formed).

All that's left is to mount the block obtained from the render function to the DOM.

## render

At the end of https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L123-L131, we have the `render` part.\
This `render` function is an internal function and is different from the `render` function of the component.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L12-L15

Like `setupComponent`, it is implemented in [packages/runtime-vapor/src/apiRender.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts).

What it does is very simple: it mounts the component and executes the tasks in the queue (scheduler).\
(※ You don't need to worry about the scheduler for now.)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L106-L112

`mountComponent` is also very simple.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L120-L123

It sets the container (the DOM selected from `#app` in this case) passed as an argument to `instance.container`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L124-L124

Then, it executes the beforeMount hook.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L130-L131

Finally, it inserts the block into the container.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L133

(The insert function is really just an insert.)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/element.ts#L23-L29

After executing the mounted hook, the component's mount is complete.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L135-L142

## Summary

We've seen how the compiled code like

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

works, which is just to create a component instance, execute the setup function (if available), call the `render` function to get the block, and then `app.mount(selector)` to insert the block into the selector.

It's very simple.

Now we understand how a SFC like

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

is compiled and works in the runtime!

The steps are:

1. Write a Vue.js SFC.
2. Run it through the Vapor Mode compiler.
3. Look at the output (get an overview).
4. Check the implementation of the compiler.
5. Read the output code.
6. Go back to step 1.

We have completed up to step 5.

Let's go back to step 1 and look at more complex components in the same way!
