# The v-show Directive

Consider a component like the following.

```vue
<script setup>
import { ref } from "vue";
const flag = ref("");
</script>

<template>
  <p v-show="text">Hello, v-show!</p>
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

    const flag = ref("");

    const __returned__ = { flag, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import {
  vShow as _vShow,
  withDirectives as _withDirectives,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p>Hello, v-show!</p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _withDirectives(n0, [[_vShow, () => _ctx.text]]);
  return n0;
}
```

What stands out is the part `_withDirectives(n0, [[_vShow, () => _ctx.text]]);`.\
Continuing from last time, it uses the `withDirectives` function again, but this time it uses the `vShow` function as the runtimeDirective.

## Reading the Compiler

We will follow `transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVShow`.

It's very simple, so I'll include the entire text.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vShow.ts#L1-L20

It's just registering `WITH_DIRECTIVE` with `name: 'vShow'`.

## Reading the Runtime

This is also simple, so I'll include the entire text.

It simply sets `el.style.display` to `none` or `""` in `beforeMount`, `updated`, and `beforeUnmount`.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vShow.ts#L1-L23

---

And that's everything!
