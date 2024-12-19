# マスタッシュとステートのバインド

## 今回の対象コンポーネント

さて，同じ手順で次々といろんなコンポーネントを読み進めてみましょう．

続いては以下のようなコンポーネントを見てください．

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <p>{{ count }}</p>
</template>
```

上記のコードでは count は変化しないので，あまり実用的なコードではありませんが，ステートの定義とマスタッシュによるバインディングを行ってみました．

## コンパイル結果

まずはこの SFC がどのようなコンパイル結果になるかを見てみましょう．

```js
import { ref } from "vue";

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

import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}

import _export_sfc from "/@id/__x00__plugin-vue:export-helper";
export default /*#__PURE__*/ _export_sfc(_sfc_main, [
  ["render", _sfc_render],
  ["vapor", true],
  ["__file", "/path/to/core-vapor/playground/src/App.vue"],
]);
```

前回のコンポーネントよりも少し複雑になっていますが，基本的な構造は変わりません．

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>
```

の部分が，

```js
import { ref } from "vue";

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
```

にコンパイルされ，

```vue
<template>
  <p>{{ count }}</p>
</template>
```

の部分が

```js
import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

script 部分に関してはこれは vuejs/core-vapor の実装ではなく，元からある `compiler-sfc` の実装によるものです．\
まぁ，`<scirpt setup>` の登場以前から Vue.js を触ってる人からすると，これはなんとなく見慣れた感じがしていると思います．\
例の如く `compileScript` という関数で実装されています．ここは今回は読み飛ばします．

今回メインで注目したいのは，template 部分の方です．

## 出力コードの概要を理解する

以下のコードを重点的に理解しましょう．

```js
import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

<div v-pre>

まず，template としては `<p>{{ count }}</p>` と書いた部分が `<p></p>` に変換されています．\
間の `{{ count }}` は `_renderEffect` と `_setText` によって `count` の値が更新されるたびに更新されるようになっています．

</div>

`setText` は名前から予想できる通り，指定した要素にテキストをセットする関数です．\
`renderEffect` とはなんでしょうか...?

こちらは一言で言うと，「update hook 実行付きの watchEffect」です．

Vue.js には `watchEffect` という API があります．

https://vuejs.org/api/reactivity-core.html#watcheffect

この関数は，引数に渡したたコールバック関数を初回に実行しつつ，そのコールバックをトラックする関数です．\
つまり，初回実行以降，今回で言うと `_ctx.count` というリアクティブな変数が更新されるたびに，コールバック関数が再実行されるというわけです．

イメージ的には，

```js
watch(
  () => ctx.count,
  () => setText(n0, _ctx.count),
  { immediate: true }
);
```

に近いです．これにより count が更新されるたびに，`setText` が実行され，`n0` のテキストが更新されるようになります．(画面が更新される)

`renderEffect` のもう一つ重要なポイントが．

> update hook 実行付きの

の部分です．

Vue.js は画面が更新され前後に `beforeUpdate` と `updated` というライフサイクルフックを提供しています．\
通常の watch はコールバックの実行時にこれらのフックが実行されません．\
(画面の更新をハンドリングするものではないので当然です．)

しかし，今回のエフェクトは紛れもなく画面を更新させるためのものです．\
`renderEffect` はこの画面更新の前後に `beforeUpdate` と `updated` フックを実行するようになっています．\
画面をレンダリングするためのエフェクトを作るための関数だということです．

逆に言えば，コンパイラは画面を更新させるようなエフェクトを全て `renderEffect` でラップします．

## コンパイラの実装を読む

まずは template の AST を出力してみましょう．

```json
{
  "type": "Root",
  "source": "\n  <p>{{ count }}</p>\n",
  "children": [
    {
      "type": "Element",
      "tag": "p",
      "ns": 0,
      "tagType": 0,
      "props": [],
      "children": [
        {
          "type": "Interpolation",
          "content": {
            "type": "SimpleExpression",
            "content": "count",
            "isStatic": false,
            "constType": 0,
            "ast": null
          }
        }
      ]
    }
  ],
  "helpers": {},
  "components": [],
  "directives": [],
  "hoists": [],
  "imports": [],
  "cached": [],
  "temps": 0
}
```

Template AST の概要で一通りの Node はみているので，もう意味は分かるかと思います．\
そして，Parser の実装もみているのでどのようにこのオブジェクトを得られるかも皆さんはすでに知っているはずです．

## transformer を読む

次は，これをどのように transform していくのか，という実装を見ていきましょう．\
おそらくこれからもこういった流れ (AST, Parse はさらっと流して transformer をしっかり読む) が多くなると思います．

例の如く，`transform` ->`transformNode` に入ると，NodeTransformer が実行されます．\
`transformElement` (onExit) -> `tarnsformChildren` と入っていき，`transfoemText` に入ってきます．

ここまではいつも通りで，ここからが今回のポイントです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L22

今回はこのチェックを通る時，

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L89-L96

`Interpolation` を含んでいるので以下の分岐に入ります．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L29-L37

`processTextLikeContainer` を見てみましょう．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L63-L78

どうやらここで `registerEffect` という関数を呼び出しています．\
そして，正しく `type: IRNodeTypes.SET_TEXT` になっています．

リテラルも取得し，全て null じゃなかった場合にはそのまま連結して `context.childrenTemplate` に追加し終了します．\
(つまり `template` の引数に落ちる)

逆に，そうじゃない場合は `context.childrenTemplate` が空っぽなままなので，この部分は `template` の引数には乗りません．\
(今回の場合，最終的な template は `"<p></p>"` になる)

そうじゃない場合は `registerEffect` です．\
`context.reference` を実行し，この Node を変数に保持することをマークしつつ id を取得します．

## registerEffect

`registerEffect` という関数の中身を少しみてみましょう．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L137-L140

引数として，`expressions` と `operations` を受け取ります．

`expression` は AST の `SimpleExpression` です． (e.g. `count`, `obj.prop` など)

`operations` は新概念です．\
これは `IR` の一種で，`OperationNode` というものです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L211-L228

この定義を見れば想像はつくと思いますが，「操作」を表す Node です．\
例えば，`SetTextIRNode` は「テキストをセットする」という操作です．\
他にも，イベントをセットする `SetEventIRNode` やコンポーネントを生成する `CreateComponentIRNode` などがあります．

今回は `SetTextIRNode` が使われているので少しみてみましょう．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L108-L112

`SetTextIRNode` は element の id (number) と values (SimpleExpression[]) を持ちます．

例えば，id が 0 で value が `count` を表す SimpleExpression だとすると，

```ts
setText(n0, count);
```

というようなコードの `IR` を表現することになります．

`registerEffect` の続きに戻ると，

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L151-L154

入ってきた `expressions` と `operations` を `block.effect` に push しています．

`block.effect` は

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L51

です．

これで概ねマスタッシュの `IR` の生成が完了しました．\
あとはこれを元に codegen していくだけです．

## Codegen を読む

まぁ，予想通り特に難しいところはありません．\
`block` が持っている `effect` を `type` によって分岐して処理していくだけです．

おそらく何も説明なしで読めると思います．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L36-L41

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L56

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L75-L81

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L86-L107

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L42-L43

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/text.ts#L12-L26

なんとあっさり！コンパイラ完全制覇です！

## ランタイムを読む

さて，コンパイル結果の

```js
import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

のランタイム(実際の動作)部分を読んでいきましょう.

application のエントリで component のインスタンスが作られ，コンポーネントの `render` 関数が呼ばれてその結果の node が container に入っていくのは今までと同じです．\
実際に `render` が実行された時に何が起こるかを見ていきましょう．

まずは `setText` です．\
この辺りのオペレーションは概ね [packages/runtime-vapor/src/dom](https://github.com/vuejs/vue-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom) に実装されています．

`setText` の実装は以下です．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/prop.ts#L188-L194

本当に単純なことしかしていません．ただの DOM 操作です． `values` を `join` して `el` の `textContent` に突っ込みます．

あとは `renderEffect` の実装を見てこのページは終わりにしましょう．\
改めて `renderEffect` は「update hook 実行付きの watchEffect」です．

実装は [packages/runtime-vapor/src/renderEffect.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts) にあります．

現在の instance や effectScope を設定しつつ，コールバックをラップして，

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L19-L35

`ReactiveEffect` を生成します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L37-L39

`effect.scheduler` (effect.run 経由ではなく，trigger 等で呼ばれる動作) には `job` という関数 (後述) を設定しています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L41

以下が初回実行になります．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L50

`job` 部分です．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L52

`effect` の実行の前にライフサイクルフック (beforeUpdate) を実行します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L62-L70

そして `effect` の実行を行い．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L72

最後にライフサイクルフック (updated) を実行します．\
実際にはスケジューラのキューに積んでいるだけです．\
(スケジューラがいい感じに重複排除等を行って然るべきところで実行されます)

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L74-L85

そろそろスケジューラ周りの実装がよく出てくるよになったので，次のページではスケジューラの実装について少し見てみましょう！
