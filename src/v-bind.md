# The v-bind Directive

Now, let's keep reading and progressing.

Consider a component like the following.

```vue
<script setup>
import { ref } from "vue";
const dynamicData = ref("a");
</script>

<template>
  <div :data-dynamic="dynamicData">Hello, World!</div>
</template>
```

## Compilation Result and Overview

The compilation result is as follows. (We're getting accustomed to this, so the explanations are becoming a bit rough (lol)).

```js
const _sfc_main = {
  vapor: true,
  __name: "App",
  setup(__props, { expose: __expose }) {
    __expose();

    const dynamicData = ref("a");

    const __returned__ = { dynamicData, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import {
  renderEffect as _renderEffect,
  setDynamicProp as _setDynamicProp,
  template as _template,
} from "vue/vapor";

const t0 = _template("<div>Hello, World!</div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setDynamicProp(n0, "data-dynamic", _ctx.dynamicData));
  return n0;
}
```

In particular,

```js
function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setDynamicProp(n0, "data-dynamic", _ctx.dynamicData));
  return n0;
}
```

is the `_setDynamicProp` part.\
As expected, you can now predict the implementation method.\
In summary, it's an effect that sets the `_ctx.dynamicData` to the `data-dynamic` attribute of `n0`, which is immediately understandable.

## Reading the Compiler

Familiar route: `transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVBind`.

[packages/compiler-vapor/src/transforms/vBind.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vBind.ts)

...Or is it?\
Actually, this only handles shorthand and truly transforms `v-bind`, without registering effects and such.

In fact, regarding this, it is directly implemented in `transformElement`'s `buildProps`.\
The implementation is around here.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L236-L244

A bit above, there is also handling for when `v-bind` does not have an `arg` (e.g., `v-bind="obj"`).

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L208-L218

Anyway, since we were able to see where `SET_DYNAMIC_EVENTS` is registered, it's okay.

Let's also read the Codegen as it is.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L40-L41

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/prop.ts#L63-L83

There shouldn't have been any particularly difficult parts.

## Reading the Runtime

There's almost nothing to read here as well.

When the `key` is `"class"` or `"style"`, it just does a bit of formatting.

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/prop.ts#L112-L133

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/prop.ts#L22-L27

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/style.ts#L12-L15
