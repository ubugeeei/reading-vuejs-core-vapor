# 複雑なテンプレート

間にスケジューラの説明をしてしまったのでやや順番は前後しますが，改めて Vapor のコンポーネントについて続きを見ていきます．\
今，私たちは以下のような単純にマスタッシュを持つテンプレートを理解できるようになりました．

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <p>{{ count }}</p>
</template>
```

さて，これの template 部分についてですが，もう少し複雑なものを書いてみるとどうなるでしょうか．\
今は単純に，

```ts
import {
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _renderEffect(() => _setText(n0, _ctx.count));
  return n0;
}
```

<div v-pre>

にコンパイルされていますが，もっと要素をネストさせてみたり，マスタッシュを部分的なもの (e.g. `count: {{ count }}`) にしてみるとどうなるでしょう．\
試しに以下のようなコンポーネントを見ていきます．

</div>

```vue
<script setup>
import { ref } from "vue";
const count = ref(0);
</script>

<template>
  <p>count is {{ count }}</p>
  <div>
    <div>
      {{ "count" }} : <span>{{ count }}</span>
    </div>
  </div>
</template>
```

## コンパイル結果

コンパイル結果は以下のようになりました．\
script 部分は同じなので省略しています．

```js
import {
  createTextNode as _createTextNode,
  prepend as _prepend,
  renderEffect as _renderEffect,
  setText as _setText,
  template as _template,
} from "vue/vapor";

const t0 = _template("<p></p>");
const t1 = _template("<div><div><span></span></div></div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  const n4 = t1();
  const n3 = n4.firstChild;
  const n2 = n3.firstChild;
  const n1 = _createTextNode(["count", " : "]);
  _prepend(n3, n1);
  _renderEffect(() => {
    _setText(n0, "count is ", _ctx.count);
    _setText(n2, _ctx.count);
  });
  return [n0, n4];
}
```

## 概要の理解

まず，このコンポーネントの template はフラグメントなので，2 つのテンプレートが生成され，その結果の node 2 つを返していことが分かります．

```js
const t0 = _template("<p></p>");
const t1 = _template("<div><div><span></span></div></div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  const n4 = t1();
  // 省略
  return [n0, n4];
}
```

`t0` や `t1` を見てもらうとわかる通り，テンプレートからはテキストが取り除かれ，要素のみになっています．\
そして，`n0` に対しては `setText` で全て挿入しています．

```ts
const t0 = _template("<p></p>");
const t1 = _template("<div><div><span></span></div></div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  const n4 = t1();
  // 省略
  _renderEffect(() => {
    _setText(n0, "count is ", _ctx.count);
    // 省略
  });
  return [n0, n4];
}
```

ここまでは前回までに見た実装で理解できるはずです．\

問題は

```vue
<div>
  <div>
    {{ "count" }} : <span>{{ count }}</span>
  </div>
</div>
```

部分のコンパイルです．\
必要な部分だけ抜き出すと，

```js
const t1 = _template("<div><div><span></span></div></div>");

function _sfc_render(_ctx) {
  const n4 = t1();
  const n3 = n4.firstChild;
  const n2 = n3.firstChild;
  const n1 = _createTextNode(["count", " : "]);
  _prepend(n3, n1);
  _renderEffect(() => {
    _setText(n2, _ctx.count);
  });

  // 省略
}
```

で，まずわかることは，`{{ "count" }} : ` の部分は `createTextNode` によって生成され，`n4` の `firstChild` の前に挿入されていいます．

```js
const t1 = _template("<div><div><span></span></div></div>");
const n4 = t1();
const n3 = n4.firstChild;
const n1 = _createTextNode(["count", " : "]);
_prepend(n3, n1);
```

そして，`<span>{{ count }}</span>` の部分は `setText` で挿入されています．\
少しわかりづらいので，各 Node がどれに該当するかだけコメントをつけてみます．\
(わかりやすいように要素に id を振りました．)

```js
const t0 = _template("<p></p>");
const t1 = _template(
  "<div id='root'><div id='inner'><span></span></div></div>"
);

function _sfc_render(_ctx) {
  const n0 = t0(); // p
  const n4 = t1(); // div#root
  const n3 = n4.firstChild; // div#inner
  const n2 = n3.firstChild; // span
  const n1 = _createTextNode(["count", " : "]); // "count" :
  _prepend(n3, n1); // append `"count : "` to pre of `div#inner`
  _renderEffect(() => {
    _setText(n0, "count is ", _ctx.count); // set `count is ${_ctx.count}` to p;
    _setText(n2, _ctx.count); // set `${_ctx.count}` to span
  });
  return [n0, n4];
}
```

確かにこれで成り立っていそうです．\
今回コンパイラの実装で確認したいことは以下です．

- ネストした時に firstChild にアクセスするコードを出力する実装
- createTextNode を出力する実装
- prepend で要素を挿入する出力の実装

## コンパイラ (transformer) を読む

さて，また AST から読んでいってもいいのですが，たまには味変で `IR` から逆引きしてみましょう．\
おそらくそろそろ慣れてきているはずなので，`IR` もあらかた当たりをつけることができるはずです．

```json
{
  "type": "IRRoot",
  "source": "\n  <p>count is {{ count }}</p>\n  <div>\n    <div>\n      {{ 'count' }} : <span>{{ count }}</span>\n    </div>\n  </div>\n",
  "template": ["<p></p>", "<div><div><span></span></div></div>"],
  "component": {},
  "directive": {},
  "block": {
    "type": "IRBlock",
    "dynamic": {
      "flags": 1,
      "children": [
        {
          "flags": 1,
          "children": [
            {
              "flags": 3,
              "children": []
            },
            {
              "flags": 3,
              "children": []
            }
          ],
          "id": 0,
          "template": 0
        },
        {
          "flags": 1,
          "children": [
            {
              "flags": 1,
              "children": [
                {
                  "flags": 7,
                  "children": [],
                  "id": 1
                },
                {
                  "flags": 3,
                  "children": []
                },
                {
                  "flags": 1,
                  "children": [
                    {
                      "flags": 3,
                      "children": []
                    }
                  ],
                  "id": 2
                }
              ],
              "id": 3
            }
          ],
          "id": 4,
          "template": 1
        }
      ]
    },
    "effect": [
      {
        "expressions": [
          {
            "type": "SimpleExpression",
            "content": "count",
            "isStatic": false,
            "constType": 0,
            "ast": null
          }
        ],
        "operations": [
          {
            "type": "IRSetText",
            "element": 0,
            "values": [
              {
                "type": "SimpleExpression",
                "content": "count is ",
                "isStatic": true,
                "constType": 3
              },
              {
                "type": "SimpleExpression",
                "content": "count",
                "isStatic": false,
                "constType": 0,
                "ast": null
              }
            ]
          },
          {
            "type": "IRSetText",
            "element": 2,
            "values": [
              {
                "type": "SimpleExpression",
                "content": "count",
                "isStatic": false,
                "constType": 0,
                "ast": null
              }
            ]
          }
        ]
      }
    ],
    "operation": [
      {
        "type": "IRCreateTextNode",
        "id": 1,
        "values": [
          {
            "type": "SimpleExpression",
            "content": "'count'",
            "isStatic": false,
            "constType": 0,
            "ast": {
              "type": "StringLiteral",
              "start": 1,
              "end": 8,
              "extra": {
                "rawValue": "count",
                "raw": "'count'",
                "parenthesized": true,
                "parenStart": 0
              },
              "value": "count",
              "comments": [],
              "errors": []
            }
          },
          {
            "type": "SimpleExpression",
            "content": " : ",
            "isStatic": true,
            "constType": 3
          }
        ],
        "effect": false
      },
      {
        "type": "IRPrependNode",
        "elements": [1],
        "parent": 3
      }
    ],
    "returns": [0, 4]
  }
}
```

かなり長いですが，落ち着いて読めばわかるはずです．

まず，当然ですが `IRNode` があります．これが持つ block の children がフラグメントになっている template 部分で，`id` がそれぞれ `0` と `4` が振られています．\
`template` プロパティにも `template` の id が振られています．

```json
{
  "type": "IRRoot",
  "template": ["<p></p>", "<div><div><span></span></div></div>"],
  "block": {
    "type": "IRBlock",
    "dynamic": {
      "flags": 1,
      "children": [
        {
          "id": 0,
          "template": 0
        },
        {
          "id": 4,
          "template": 1
        }
      ]
    }
  }
}
```

まずこの時点で codegen で

```js
const t0 = _template("<p></p>");
const t1 = _template(
  "<div id='root'><div id='inner'><span></span></div></div>"
);

const n0 = t0();
const n4 = t1();
```

は生成できそうです．

なぜ急に `id` が `4` に飛んでいるかは，children のなかに潜っていき，内から外に登ってくるからです．\
`transformChildren` の `id` が生成されるのは以下のタイミングでした．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L23

これは，この要素の children のを transformNode した後で行われるので，そこからまた再帰的に入った `transformChildren` が先に処理されます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L20

つまり，`id` の生成は末端から親にかけてインクリメントされていきます．\
今回はたまたま，`t1` が持つ子 Node が `#inner` と `span` とその中の Text の 3 つがあるのでこれらにそれぞれ `3`, `2`, `1` の id が振られ (0 は `t0` から得た Node なので)，`t1` から得られる Node には `4` が振られています．

```json
{
  "type": "IRRoot",
  "template": [
    "<p></p>",
    "<div id='root'><div id='inner'><span></span></div></div>"
  ],
  "block": {
    "type": "IRBlock",
    "dynamic": {
      "children": [
        // p
        {
          "id": 0,
          "template": 0
        },

        // #root
        {
          "id": 4,
          "template": 1,
          "children": [
            // #inner
            {
              "id": 3,
              "children": [
                // Text
                { "id": 1 },

                // span
                { "id": 2 }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

operation と effect 部分の `IR` も見てみましょう．

```json
{
  "effect": [
    {
      "expressions": [
        {
          "type": "SimpleExpression",
          "content": "count",
          "isStatic": false,
          "constType": 0,
          "ast": null
        }
      ],
      "operations": [
        {
          "type": "IRSetText",
          "element": 0,
          "values": [
            {
              "type": "SimpleExpression",
              "content": "count is ",
              "isStatic": true,
              "constType": 3
            },
            {
              "type": "SimpleExpression",
              "content": "count",
              "isStatic": false,
              "constType": 0,
              "ast": null
            }
          ]
        },
        {
          "type": "IRSetText",
          "element": 2,
          "values": [
            {
              "type": "SimpleExpression",
              "content": "count",
              "isStatic": false,
              "constType": 0,
              "ast": null
            }
          ]
        }
      ]
    }
  ],
  "operation": [
    {
      "type": "IRCreateTextNode",
      "id": 1,
      "values": [
        {
          "type": "SimpleExpression",
          "content": "'count'",
          "isStatic": false,
          "constType": 0,
          "ast": {
            "type": "StringLiteral",
            "start": 1,
            "end": 8,
            "extra": {
              "rawValue": "count",
              "raw": "'count'",
              "parenthesized": true,
              "parenStart": 0
            },
            "value": "count",
            "comments": [],
            "errors": []
          }
        },
        {
          "type": "SimpleExpression",
          "content": " : ",
          "isStatic": true,
          "constType": 3
        }
      ],
      "effect": false
    },
    {
      "type": "IRPrependNode",
      "elements": [1],
      "parent": 3
    }
  ]
}
```

effect は `IRSetText` が ２ つ, operation には `IRCreateTextNode` と `IRPrependNode` があります．\
これだけ生成できていればもう codegen できそうです．

setText については問題ないでしょう．\
これまでにみた `transformText` の部分を追えば良いです．

`IRCreateTextNode` をみてみましょう．\
こちらも同じく `transformText` で生成されていました．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L45-L61

この `processTextLike` は 2 つめの分岐である，自身が `INTERPOLATION` がある場合に通ります．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L29-L40

最後に `IRPrependNode` です．\
PREPEND_NODE が登録される部分は以下のところです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformChildren.ts#L68-L74

これがどこかというと，`processDynamicChildren` という関数で，`transformChildren` 中の処理で，`isFragment` が `falsy` の場合に呼ばれます．\
children から一つづつ child を取り出して，`DynamicFlag.INSERT` が立ってる Node を収集します．\
今回は，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformText.ts#L45-L61

からも分かる通り，このフラグが立っています．

この辺りの処理で `IR` に transform されることがわかりました．

## Codegen を読む

`IR` さえできれば  codegen は何も難しくないのでさらっとみていきます．

新規の部分は主に `IRCreateTextNode` と `IRPrependNode` です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L33-L36

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L54-L55

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/text.ts#L28-L45

---

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/operation.ts#L58-L59

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/dom.ts#L22-L34

`firstChild` へのアクセスのコード生成は `genChildren` で分岐されています．\
firstChild がやや特殊で，それ以外の場合は `children` というヘルパー関数の実行を出力しています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/template.ts#L63-L75

`genChildren` が `from` や `id` を引き回しながら再帰的に `genChildren` を実行しています．

## ランタイムを読む

```ts
const t0 = _template("<p></p>");
const t1 = _template(
  "<div id='root'><div id='inner'><span></span></div></div>"
);

function _sfc_render(_ctx) {
  const n0 = t0(); // p
  const n4 = t1(); // div#root
  const n3 = n4.firstChild; // div#inner
  const n2 = n3.firstChild; // span
  const n1 = _createTextNode(["count", " : "]); // "count" :
  _prepend(n3, n1); // append `"count : "` to pre of `div#inner`
  _renderEffect(() => {
    _setText(n0, "count is ", _ctx.count); // set `count is ${_ctx.count}` to p;
    _setText(n2, _ctx.count); // set `${_ctx.count}` to span
  });
  return [n0, n4];
}
```

のランタイムコードも大したことないのでサクサクいきます．

### createTextNode

まずは `createTextNode` です．

本当に `document.createTextNode` しているだけです．\
`values` として配列か，その getter 関数を受け取っています．\
getter の場合には dynamic なものとみなし `renderEffect` でラップしています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/element.ts#L39-L49

### prepend

prepend は本当に `ParentNode.prepend` を呼んでいるだけです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/element.ts#L31-L33

---

かなりサクッとですがここまでで少し複雑なテンプレートがどのように扱われているかわかるようになりました．\
これらの children を追従したり，prepend したりという知識はこれからのイベントハンドラをアタッチする時なども同じです．\
あとは，単純な構造でひたすらいろんなディレクティブであったり，コンポーネント機能を見ていきましょう！
