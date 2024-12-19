# v-once ディレクティブ

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <p v-once>{{ count }}</p>
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

注目するべきは `setText` の部分が `renderEffect` でラップされていない点です．\
`v-once` は一度だけ描画されるため，`renderEffect` でラップする必要がありません．

## コンパイラを読む

`transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVOnce` と辿っていきます．

非常にシンプルなので全文載せてしまいます．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOnce.ts#L1-L12

`context` が持っている `inVOnce` というフラグを有効にしているだけです．

`inVOnce` の場合は `registerEffect` で `registerOperation` を呼び出して終了，ということになっていてエフェクトが生成されません．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L137-L144

ランタイムは特に読むところがないので今回はなんとこれでおしまいです．