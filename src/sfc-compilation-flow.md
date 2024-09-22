# Flow of SFC Compilation

Now, let's look at the implementation to produce the final output code.

Once again,

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

is transformed into

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

This is how we create it.

Since we've already understood the most complex rendering output from the previous page, we should be able to proceed smoothly from here.

## Reading `compiler-sfc` and `vite-plugin-vue`

From here on, it's more about the implementation of `compiler-sfc` and `vite-plugin-vue` rather than Vapor Mode.

In the non-Vapor case, generally, it becomes like:

```js
const _sfc_main = {};
import { createElement as _createElement } from "vue";

function _sfc_render(_ctx) {
  return _createElement("p", null, "Hello, World!");
}
export default Object.assign(_sfc_main, {
  render: _sfc_render,
  __file: "/path/to/App.vue",
});
```

The surrounding code and transformation flow do not change.

The compiler is just called at the appropriate timing, implemented in `compiler-vapor`.

## When is the SFC Compiled?

As you can see from the entry point of `compiler-sfc`, only separate compilers are exported here.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/index.ts#L4-L7

There is no implementation here that handles these in an integrated manner.

### Vite's Plugin System

As mentioned at the beginning, these implementations are called by tools like bundlers, and each compilation is executed.

There are various tools, but let's look at this assuming `Vite`.

In `Vite`, the official plugin `vite-plugin-vue` is famous for this role.

https://github.com/vitejs/vite-plugin-vue

The plugin becomes effective by setting it in `vite.config.js`.

When you use Vue.js with Vite, you might write something like this:

```js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});
```

This `vue()` generates the plugin code.

Before looking at the implementation of this plugin, let's first grasp the concept of plugins in Vite.

Mainly, the important hook is `transform`.

https://vitejs.dev/guide/api-plugin.html#simple-examples

As a premise, Vite's plugin system is a superset of Rollup's, and in production builds, Rollup's plugin system is actually used.

https://vitejs.dev/guide/api-plugin.html#plugin-api

> Vite plugins extend Rollup's well-designed plugin interface with a few extra Vite-specific options. As a result, you can write a Vite plugin once and have it work for both dev and build.

### `transform` Hook

When implementing a plugin, you can transform modules by writing processes in this `transform` hook.

Roughly, you can compile SFCs by running the compiler here.

Then, when is this `transform` executed? Generally, it's when the module is loaded from JavaScript.

More specifically, when `import` or `import()` is executed.

#### Development Mode

When the `import` is executed depends on the mode.

In development mode, the JavaScript with the `import` is loaded in the browser, and when it's executed, a request is sent to the development server using the browser's Native ESM mechanism.

The development server handles it, executes `transform`, and returns the result to the browser.

From there, it's the same as Native ESM.

This mechanism is implemented by Vite.

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/transformRequest.ts#L67-L71

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/transformRequest.ts#L126

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/transformRequest.ts#L190-L198

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/transformRequest.ts#L344-L346

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/pluginContainer.ts#L456-L469

#### Production Mode

In production mode builds, the `rollup` bundler runs.

The bundler reads `import` when resolving modules.

At that time, it executes `transform` and uses the result as the resolved result.

This is implemented by Rollup.

Vite is roughly just calling Rollup's `bundle` function.

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/build.ts#L507-L509

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/build.ts#L838-L840

Code where Rollup calls `transform`:

https://github.com/rollup/rollup/blob/79c0aba353ca84c0e22c3cfe9eee433ba83f3670/src/utils/transform.ts#L31-L36

https://github.com/rollup/rollup/blob/79c0aba353ca84c0e22c3cfe9eee433ba83f3670/src/utils/transform.ts#L102-L103

https://github.com/rollup/rollup/blob/79c0aba353ca84c0e22c3cfe9eee433ba83f3670/src/ModuleLoader.ts#L327-L329

https://github.com/rollup/rollup/blob/79c0aba353ca84c0e22c3cfe9eee433ba83f3670/src/utils/PluginDriver.ts#L191-L213

### `transform` Hook in `vite-plugin-vue`

The implementation of the `transform` hook in `vite-plugin-vue` is around here.

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/index.ts#L320-L341

Here, it executes a function called `transformMain`.

`transformMain` is implemented in [vite-plugin-vue/packages/plugin-vue/src/main.ts](https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts).

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L30-L37

In this, `compileScript` and `compileTemplate` from `compiler-sfc` are called.

This should make it clear how Vue.js's compiler is set up and when it is executed.

## Grasping the Whole Output Code by Calling `transformMain`

Recall such a compilation result.

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

How should we output code like this? Generally,

```js
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

This part is generated by a function called `compileTemplate`.

```js
const _sfc_main = {};

// <---------------- insert compileTemplate result

export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

If there is a `<script>` or `<script setup>`, code like this is generated, mainly by `compileScript`:

```js
const constant = 42;

const _sfc_main = {
  props: {
    count: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const localCount = ref(0);
    return { localCount };
  },
};

// <---------------- insert compileTemplate result

export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

In other words, it's like:

```js
// <---------------- insert compileScript result

// <---------------- insert compileTemplate result

export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

Then, the last part where properties are added to `_sfc_main` is collected as `attachedProps` and expanded as code.

The source code for the above discussion is in the following parts.

(They are calling `genScriptCode` and `genTemplateCode` instead of `compileScript` and `compileTemplate`, but think of them as wrapper functions.)

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L68

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L71-L94

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L122-L127

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L231-L236

(The joined `output` becomes the final result.)

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L240

(Note: Collection of `attachedProps`)

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L96-L100

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L131-L137

In this way, roughly speaking, we generate the final code like:

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

## Switching the Vapor Mode Compiler

Finally, let's look at how to switch between the Vapor Mode compiler and the regular compiler before ending this page. In fact, `vite-plugin-vue` has a `vapor` branch dedicated to Vapor Mode.

This is because Vapor Mode is currently in the R&D stage. The `vuejs/core-vapor` is being developed separately to avoid impacting the existing codebase. The same applies to `vite-plugin-vue`.

It's somewhat inevitable that something like compiler switching partially intrudes into `vite-plugin-vue`. This is circumvented by switching branches and changing the npm package distribution name.

Here is the branch:

https://github.com/vitejs/vite-plugin-vue/tree/vapor

The distributed package is this, provided as `@vue-vapor/vite-plugin-vue`:

https://www.npmjs.com/package/@vue-vapor/vite-plugin-vue

This branch provides a flag to switch whether it is `vapor` or not. To be precise, this option is intended to fall through to the implementation of `vuejs/core-vapor`, so it's described to omit from the type.

https://github.com/vitejs/vite-plugin-vue/blob/d8e849f147c159de90c1758f7001bcd2fcc534df/packages/plugin-vue/src/index.ts#L42-L55

https://github.com/vitejs/vite-plugin-vue/blob/d8e849f147c159de90c1758f7001bcd2fcc534df/packages/plugin-vue/src/index.ts#L67-L83

In other words, the definitions themselves exist in `SFCScriptCompileOptions` and `SFCTemplateCompileOptions`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/compileScript.ts#L128-L131

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/compileTemplate.ts#L60

After that, you can switch the compiler by passing this flag as an argument when setting up the plugin. For reference, in the `vuejs/core-vapor` playground, it is set up as follows:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/playground/vite.config.ts#L18-L22

Then, as long as the implementation switches the compiler based on the flag that has fallen through from here, it should work. This implementation is done below:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/compileTemplate.ts#L212-L218

:::info About the Compiler Switching API
In the future, switching the compiler will be possible per component. Although the API is not yet decided, something like `<script vapor>` is proposed.

Incidentally, the formulation of the API is being discussed in the following issue:

https://github.com/vuejs/core-vapor/issues/198
:::
