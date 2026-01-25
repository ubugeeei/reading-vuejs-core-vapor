# v-if ディレクティブ

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";
const ok = ref(true);
</script>

<template>
  <div v-if="ok">Hello, v-if!</div>
</template>
```

## コンパイル結果と概要

コンパイル結果は以下のようになります．

```js
import {
  createIf as _createIf,
  template as _template,
} from "vue/vapor";

const t0 = _template("<div>Hello, v-if!</div>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.ok,
    () => {
      const n2 = t0();
      return n2;
    }
  );
  return n0;
}
```

`v-show` とは異なり，`v-if` は条件に応じて DOM 要素を生成・破棄します．\
そのため，`createIf` というヘルパー関数を使って，条件分岐を実現しています．

`createIf` は第一引数に条件，第二引数に条件が真の場合に実行するブロック (positive)，第三引数に条件が偽の場合に実行するブロック (negative) を取ります．

## v-if + v-else

以下のようなコンポーネントを考えます．

```vue
<template>
  <div v-if="ok">YES</div>
  <p v-else>NO</p>
</template>
```

コンパイル結果は以下のようになります．

```js
import { createIf as _createIf, template as _template } from "vue/vapor";
const t0 = _template("<div>YES</div>");
const t1 = _template("<p>NO</p>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.ok,
    () => {
      const n2 = t0();
      return n2;
    },
    () => {
      const n4 = t1();
      return n4;
    }
  );
  return n0;
}
```

第三引数に `v-else` のブロックが渡されています．

## v-if + v-else-if + v-else

以下のようなコンポーネントを考えます．

```vue
<template>
  <div v-if="ok">OK</div>
  <p v-else-if="orNot">OR NOT</p>
  <span v-else>ELSE</span>
</template>
```

コンパイル結果は以下のようになります．

```js
import { createIf as _createIf, template as _template } from "vue/vapor";
const t0 = _template("<div>OK</div>");
const t1 = _template("<p>OR NOT</p>");
const t2 = _template("<span>ELSE</span>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => _ctx.ok,
    () => {
      const n2 = t0();
      return n2;
    },
    () =>
      _createIf(
        () => _ctx.orNot,
        () => {
          const n4 = t1();
          return n4;
        },
        () => {
          const n7 = t2();
          return n7;
        }
      )
  );
  return n0;
}
```

`v-else-if` は `createIf` のネストによって表現されています．\
第三引数に更なる `createIf` を呼び出す関数が渡されていることがわかります．

## コンパイラを読む

### IR

まず，`v-if` 用の IR を確認しましょう．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L66-L73

```ts
export interface IfIRNode extends BaseIRNode {
  type: IRNodeTypes.IF;
  id: number;
  condition: SimpleExpressionNode;
  positive: BlockIRNode;
  negative?: BlockIRNode | IfIRNode;
  once?: boolean;
}
```

- `condition`: 条件式
- `positive`: 条件が真の場合のブロック
- `negative`: 条件が偽の場合のブロック (`v-else`) または `IfIRNode` (`v-else-if`)
- `once`: `v-once` と組み合わせた場合

`negative` が `BlockIRNode` または `IfIRNode` のどちらかになっているのがポイントです．\
`v-else` の場合は `BlockIRNode`，`v-else-if` の場合は `IfIRNode` になります．

### Transformer

`transformVIf` は `createStructuralDirectiveTransform` を使って定義されています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L22-L25

```ts
export const transformVIf: NodeTransform = createStructuralDirectiveTransform(
  ["if", "else", "else-if"],
  processIf
);
```

`processIf` 関数では，`v-if`，`v-else`，`v-else-if` のそれぞれのケースを処理しています．

#### v-if の場合

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L41-L55

```ts
if (dir.name === "if") {
  const id = context.reference();
  context.dynamic.flags |= DynamicFlag.INSERT;
  const [branch, onExit] = createIfBranch(node, context);

  return () => {
    onExit();
    context.registerOperation({
      type: IRNodeTypes.IF,
      id,
      condition: dir.exp!,
      positive: branch,
      once: context.inVOnce,
    });
  };
}
```

`createIfBranch` でブロックを作成し，`registerOperation` で `IfIRNode` を登録しています．

#### v-else / v-else-if の場合

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vIf.ts#L56-L111

`v-else` と `v-else-if` の場合は，隣接する `v-if` を探し，その `negative` プロパティにブロックを追加します．

```ts
// 隣接する v-if を探す
const siblingIf = getSiblingIf(context, true);

// 最後の IfNode を取得
let lastIfNode = operation[operation.length - 1];

// v-else-if の場合はネストした IfIRNode を探す
while (lastIfNode.negative && lastIfNode.negative.type === IRNodeTypes.IF) {
  lastIfNode = lastIfNode.negative;
}

const [branch, onExit] = createIfBranch(node, context);

if (dir.name === "else") {
  // v-else の場合は BlockIRNode を設定
  lastIfNode.negative = branch;
} else {
  // v-else-if の場合は新しい IfIRNode を設定
  lastIfNode.negative = {
    type: IRNodeTypes.IF,
    id: -1,
    condition: dir.exp!,
    positive: branch,
    once: context.inVOnce,
  };
}
```

### Codegen

`genIf` 関数でコード生成を行います．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/if.ts#L1-L45

```ts
export function genIf(
  oper: IfIRNode,
  context: CodegenContext,
  isNested = false
): CodeFragment[] {
  const { vaporHelper } = context;
  const { condition, positive, negative, once } = oper;

  const conditionExpr: CodeFragment[] = [
    "() => (",
    ...genExpression(condition, context),
    ")",
  ];

  let positiveArg = genBlock(positive, context);
  let negativeArg: false | CodeFragment[] = false;

  if (negative) {
    if (negative.type === IRNodeTypes.BLOCK) {
      // v-else の場合
      negativeArg = genBlock(negative, context);
    } else {
      // v-else-if の場合は再帰的に genIf を呼び出す
      negativeArg = ["() => ", ...genIf(negative!, context, true)];
    }
  }

  if (!isNested) push(NEWLINE, `const n${oper.id} = `);
  push(
    ...genCall(
      vaporHelper("createIf"),
      conditionExpr,
      positiveArg,
      negativeArg,
      once && "true"
    )
  );

  return frag;
}
```

`negative` が `IfIRNode` の場合は再帰的に `genIf` を呼び出すことで，ネストした `createIf` を生成しています．

## ランタイムを読む

`createIf` は `runtime-vapor` の `apiCreateIf.ts` に実装されています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateIf.ts#L1-L91

```ts
export const createIf = (
  condition: () => any,
  b1: BlockFn,
  b2?: BlockFn,
  once?: boolean
): Fragment => {
  let newValue: any;
  let oldValue: any;
  let branch: BlockFn | undefined;
  let parent: ParentNode | undefined | null;
  let block: Block | undefined;
  let scope: BlockEffectScope | undefined;
  const parentScope = getCurrentScope()!;
  const anchor = __DEV__ ? createComment("if") : createTextNode();
  const fragment: Fragment = {
    nodes: [],
    anchor,
    [fragmentKey]: true,
  };

  // ...

  createChildFragmentDirectives(
    anchor,
    () => (scope ? [scope] : []),
    condition,
    // init cb
    (getValue) => {
      newValue = !!getValue();
      doIf();
    },
    // effect cb
    (getValue) => {
      if ((newValue = !!getValue()) !== oldValue) {
        doIf();
      } else if (scope) {
        invokeWithUpdate(scope);
      }
    },
    once
  );

  return fragment;

  function doIf() {
    parent ||= anchor.parentNode;
    if (block) {
      invokeWithUnmount(scope!, () => remove(block!, parent!));
    }
    if ((branch = (oldValue = newValue) ? b1 : b2)) {
      scope = new BlockEffectScope(instance, parentScope);
      fragment.nodes = block = scope.run(branch)!;
      invokeWithMount(scope, () => parent && insert(block!, parent, anchor));
    } else {
      scope = block = undefined;
      fragment.nodes = [];
    }
  }
};
```

### 仕組み

1. **アンカーの作成**: 開発環境では `createComment('if')` でコメントノード，本番環境では `createTextNode()` で空のテキストノードを作成します．これは DOM の挿入位置を示すマーカーとして機能します．

2. **Fragment の作成**: `v-if` の結果は `Fragment` として返されます．これは `nodes` (実際の DOM ノード) と `anchor` (挿入位置マーカー) を持つオブジェクトです．

3. **リアクティブな更新**: `createChildFragmentDirectives` を使って，条件の変化を監視します．条件が変化すると `doIf` 関数が呼び出されます．

4. **doIf 関数**: 条件の真偽に応じて，適切なブランチ (`b1` または `b2`) を実行します．
   - 既存のブロックがある場合は `remove` で削除
   - 新しいブランチがある場合は `BlockEffectScope` 内で実行し，`insert` で DOM に挿入

### BlockEffectScope

各ブランチは独自の `BlockEffectScope` 内で実行されます．\
これにより:

- ブランチ内の effect は適切にクリーンアップされる
- ブランチの切り替え時に，古いブランチの effect は自動的に停止される
- ライフサイクルフック (mount/unmount) が適切に呼び出される

---

`v-if` は `v-show` と異なり，条件に応じて実際に DOM を生成・破棄するため，実装がより複雑になっています．\
しかし，IR の設計とランタイムの `Fragment` パターンにより，`v-else-if` のようなネストした条件分岐も elegantly に処理できています．
