# 単純なコンポーネントを読む

Playground を利用して最も単純なコンポーネントを読んでみましょう．

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

出力結果は以下のようなものになります．\
※ HMR 周りのコードが出力されているかと思いますが，今回は関係ないので省略しています．

```js
const _sfc_main = {};
import { template as _template } from "vue/vapor"; // ※ ここも vite の都合で実際には fs へのパスになってますが，ここでは簡略化しています．
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
import _export_sfc from "/@id/__x00__plugin-vue:export-helper";
export default /*#__PURE__*/ _export_sfc(_sfc_main, [
  ["render", _sfc_render],
  ["vapor", true],
  ["__file", "/path/to/App.vue"],
]);
```

後半部分は少しわかりづらいので，概ね以下のようなものだと思ってください．

```js
const _sfc_main = {};
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

今回はこれを読み解いていきます．\
進め方でも説明した通り，読むべきものは「出力をするための実装」と「出力されたコードの中身」であり．手順は

1. Vue.js の SFC を書く
1. Vapor Mode のコンパイラにかける
1. 出力を見る (概要を理解する)
1. コンパイラの実装を見る
1. 出力コードの中身を読む
1. 1 に戻る

になります．

ここまでで，1, 2 はいけているので，次は出力の概要を見ていきましょう.

## 出力の概要を理解する

まず，皆さんがコンポーネントを記載するときに，

```ts
export default {
  /* options */
};
```

```ts
export default defineComponent({
  /* options */
});
```

のようにコンポーネントオブジェクトを default export することがあると思います．

出力コードの

```js
const _sfc_main = {};
// ...
export default _sfc_main;
```

の部分はまさにこれそのものです．
そして，このオブジェクトの render オプションとして `_sfc_render` が設定されていることがわかります．

```js
_sfc_main.render = _sfc_render;
```

さて，ここまでは従来の Vue.js と大差ありません．
ここからが Vapor の肝である，_sfc_render の中身についてみていきましょう.

```js
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

`vue/vapor` から export されている `template` という関数で template を定義し，Node を生成しそれを render 関数の結果としています．\
`t0`, `n0` となっていることからも予想できる通り，これからより複雑な template を定義した場合には，`t1`, `n1` といったように増えてくことになります．\
この `n0`, `n1` 等は概ね `HTMLElement` だと思ってもらえれば問題ないです．今回は，`p` 要素がここに入ってくることになります．

これで出力の概要は理解できたと思います．

---


つまるところ，コンパイラは

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

を

```js
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

にコンパイルします．

続いて，コンパイラの実装を実際に見ていきましょう．\
そのためにはまずコンパイラの実装の概要を掴むことが重要です．