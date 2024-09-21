# Transformer の概要 2

少し長くなったので分割しましたが続きです．\
概要，といいつつ気付けば具体的な実装の詳細を読んでしまっていますが，まぁ，自然な導入としては良いのではないでしょうか (笑)

前ページまでで `template` 関数に引数として渡すテンプレートの文字列を生成する実装を見てきました．\
ここでは `Block` の index 管理等を見ていきます．

## registerTemplate

`TransformContext` に `registerTemplate` という関数があります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L131-L135

この `registerTemplate` では `pushTemplate` という関数を呼んでいます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L123-L130

template (文字列) は `this.ir.template` (配列) に登録されていきます．

`this.ir` は `RootIRNode` です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L87-L88

つまりここです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L56-L60

そして，この `registerTemplate` が呼び出されるのは 3 箇所です．

1. `transformNode` の最後 (root の時のみ)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L264-L266

2. `transformChildren` で children を処理したあと (Fragment の時のみ)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L22-L24

3. `context.enterBlock` が呼び出された時 (`onExit`)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L104-L113

`context.enterBlock` は `transformVFor` や `transformVIf` で `Block` に入るときに呼び出す関数です．\
これはまた `v-for` や `v-if` のコンパイルの実装を見る時に見るとして，一旦は 1 と 2 だけ把握しておけば良いでしょう．

<div v-pre>

1 に関しては特に何もないと思います．\
今回読んでいる小さいコンポーネントはここで template が登録されます．\
つまり，この時点で今，`this.ir.template` は，`["<p>Hello, Vapor!</p>"]` という状態になっています．

</div>

これがあれば template の index がわかるので，

```js
const t0 = template("<p>Hello, Vapor!</p>");
```

というコードは生成することができそうです．(ここはまた codegen の時に実際に見てみましょう．)

2 の Fragment の場合というのは，

```vue
<template>
  <p>Hello, Vapor 1</p>
  <p>Hello, Vapor 2</p>
  <p>Hello, Vapor 3</p>
</template>
```

のような template を書いた場合です．この場合は 2 のタイミングで 3 つの template が登録されます．

```js
// this.ir.template
["<p>Hello, Vapor 1</p>", "<p>Hello, Vapor 2</p>", "<p>Hello, Vapor 3</p>"];
```

```js
const t0 = template("<p>Hello, Vapor 1</p>");
const t1 = template("<p>Hello, Vapor 2</p>");
const t2 = template("<p>Hello, Vapor 3</p>");
```

## render 関数の戻り値

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

に話を戻して，これから得られた `IR` を再度見返してみます．\
(不要な部分は省略しています)

```json
{
  "type": "RootIRNode",
  "template": ["<p>Hello, Vapor!</p>"],
  "block": {
    "type": "BlockIRNode",
    "returns": [0]
  }
}
```

よく見ると，`"returns": [0]` というなんとも怪しいものがあります．\
この情報があれば，0 番目の node が render 関数の戻り値となりそうなことが分かります．

これは，`transformChildren` で行われています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L26-L31

ある条件下の時に，その node の `id` を `block.returns` に push しています．\
この id は `pushTemplate` した際に length から算出されています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L123-L135

そして，

> ある条件下の時

これがどういう場合かというと，まず 1 つ目の条件は `isFragment` が `true` の時です．\
これは `transformChildren` を実行している `node` が `Root`, `Element`, `Template`, `Component` のいずれかの場合です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L10-L14

そして 2 つめの条件は, `dynamic.flags` が `NON_TEMPLATE` では **ない** もしくは，`INSERT` である場合です．\
(※ ぱっと見分かりづらいですが，ビットマスクなので各フラグは排他的なものではありません)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L27-L28

この ２ つの条件に一致した場合に `block.returns` に `id` が push されます．\
1 つ目の条件はまぁ良いと思います．\
2 つめの条件の，`dynamic.flags` についてです．

## dynamic.flags

`dynamic` は `TransformContext` のプロパティです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L74

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L246-L252

`context.ir` がこの情報を持っているので，その参照を `TransformContext` に保持しています．\
特に，今回はこの `IRDynamicInfo` が持つ，`DynamicFlag` という情報が重要なのでそこを重点的にみていきます．

`DynamicFlag` は node がどのような性質を持っているかを表すフラグです．\
性質は各自コメントアウトにある通りです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L230-L244

ビットマスクで表現されているため，各性質は共存しうります．

それぞれ，どういう時にそのフラグがマークされるかどうかみてみましょう．

### DynamicFlag.REFERENCED

> This node is referenced and needs to be saved as a variable.

という記載があります．

`DynamicFlag.REFERENCED` が設定されるタイミングは 2 箇所です．

1. `context.reference` が呼ばれた時．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L117-L121

2. `newDynamic` によって `IRDynamicInfo` を生成した時 (デフォルト値として)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/utils.ts#L20-L23

まず 1 のケースですが，`context.reference` はかなり色々なところで呼ばれています．\
例えば，先ほど見ていた `transformChildren` の `isFragment` が `true` の時の条件分岐の中で呼ばれています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L22-L24

そして，このフラグがなんのために使われているのかというと，コードを生成する際に `id` を生成するためです．\
これはまた後ほど codegen の実装を見ていく際に詳しく見ますが，このフラグが立っている Node は `id` を生成し，変数に保持します．

> needs to be saved as a variable.

の通りです．

`transformChildren` の `isFragment` でこのフラグが立たせているのもこれでよくわかると思います．\
こうすることで，

```js
const n0 = t0();
const n1 = t1();
const n2 = t2();
```

のように `n${id}` という変数に保持するコードを出力することができます．\
逆に，変数に保持する必要のない node はこのフラグが立ません．

今回は，

```js
const t0 = template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0(); // ここ
  return n0;
}
```

のように `n0` という変数に保持する必要があるので，このフラグが立っているということです．

### DynamicFlag.NON_TEMPLATE

続いて `DynamicFlag.NON_TEMPLATE` です．\
このフラグが立っているかどうかはかなり重要で，立っていなければ `block.returns` に `id` が push されていく事になります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L26-L31

> This node is not generated from template, but is generated dynamically.

とあるように，どうやら template から生成された node ではないものにこのフラグが立つようです．

例えば，`transformComponentElement` や `transformSlotOutlet`, `transformVFor` などでこのフラグが立つようです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L96

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformSlotOutlet.ts#L31

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vFor.ts#L50

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L40

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vSlot.ts#L115


少し飛ばしてこのフラグと併用して重要なポイントになるのが `DynamicFlag.INSERT` です．

### DynamicFlag.INSERT

`returns` に id を push するかどうかはまず，`DynamicFlag.NON_TEMPLATE` が立っていないかどうかを見ます．\
もし立っていなければこの時点で `returns` に push されます．

立っていた場合は，`DynamicFlag.INSERT` が立っているかどうかを見ます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L96

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformSlotOutlet.ts#L31

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vFor.ts#L50

を見るとわかる通り，`Component`, `SlotOutlet`, `v-for` は初めからこのフラグが立っています．

しかし，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L40

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vSlot.ts#L115

はこの時点では立っていません．

if に関して言えば，`v-if` の場合 (`v-else-if`, `v-else` ではない場合) にこのフラグを立てます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L41-L43

そして，`<template #foo>` のような，挿入されたスロットに場合にはこのフラグが立つことはありません．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vSlot.ts#L110-L115

このようにして，`block.returns` に何を push して，何を push しないかを選択しています．

---

今回の小さなコンポーネントの場合には，`DynamicFlag.NON_TEMPLATE` というフラグは立たないので，`block.returns` には `id` が push されます．
これで，codegen に必要そうな `IR` を全て生成 (transform) することができました！

次は，codegen の実装を見ていきましょう！