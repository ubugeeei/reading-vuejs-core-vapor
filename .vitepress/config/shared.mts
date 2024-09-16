import type { DefaultTheme, UserConfig } from "vitepress";
import linkPreview from "markdown-it-link-preview";

export default (): UserConfig<DefaultTheme.Config> => ({
  srcDir: "src",
  themeConfig: {
    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
  markdown: {
    config: (md) => {
      md.use(linkPreview);
    },
  },
});
