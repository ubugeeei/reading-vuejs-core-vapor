# Transformer の概要

## 実装箇所

続いて，`AST` を `IR` に変換するための `Transformer` についてみていきます．

![compiler vapor transformer](/compiler-overview-transformer/compiler-vapor.drawio.png)

コンパイラの概要の際にも話した通り，transformer というコンセプト自体は `vuejs/core` の時から，`compiler-core` に存在していました．
その実装はこのあたりにあります．

- [packages/compiler-core/src/transform.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/transform.ts)
- [packages/compiler-core/src/transforms/](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/transforms)

Vapor Mode には関係ないので今回は読み飛ばしますが，Vapor Mode の transformer もこの元々あった transformer を参考に設計されています．(使われてはいません)\
今回読んでいく Vapor Mode の transformer はこのあたりに実装があります．

- [packages/compiler-vapor/src/transform.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts)
- [packages/compiler-vapor/src/transforms/](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms)

`transform.ts` に実装された `transform` という関数をコンパイラで呼び出しています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L209-L213

呼び出し (compile: parse -> transform -> generate):

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L36-L40

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L62

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L76-L89

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L91

## Transformer の設計

Transformer には 2 種類のインターフェイスがあります．\
`NodeTransform` と `DirectiveTransform` です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L31-L34

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L36-L40

[/transforms/](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms) には様々 transformer が実装されていますが，これらはこの 2 つのいずれかになります．

サクッとそれぞれがどっちなのかをまとめておくと，

- NodeTransform
  - [transformChildren](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts)
  - [transformComment](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformComment.ts)
  - [transformElement](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts)
  - [transformSlotOutlet](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformSlotOutlet.ts)
  - [transformTemplateRef](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformTemplateRef.ts)
  - [transformText](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts)
- DirectiveTransform
  - [transformVBind](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vBind.ts)
  - [transformVFor](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vFor.ts)
  - [transformVHtml](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vHtml.ts)
  - [transformVIf](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts)
  - [transformVModel](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vModel.ts)
  - [transformVOn](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOn.ts)
  - [transformVOnce](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vOnce.ts)
  - [transformVShow](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vShow.ts)
  - [transformVSlot](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vSlot.ts)
  - [transformVText](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vText.ts)

といった感じで．名前から想像できる通りだと思います．\
これらの transformer によって AST を IR に変換していきます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L76-L89

からもわかる通り，これらの transformer を `transform` という関数に対してオプションとして渡しています．

`nodeTransforms`, `directiveTransforms` は以下から来ています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L63-L64

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L100-L125

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L16-L31

## transform 関数を読む

早速 `transform` 関数を読んでみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L210-L229

transform 関数は `TransformContext` というオブジェクトを 1 つ持ちます．\
ざっくり，Transform に必要なオプションや，状態を持つためのオブジェクトです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L62

この，context にある実装は実際の transform 処理を追いながら随時読んでいきましょう．

とりあえず，この context を transformNode という関数に渡して transform 処理が始まります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L224-L226

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L231-L233

今回は，今読んでいる，小さいコンポーネント

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

から得られた AST を IR に transform する処理を追っていきます．

まず，得られた AST は以下のようなものになります．

```json
{
  "type": "RootNode",
  "source": "\n  <p>Hello, Vapor!</p>\n",
  "children": [
    {
      "type": "ElementNode",
      "tag": "p",
      "ns": 0,
      "tagType": "Element",
      "props": [],
      "children": [
        {
          "type": "TextNode",
          "content": "Hello, Vapor!"
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

まず，この Node が `transformNode` に入っていき，`transformNode` は option として渡された `nodeTransforms` を一つづつ順に実行していきます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L237-L240

設計として，transform を適用した後に最後に実行するものを `onExit` として受けるようになっています．\
これらは後で実行するように保存しておいて，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L241-L247

`transformNode` の最後で実行します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transform.ts#L259-L262

早速 `nodeTransforms` の実行を見ていきましょう．\
順番は，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/compile.ts#L105-L114

<div v-pre>

の通りです．今回はまだディレクティブやスロットは使っていないので，`transformText` -> `transformElement` -> `transformChildren` の順に読んでいこうと思います．

</div>

## transformText

実装はここにあります．

[packages/compiler-vapor/src/transforms/transformText.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts)

今見ている `node` の `type` が `ELEMENT` の場合で，children の node が全て text-like で，interpolation を含む場合にはその node を「text のコンテナ」として扱い処理 (`processTextLikeContainer`) します．\
text-like というのは text または interpolation です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L63-L78

今回は，AST を見てわかる通り，

```json
{
  "type": "ElementNode",
  "tag": "p",
  "ns": 0,
  "tagType": "Element",
  "props": [],
  "children": [
    {
      "type": "TextNode",
      "content": "Hello, Vapor!"
    }
  ]
}
```

今回は interpolation を含まないのでこの分岐に入りません．

少し順番は前後しますが，今回は次々 Node が読み進められ，`TextNode` に入った時に下の下の以下の分岐を通ります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L40-L42

context の template というプロパティに text node の content を追加して終了です．\
template は `"Hello, Vapor!"` になります．

## transformElement

実装はここにあります．

[packages/compiler-vapor/src/transforms/transformElement.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts)

まず前提として，この transform は全体として `onExit` のライフサイクルに乗っています．\
関数を return している事に注目してください．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L43

今回は Component ではないので，`transformNativeElement` が実行されることになります (今 `p` タグを読んでいると仮定してください).

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L55

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L62-L66

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L130-L134

`transformNativeElement` では，`template` 関数に引数として渡すための文字列を生成します．

<div v-pre>

まずは AST から tag 名を取り出し，`<` にくっつけます．

</div>

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L137-L139

props がある場合はそれも生成しますが．今回は props がないので一旦スキップします．

あとは，`context` に保持してある `childrenTemplate` というものを差し込みつつ，閉じタグを生成したら終了です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L165-L169

`childrenTemplate` がどこで作られているかというと，`transformChildren` です．

transform の実行順的には, `transformText` -> `transformElement` -> `transformChildren` なのですが，今見た `transformElement` の処理は `onExit` で実行され，先に `transformChildren` が実行される事になるため，すでに `childrenTemplate` は生成されています．

それでは実際に `childrenTemplate` を作っているところを見てみましょう.

## transformChildren

実装はここにあります．

[packages/compiler-vapor/src/transforms/transformChildren.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts)

やっていることは単純で，入ってきた `node` の `children` に対して一つづ順に `transformNode` を実行していきます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L18-L20

ここで面白いのが， child node に入ったらまず child node 専用の context (`childContext`) を新たに生成しているところです．\
そして，`transformNode` が済んだら，その `childContext` に保持されている `template` を取り出して，親の `context` に push します．\
(push はただの [Array.prototype.push](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push) です)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L32-L34

<div v-pre>

`context.template` に `"<p>Hello, Vapor!</p>"` という文字列を作ることができました．

</div>

## まだまだ終わらない

果たして，文字列を生成することができたのはいいですが，実際には

```js
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

のようなコードを生成しなくてはなりません．\
このためにはまだ情報が足りません．\
このテンプレートを `t0` する実装や，その結果を `n0` とし，render の return にする実装はまだみていません．\
それがどこで行われているかは次のページで見てみましょう．