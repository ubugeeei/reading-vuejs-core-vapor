# Template の Parser

前回までで parse の成果物である，AST について詳しくみてきました．\
ここからは実際にその AST を生成する parser について見ていきます．

parser は `parse` と `tokenize` という 2 つステップに分かれています．\
順番としては，まず `tokenize` です．

## Tokenize

`tokenize` は字句解析のステップです．\
字句解析というのは，簡単にいうと単なる文字列であるコードをトークン (字句) という単位に解析することです．\
トークンとは，あるまとまりのある文字列です．具体的にどういうものがあるかについては実際にソースコードを見てみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L87-L138

:::info Tips

実は，このトーカナイザは htmlparser2 というライブラリのフォーク実装です．

https://github.com/fb55/htmlparser2/tree/master

このパーサーは最も早い HTML パーサーとして知られていて，Vue.js は [v3.4 以降このパーサーを利用することによってパフォーマンスを大きく向上](https://blog.vuejs.org/posts/vue-3-4#_2x-faster-parser-and-improved-sfc-build-performance) させました．

ソースコード上でもその旨が記載されています

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L1-L3

:::

トークンはソースコード上では `State` として表現されています．\
tokenizer は state という内部状態を一つ持ち，これは `State` という enum で定義された状態のどれか一つに定ります．

<div v-pre>

具体的に覗いてみると，まずはデフォルトの状態である `Text`, そして，Interpolation の開始を表す `{{`, Interpolation の終了を表す `}}`, その間の状態，タグの開始を表す `<`, タグの終了を表す `>` などが定義されています．

</div>

以下の，

<div v-pre>

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L47-L84

あたりを見てもわかる通り，解析する文字列は Uint8Array や数値としてエンコードし，パフォーマンスの向上を図っています．(あまり詳しくないですが，おそらく数値の方が比較演算が早かったりするのでしょう．)

htmlparser2 のフォーク実装なので，Vue.js のソースコードリーディングかと言われると微妙なところはありますが，実際に少し Tokenizer の実装を読んでみましょう．\
以下からが Tokenizer の実装です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L236

コンストラクタを見てわかる通り，各 Token に対するコールバックを定義することで，「tokenize -> parse」を実現しています．\
(後述の parser.ts の方で実際に template のパース処理をこのコールバックを定義することで実現しています)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L265-L268

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L180-L208

そして，`parse` というメソッドが最初の関数です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L923-L928

buffer にソースを読み込み (格納し)，1 文字づつ読み進めます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L929-L930

特定の state の際にコールバックを実行します．\
初期値は `State.Text` なのでまずそこに入ります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L935-L943

例えば，`state` が `Text` の場合で，現在の文字が `<` だった場合には `ontext` コールバックを実行しつつ，`state` を `State.BeforeTagName` に更新します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/tokenizer.ts#L318-L324

このように，特定の状態下で文字を読み，その文字の種類によって状態を遷移させ次々と読み進めます．\
基本的にはこれの繰り返しです．

他の状態の他の文字の場合はあまりに実装が多いので割愛ます．
(多いですが，やってることは一緒です．)

</div>

## Parse

さて，トーカナイザの実装があらかた理解できてので次は `parse` です．\
こちらは `parser.ts` に実装があります．

[https://github.com/vuejs/core-vapor/packages/compiler-core/src/parser.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts)

ここで先ほどの `Tokenizer` が利用されています

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L97

各トークンに対してコールバックを登録し，template の AST を組み立てて行っています．

とりあえず一つの例を見てみましょう．\
`oninterpolation` というコールバックに注目してください．

こちらは名前の通り，`Interpolation` Node に関連する処理です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L108-L108

<div v-pre>

delimiter (デフォルトでは `{{` と `}}`) の長さと，渡ってくる index を元に，`Interpolation` の inner (コンテンツ) の index を計算しています．

</div>

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L112-L113

その index を元に inner のコンテンツを取得します

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L120

そして最後に Node を生成します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L129-L133

`addNode` はすでに stack がある場合はそこに，ない場合は root の children に Node を push する関数です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L916-L918

stack というのは，element がネストしていくたびにその element を積んでいくスタックです．

せっかくなのでその処理も見てみましょう．

opentag (開始タグ) が終わったタイミング，例えば `<p>` だった場合は `>` のタイミンングで stack に現在の tag を `unshift` しています

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L567-L586

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L580

そして，onclosetag で stack を shift します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core/src/parser.ts#L154-L166


このように，`Tokenizer` のコールバックを駆使して AST を構築していきます．\
実装量自体は多いですが，基本的にはこれらを地道にやっていくだけです．