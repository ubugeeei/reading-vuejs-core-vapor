# ランタイムを読み始める

もう，

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

をコンパイルする実装は一通り追うことができたので，ここからはその結果である

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

が実際にどのように動作するかを見ていきましょう！

## vue/vapor

ずっと見過ごしてきたのですが，実はこのパッケージの説明をまだしていません．
これは Vapor Mode のエントリポイントです．

ソースは [packages/vue/vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue/vapor) にあります．

Vapor Mode のエントリパッケージとして，[packages/vue-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue-vapor) というものもあるのですが，`vue/vapor` はこのパッケージを import しているだけです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue-vapor/package.json#L2

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue/vapor/index.mjs#L1

Vapor のランタイムに必要なヘルパー関数はこの `vue/vapor` から import します．

## template 関数

これは Vapor のヘルパー関数の一つです．

```js
import { template } from "vue/vapor";
const t0 = template("<p>Hello, Vapor!</p>");
const n0 = t0();
```

のようにテンプレートを宣言し，`Block` を得ます．

`template` 関数の実装を読んでみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/template.ts#L2-L11

引数から渡された文字列を一時的な `template` という要素の `innerHTML` に格納し，`template` の `firstChild` を読み取ることにより `Block` を得ています．\
一度作られた Node はこの関数のローカル変数として保持され，2 回目以降の実行では `cloneNode` が結果となります．

```js
import { template } from "vue/vapor";
const t0 = template("<p>Hello, Vapor!</p>");
const n0 = t0();
const n1 = t0(); // clone node
```

以下の，

```js
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

からわかる通り，Vapor Mode ではこのコードに関してはコンポーネントの render 関数がただの DOM 要素を返しています．

## application のエントリポイント

さて，このコンポーネントがどのように動作するのかをみていきますが，そのためにアプリケーションのエントリを把握しましょう．

Vue.js でアプリを構築する際はしばしばこのように書かれると思います．

```ts
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

Vapor Mode でも同様です． `createApp` の代わりに　`createVaporApp` を使います．

```ts
import { createVaporApp } from "vue/vapor";
import App from "./App.vue";

createVaporApp(App).mount("#app");
```

つまるところ，`createVaporApp` に実装を読んでいけば，このコンポーネントがどのように動作するのかがわかるということです．

## createVaporApp

実装は [packages/runtime-vapor/src/apiCreateVaporApp.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts) にあります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L22-L25

ここに関してはほとんど `runtime-core` の `createApp` と同じです．

まずは application のコンテキストを作成し，`App` インスタンスを作ります．\
この `App` インスタンスが `mount` というメソッドを持っています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L38

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L43-L51

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L112

他にも component を登録するための `component` 関数や，plugin を使用する `use` 関数があったりします．\
ほとんど従来の Vue.js と同じです．

## App.mount

`mount` 関数の処理を見てみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L112-L151

引数で渡されたセレクタもしくは要素を container として扱います．

`normalizeContainer` 関数の実装は以下のような感じです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L114-L118

そうしたら，`createComponentInstance`, `setupComponent`, `render` (初回) を行ってマウント処理は終わりです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L123-L131

## createComponentInstance

`createComponentInstance` は `ComponentInternalInstance` というオブジェクトを作ります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L262-L269

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L151-L151

`ComponentInternalInstance` は内部的なコンポーネント情報で，登録されたライフサイクルや props, emit の情報, state などを持っています．\
渡されたコンポーネントの定義も保持します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L191-L234

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L167-L181

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L288

これもほとんど `runtime-core` と同じです．

`createComponentInstance` では `ComponentInternalInstance` オブジェクトを生成するとともに，`EffectScope` の生成や，`props`, `emit`, `slot` の初期化を行います．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L360-L364

Vapor 固有の実装として，`block` を保持するという点が挙げられます．\
これは従来は `subTree` や `next` として `VNode` (仮想 DOM) を保持していましたが，Vapor では `Block` を保持するようになりました．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/component.ts#L158

従来:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/component.ts#L324-L332

今後は render した際にここに `Block` が保持されるようになります．

props や emit, slot についてはそれらを使ったコンポーネントを動かす際にまた見にきましょう．\
今回は読み飛ばします．

## setupComponent

さて，ここからはレンダリングの処理です．\
Vapor Mode の真髄と言ってもいいでしょう．

従来は，[`renderer.ts`](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/renderer.ts) というファイルで [`VNode` の `patch` 処理](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/renderer.ts#L386-L396) を行っていました．

Vapor Mode には VNode や patch といったものはないので，最初の setup 処理が全てです．\
それ以降の更新はリアクティビティシステムによって直接 DOM (Block) に対して操作が行われます．

今はまだ state を持っていないので，単純に render 関数から得た Block がどのように扱われているかを見ていきましょう．

この関数は [packages/runtime-vapor/src/apiRender.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts) という，レンダリング周りの処理が実装されたファイルにあります．

まず，`setupComponent` に入ったらすぐに currentInstance を対象のコンポーネントにセットします．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L40

次に，`createComponentInstance` の時に生成した effectScope 内で各種 setup を実行していきます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L41

effectScope は Vue.js の API なので，詳しい説明は行いませんが，知らない方のために簡単に説明しておくと，「エフェクトを収集して，あとで回収しやすくするためのもの」です．

https://vuejs.org/api/reactivity-advanced.html#effectscope

この中でさまざまなエフェクトを形成することで，コンポーネントがアンマウントした際にそこ EffectScop を stop してしまえばクリーンナップを行うことができます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L155-L161

さて，具体的にどのようなことを effectScope 内で行っているかを見てみましょう．

## setupComponent > effectScope

まずは setup 関数のハンドリングです．\
コンポーネント自体が関数である場合は関数コンポーネントとしてそれを実行します．\
そうでない場合 (オブジェクトだった場合) は setup 関数を取り出します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L50

そして，この関数を実行します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L56-L61

結果は state か，Node になります．

Node (もしくは fragment, component) だった場合は block という変数に結果を保持します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L65-L74

このあと，まだ block という変数に何も入っていない場合は render 関数から block の取得を試みます．\
今回のコンポーネントはこの分岐に入って，render 関数が実行され block が保持されます．(`n0`)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L78-L87

ここまでやったら `instance.block` に block を格納します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L96

なんと，画面更新のためのセットアップはこれでおしまいです．\
後に複雑なコンポーネントのコンパイル結果を見ればわかるのですが，ほとんどの更新処理はエフェクトとして component に直接記載されています．

そのため，コンポーネントのレンダリングは「setup 関数を実行する (ここでそのステートの定義がされる)」「render 関数によって block を生成する (ここで effect が形成される)」の 2 ステップでおしまいなのです．

あとは render 関数によって得た block を DOM にマウントするだけです．

## render

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L123-L131

の最後，render の部分です．
この `render` という関数は内部関数です．コンポーネントが持つ `render` 関数とは別物です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateVaporApp.ts#L12-L15

`setupComponent` と同じく，[packages/runtime-vapor/src/apiRender.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts)　に実装されています．

やっていることは非常にシンプルで，component のマウントと，キュー(スケジューラ)にあるタスクを実行するだけです．\
(※ スケジューラについては今は気にする必要はないです)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L106-L112

`mountComponent` も非常にシンプルで，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L120-L123

`instance.container` に引数で渡ってきた container (今回で言うと `#app` からセレクトされた DOM) をセットして，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L124-L124

beforeMount hook を実行して，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L130-L131

container に block を insert します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L133

(insert 関数は本当にただの insert です)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/element.ts#L23-L29

最後に　mounted hook を実行したら component の mount はおしまいです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L135-L142

## まとめ

実際にコンパイル後の

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

のようなコードがどのように動作するかを見てきましたが，ただ component のインスタンスを用意して，(あれば) setup 関数を実行して，render 関数によって得られた `Block` を `app.mount(selector)` して得られた `container` に `insert` するだけです．

とてもシンプルだということがわかりました．

ここまででなんと，

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

という SFC がどのような流れでどうやってコンパイルされ，どのようにランタイム上で動作するのかが分かるようになりました！

手順の，

1. Vue.js の SFC を書く
1. Vapor Mode のコンパイラにかける
1. 出力を見る (概要を理解する)
1. コンパイラの実装を見る
1. 出力コードの中身を読む
1. 1 に戻る

5 まで終わったわけです．

ここからは 1 に戻って．もっと複雑なコンポーネントを同じ手順でみていきましょう！