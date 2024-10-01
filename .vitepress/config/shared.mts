import type { DefaultTheme, UserConfig } from "vitepress";
import { previewGitHubSource } from "../plugins/markdown-it/github";

export default (): UserConfig<DefaultTheme.Config> => ({
  srcDir: "src",
  appearance: "dark",
  themeConfig: {
    i18nRouting: true,
    logo: "/logo.png",
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/ubugeeei/reading-vuejs-core-vapor",
      },
      {
        icon: {
          svg: '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-heart-fill icon-sponsoring mr-1 v-align-middle color-fg-sponsors"><path d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.066 22.066 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.044 5.231-3.886 6.818a22.094 22.094 0 0 1-3.433 2.414 7.152 7.152 0 0 1-.31.17l-.018.01-.008.004a.75.75 0 0 1-.69 0Z"></path></svg>',
        },
        link: "https://github.com/sponsors/ubugeeei",
      },
    ],
    search: { provider: "local" },
    lastUpdated: {
      text: "Updated at",
      formatOptions: {
        dateStyle: "full",
        timeStyle: "medium",
      },
    },
    outline: "deep",
    footer: {
      copyright: `© 2024-PRESENT ubugeeei All rights reserved.`,
    },
  },
  markdown: {
    config: (md) => {
      md.use(previewGitHubSource);
    },
  },
  head: [
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/base16/circus.css",
      },
    ],
    ["link", { rel: "icon", href: "/logo.png" }],

    // og
    ["meta", { property: "og:site_name", content: "Reading vuejs/core-vapor" }],
    [
      "meta",
      {
        property: "og:url",
        content: "https://ubugeeei.github.io/reading-vuejs-core-vapor",
      },
    ],
    ["meta", { property: "og:title", content: "Reading vuejs/core-vapor" }],
    [
      "meta",
      {
        property: "og:description",
        content: "Reading vuejs/core-vapor",
      },
    ],
    [
      "meta",
      {
        property: "og:image",
        content:
          "https://github.com/ubugeeei/reading-vuejs-core-vapor/blob/main/src/public/cover.png?raw=true",
      },
    ],
    ["meta", { property: "og:image:alt", content: "Reading vuejs/core-vapor" }],
    ["meta", { name: "twitter:site", content: "Reading vuejs/core-vapor" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "Reading vuejs/core-vapor" }],
    [
      "meta",
      { name: "twitter:description", content: "Reading vuejs/core-vapor" },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content:
          "https://github.com/ubugeeei/reading-vuejs-core-vapor/blob/main/src/public/cover.png?raw=true",
      },
    ],
    [
      "meta",
      { name: "twitter:image:alt", content: "Reading vuejs/core-vapor" },
    ],
  ],
});
