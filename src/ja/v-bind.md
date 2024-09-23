# v-bind ディレクティブ

さて，どんどん読み進めましょう．

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";
const dynamicData = ref("a");
</script>

<template>
  <div :data-dynamic="dynamicData">Hello, World!</div>
</template>
```

## コンパイル結果と概要

コンパイル結果は以下のようになります. (だんだん小慣れてきて説明が雑になってきましたね (笑))

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

特に，

```js
function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setDynamicProp(n0, "data-dynamic", _ctx.dynamicData));
  return n0;
}
```

の `_setDynamicProp` の部分です．\
流石にもう実装方法も予想がつくようになってきましたね．\
概要的にも，`n0` に対して `data-dynamic` という属性に `_ctx.dynamicData` を設定するエフェクトだ，というのがすぐにわかります．

## コンパイラを読む

お馴染み，`transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVBind` と辿っていきます．

[packages/compiler-vapor/src/transforms/vBind.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vBind.ts)

．．．と思いきや？\
実はここには shorthand のハンドリングなど，本当に `v-bind` を transform しているだけで，エフェクトの登録などは行われていません．

実はここに関しては直接 `transformElement` の `buildProps` に直接実装されています．\
以下のあたりがその実装です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L236-L244

その少し上あたりには `v-bind` のに `arg` がない場合 (e.g. `v-bind="obj"`) のハンドリングもあります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L208-L218

とりあえず，`SET_DYNAMIC_EVENTS` を登録しているところが見れたので OK です．

このまま Codegen も読んでしまいましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L40-L41

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/prop.ts#L63-L83

特に難しいところはなかったはずです．

## ランタイムを読む

こちらもほとんど読むところがありません．

`key` が `"class"` や `"style"` だった場合に少々フォーマットしているだけです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/prop.ts#L112-L133

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/prop.ts#L22-L27

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/style.ts#L12-L15
