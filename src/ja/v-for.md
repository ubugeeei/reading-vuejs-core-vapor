# v-for ディレクティブ

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref } from "vue";
const items = ref([
  { id: 1, name: "a" },
  { id: 2, name: "b" },
  { id: 3, name: "c" },
]);
</script>

<template>
  <div v-for="item in items" :key="item.id">{{ item.name }}</div>
</template>
```

## コンパイル結果と概要

コンパイル結果は以下のようになります．

```js
import {
  renderEffect as _renderEffect,
  setText as _setText,
  createFor as _createFor,
  template as _template,
} from "vue/vapor";

const t0 = _template("<div></div>");

function _sfc_render(_ctx) {
  const n0 = _createFor(
    () => _ctx.items,
    (_ctx0) => {
      const n2 = t0();
      _renderEffect(() => _setText(n2, _ctx0[0].name));
      return n2;
    },
    (item) => item.id
  );
  return n0;
}
```

`createFor` は以下の引数を取ります:

1. **source**: ループ対象のソース (`() => _ctx.items`)
2. **renderItem**: 各アイテムをレンダリングする関数
3. **getKey**: key を取得する関数 (オプション)

`_ctx0` は `[item, key, index]` の配列で，`_ctx0[0]` が `item`，`_ctx0[1]` が `key`，`_ctx0[2]` が `index` です．

## 様々なパターン

### ネストした v-for

```vue
<template>
  <div v-for="item in list">
    <span v-for="child in item">{{ child + item }}</span>
  </div>
</template>
```

```js
const n0 = _createFor(
  () => _ctx.list,
  (_ctx0) => {
    const n5 = t1();
    const n2 = _createFor(
      () => _ctx0[0],
      (_ctx1) => {
        const n4 = t0();
        _renderEffect(() => _setText(n4, _ctx1[0] + _ctx0[0]));
        return n4;
      }
    );
    _insert(n2, n5);
    return n5;
  }
);
```

ネストした場合は `_ctx0` が外側の v-for のコンテキスト，`_ctx1` が内側の v-for のコンテキストとして参照されます．

### 分割代入

```vue
<template>
  <div v-for="{ id, ...other } in list" :key="id">
    {{ id + other }}
  </div>
</template>
```

```js
const n0 = _createFor(
  () => _ctx.list,
  _withDestructure(
    ([{ id, ...other }, index]) => [id, other, index],
    (_ctx0) => {
      const n2 = t0();
      _renderEffect(() => _setText(n2, _ctx0[0] + _ctx0[1] + _ctx0[2]));
      return n2;
    }
  ),
  ({ id, ...other }, index) => id
);
```

分割代入の場合は `withDestructure` ヘルパーを使って，分割代入された値を配列に変換しています．

## コンパイラを読む

### IR

まず，`v-for` 用の IR を確認しましょう．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L75-L88

```ts
export interface IRFor {
  source: SimpleExpressionNode;
  value?: SimpleExpressionNode;
  key?: SimpleExpressionNode;
  index?: SimpleExpressionNode;
}

export interface ForIRNode extends BaseIRNode, IRFor {
  type: IRNodeTypes.FOR;
  id: number;
  keyProp?: SimpleExpressionNode;
  render: BlockIRNode;
  once: boolean;
}
```

- `source`: ループ対象のソース式
- `value`: ループ変数 (`item`)
- `key`: キー変数 (オブジェクトのループ時)
- `index`: インデックス変数
- `keyProp`: `:key` prop の式
- `render`: 各アイテムのレンダリングブロック
- `once`: `v-once` と組み合わせた場合

### Transformer

`transformVFor` は `createStructuralDirectiveTransform` を使って定義されています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vFor.ts#L21-L70

```ts
export const transformVFor: NodeTransform = createStructuralDirectiveTransform(
  "for",
  processFor
);

export function processFor(
  node: ElementNode,
  dir: VaporDirectiveNode,
  context: TransformContext<ElementNode>
) {
  // ...
  const parseResult = dir.forParseResult;
  const { source, value, key, index } = parseResult;

  const keyProp = findProp(node, "key");
  const keyProperty = keyProp && propToExpression(keyProp);
  // ...

  const render: BlockIRNode = newBlock(node);
  const exitBlock = context.enterBlock(render, true);

  return (): void => {
    exitBlock();
    context.registerOperation({
      type: IRNodeTypes.FOR,
      id,
      source: source as SimpleExpressionNode,
      value: value as SimpleExpressionNode | undefined,
      key: key as SimpleExpressionNode | undefined,
      index: index as SimpleExpressionNode | undefined,
      keyProp: keyProperty,
      render,
      once: context.inVOnce,
    });
  };
}
```

`forParseResult` は `@vue/compiler-dom` のパーサーによって解析された結果で，`source`，`value`，`key`，`index` を含みます．

### Codegen

`genFor` 関数でコード生成を行います．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/for.ts#L14-L122

主要な処理:

1. **ソース式の生成**: `() => (_ctx.items)` の形式
2. **レンダリング関数の生成**: `_ctx0` を引数に取る関数
3. **key 関数の生成**: `:key` prop がある場合
4. **分割代入の処理**: `withDestructure` を使用

```ts
if (isDestructureAssignment) {
  blockFn = genCall(
    vaporHelper("withDestructure"),
    destructureAssignmentFn,
    blockFn
  );
}

return [
  NEWLINE,
  `const n${id} = `,
  ...genCall(
    vaporHelper("createFor"),
    sourceExpr,
    blockFn,
    getKeyFn,
    false, // getMemo
    false, // hydrationNode
    once && "true"
  ),
];
```

## ランタイムを読む

`createFor` は `runtime-vapor` の `apiCreateFor.ts` に実装されています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateFor.ts#L44-L355

### 概要

```ts
export const createFor = (
  src: () => Source,
  renderItem: (block: any) => Block,
  getKey?: (item: any, key: any, index?: number) => any,
  getMemo?: (item: any, key: any, index?: number) => any[],
  hydrationNode?: Node,
  once?: boolean
): Fragment => {
  let oldBlocks: ForBlock[] = [];
  // ...
};
```

### ForBlock 構造

```ts
interface ForBlock extends Fragment {
  scope: BlockEffectScope;
  state: [
    item: ShallowRef<any>,
    key: ShallowRef<any>,
    index: ShallowRef<number | undefined>
  ];
  key: any;
  memo: any[] | undefined;
}
```

各アイテムは `ForBlock` として管理され:

- `scope`: エフェクトスコープ
- `state`: `[item, key, index]` の `ShallowRef` 配列
- `key`: key プロパティの値
- `memo`: v-memo 用のキャッシュ

### Diff アルゴリズム

`createFor` は Vue 3 の Virtual DOM と同様の Diff アルゴリズムを使用しています:

1. **先頭からの同期**: 先頭から同じ key のアイテムを処理
2. **末尾からの同期**: 末尾から同じ key のアイテムを処理
3. **共通シーケンス + マウント**: 新しいアイテムの追加
4. **共通シーケンス + アンマウント**: 古いアイテムの削除
5. **未知のシーケンス**: LIS (Longest Increasing Subsequence) を使った最小限の DOM 移動

```ts
// 5.3 move and mount
// generate longest stable subsequence only when nodes have moved
const increasingNewIndexSequence = moved
  ? getSequence(newIndexToOldIndexMap)
  : [];
```

### mount/unmount

```ts
function mount(source: any, idx: number, anchor: Node = parentAnchor): ForBlock {
  const scope = new BlockEffectScope(instance, parentScope);
  const [item, key, index] = getItem(source, idx);
  const state = [shallowRef(item), shallowRef(key), shallowRef(index)];
  const block: ForBlock = {
    nodes: null!,
    scope,
    state,
    key: getKey && getKey(item, key, index),
    // ...
  };
  block.nodes = scope.run(() => renderItem(proxyRefs(state)))!;
  // ...
  return block;
}

function unmount({ nodes, scope }: ForBlock) {
  invokeWithUnmount(scope, () => {
    removeBlock(nodes, parent!);
  });
}
```

### proxyRefs による state のプロキシ

`renderItem` に渡される `state` は `proxyRefs` でラップされています．\
これにより，テンプレート内で `.value` を使わずに `item`，`key`，`index` にアクセスできます．

```ts
block.nodes = scope.run(() => renderItem(proxyRefs(state)))!;
```

コンパイル結果では `_ctx0[0]`，`_ctx0[1]`，`_ctx0[2]` としてアクセスしていますが，\
`proxyRefs` により自動的に `.value` が解決されます．

---

`v-for` は Vapor Mode でも Virtual DOM と同様の Diff アルゴリズムを採用しており，\
key を使った効率的な更新が可能です．\
`BlockEffectScope` と `ShallowRef` を組み合わせることで，\
リアクティブな更新と適切なライフサイクル管理を実現しています．
