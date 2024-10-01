# The v-html Directive

Consider a component like the following.

```vue
<script setup>
import { ref } from "vue";
const inner = ref("<p>Hello, v-html</p>");
</script>

<template>
  <div v-html="inner" />
</template>
```

## Compilation Result and Overview

The compilation result is as follows.

```js
const _sfc_main = {
  vapor: true,
  __name: "App",
  setup(__props, { expose: __expose }) {
    __expose();

    const inner = ref("<p>Hello, v-html</p>");

    const __returned__ = { inner, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import {
  renderEffect as _renderEffect,
  setHtml as _setHtml,
  template as _template,
} from "vue/vapor";

const t0 = _template("<div></div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setHtml(n0, _ctx.inner));
  return n0;
}
```

A new helper called `setHtml` has appeared.\
Its implementation does not change in particular.

## Reading the Compiler

We will follow the path `transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVHtml`.

It's very simple, so I'll include the entire text.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vHtml.ts#L1-L26

It simply registers an effect with `SET_HTML`.\
It performs processing similar to when `transformText` is called.

Let's look at Codegen.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L48-L49

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/html.ts#L6-L19

It's familiar.

## Reading the Runtime

Let's just read `setHtml`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/prop.ts#L196-L201

It's very simple and just sets `innerHTML`.\
For the time being, it seems to extract the old value from the meta information to prevent unnecessary sets.
