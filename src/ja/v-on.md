# v-on ディレクティブ

さて，`v-on` ディレクティブについて見てみましょう．\
`v-on` はネイティブ要素に対するものと，コンポーネントに対するものの 2 種類のものがありますが，まだコンポーネントの扱い方は知らないので，ここではネイティブ要素に対するものについて説明します．\
(ちなみにコンポーネントの際はほぼ props なので，あまり説明することがありません)

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);
function increment() {
  count.value++;
}
</script>

<template>
  <button type="button" @click="increment">{{ count }}</button>
</template>
```

よくあるカウンターコンポーネントです．

## コンパイル結果

コンパイル結果は以下のような感じになります．

```js
const _sfc_main = {
  vapor: true,
  __name: "App",
  setup(__props, { expose: __expose }) {
    __expose();

    const count = ref(0);
    function increment() {
      count.value++;
    }

    const __returned__ = { count, increment, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import {
  delegate as _delegate,
  renderEffect as _renderEffect,
  setText as _setText,
  delegateEvents as _delegateEvents,
  template as _template,
} from "vue/vapor";

const t0 = _template('<button type="button"></button>');

_delegateEvents("click");

function _sfc_render(_ctx) {
  const n0 = t0();
  _delegate(n0, "click", () => _ctx.increment);
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

例の如く，script 部分は大したものではないので，以下の部分を重点的にみていきましょう．

```js
import {
  delegate as _delegate,
  renderEffect as _renderEffect,
  setText as _setText,
  delegateEvents as _delegateEvents,
  template as _template,
} from "vue/vapor";

const t0 = _template('<button type="button"></button>');

_delegateEvents("click");

function _sfc_render(_ctx) {
  const n0 = t0();
  _delegate(n0, "click", () => _ctx.increment);
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

## 概要の理解

template の生成や `renderEffect` ~ `setText` はいつも通りです．\
今回のメイン部分は

```js
_delegateEvents("click");
```

と

```js
_delegate(n0, "click", () => _ctx.increment);
```

です．

予想的には後者の方は `n0` に対して `click` イベントを追加しているのだろうと思います．\
が，"delegate" というのが何なのか，と前者の `_delegateEvents` が何をしているのかがわかりません．

とりあえず，ここは謎なまま置いておいて，コンパイラの実装を見ていきましょう．\
謎はランタイムを読み進める時に把握していきましょう．

## コンパイラを読む

### IR

例の如く `IR` を覗いてみましょう．\
IR としては怪しそうなものは `SET_EVENT` というものがありますが，他には見当たりません．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L22

みてみましょう．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L115-L132

どうやらこの Node が `delegate` というフラグを持っているようです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L129

それでは，この Node を生成している transformer を探してみましょう．\
ありました．[packages/compiler-vapor/src/transforms/vOn.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts) です．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L73-L86

### DirectiveTransform

なんだかんだで DirectiveTransform が登場するのは初めてなので，どういう流れでこれが呼ばれるのかは見ておきましょう．\
DirectiveTransform は `transformElement` から呼ばれます．\
具体的には要素の属性を取り回す処理の途中で呼ばれます．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L42

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L56-L60

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L188-L192

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L255

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L284-L288

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L301-L304

今回の場合は，`on` 等名前から v-on の transformer を取得し，`transformVOn` が呼ばれます．\
そして，`transformVOn` では最後に `context.registerEffect` が呼ばれており，ここで effect が登録されます．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L88

### transformVOn

それでは `transformVOn` を見ていきましょう．

`dir` というのはディレクティブの AST です．
これは `runtime-core` に実装されたもので，parse の時点で作られます．

ここから `arg` や `expr`, `modifiers` などを取り出していきます．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L21

簡単に説明しておくと，`v-on:click.stop="handler"` の `click` が `arg` に，`stop` が `modifiers` に，`handler` が `expr` に該当します．

まずは `modifiers` を種類別に解決して整理しておきます．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L32-L38

`resolveModifiers` は `compiler-dom` に実装された関数で，modifiers を分類します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-dom/src/transforms/vOn.ts#L35-L44

続いて，`delegate` を有効にするかの判定です． (とりあえず delegate が何なのか，というのは置いておきましょう．)

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L42-L43

以下の条件を全て満たす時に有効になります．

- arg が static である\
  `v-on[eventName]="handler"` のようなものでない場合です．
- modifiers が空である
- delegate 対象である\
  ここに定義されたイベントであるかどうかの判定です．
  https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L13-L18

あとはこれまでに得られた情報をもとに，`registerEffect` で effect を登録したらおしまいです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts#L73-L88

## Codegen を読む．

`delegate` フラグあたりがどう影響しているかだけ重点的に見て，あとはさらっと見ていきましょう．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L44-L45

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/event.ts#L17-L42

この流れはもはや見慣れたもので，難しいところはないはずです．\
注目したいのは特にここです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/event.ts#L36

`IR` の `delegate` が有効な場合には `delegate` ヘルパーを，そうでない場合は `on` ヘルパーを生成しています．\
つまりはこの次にランタイムを読む時にこの 2 つを見比べてみると `delegate` の役割が掴めそうです．

直前で，`context.delegates` にイベントを登録しているのもわかります．\
これがおそらく hoist された `_delegateEvents("click");` の部分であることもわかります．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/event.ts#L28-L31

## ランタイムを読む

さて，読みたい関数は 3 つです．\
`delegateEvents`，`delegate`，`on` です．

まずは実行順番的に `delegateEvents` から見ていきましょう．

### delegateEvents

実装は以下です．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L83-L96

コメントアウトを見る通り，どうやらこの概念は Solid から拝借したもののようです．\
Solid のドキュメントを見てみると delegate の説明が書いてあります．

https://docs.solidjs.com/concepts/components/event-handlers

> Solid provides two ways to add event listeners to the browser:
>
> - `on:__`: adds an event listener to the element. This is also known as a native event.
>
> - `on__`: adds an event listener to the document and dispatches it to the element. This can be referred to as a delegated event.
>
> Delegated events flow through the component tree, and save some resources by performing better on commonly used events. Native events, however, flow through the DOM tree, and provide more control over the behavior of the event.

delegateEvents は渡された events で document に対して `delegatedEventHandler` をリッスンしています．

`delegatedEventHandler` を見てみましょう．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L98-L128

`e.composedPath` はイベントの経路 (EventTarget) を配列で返すメソッドです．

https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath

```js
// 例

e.composedPath(); // [button, div, body, html, document]
```

まず，`getMetadata` という関数で `node` からメタデータを取得し，そこにあるイベント情報からハンドラを取得します．\

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L114

そしてそのハンドラを全て実行します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L115-L118

そしたらこの流れを host, parent を遡って実行していきます．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L123-L126

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L113

この流れで `delegate` も読んでしまいましょう．

### delegate

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L58-L67

delegate は handler を作り， delegate フラグを立てた状態でメタデータに登録します．

`recordEventMetadata` は [packages/runtime-vapor/src/componentMetadata.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/componentMetadata.ts) という別のファイルに実装されています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/componentMetadata.ts#L21-L26

これを見てもわかる通り，メタデータは要素に直接，`$$metadata` というプロパティに登録されるもので．以下のような型になっています

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/componentMetadata.ts#L5-L13

イベントハンドラと Props を持っているようです．

つまり，ここでは直接イベントハンドラの登録を行わずに，ハンドラだけ持たせて，実際には `delegateEvents` で `document` に登録されたハンドラが呼び出された時にこのメタデータを参照してハンドラを実行する，という流れになっているようです．

### on

さて，`IR` の `delegate` フラグが立っていない場合は `on` が呼ばれます．

こちらは非常に単純で，queuePostFlushCb で addEventListener を呼び出しています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L29-L51

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L14-L22

クリーンナップ処理も実装されています．

## delegate vs on

さて，それぞれの実装の違いはわかったのですが，これらは何のために使い分けているのでしょうか．\
Solid のドキュメントを参照してもわかる通り，`delegate` の場合はリソースの節約になるようです．

もう少し具体的に説明すると，「イベントを要素にアタッチする」という行為はコスト (時間やメモリ) がかかるものです．\
`on` は各要素に対してそれぞれにイベントをアタッチするのに対し，`delegate` は document に対してのみイベントをアタッチし，イベントが発生した時にそのイベントがどの要素から発生したかを調べ，該当する要素に対してイベントを発火させる，という流れです．
これによりパフォーマンスに貢献しているようです．(手元でベンチを取ったわけではないので Vapor でどれくらい効果が出ているのかは私は知りません (ぜひ知っていたら教えてください))
