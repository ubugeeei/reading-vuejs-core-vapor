# v-show ディレクティブ

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";
const flag = ref("");
</script>

<template>
  <p v-show="text">Hello, v-show!</p>
</template>
```

## コンパイル結果と概要

コンパイル結果は以下のようになります．

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

注目するべきは `_withDirectives(n0, [[_vShow, () => _ctx.text]]);` の部分です.\
前回に引き続き `widthDirectives` 関数を使っていますが，今回は runtimeDirective として `vShow` 関数を使っています．

## コンパイラを読む

`transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVShow` と辿っていきます．

非常にシンプルなので全文載せてしまいます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vShow.ts#L1-L20

`name: 'vShow'` で `WITH_DIRECTIVE` を登録しているだけです．

## ランタイムを読む

こちらもシンプルなので全文載せてしまいます．

`beforeMount`, `updated`, `beforeUnmount` で `el.style.display` を `none` にしたり `""` にしたりしているだけです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vShow.ts#L1-L23

---

何と！これで全部です！