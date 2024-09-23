# v-text ディレクティブ

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";
const message = ref("Hello, v-text!");
</script>

<template>
  <p v-text="text" />
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

`v-text` を指定した要素が `renderEffect` と `setText` によって構築されるようになりました．

## コンパイラを読む

`transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVText` と辿っていきます．

非常にシンプルなので全文載せてしまいます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vText.ts#L1-L32

`registerEffect` しているだけです．\
`transformText` の時と似たような処理を行っています．

ランタイムは特に読むところがないので今回もこれでおしまいです．
サクサクいきましょう！