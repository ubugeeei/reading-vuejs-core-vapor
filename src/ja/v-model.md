# v-model ディレクティブ

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";
const text = ref("");
</script>

<template>
  <input v-model="text" />
</template>
```

## コンパイル結果と概要

コンパイル結果は以下のようになります.

```js
const _sfc_main = {
  vapor: true,
  __name: "App",
  setup(__props, { expose: __expose }) {
    __expose();

    const text = ref("");

    const __returned__ = { text, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import {
  vModelText as _vModelText,
  withDirectives as _withDirectives,
  delegate as _delegate,
  template as _template,
} from "vue/vapor";

const t0 = _template("<input>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _withDirectives(n0, [[_vModelText, () => _ctx.text]]);
  _delegate(n0, "update:modelValue", () => ($event) => (_ctx.text = $event));
  return n0;
}
```

何といっても注目するべきは

```js
_withDirectives(n0, [[_vModelText, () => _ctx.text]]);
_delegate(n0, "update:modelValue", () => ($event) => (_ctx.text = $event));
```

の部分です．

delegate がまた登場しているので，これがイベントハンドラの登録であることは何となくわかりますが，`withDirectives` と `_vModelText` という謎のものが登場しています．\
詳細は後で読むとして，とりあえずコンパイラを読んでみましょう．

## コンパイラを読む

`transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVModel` と辿っていきます．

[packages/compiler-vapor/src/transforms/vModel.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts)
まず，`context` から `bindingMetadata` というものを取り出しています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L34

これは `compiler-sfc` が収集したもので，SFC に定義されている変数のメタデータです．\
setup で定義された let の変数なのか， props なのか, data なのかなどです．

具体的には以下のように列挙されています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/options.ts#L109-L153

どのように収集されているかはまたどこかで追いましょう．

`exp` の `bindingType` が props だった場合にはエラーを出力しています．親切ですね．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L37-L45

そして，以下の分岐以降が本題です．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L84

まずは tag が `input` `textarea` `select` のいずれかである場合です．\
今回は `input` なのでここに該当します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L84-L87

`input` の場合には `type` 属性を読みつつ，`runtimeDirective` を決定します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L90-L118

先ほど出力に出ていた `vModelText` はこの変数の初期値のようです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L83

ここまできたら `SET_MODEL_VALUE` な operation を登録して，

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L142-L148

先ほど算出した `runtimeDirective` を使って `withDirectives` を登録します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts#L151-L157

意外とシンプルですね．\
あとは Codegen ですがここまで来れば楽勝でしょう．

お決まりの流れです．特に説明はありません．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L52-L53

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/modelValue.ts#L8-L38

withDirectives の方は少し codegen の動線が違います．\
`genBlockContent` -> `genChildren` -> `genDirectivesForElement` -> `genWithDirective` になります．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L36-L41

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L51-L53

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L18-L23

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L31

or

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L31

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/directive.ts#L23-L29

↓

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/directive.ts#L31-L34

になります．

## ランタイムを読む

`_delegate(n0, "update:modelValue", () => ($event) => (_ctx.text = $event));` の部分はまあ良いとして，問題は `withDirectives` と `_vModelText` です．

### withDirectives

`withDirectives` を読んでみましょう．
実装は [packages/runtime-vapor/src/directives.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts) にあります．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L93-L96

`node` か `component` と，`directives` を受け取ります．

#### DirectiveArguments

`DirectiveArguments` の定義は以下です．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L81-L91

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L71-L73

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L65-L69

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L58-L63

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L41-L57

ややこしいですが，簡単にいうと各ライフサイクルでの挙動を定義しています．\
(ディレクティブの動作の実態と言えそうです．)

#### withDirectives の中身

まず，`DirectiveBinding` という概念があります．

これは新旧の値や修飾子，ディレクティブ本体 (`ObjectDirective`), コンポーネントの場合はインスタンスなど，必要な情報をまとめたオブジェクトです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L29-L37

そして，この `withDirectives` という関数ですが，名前が複数形になっていることからもわかる通り，複数のディレクティブを適用することができます．\
引数で受け取ったディレクティブの配列を 1 つづつ回して処理を行います．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L124

この for 文で行われていることを見ていきましょう．

まずは定義から各種情報を取り出します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L125

normalize もしておきます

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L127-L132

ベースとなる binding を定義して

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L134-L141

`source` を `ReactiveEffect` でラップし，その `effect` の `scheduler` には update trigger を仕込みます．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L143-L164

update trigger は単純にライフサイクルの `beforeUpdate`, `updated` を実行するトリガです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L228-L266

最後に created hook を実行しておしまいです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L168

### vModelText

さてここまで読めたら次は具体的なディレクティブの実装を読んでいきましょう．\

v-model に関する runtimeDirective は [packages/runtime-vapor/src/directives/vModel.ts](https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts) に実装されています．

今回の `vModelText` は以下です．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L44-L48

ここには，`beforeMount`, `mounted`, `beforeUpdate`, などのこのディレクティブに関するライフサイクルごとの動作が定義されています．
順に見ていきましょう．

#### beforeMount

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L49

イベントハンドラの登録を行っています．

値のトリムを行ったり，数値へのキャストを行ったりしながら，値を更新しています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L56-L66

値の更新は delegate されたイベントハンドラから assigner を取得し，それを使っています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L56-L66

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L21-L25

:::info Tips
v-model は IME などの composing のハンドリングが行われていることが公式ドキュメントでも触れらていますが，これはまさにこの処理です．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L56-L57

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L73-L74

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L27-L37
:::

#### mounted

マウント時は初期値の設定をしておしまいです．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L83-L85

#### beforeUpdate

更新までは composing のハンドリングを行ったり，必要のない更新をスキップするなどの処理を行っています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives/vModel.ts#L86-L111

---

以上で `v-model` の動作は理解できたはずです．\
`vModelText` 以外にもさまざまなディレクティブ定義がありますが，同じ要領で読み進めることができるはずです．

そして，今回は runtimeDirective や withDirectives などの新しい概念が登場したので少し長くなりましがた，他のディレクティブについてもこれをベースに読み進めていけるはずです．(スピードも上がるはずです．)\
この調子でどんどん読んでいきましょう．