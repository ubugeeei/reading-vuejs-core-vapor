# Directory Structure of core-vapor

:::info About Repository Terminology
In the following explanation, topics that apply to both vuejs/core and vuejs/core-vapor will be referred to as the **v3 repository**. (For example, "In the v3 repository, ~~~") \
By distinguishing what is specific to core-vapor and what comes from the original (vuejs/core), we can understand core-vapor by anticipating the differences.
:::

## Main Packages

The v3 repository is managed as a monorepo using [pnpm workspace](https://pnpm.io/workspaces). \
Each package is located in the `/packages` directory.\
[https://github.com/vuejs/core-vapor/packages](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages)

These packages are broadly divided into two categories: compiler and runtime. \
Packages starting with `compiler-` are related to the compiler, and those starting with `runtime-` are related to the runtime.

- [https://github.com/vuejs/core-vapor/packages/compiler-core](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core)
- [https://github.com/vuejs/core-vapor/packages/compiler-dom](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-dom)
- [https://github.com/vuejs/core-vapor/packages/compiler-sfc](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc)
- [https://github.com/vuejs/core-vapor/packages/runtime-core](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core)
- [https://github.com/vuejs/core-vapor/packages/runtime-dom](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-dom)

---

In core-vapor, new packages `compiler-vapor` and `runtime-vapor` have been added.

- [https://github.com/vuejs/core-vapor/packages/compiler-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor)
- [https://github.com/vuejs/core-vapor/packages/runtime-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor)

---

Next, an important package is `reactivity`. \
Implementations like `ref`, `computed`, and `watch` are provided as `@vue/reactivity`, independently from the runtime packages. \
This is located in `/packages/reactivity`.

- [https://github.com/vuejs/core-vapor/packages/reactivity](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity)

---

The package that serves as the entry point for Vue.js is located in `/packages/vue`. \
In `core-vapor`, in addition to this, a package called `/packages/vue-vapor`, which serves as the entry point for Vapor Mode, has been added.

- [https://github.com/vuejs/core-vapor/packages/vue](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue)
- [https://github.com/vuejs/core-vapor/packages/vue-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue-vapor)

---

Overview:

![structure-overview](/directory-structure/overview.drawio.png)

## compiler-core

As the name suggests, `compiler-core` provides the core part of the compiler. \
In addition to this, compiler packages include `compiler-dom` and `compiler-sfc`, among others. \
The core provides implementations that are independent of specific use cases or environments like SFC or DOM.

There are various compilers in Vue.js.

For example, when using the `template` option, the template is compiled at runtime.

```ts
createApp({
  template: `<div>{{ msg }}</div>`,
  setup() {
    const msg = ref("Hello, Vue!");
    return { msg };
  },
}).mount("#app");
```

However, as you can see, this template uses the same template syntax as in SFC.

```vue
<script setup lang="ts">
import { ref } from "vue";

const msg = ref("Hello, Vue!");
</script>

<template>
  <div>{{ msg }}</div>
</template>
```

In addition, there are cases where content written as innerHTML in HTML is compiled. \
Vue.js has various ways of compiling templates. \
It is roughly correct to understand that `compiler-core` provides the common parts for these various use cases.

Specifically, it includes the core implementation that compiles `template` into a `render` function.

## compiler-dom

In Vue.js, operations and code generation related to the DOM are considered **environment-dependent**, and are therefore separated from the core. \
This will also appear later in the runtime section.

Regarding the compiler, it includes implementations that generate code related to DOM events and specific DOM elements. \
You might find it easier to understand if you think of event modifiers in Vue.js.

For example, the modifier `@submit.prevent` requires code like:

```ts
(e: Event) => e.preventDefault()
```

This is code generation that depends on the DOM API. \
Providing such functionality is the role of `compiler-dom`.

Example:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-dom/src/runtimeHelpers.ts#L29-L35

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-dom/src/directives/vOn.ts#L30-L36

## compiler-sfc

As the name suggests, this is the compiler related to SFC (Single File Components). \
Specifically, it provides features like `<script setup>` and `<style scoped>`.

In many cases, this compiler functions by being called by plugins of tools like bundlers, which are in separate packages. \
Famous examples include [vite-plugin-vue](https://github.com/vitejs/vite-plugin-vue) used in [Vite](https://vitejs.dev/) and [vue-loader](https://github.com/vuejs/vue-loader) used in [webpack](https://webpack.js.org/).

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/compiler.ts#L25-L31

https://github.com/vuejs/vue-loader/blob/698636508e08f5379a57eaf086b5ff533af8e051/src/compiler.ts#L8-L25

## runtime-core

Provides the core part of the runtime. \
Again, it does not depend on the DOM, and includes implementations of the component runtime, virtual DOM and its patching, and the scheduler. \
Regarding the patching process (renderer), although it seems that DOM operations might be performed, `runtime-core` only calls interfaces defined without dependency on the DOM API. \
The actual functions are implemented in `runtime-dom` and injected. (Utilizing the Dependency Inversion Principle.)

Interface:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/renderer.ts#L108-L145

The function `createRenderer` accepts the actual operations as options (not directly called in `runtime-core`):

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/renderer.ts#L325-L328

## runtime-dom

Includes the actual implementation of the DOM operations described above, and the implementation of injecting them into the core.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-dom/src/nodeOps.ts#L45-L90

It also includes implementations to actually handle DOM events, as mentioned in the compiler explanation. \
(`compiler-dom` is the implementation for outputting code that calls these.)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-dom/src/directives/vOn.ts#L18-L47

## reactivity

As the name suggests, provides the reactivity system of Vue.js. \
You may have heard somewhere that "Vue.js's reactivity system is available **_out of the box_**". This is because this package is implemented independently without depending on other packages. \
Moreover, the fact that it is "independent" is an important point in the implementation of Vapor Mode.

That's for a good reason. To give a little spoiler, Vapor Mode updates the screen by leveraging the reactivity system without using the virtual DOM. \
In fact, there are hardly any changes made to the reactivity package. \
In other words, it can be used seamlessly as part of Vapor's functionality, as it does not depend much on Vue.js's runtime.

## compiler-vapor, runtime-vapor

Now, finally, the main topic. \
As the names suggest, these are the compiler and runtime implementations for Vapor Mode.

Vapor Mode is currently in the R&D phase, so it is implemented as independent packages to avoid modifying existing implementations in the upstream as much as possible. \
Therefore, although there is significant overlap with the existing runtime and compiler, these parts are actually re-implemented even in this section.

What kind of implementations are done in these packages will be examined from here on (or rather, that's the main topic of this book), so we'll omit it here.

---

Now that we have a rough understanding of the overall package structure, let's start reading the source code necessary to understand the implementation of Vapor Mode!
