# コンパイラの全体像

## コンパイラ？

あるコードをあるコードに翻訳するための実装のことを **コンパイラ** と言います．\
Vue.js の場合は Single File Component を input とし，JavaScript と CSS を出力します.

Vapor Mode は Vue.js の新たなコンパイラ実装です．
\(仮想 DOM を使用しないコードを出力する)

Vapor Mode のコンパイラの実装は概ね `/packages/compiler-vapor` にあります．

[https://github.com/vuejs/core-vapor/packages/compiler-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor)

ここで，「概ね」と言ったのには理由があります．

一般的なコンパイラは，「parser」と「generator (codegen)」というもので実装されます．\
**parser** によってソースコード (文字列) を解析し，**AST (Abstract Syntax Tree)** (オブジェクト) に変換します．

ソースコードというのはただの文字列ですので，それを解析して構造を持ったオブジェクトとして扱うことで，今後の変換処理などがしやすくなります．\
そのオブジェクトこそが AST です．

例えば,

```js
1 + 2 * 3
```

というコード文字列をパースすると，

```json
{
  "type": "BinaryExpression",
  "operator": "+",
  "left": {
    "type": "Literal",
    "value": 1
  },
  "right": {
    "type": "BinaryExpression",
    "operator": "*",
    "left": {
      "type": "Literal",
      "value": 2
    },
    "right": {
      "type": "Literal",
      "value": 3
    }
  }
}
```

のように表現することができます．

そして得られた AST を元に，**generator** がコード (文字列) を生成します．\
正確には，得られた AST を任意の形に変換(翻訳)して，それを再度文字列として出力します．

この，「コード (input) 解析 -> 操作 -> コード (output) 生成」という手順は Vue.js で同じです．

## Vapor Mode のコンパイラの設計

そしてここで重要なのが，「Vapor Mode は既存の Single File Component のサブセットとしての実装になるので，パーサーは既存のものを使うことができる」という点です．\
これは Vapor の SFC に独自の構文があるわけではないことを意味します．

この既存のパーサーは `/packages/compiler-sfc` と `/packages/compiler-core` にあります．\
概要の方でも説明した通り，`compiler-core` には template のコンパイラがあり，`compiler-sfc` には SFC のコンパイラがあります．\
(もちろんこれらはそれらのパーサーも実装しています)

そして，template の AST に当たるものが `AST` というオブジェクトで，SFC の AST に当たるものが `SFCDescriptor` というオブジェクトです．

ここまでの話を図に起こすと以下のような感じになります．

![compiler](/compiler-overview/compiler.drawio.png)

つまり，`compiler-core`, `compiler-sfc` にある，`parser` と，`AST`，`SFCDescriptor` はそのまま使います．\
それぞれの具体的なソースコードはまた後で紹介します．

続いて，Vapor 固有の部分です．Vapor Mode のコードを出力する部分はもちろん `compiler-vapor` に実装されています．\
ここで，新しい概念として，`IR` というものがあります．\
`IR` は Intermediate Representation の略で，中間表現という意味です．\
ざっくり，「出力コードを表したオブジェクト」と思ってもらえれば問題ないです．\
こちらも具体的なソースコードはまた後で紹介します．

そして，Vue.js のコンパイラの重要な概念として，`transformer` というものがあります．\
これは AST を操作して AST をトランスフォーム (変換) するための実装で，Vapor Mode では主にこの transformer によって AST を IR に変換します．\
そして，`IR` を元にコードを生成します．

(transformer という概念自体は実は Vapor 固有のもではなく，`compiler-core` にも実装されていますが，Vapor Mode ではこれは使わずに `compiler-vapor` に実装された transformer を使用します．)

少しややこしいですが，ここまでの流れを改めて図に起こすと以下のようになります．

![compiler-vapor](/compiler-overview/compiler-vapor.drawio.png)