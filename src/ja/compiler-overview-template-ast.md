# Template のパースと AST

続いては `compiler-core` に実装されている方の parser と AST について見ていきます．\
SFC の parser はこれを利用しています．

![](/compiler-overview-template-ast/compiler-vapor.drawio.png)

## AST

AST (Abstract Syntax Tree) です．

おそらく，Vue.js のコンパイラが持っている中間的なオブジェクトでもっとも複雑なオブジェクトです．\
ここに各ディレクティブの情報や，マスタッシュ，スロット，などが AST として表現されています．

実装は，`compiler-core` の `ast.ts` にあります．

[packages/compiler-core/src/ast.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts)

全体像を読んでみましょう．

Node の種類を見てみると，いくつかの区分けがあることがわかります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L29-L61

- 無印
- containers
- codegen
- ssr codegen

結論から言ってしまうと，codegen と ssr codegen は Vapor のコンパイラには関係ありません．\
これは，後に説明する `IR` と `transform` という概念に関連しますが，Vapor Mode では codegen のための情報は `IR` に集約されています．\
しかし実は，従来の Vue.js (非 Vapor Mode) には `IR` という概念がなく，あくまで `AST` として出力コードも表現していました．\
Vapor Mode では transformer によって AST を IR に変換しますが，Vue.js (非 Vapor Mode) では AST (無印, containers) を AST (codegen, ssr codegen) に変換してそれを codegen に渡しています．

今回は，Vapor Mode のコンパイラの設計について説明するため，codegen と ssr codegen については触れません．\
それ以外についてみていきましょう！

## 無印

まずは特に区分のないベーシックな AST Node の種類です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L29-L37

### Root

Root はその名の通り，template のルートを表しています．\
children にまた Node を持っています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L111-L128

### Element

Element は要素を表す Node です．\
`<p>` や `<div>` などの要素がこれに該当します．\
コンポーネントやスロットもこれに該当します．

これらもまた children に Node を持っています．\
属性情報やディレクティブ情報も持っています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L136-L175

### Text

Text はその名の通り Text です．\
`<p>hello</p>` の `hello` がこれに該当します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L183-L186

### Comment

Comment はコメントです．\
`<!-- comment -->` がこれに該当します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L188-L191

### SimpleExpression

SimpleExpression は template 中に登場するシンプルな式です．
何がシンプルで何がシンプルでないかを説明するのは少し難しいですが，例えば `a` や `o.a` はシンプルで，`(() => 42)()` などはシンプルではありません．

<div v-pre>

`{{ foo }}` の `foo` や，`<button @click="handlers.onClick">` の `handlers.onClick` がこれに該当します．

</div>

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L232-L254

### Interpolation

<div v-pre>

これはマスタッシュです．\
`{{ foo }}` がこれに該当します．

</div>

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L256-L259

### Attribute

属性 (ディレクティブではない) がこれに該当します．\
`<div id="app">` の `id="app"` がこれに該当します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L193-L198

### Directive

ディレクティブです．

`v-on:click="handler"` や `v-for="item in items"` がこれに該当します．\
もちろん，`@click="handler"` や `#head` などのショートハンドも含まれます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L200-L218

## containers

containers は，特定の構造を持つ Node です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L39-L43

順番は前後してしまいますが，わかりやすいものからみていきましょう

### If, IfBranch

`If`, `IfBranch` は `v-if`, `v-else-if`, `v-else` で表現される Node です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L286-L298

構造的には `IfNode` が `IfBranchNode` を複数持つ構造で，`IfBranchNode` は `condition` (条件) と，`children` (その条件にあった時の Node) を持ちます．\
`v-else` の場合は `condition` が `undefined` になります．

### For

`v-for` で表現される Node です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L300-L309

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L311-L317

`<div v-for="it in list">` の場合は，`source` が `list`, `value` が `it` になります．

### CompoundExpression

これは少しわかりずらい概念です．

`compound` は「複合の」と言った意味があり，この Node は複数の Node から構成される Node です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L261-L284

<dic v-pre>

`{{ foo }} + {{ bar }}` などがこれに該当します．

</dic>

これは，直感的には `Interpolation` + `Text` + `Interpolation` という構造になりそうですが，\
Vue.js のコンパイラはこれらをまとめて `CompoundExpression` として扱います．

注目するべきものは，children に string や Symbol といった方が見受けられる点です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L269-L275

これは，部分的な文字列はもはや何かの AST Node として扱うのではなく，リテラルで簡略的に扱うための仕組みです．\

<div v-pre>

`{{ foo }} + {{ bar }}`

</div>

の間の文字列の `+` の部分はわざわざ Text Node として表現するよりも，`" + "` というリテラルとして扱う方が効率的です．

かのような AST になるイメージです．

```json
{
  "type": "CompoundExpression",
  "children": [
    { "type": "Interpolation", "content": "foo" },
    " + ",
    { "type": "Interpolation", "content": "bar" }
  ]
}
```

### TextCall

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/ast.ts#L319-L323

Text を `createText` という関数呼び出しとして表現する際の Node です．\
とりあえず，あまり気にしなくて良いです．

---

とりあえずここまでで必要な AST の Node について見てきました．\
ここからはこれらの AST を生成するためのパーサーの実装についてみてみましょう！
