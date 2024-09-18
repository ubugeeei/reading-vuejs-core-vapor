# どう読み進める？

<div align="center" style="font-size: 50px">

:man_shrugging:

</div>

## 何から読むか

前ページまでで，vuejs/core-vapor のパッケージの概要がわかったはずです．\
ここからは具体的にソースコーを読んでいくことになりますが，何から読むのがいいでしょうか.

答えは簡単です．

「**まず敵を知る**」ことです．

もう少しいうと，「具体的な成果物から見ていく」ことです．\
前提の説明でもあった通り，Vapor Mode はコンパイラの実装により仮想 DOM を使用しないモードを提供するものです．

つまりは，実際に Vue.js の SFC を書いてみて，Vapor Mode のコンパイラにかけてみて，出力を見てみましょう．\
それができればあとは，「**出力をするための実装を見る**」と「**出力されたコードの中身を読む**」の 2 プロセスを繰り返すことで，Vapor Mode の実装を理解していくことができます．

もう手順少し細分化すると，

1. Vue.js の SFC を書く
1. Vapor Mode のコンパイラにかける
1. 出力を見る (概要を理解する)
1. コンパイラの実装を見る
1. 出力コードの中身を読む
1. 1 に戻る

をひたすら繰り返せば良いです．

## 1~3 の詳細な手順

どこに SFC を書いてどうやって Vapor Mode のコンパイラにかけるのか，というところを詳しく説明します．

とりあえず手元に vuejs/core-vapor は clone しておきましょう．\
そして `30583b9ee1c696d3cb836f0bfd969793e57e849d` に checkout してしまいます．

[vuejs/core-vapor (30583b9ee1c696d3cb836f0bfd969793e57e849d)](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d)

```bash
git clone https://github.com/vuejs/core-vapor.git

cd core-vapor

git checkout 30583b9ee1c696d3cb836f0bfd969793e57e849d

pnpm install
```

[README](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/README.md?plain=1#L3-L6) を読んでみると，

```md
This repository is a fork of [vuejs/core](https://github.com/vuejs/core) and is used for research and development of no virtual dom mode.

- [Vapor Playground](https://vapor-repl.netlify.app/)
- [Vapor Template Explorer](https://vapor-template-explorer.netlify.app/)
```

という記載があります．

[Vapor Playground](https://vapor-repl.netlify.app/) と [Vapor Template Explorer](https://vapor-template-explorer.netlify.app/) というものがあるのがわかります．

Playground はいわゆる [Vue SFC Playground](https://play.vuejs.org) の Vapor 版です．
つまりここでコンパイル結果は確認することができます．

![Vapor Playground](/how-read/playground.png)

Template Explorer は Vapor Mode でどのようなコードが生成されるかを確認するためのツールです．\
これは，実は元々 vuejs/core の方にもあるのですが，それの vuejs/core-vapor 版です．\
こちらはあまり馴染みがない方も多いと思います．

これは, Vue.js の template (SFC に限らない) がどのようなコンパイル結果になっているのかを確認するためのツールです．\
つまり, SFC の style や script がどのようなコードになっているかは確認できません.

じゃあ Playground を使っていこう！と，言いたいところなのですが少し問題があります．\
今回は `30583b9ee1c696d3cb836f0bfd969793e57e849d` のコードを読んでいくことになるのですが，\
このリンクにホストされている　 Playground はコミットを固定することができません.\
Vapor Mode は現在 R&D が進行中のためソースコードは頻繁に変更されてしました．\
読んでる間にも変わってしまうとかなり不都合なので，どうにかして先ほどチェックアウトした手元の vuejs/core-vapor を使って確認できるようにしましょう．

vuejs/core-vapor には `/playground` というディレクトリがあります．\
`vuejs/core-vapor` で `pnpm dev-vapor`　を実行することでこの playground を起動することができます．\
そして `/playground/src` にいくつかのコンポーネントが置かれています．起動した playground にアクセスすると，`/playground/src/App.vue` がブラウザで実行されることがわかります．

この playground では `/playground/src` がルーティングに対応していて，例えば， `http://localhost:5173/components.vue` にアクセスすると `/playground/src/components.vue` が実行されます．\
今回はこの playground を活用してみましょう．\
とりあえず，`App.vue` を書き換えながら見てみましょう．\
コンパイル結果はブラウザの開発者ツールの source タブで確認することができます．

![dev-tool](/how-read/dev-tool.png)

なんだかもうよくわかりませんが．安心してください．\
もっと小さく SFC を書きながら徐々に読んでいきます．

また，この playground では，このリポジトリの実装が動いているので，随時ソースコードを変更しながら確認することができます．

この playground を使うことで 1\~3 の手順を踏むことができます．\
4~6 については，実際にこの本を読み進めながら一緒についてきてもらえれば大丈夫です！

さてさて，前ページから随分と前置きが長くなってしまいましたが，これでソースコードを読み進めるための準備は整ったので，次ページからは実際に出力やコンパイラの実装を読んでいきましょう！
