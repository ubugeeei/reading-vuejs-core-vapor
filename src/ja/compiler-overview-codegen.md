# Codegen の概要

ここまででコードをパースし，AST を生成し，transformer によって IR に変換するまでの流れを見てきました．\
最後は IR からコードを生成する codegen について見ていきましょう．\
ここまで見れればコンパイラに関してはかなりの部分を理解できるでしょう．

![compiler vapor codegen](/compiler-overview-codegen/compiler-vapor.drawio.png)

## 実装箇所

codegen (generator) の実装は以下のあたりにあります．

- [packages/compiler-vapor/src/generate.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts)
- [packages/compiler-vapor/src/generators](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators)

transformer と構成は似ていて，`generate.ts` に `generate` 関数や `CodegenContext` が実装されていて，`generators` ディレクトリには各ノードのコード生成関数が実装されています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L99-L103

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L22

例の如く，`CodegenContext` に関しては実際にコンポーネントのコード生成を追いながら必要なところを随時読んでいきましょう．

## generate

まずは `generate` 関数に入ります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L99-L103

code は `buildCodeFragment` によって得られる `push` という関数で次々 append していきます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L104-L104

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/utils.ts#L30-L35

まずは render 関数のシグネチャを push します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L108

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L113

そして `genBlockContent` によって ir からコードを生成します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L116-L118

template の宣言や import 文の宣言は render 関数の外で行われるので，これらは，`preamble` として生成され，コードの先頭に追加されます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L126-L129

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L136-L139

そしてこの `code` が最終的なコードになります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generate.ts#L141-L148

それでは `genBlockContent` を読んでいきましょう．

:::info Tips: `_sfc_render` について

出力コードを確認した時，render 関数の名前は `render` ではなく `_sfc_render` でした．\
しかし，`generate` 関数内で `render` として push しています．

実は，`render` という関数は `vite-plugin-vue` の実装によってのちに `_sfc_render` にリライトされます．\
なので，`_sfc_render` という名前は `compiler-vapor` には実は登場しないのです．

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/template.ts#L71-L76

:::

## genBlockContent

実装は [packages/compiler-vapor/src/generators/block.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts) にあります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L36-L41

`block.dynamic.children` から child を一つづ取り出して generate します．\

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L51-L53

`block.dynamic.children` は `transformChildren` で生成されるもので，中身としては `childContext.dynamic` がそのまま入る形になっています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L36

改めて，flags 以外にどのような情報があるのか見ておくと，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L246-L252

id や template の index の情報が入っていることが分かります．\
この情報を使って，`genChildren` によりコードを生成します．

## genChildren

`genChildren` は [packages/compiler-vapor/src/generators/template.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts) に実装されています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L18-L23

この関数では `const n${id} = t${template}()` のようなコードが生成されます．
つまり，今回でいうところの `const n0 = t0()` のようなコードが生成されるわけです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L29-L32

ここで，後々登場する `nextSibling` や `firstChild` のようなコードも生成されます．(今は読み飛ばします．)

## genBlockContent の続き

children のコードが生成できたら.

次に operation と effect を generate します．\
ここはまだ登場していませんが，テキストの書き換えやイベントハンドラの登録などのコードの生成です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L55-L56

最後に，`return` 文の生成です．

`block.returns` を map し，`n${idx}` の識別子を生成しつつ `return` 文を生成します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/block.ts#L58-L65

---

なんと，ざっくり Codegen はこれで終わりです．\
さて，これで単純なコンポーネントをコンパイルするためのコンパイラの実装は一通り追うことができました．\
改めて，今回の目的と手順，残りやりたいことをまとめつつ次のステップに進みましょう！
