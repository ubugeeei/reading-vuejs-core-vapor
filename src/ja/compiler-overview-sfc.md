# SFC のパースと SFCDescriptor

ここからは先ほどまでに説明した各パーツの詳細を見ていきましょう.

SFC のパーサーは SFC のコンパイラの一部なので，`compiler-sfc` に実装されています．

[https://github.com/vuejs/core-vapor/packages/compiler-sfc](https://github.com/vuejs/core-vapor/tree/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc)

## SFCDescriptor

まず，パース結果となる `SFCDescriptor` というオブジェクトですが，これは SFC の情報を持ったオブジェクトです．\
filename や template の情報, script の情報, style の情報などが含まれています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L76-L102

template や script, style はそれぞれ `SFCBlock` というオブジェクトを継承しており，この `SFCBlock` はその内容を表す `content` や，lang, setup, scoped などを表す `attrs`，SFC 全体のどの位置にあるか示す　`loc` の情報などを持っています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L39-L47

`template` は `SFCTemplateBlock` というオブジェクトで表現されており，ここに先ほど説明した AST を持っています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L49-L52

script も同様に `SFCScriptBlock` というオブジェクトで表現されています．\
ここには setup であるかどうかのフラグや，import しているモジュールの情報，ブロックの中身であるスクリプト (JS, TS) の AST などが含まれています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L54-L68

style も同様に `SFCStyleBlock` というオブジェクトで表現されています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L70-L74

`SFCDescriptor` の概要はざっとこんな感じです．

実際に以下のような SFC をパースすると

```vue
<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <button type="button" @click="count++">{{ count }}</button>
</template>
```

以下のような `SFCDescriptor` が得られます．\
ast については今は詳しく読めなくて問題ありません．これから解説します．\
※ 一部省略しています．

```json
{
  "filename": "path/to/core-vapor/playground/src/App.vue",
  "source": "<script setup lang=\"ts\">\nimport { ref } from 'vue'\n\nconst count = ref(0)\n</script>\n\n<template>\n  <button type=\"button\" @click=\"count++\">{{ count }}</button>\n</template>\n",
  "template": {
    "type": "template",
    "content": "\n  <button type=\"button\" @click=\"count++\">{{ count }}</button>\n",
    "attrs": {},
    "ast": {
      "type": 0,
      "source": "<script setup lang=\"ts\">\nimport { ref } from 'vue'\n\nconst count = ref(0)\n</script>\n\n<template>\n  <button type=\"button\" @click=\"count++\">{{ count }}</button>\n</template>\n",
      "children": [
        {
          "type": 1,
          "tag": "button",
          "tagType": 0,
          "props": [
            {
              "type": 6,
              "name": "type",
              "value": {
                "type": 2,
                "content": "button",
                "source": "\"button\""
              }
            },
            {
              "type": 7,
              "name": "on",
              "rawName": "@click",
              "exp": {
                "type": 4,
                "content": "count++",
                "isStatic": false,
                "constType": 0,
                "ast": {
                  "type": "UpdateExpression",
                  "start": 1,
                  "end": 8,
                  "operator": "++",
                  "prefix": false,
                  "argument": {
                    "type": "Identifier",
                    "identifierName": "count"
                  },
                  "name": "count"
                },
                "extra": {
                  "parenthesized": true,
                  "parenStart": 0
                },
                "comments": [],
                "errors": []
              }
            },
            "arg": {
              "type": 4,
              "content": "click",
              "isStatic": true,
              "constType": 3
            },
            "modifiers": []
          ],
          "children": [
            {
              "type": 5,
              "content": {
                "type": 4,
                "content": "count",
                "isStatic": false,
                "constType": 0,
                "ast": null
              }
            }
          ]
        }
      ]
    }
  },
  "script": null,
  "scriptSetup": {
    "type": "script",
    "content": "\nimport { ref } from 'vue'\n\nconst count = ref(0)\n",
    "attrs": {
      "setup": true,
      "lang": "ts"
    },
    "setup": true,
    "lang": "ts"
  },
  "styles": []
}
```

## パーサーの実装

パーサーの実装は以下の `parse` という関数です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L126-L129

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L104-L107

source には SFC の文字列が入ってきます\
そしてその文字列を解析し，`SFCDescriptor` を返します．

まず，template のパーサーによって SFC 全体パースします．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L162-L169

compiler.parse の compiler は options からきているもので，これは実は `compiler-core` にある template のパーサーです．

「なぜ SFC なのに template のパーサーを使うの・・・？」

そう思うのもまぁ無理はありません．その通りだと思います．\
しかし，よく考えてみてほしいでのすが，これで十分なのです．

template も SFC も構文としてはほぼ HTML です．\
Vue.js の HTML っぽいものを解析するときは基本 `compiler-core` のパーサーを使います．\
若干の差異はあるので，引数の `parseMode` に `'sfc'` を渡してるのもわかると思います．

まぁ，つまるところ，`compiler-core` は template 専用のパーサを実装しているというよりももっと汎用的な立ち位置で，compiler-sfc のパーサーはそれのラッパーであるということです．

このパース処理によって概ね `template` や `script` , `style` などの大枠の構造を得ることができるので，あとはそれぞれで分岐をして詳細なパース処理を行います．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L184-L185

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L215

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L229

詳細部分では，先ほどの `SFCBlock` を継承したそれぞれの Block を生成するために処理を行っています．\
(概ね createBlock という整形関数を読んだり，エラハンを行ったりしているだけなのでコードは省略します)

あとは，ソースマップの生成等を行います．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L285-L302

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-sfc/src/parse.ts#L377-L384

なんと，これで SFC のパース処理は終わりです．
