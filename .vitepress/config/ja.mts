import type { DefaultTheme, UserConfig } from "vitepress";

export default (): UserConfig<DefaultTheme.Config> => ({
  title: "vuejs/core-vapor を読む",
  description: "vuejs/core-vapor を読む",
  themeConfig: {
    sidebar: [
      {
        text: "この本について",
        link: "/ja/",
      },
      {
        text: "さぁ！飛び込もう！",
        link: "/ja/lets-deep-dive",
      },
      {
        text: "core-vapor のディレクトリ構成",
        link: "/ja/directory-structure",
      },
      {
        text: "どう読み進める？",
        link: "/ja/how-read",
      },
      {
        text: "単純なコンポーネントを読む",
        link: "/ja/read-simplest-component",
      },
      {
        text: "コンパイラの概要",
        link: "/ja/compiler-overview",
      },
      {
        text: "SFC Parser の概要",
        link: "/ja/compiler-overview-sfc",
      },
      {
        text: "Template AST の概要",
        link: "/ja/compiler-overview-template-ast",
      },
      {
        text: "Template Parser の概要",
        link: "/ja/compiler-overview-template-parser",
      },
      {
        text: "Vapor IR の概要",
        link: "/ja/compiler-overview-ir",
      },
      {
        text: "Transformer の概要",
        link: "/ja/compiler-overview-transformer",
      },
      {
        text: "Transformer の概要 2",
        link: "/ja/compiler-overview-transformer2",
      },
      {
        text: "Codegen の概要",
        link: "/ja/compiler-overview-codegen",
      },
      {
        text: "次は何？",
        link: "/ja/what-next",
      },
      {
        text: "SFC のコンパイルの流れ",
        link: "/ja/sfc-compilation-flow",
      },
      {
        text: "ランタイムを読み始める",
        link: "/ja/start-to-read-runtime",
      },
      {
        text: "マスタッシュとバインド",
        link: "/ja/mustache-and-state-binding",
      },
      {
        text: "スケジューラ",
        link: "/ja/scheduler",
      },
      {
        text: "複雑なテンプレート",
        link: "/ja/complex-template",
      },
      {
        text: "v-on",
        link: "/ja/v-on",
      },
      {
        text: "v-bind",
        link: "/ja/v-bind",
      },
      {
        text: "v-model",
        link: "/ja/v-model",
      },
      {
        text: "v-show",
        link: "/ja/v-show",
      },
      {
        text: "v-once",
        link: "/ja/v-once",
      },
      {
        text: "v-text",
        link: "/ja/v-text",
      },
      {
        text: "v-html",
        link: "/ja/v-html",
      },
      {
        text: "🚧 v-if",
        link: "/ja/v-if",
      },
      {
        text: "🚧 v-for",
        link: "/ja/v-for",
      },
      {
        text: "🚧 Template Refs",
        link: "/ja/template-refs",
      },
      {
        text: "🚧 コンポーネント",
        link: "/ja/component",
      },
      {
        text: "🚧 v-slot",
        link: "/ja/v-slot",
      },
    ],
  },
});
