# SFC のコンパイルの流れ

さて，最終的な出力コードを出力すための実装を見てみましょう．

改めて，

```vue
<template>
  <p>Hello, Vapor!</p>
</template>
```

から，

```js
const _sfc_main = {};
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

を作る方法です．

前ページまでで最も複雑な render の出力はわかっているので，ここからはさらっと行けるはずです．

## compiler-sfc と vite-plugin-vue を読む

ここからは Vapor Mode というより，`compiler-sfc` と `vite-plugin-vue` の実装です．
非 Vapor の場合は，概ね，

```js
const _sfc_main = {};
import { createElement as _createElement } from "vue";

function _sfc_render(_ctx) {
  return _createElement("p", null, "Hello, World!");
}
export default Object.assign(_sfc_main, {
  render: _sfc_render,
  __file: "/path/to/App.vue",
});
```

のようになるだけで，周辺のコードや変換の流れは変わりません．\
しかるべきタイミングで `compiler-vapor` に実装されてコンパイラが呼び出されるだけです．

## SFC はいつコンパイルされる?

`compiler-sfc` のエントリポイントを見てもわかる通り，ここにはバラバラの compiler が export されているだけです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/index.ts#L4-L7

これらを統合的に扱う実装はここにはありません．

### Vite のプラグインシステム

冒頭でも述べた通りこれらの実装はバンドラ等のツールによって呼び出され，それぞれのコンパイルが実行されます．\
ツールは様々ありますが，今回は `Vite` を前提に見てみます．

`Vite` でこれを担うのは公式のプラグインである `vite-plugin-vue` が有名です．

https://github.com/vitejs/vite-plugin-vue

プラグインは `vite.config.js` に設定することで有効になります．

皆さんは Vite で Vue.js を使う時このように書くことがあるかと思います．

```js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});
```

まさにこの `vue()` がプラグインコードを生成しています．

このプラグインの実装を見る前に，まずは Vite のプラグインのコンセプトを把握しましょう．\
主に重要になるのは `transform` というフックです．

https://vitejs.dev/guide/api-plugin.html#simple-examples

前提として， Vite のプラグインシステムは rollup のスーパーセットであり，production build では実際に rollup のプラグインシステムが使われます．

https://vitejs.dev/guide/api-plugin.html#plugin-api

> Vite plugins extends Rollup's well-designed plugin interface with a few extra Vite-specific options. As a result, you can write a Vite plugin once and have it work for both dev and build.

### transform フック

プラグインを実装する際，この `transform` というフックに処理を書くことでモジュールを変換することができます．\
ざっくり，ここでコンパイラを動かすことで SFC をコンパイルすることができます．

そして，この `transform` がいつ実行されるか，というのは概ね「JavaScript からモジュールが読み込まれた時」です．\
もっというと，`import` や `import()` が実行された時です．

#### development mode

そして，いつ import が実行されるのかというのはモードによって違います．
開発者モードの場合はブラウザ上で `import` が記述された JavaScrip が読み込まれ，そこか実行された時にブラウザ Native ESM の仕組みを使い開発サーバーにリクエストが飛びます．\
開発サーバーはそれをハンドリングし，`transform` を実行，結果をブラウザに返します．\
この先は Native ESM と同じです．\
この仕組みは Vite が実装しています．

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/transformRequest.ts#L67-L71

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/transformRequest.ts#L126

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/transformRequest.ts#L190-L198

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/transformRequest.ts#L344-L346

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/server/pluginContainer.ts#L456-L469

#### production mode

プロダクションモードのビルドでは `rollup` のバンドラが動きます．\
バンドラはモジュールを解決するときに `import` を読みます．

その読み込みの際に，`transform` を実行し，結果をその解決結果とします．\
これは rollup が実装しています．

Vite は概ね rollup の `bundle` 関数を呼んでいるだけです．

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/build.ts#L507-L509

https://github.com/vitejs/vite/blob/21ec1ce7f041efa5cd781924f7bc536ab406a197/packages/vite/src/node/build.ts#L838-L840

rollup が transform を呼び出しているコード:

https://github.com/rollup/rollup/blob/79c0aba353ca84c0e22c3cfe9eee433ba83f3670/src/utils/transform.ts#L31-L36

https://github.com/rollup/rollup/blob/79c0aba353ca84c0e22c3cfe9eee433ba83f3670/src/utils/transform.ts#L102-L103

https://github.com/rollup/rollup/blob/79c0aba353ca84c0e22c3cfe9eee433ba83f3670/src/ModuleLoader.ts#L327-L329

https://github.com/rollup/rollup/blob/79c0aba353ca84c0e22c3cfe9eee433ba83f3670/src/utils/PluginDriver.ts#L191-L213

### vite-plugin-vue の transform フック

vite-plugin-vue の `transform` フックの実装はこの辺りです．

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/index.ts#L320-L341

ここで `transformMain` という関数を実行しています．

`transformMain` は [vite-plugin-vue/packages/plugin-vue/src/main.ts](https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts) に実装されています．

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L30-L37

この中で，`compiler-sfc` の `compileScript` や `compileTemplate` が呼ばれています．\
これでどのように Vue.js のコンパイラが設定され，どのタイミングで実行されるかがわかったはずです．

## transformMain を呼んで出力コードの全体を掴む

このようなコンパイル結果を思い出してください．

```js
const _sfc_main = {};
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

のようなコードをどう出力すれば良いかです．概ね，

```js
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
```

の部分は `compileTemplate` という関数によって生成されます．

```js
const _sfc_main = {};

// <---------------- insert compileTemplate result

export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

もし `<script>` や `<script setup>` があった場合は，

```js
const constant = 42;

const _sfc_main = {
  props: {
    count: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const localCount = ref(0);
    return { localCount };
  },
};

// <---------------- insert compileTemplate result

export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

のようなコードが生成されますが，こは主に `compileScript` によって生成されます．

つまり，以下のような感じです．

```js
// <---------------- insert compileScript result

// <---------------- insert compileTemplate result

export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

そして，最後の，`_sfc_main` にプロパティを追加する部分ですが，これは `attachedProps` として収集され，コードとして展開されます．

ここまでの話のソースコードが以下の部分になります．\
(`compileScript`, `compileTemplate` ではなく `genScriptCode`, `genTemplateCode` を呼び出してますが，ラッパー関数だと思ってください．)

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L68

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L71-L94

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L122-L127

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L231-L236

(output を join したものが最終的な結果になります．)

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L240

(※ attachedProps の収集)

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L96-L100

https://github.com/vitejs/vite-plugin-vue/blob/8d5a270408ff213648cda2a8db8f6cd63d709eb5/packages/plugin-vue/src/main.ts#L131-L137

このような形で，ざっくりとですが，

```js
const _sfc_main = {};
import { template as _template } from "vue/vapor";
const t0 = _template("<p>Hello, Vapor!</p>");
function _sfc_render(_ctx) {
  const n0 = t0();
  return n0;
}
export default Object.assign(_sfc_main, {
  render: _sfc_render,
  vapor: true,
  __file: "/path/to/App.vue",
});
```

のような最終的なコードを生成しています．

## Vapor Mode のコンパイラの切り替え

Vapor Mode のコンパイラとそうでないコンパイラはどのように切り替えられているのでしょうか，というのを最後に見てこのページは終わります．\
実は，`vite-plugin-vue` には `vapor` とう Vapor Mode 専用のブランチがあります．

というのも，Vapor Mode は現在 R&D の段階です．\
`vuejs/core-vapor` は既存のコードベースに影響しないように切り出されて開発が進んでいます．\
`vite-plugin-vue` においてもこれは同じです．

コンパイラの切り替えのようなものは `vite-plugin-vue` に一部侵食してしまうのはまぁ仕方がないことです．\
こちらの方はブランチを切り替えて npm の配布パッケージ名を変えるという方法で回避されています．

ブランチはこれです.

https://github.com/vitejs/vite-plugin-vue/tree/vapor

配布されているパッケージはこれで，`@vue-vapor/vite-plugin-vue` として配布されています．

https://www.npmjs.com/package/@vue-vapor/vite-plugin-vue

そしてこのブランチには，`vapor` であるかどうかを切り替えるフラグが用意されています．\
正確には，このオプションは vuejs/core-vapor の実装へ fallthrough される前提なので，型から Omit するように記述されています．

https://github.com/vitejs/vite-plugin-vue/blob/d8e849f147c159de90c1758f7001bcd2fcc534df/packages/plugin-vue/src/index.ts#L42-L55

https://github.com/vitejs/vite-plugin-vue/blob/d8e849f147c159de90c1758f7001bcd2fcc534df/packages/plugin-vue/src/index.ts#L67-L83

つまり，定義自体は `SFCScriptCompileOptions`, `SFCTemplateCompileOptions` の方に存在しています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/compileScript.ts#L128-L131

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/compileTemplate.ts#L60

あとは，plugin を設定する際に引数としてこのフラグを渡せばコンパイラを切り替えることができます．\
参考までに，`vuejs/core-vapor` の playground では以下のように設定しています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/playground/vite.config.ts#L18-L22

あとはここから fallthrough されたフラグをもとにコンパイラを切り替わる実装がされていれば良いはずです．\
この実装は以下で行われています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/compileTemplate.ts#L212-L218

:::info コンパイラ切り替えの API について
将来的にはコンパイラの切り替えはコンポーネントごとに出来るようになります．\
API はまだ定まっていませんが， `<script vapor>` のようなものが案として挙げられます．

ちなみに，API の策定は以下の issue で議論しています．

https://github.com/vuejs/core-vapor/issues/198
:::

