# v-if ディレクティブ

さて，続いて `v-if` ディレクティブについてです．

`v-if` についてはいくつかのパターンがあるので，始めにそれぞれのコンパイル結果を見ていきましょう．

## コンパイル結果と概要

### v-if のみ

```vue
<script setup>
import { ref } from "vue";
const flag = ref(true);
</script>

<template>
  <p v-if="flag">Hello v-if!</p>
</template>
```

```js
const _sfc_main = {
  vapor: true,
  __name: "App",
  setup(__props, { expose: __expose }) {
    __expose();

    const flag = ref(true);

    const __returned__ = { flag, ref };
    Object.defineProperty(__returned__, "__isScriptSetup", {
      enumerable: false,
      value: true,
    });
    return __returned__;
  },
};

import { createIf as _createIf, template as _template } from "vue/vapor";

const t0 = _template("<p>Hello v-if!</p>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.flag,
    () => {
      const n2 = t0();
      return n2;
    }
  );
  return n0;
}
```

`createIf` というヘルパー関数が登場しました．\
第一引数に condition (getter), 第 2 引数に consequent (render) をとっているようです．

### v-if と v-else

```vue
<template>
  <p v-if="flag">Hello v-if!</p>
  <p v-else>Hello v-else!</p>
</template>
```

```js
import { createIf as _createIf, template as _template } from "vue/vapor";

const t0 = _template("<p>Hello v-if!</p>");
const t1 = _template("<p>Hello v-else!</p>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.flag,
    () => {
      const n2 = t0();
      return n2;
    },
    () => {
      const n4 = t1();
      return n4;
    }
  );
  return n0;
}
```

`createIf` の第 3 引数に alternate (render) が追加されています．

### v-if と v-else-if

```vue
<template>
  <p v-if="flag">Hello v-if!</p>
  <p v-else-if="!flag">Hello v-else-if!</p>
</template>
```

```js
import { createIf as _createIf, template as _template } from "vue/vapor";

const t0 = _template("<p>Hello v-if!</p>");
const t1 = _template("<p>Hello v-else-if!</p>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.flag,
    () => {
      const n2 = t0();
      return n2;
    },
    () =>
      _createIf(
        () => !_ctx.flag,
        () => {
          const n4 = t1();
          return n4;
        }
      )
  );
  return n0;
}
```

alternate にネストして `createIf` が追加されています．

## コンパイラを読む

`transformElement` -> `buildProps` -> `transformProps` -> `directiveTransform` -> `transformVIf` と辿っていきます．

[https://github.com/vuejs/core-vapor/packages/compiler-vapor/src/transforms/vIf.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts)

ここで，どうやら見慣れない概念が登場しています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L22-L25

### Structural Directive

`createStructuralDirectiveTransform` です．\
実はこの「Structural Directive」というものは `vuejs/core` からある概念で，`v-if` や `v-for` などの構造的なディレクティブを指します．

`createStructuralDirectiveTransform` は `name` と `StructuralDirectiveTransform` を受け取ります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L269-L272


`StructuralDirectiveTransform` の定義は以下で，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L52-L58

> A structural directive transform is technically also a NodeTransform;

とあるように，技術的には `NodeTransform` と同じだということです．

確かに，このシグネチャは

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L31-L34

とほとんど同じです．(特に，結果に注目)

`createStructuralDirectiveTransform` の実装を覗いてみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L269-L298

NodeTransform の感覚なので，まず操作対象は `Element` です．

そして，slot 用の template だった場合はスキップします．\
これは `vSlot.ts` で個別にハンドルされるためのようです．

`props` を一つづつ回し，name に一致するもののみを操作対象に，`StructuralDirectiveTransform` を適用します．\
あとは，NodeTransform と同様，`onExit` の関数を収集し，返します．

概ね，DirectiveTransform のインターフェイスを NodeTransform に合わせに行くような，そんなイメージです．

### transformVIf を読む

と，いうわけなので，NodeTransform を読む気持ちで読んでいきましょう．

本体は `processIf` です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L27-L31

初手はバリデーションです．\
`else` 出ないのに `exp` が空の場合はありえないので弾きます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L32-L38


そしてまずは `v-if` の場合の分岐です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L41-L56

`createIf` を呼び出しつつ，変数に保持する必要があるので，まずは `context.reference()` でリファレンスをとり，`IfBranch` の Node を表す `IR` を生成します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L42-L44

そしてら `onExit` で operation を生成します．

続いてそれ以外 (`v-else-if`, `v-else`) の場合です．\
まずこれらは `v-if` が存在していない場合はありえないので，チェックしてバリデーションします．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L58

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L63-L74

次に，`v-else` の後に `v-else-if` が続く場合をバリデーションします．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L76-L85

そうしたら，`IfBranch` を生成しつつ，`else-if` の場合はそのままそれを negative (alternative) に，`else` の場合には else 用の `IR` を生成します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L96-L108

これで transformVIf は終了です．

Codegen もさらっと確認しましょう．\
negative を持っている場合には再帰的に IfBranch を生成します．特に難しくないはずです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L60-L61

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/if.ts#L7-L45


## ランタイムを読む

読むのはもちろん `createIf` 関数です．

実装は [packages/runtime-vapor/src/apiCreateIf.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateIf.ts) にあります．

まずはシグネチャから見てみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateIf.ts#L17-L23

condition (getter) と，b1 (true の時の render) と b2 (false の時の render) を受け取ります．

実装を読み進めてみると，どうやら `createChildFragmentDirectives` という関数と，`doIf` という関数が重要そうです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateIf.ts#L49

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateIf.ts#L77

`createChildFragmentDirectives` の方から見てみましょう．こちらは別ファイルに実装されています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directivesChildFragment.ts#L14-L25

コメントにあるように，createIf と createFor で使われているもので．ディレクティブの子フラグメントを管理するためのもののようです．