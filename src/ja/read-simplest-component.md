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
_sfc_main.render = _sfc_render;
export default _sfc_main;
```

今回はこれを読み解いていきます．\
進め方でも説明した通り，読むべきものは 「出力をするための実装」と「出力されたコードの中身」であり．手順は

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
ここからが Vapor の肝である，\_sfc_render の中身についてみていきましょう.

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

## コンパイラの実装を理解する

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

にコンパイルします．このコンパイラの実装を実際に見ていきましょう．

Vapor Mode のコンパイラの実装は概ね `/packages/compiler-vapor` にあります．

[https://github.com/vuejs/core-vapor/packages/compiler-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor)

ここで，「概ね」と言ったのには理由があります．

一般的なコンパイラは，「parser」と「generator (codegen)」 というもので実装されます．\
parser によってソースコードを解析し，AST (Abstract Syntax Tree) に変換します．\
得られた AST を元に，generator がコードを生成します．\
Vue.js に関してもこの点は同じです．

しかし，Vapor Mode は既存の Single File Component のサブセットとしての実装になるので，パーサーは既存のものを使うことができます．\
このパーサーは `/packages/compiler-sfc` と `/packages/compiler-core` にあります．\
概要の方でも説明した通り，`compiler-core` には template のコンパイラがあり，`compiler-sfc` には SFC のコンパイラがあります．\
(もちろんこれらはそれらのパーサーも実装しています)

そして，template の AST に当たるものが `AST` というオブジェクトで，SFC の AST に当たるものが `SFCDescriptor` というオブジェクトです．\

ここまでの話を図に起こすと以下のような感じになります．

![compiler](/read-simplest-component/compiler.drawio.png)
Vapor Mode は SFC や template の syntax を変更するようなものではないので，パーサーは既存のものを使います．\
つまり，`compiler-core`, `compiler-sfc` にある，パーサーと，`AST`，`SFCDescriptor` はそのまま使います．\
それぞれの具体的なソースコードはまた後で紹介します．

続いて，Vapor 固有の部分です．Vapor Mode のコードを出力する部分はもちろん `compiler-vapor` に実装されています．\
ここで，新しい概念として，`IR` というものがあります．\
`IR` は Intermediate Representation の略で，中間表現という意味です．\
ざっくり，「出力コードを表したオブジェクト」と思ってもらえれば問題ないです．

そして，Vue.js のコンパイラの重要な概念として，`transformer` と言うものがあります．\
これは AST を操作して AST をトランスフォーム (変換) するための実装で，Vapor Mode では主にこの transformer によって AST を IR に変換します．\
そして，`IR` を元にコードを生成します．

少しややこしいですが，ここまでの流れを改めて図に起こすと以下のようになります．

![compiler-vapor](/read-simplest-component/compiler-vapor.drawio.png)

## SFC のパースと SFCDescriptor

ここからさ先ほどまでに説明した各パーツの詳細を見ていきましょう.

TBD

## Template のパースと AST

TBD

## Vapor Mode の IR

TBD

## Transformer

TBD

## Codegen

TBD
