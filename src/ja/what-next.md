# 次は何？

さて，ここまでで，

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

という単純なコンポーネントを

```js
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

にコンパイルする実装を見てきました．

次は何を見ていくのがいいでしょうか？

## 今どの段階？

ここで少しやるべきことと手順のおさらいです．

#### やるべきこと

- **出力をするための実装を見る**
- **出力されたコードの中身を読む**

#### 手順

1. Vue.js の SFC を書く
1. Vapor Mode のコンパイラにかける
1. 出力を見る (概要を理解する)
1. コンパイラの実装を見る
1. 出力コードの中身を読む
1. 1 に戻る

まず，今の時点でやるべきことの前半部分「出力をするための実装を見る」までできました．\
手順で言うと，1~4 まで終わったところです．(単純なコンポーネントに関して)

## これから

これからやることの整理です．

### SFC コンパイラの周辺のコード

#### 周辺コード

現時点では，まだ，

```js
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

の部分しか見ることができていません．\
しかし，実際の出力は，

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

のようなものでした．\
少し足りません．

予想的にも，一番複雑そうな部分は終わっているので，軽く周辺コードの生成について見ておいて良いでしょう．\
この次のページで軽く触れます．

#### コンパイラがどこで設定され，どこで呼ばれるか

実はこの部分についてはそれほど詳しく説明しませんでした．\
コンパイラが持つ，`parser` や `transformer`, `codegen` 関数の実装の詳細は読みましたが，これらがどこで設定されてどう繋がってどう動いているのかについてはまだわかっていないのでこれも見てみましょう．

### ランタイム

そして，ここが重要です．

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

のようなコードを出力する，ということがわかったとして，果たして「このコードはどのように動くのか」についてはまだ何もみれていません．\
なぜ，render 関数に `Block` を渡すと画面が描画されるのか，などの部分はまだ見れていないわけです．

これはいわゆる「ランタイム」の部分で，実装は `runtime-vapor` にあります．\
Vapor Mode の実装の理解を深めるには，このランタイムの理解もかかせません．

こちらも詳しくやっていきましょう．\
手順で言うと 5 の部分です．

もう少しこの部分部分を細分化すると，

1. 出力コードで使われる helper 関数 (e.g. `template`) がどういうものなのかみる
1. このコンポーネントが Vue.js の内部実装にどう繋がっているのか見る
1. 内部実装を見る

といった感じでしょうか．

### より色んなパターンのコンポーネント

今は

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

といった単純なコンポーネント

Vue.js のコンポーネントといえば，`<script>` を持ち，状態を持つものや，マスタッシュ，ディレクティブなど色んな機能があります．\
これらについても上記の 1~6 の手順を踏みながら見ていきましょう．
めざせ！完全制覇！(え)
