# The v-once Directive

Consider a component like the following.

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <p v-once>{{ count }}</p>
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

    const count = ref(0);

    const __returned__ = { count, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import { setText as _setText, template as _template } from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _setText(n0, _ctx.count);
  return n0;
}
```

What stands out is that the `setText` part is not wrapped in `renderEffect`.\
Since `v-once` is rendered only once, there is no need to wrap it in `renderEffect`.

## Reading the Compiler

We will follow `transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVOnce`.

It's very simple, so I'll include the entire text.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOnce.ts#L1-L12

It simply enables the `inVOnce` flag that `context` holds.

When `inVOnce` is true, it calls `registerOperation` with `registerEffect` and finishes, meaning no effect is generated.

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L137-L144

Since there is nothing particularly to read in the runtime, this concludes it for now.
