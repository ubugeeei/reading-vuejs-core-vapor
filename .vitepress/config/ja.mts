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
    ],
  },
});
