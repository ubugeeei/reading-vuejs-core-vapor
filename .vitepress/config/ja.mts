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
      }
    ],
  },
});
