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
    ],
  },
});
