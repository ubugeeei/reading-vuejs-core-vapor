# v-html ディレクティブ

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";
const inner = ref("<p>Hello, v-html</p>");
</script>

<template>
  <div v-html="inner" />
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

`setHtml` という新しいヘルパーが登場しました．\
それ以外は特に変わりません．

## コンパイラを読む

`transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVHtml` と辿っていきます．

非常にシンプルなので全文載せてしまいます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vHtml.ts#L1-L26

`SET_HTML` でエフェクトを登録しているだけです．

Codegen をみてみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L48-L49

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/html.ts#L6-L19

お馴染みです．

## ランタイムを読む

`setHtml` だけ読んでみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/prop.ts#L196-L201

非常にシンプルで `innerHTML` にセットしているだけです．\
一応，余計なセットが起こらないように．メタ情報から古い値を取り出して差分を見たりはしているようです．