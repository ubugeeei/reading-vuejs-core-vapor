import type { DefaultTheme, UserConfig } from "vitepress";

export default (): UserConfig<DefaultTheme.Config> => ({
  title: "vuejs/core-vapor を読む",
  description: "vuejs/core-vapor を読む",
  themeConfig: {
    nav: [
      { text: "ホーム", link: "/ja" },
      { text: "例", link: "/ja/markdown-examples" },
    ],
    sidebar: [
      {
        text: "例",
        items: [
          { text: "マークダウン例", link: "/ja/markdown-examples" },
          { text: "ランタイム API 例", link: "/ja/api-examples" },
        ],
      },
    ],
  },
});
