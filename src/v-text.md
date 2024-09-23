# The v-text Directive

Consider a component like the following.

```vue
<script setup>
import { ref } from "vue";
const message = ref("Hello, v-text!");
</script>

<template>
  <p v-text="text" />
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

    const message = ref("Hello, v-text!");

    const __returned__ = { message, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.text));
  return n0;
}
```

Elements specified with `v-text` are constructed using `renderEffect` and `setText`.

## Reading the Compiler

We will follow the path `transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVText`.

It's very simple, so I'll include the entire text.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vText.ts#L1-L32

It simply registers `registerEffect`.\
It performs similar processing to when `transformText` is called.

There's nothing particularly to read in the runtime, so this concludes it for now.
Let's keep 
