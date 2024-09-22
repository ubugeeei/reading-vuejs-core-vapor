import type { DefaultTheme, UserConfig } from "vitepress";

export default (): UserConfig<DefaultTheme.Config> => ({
  title: "Reading vuejs/core-vapor",
  description: "Reading vuejs/core-vapor",
  themeConfig: {
    sidebar: [
      {
        text: "About This Book",
        link: "/",
      },
      {
        text: "Let's Dive In!",
        link: "/lets-deep-dive",
      },
      {
        text: "Directory Structure",
        link: "/directory-structure",
      },
      {
        text: "How to Proceed?",
        link: "/how-read",
      },
      {
        text: "Overview of the Compiler",
        link: "/compiler-overview",
      },
      {
        text: "Overview of the SFC Parser",
        link: "/compiler-overview-sfc",
      },
      {
        text: "Overview of the Template AST",
        link: "/compiler-overview-template-ast",
      },
      {
        text: "Overview of the Template Parser",
        link: "/compiler-overview-template-parser",
      },
      {
        text: "Overview of the Vapor IR",
        link: "/compiler-overview-ir",
      },
      {
        text: "Overview of the Transformer",
        link: "/compiler-overview-transformer",
      },
      {
        text: "Overview of the Transformer 2",
        link: "/compiler-overview-transformer2",
      },
      {
        text: "Overview of the Codegen",
        link: "/compiler-overview-codegen",
      },
      {
        text: "What's Next?",
        link: "/what-next",
      },
      {
        text: "Flow of SFC Compilation",
        link: "/sfc-compilation-flow",
      },
      {
        text: "Start Reading the Runtime",
        link: "/start-to-read-runtime",
      },
      {
        text: "Mustache and Binding",
        link: "/mustache-and-state-binding",
      },
    ],
  },
});
