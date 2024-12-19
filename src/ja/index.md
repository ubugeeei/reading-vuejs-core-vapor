# vuejs/core-vapor を読む

<div align="center">
  <img src="/cover-transparent.png" width="600px" alt="Reading vuejs/core-vapor"/>
</div>

## はじめに

この本を手に取っていただき，ありがとうございます！\
この本は，Vue.js の次世代実装である Vapor Mode の実装を読み進める本です．\
少々上級者向けではありますが，部分的にでも参考になる点があれば嬉しいです！

## この本の目的

- **Vue.js の次世代実装である Vapor Mode について深い理解を得る**
- Vapor Mode とは何かについて理解を深める
- どのように実装されているのかソースコードを読み進めながら理解を深める

#### この本の目的ではないこと

- Vue.js の使い方を学ぶ
- 他のフレームワークと比較し，評価する

## 想定読者

- vuejs/core や vuejs/core-vapor にコントリビュートしてみたい方
- Vue.js の理解をより深めたい方

## 著者について

**ubugeeei (うぶげ)**

<img src="/ubugeeei.jpg" alt="ubugeeei" width="200" />

Vue.js メンバー, Vue.js Japan User Group コアスタッフ．\
Vapor Mode の開発に立ち上げ (2023/11) から携わる. \
2023/12 に vuejs/core-vapor の external collaborator になる.\
2024/4 に vuejs organization のメンバーになり，Vapor Team のメンバーになる.

https://ublog.dev/

## 注意

::: warning Vue Vapor の実装リポジトリについて

Vue Vapor の実装は当初，`vuejs/core-vapor` というリポジトリで始まりましたが，2024/10 に `vuejs/vue-vapor` に改名されました．

本書では，文章中のリンクは `vuejs/vue-vapor` に変更していますが，PJ 名や本書の pages の都合上，文言の方は `vuejs/core-vapor` に統一しています．

`vuejs/core-vapor` = `vuejs/vue-vapor` というふうに頭の中で変換しながら読んでいただければと思います．両者は時系列上の別名であり，全く同じものを指しています．

:::

<div align="center" style="margin-top: 100px">

## スポンサー

もしよろしければ，私の仕事を応援していただけると嬉しいです！

https://github.com/sponsors/ubugeeei

<img class="sponsors" src="https://raw.githubusercontent.com/ubugeeei/sponsors/main/sponsors.png" alt="ubugeeei's sponsors" width="400px">

</div>

<style scoped>
img.sponsors {
  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset;
}

h2:nth-of-type(1) {
  margin-top: 0px;
}
</style>
