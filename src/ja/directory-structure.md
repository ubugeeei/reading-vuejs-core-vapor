# core-vapor のディレクトリ構成

:::info リポジトリの用語について
これから行う説明について，vuejs/core と vuejs/core-vapor のどちらもに適応される話は `v3 のリポジトリ` として表記します．(例，v3 のリポジトリでは，~~~) \
何が core-vapor 固有の話で，何がもと (vuejs/core) からある話なのかを区別することで差分を予想しながら core-vapor の理解に繋げます．
:::

## 主要なパッケージ

v3 のリポジトリは [pnpm workspace](https://pnpm.io/workspaces) によってモノレポで管理されています．\
各パッケージは `/packages` ディレクトリに配置されています．\
[packages](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages)

そして，それらのパッケージは大きく分けてコンパイラとランタイムの 2 つに分けられます．\
`compiler-` で始まるパッケージはコンパイラに関連するパッケージで，`runtime-` で始まるパッケージはランタイムに関連するパッケージです．

- [packages/compiler-core](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-core)
- [packages/compiler-dom](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-dom)
- [packages/compiler-sfc](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc)
- [packages/runtime-core](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core)
- [packages/runtime-dom](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-dom)

---

core-vapor では新たに `compiler-vapor` と `runtime-vapor` が追加されています．

- [packages/compiler-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor)
- [packages/runtime-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor)

---

また，次に重要なパッケージが `reactivity` です．\
`ref` や `computed`, `watch` などの実装はランタイムパッケージからは独立して `@vue/reactivity` として提供されています．\
こちらは `/packages/reactivity` に配置されています．

- [packages/reactivity](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity)

---

そして，Vue.js のエントリとなるパッケージは `/packages/vue` に配置されています．\
`core-vapor` においては，これに加え，`/packages/vue-vapor` という Vapor Mode のエントリとなるパッケージが追加されています．

- [packages/vue](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue)
- [packages/vue-vapor](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/vue-vapor)

---

全体像:

![structure-overview](/directory-structure/overview.drawio.png)

## compiler-core

`compiler-core` はその名の通りコンパイラのコア部分を提供します．\
コンパイラのパッケージはこれらの他に，`compiler-dom` と `compiler-sfc` などがありますが，\
core は，sfc や dom といった特定の用途や特定の環境に依存しないコアな実装です．

Vue.js にはさまざまなコンパイラが存在しています．

例えば，`template` オプションを利用するとランタイム上でテンプレートがコンパイルされます．

```ts
createApp({
  template: `<div>{{ msg }}</div>`,
  setup() {
    const msg = ref("Hello, Vue!");
    return { msg };
  },
}).mount("#app");
```

しかし，このテンプレートは見てわかる通り，SFC でも同様のテンプレート構文を利用しています．

```vue
<script setup lang="ts">
import { ref } from "vue";

const msg = ref("Hello, Vue!");
</script>

<template>
  <div>{{ msg }}</div>
</template>
```

また，これ以外にも HTML の innerHtml として記載したものをコンパイルするケースなど，Vue.js のテンプレートとしてのコンパイルは様々です．\
このような様々な用途の共通部分を提供するのが `compiler-core` だという理解で概ね問題ありません．

具体的には，`template` を `render` 関数にコンパイルするコアな実装が含まれます．

## compiler-dom

Vue.js では，DOM に関する操作やコード生成を行うものは **環境依存である** という考えのもと，これらはコアから分離されています．\
これは後ほど runtime の方でも登場します．

コンパイラに関して言えば，DOM イベントに関するコードを生成したり，特定の DOM 要素に関するコードを生成したりする実装が含まれます．\
Vue.js のイベント修飾子あたりを想像してもらうとわかりやすいかもしれません．

例えば，`@submit.prevent` といった修飾子は，

```ts
(e: Event) => e.preventDefault()
```

のようなコードが必要となり，これは DOM API に依存するコード生成です．
このようなものを提供するのが compiler-dom です．

例:

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-dom/src/runtimeHelpers.ts#L29-L35

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-dom/src/directives/vOn.ts#L30-L36

## compiler-sfc

これは名前の通り SFC (Single File Component) に関するコンパイラです．\
具体的には，`<script setup>` や `<style scoped>` などの機能を提供します．

多くの場合，このコンパイラは別パッケージになっているバンドラ等のツールのプラグインに呼ばれることで機能します．\
有名な例としては，[Vite](https://vitejs.dev/) で利用される [vite-plugin-vue](https://github.com/vitejs/vite-plugin-vue) や，[webpack](https://webpack.js.org/) で利用される [vue-loader](https://github.com/vuejs/vue-loader) などがあります．

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/compiler.ts#L25-L31

https://github.com/vuejs/vue-loader/blob/698636508e08f5379a57eaf086b5ff533af8e051/src/compiler.ts#L8-L25

## runtime-core

ランタイムのコア部分を提供します．\
こちらも DOM には依存しない，コンポーネントのランタイムの実装や，仮想 DOM とそのパッチ，スケジューラの実装などが含まれます．\
パッチ処理 (renderer) に関しては，実際に DOM 操作が行われそうな雰囲気がありますが，runtime-core では非 DOM API 依存に定義された interface の呼び出しのみを行っており，\
実際の関数は runtime-dom に実装され，注入されています．(依存性逆転の法則を利用しています．)

interface: 

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/renderer.ts#L108-L145

createRenderer という関数が option として実際のオペレーションを受け取る(runtime-core では直接呼び出さない):

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-core/src/renderer.ts#L325-L328


## runtime-dom

上記で説明したうちの，実際の DOM オペレーションの実装や，それらを core に注入する実装が含まれます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-dom/src/nodeOps.ts#L45-L90

他にも，compiler の説明でも触れた，実際に DOM イベントを処理するための実装なども含まれています．\
(compiler-dom はこれらの呼び出しを行うコードを出力するための実装です．)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-dom/src/directives/vOn.ts#L18-L47

## reactivity

名前の通り，Vue.js のリアクティビティシステムを提供します．\
どこかで，「Vue.js のリアクティビティシステムは **_out of box_** で利用可能だ」，という話を聞いたことがあるかもしれませんが，これはこのパッケージが他のパッケージに依存せず独立して実装されているためです．\
そして，この「独立している」という点も Vapor Mode の実装においては重要なポイントとなります．

それもそのはず，少しネタバレをしておくと，Vapor Mode は仮想 DOM を使わずにリアクティビティシステムを活用することで画面を更新していくわけですが，実際のところこのリアクティビティのパッケージにはほとんど変更が入っていません．\
詰まるところ，Vapor の機能の一部としてスッと使えてしまうほど Vue.js のランタイムには依存していないのです．

## compiler-vapor, runtime-vapor

さて，ようやく今回のメインです．
名前の通り，Vapor Mode のコンパイラとランタイムの実装です．

Vapor Mode は現在 R&D のフェーズであるため，なるべく upstream にある既存の実装には手を加えずに済むように独立したパッケージとして実装されています．\
そのため，既存の runtime, compiler と大きく被る部分もありますが，実はこの部分関しても重複して実装しています．

このパッケージでどのような実装がされているかなどはこれから見ていく (というかそれがこの本のメインの話) なので，ここでは省略します．

---

ざっくり，パッケージの全体構成がわかったところで早速 Vapor Mode の実装を理解するために必要なソースコードを読んでいきましょう！