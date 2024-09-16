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
    ],
  },
});
