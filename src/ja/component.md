# コンポーネント

以下のようなコンポーネントを考えます．

```vue
<!-- Child.vue -->
<script setup>
defineProps<{ msg: string }>();
</script>

<template>
  <p>{{ msg }}</p>
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import Child from "./Child.vue";
</script>

<template>
  <Child msg="Hello!" />
</template>
```

## コンパイル結果と概要

### 基本的なコンポーネント

Parent.vue のコンパイル結果は以下のようになります．

```js
import { createComponent as _createComponent } from "vue/vapor";

function _sfc_render(_ctx) {
  const n0 = _createComponent(_ctx.Child, { msg: () => "Hello!" }, null, true);
  return n0;
}
```

`createComponent` は以下の引数を取ります:

1. **comp**: コンポーネントの定義
2. **rawProps**: props の配列
3. **slots**: スロットの配列
4. **singleRoot**: 単一ルートかどうか (fallthrough attributes 用)

### asset からの解決

グローバルに登録されたコンポーネントの場合:

```vue
<template>
  <Foo />
</template>
```

```js
import {
  resolveComponent as _resolveComponent,
  createComponent as _createComponent,
} from "vue/vapor";

function _sfc_render(_ctx) {
  const _component_Foo = _resolveComponent("Foo");
  const n0 = _createComponent(_component_Foo, null, null, true);
  return n0;
}
```

`resolveComponent` でグローバルに登録されたコンポーネントを解決しています．

## コンパイラを読む

### IR

`CREATE_COMPONENT_NODE` の IR を確認します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L186-L195

```ts
export interface CreateComponentIRNode extends BaseIRNode {
  type: IRNodeTypes.CREATE_COMPONENT_NODE;
  id: number;
  tag: string;
  props: IRProps[];
  slots: IRSlots[];
  asset: boolean;
  root: boolean;
  once: boolean;
}
```

- `tag`: コンポーネントのタグ名
- `props`: props の配列
- `slots`: スロットの配列
- `asset`: グローバル登録コンポーネントかどうか
- `root`: ルートコンポーネントかどうか
- `once`: `v-once` と組み合わせた場合

### Transformer

`transformElement` 内でコンポーネントかどうかを判定します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformElement.ts#L55-L66

```ts
const { tag, tagType } = node;
const isComponent = tagType === ElementTypes.COMPONENT;
const propsResult = buildProps(
  node,
  context as TransformContext<ElementNode>,
  isComponent
);

(isComponent ? transformComponentElement : transformNativeElement)(
  tag,
  propsResult,
  context as TransformContext<ElementNode>
);
```

`transformComponentElement` では:

```ts
context.registerOperation({
  type: IRNodeTypes.CREATE_COMPONENT_NODE,
  id: context.reference(),
  tag,
  props: propsResult[0] ? propsResult[1] : [propsResult[1]],
  asset,
  root,
  slots: slotsResult,
  once: context.inVOnce,
});
```

### Codegen

`genCreateComponent` 関数でコード生成を行います．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/generators/component.ts#L42-L77

```ts
export function genCreateComponent(
  oper: CreateComponentIRNode,
  context: CodegenContext
): CodeFragment[] {
  const { vaporHelper } = context;

  const tag = genTag();
  const { root, props, slots, once } = oper;
  const rawProps = genRawProps(props, context);
  const rawSlots = genRawSlots(slots, context);

  return [
    NEWLINE,
    `const n${oper.id} = `,
    ...genCall(
      vaporHelper("createComponent"),
      tag,
      rawProps,
      rawSlots,
      root ? "true" : false,
      once && "true"
    ),
    ...genDirectivesForElement(oper.id, context),
  ];

  function genTag() {
    if (oper.asset) {
      return toValidAssetId(oper.tag, "component");
    } else {
      return genExpression(
        extend(createSimpleExpression(oper.tag, false), { ast: null }),
        context
      );
    }
  }
}
```

### Props の生成

props は getter 関数としてラップされます:

```ts
function genProp(prop: IRProp, context: CodegenContext, isStatic?: boolean) {
  return [
    ...genPropKey(prop, context),
    ": ",
    ...(prop.handler
      ? genEventHandler(context, prop.values[0])
      : isStatic
        ? ["() => (", ...genExpression(prop.values[0], context), ")"]
        : genExpression(prop.values[0], context)),
    // ...
  ];
}
```

これにより props は遅延評価され，リアクティブな更新が可能になります．

## ランタイムを読む

`createComponent` は `runtime-vapor` の `apiCreateComponent.ts` に実装されています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiCreateComponent.ts#L12-L32

```ts
export function createComponent(
  comp: Component,
  rawProps: RawProps | null = null,
  slots: RawSlots | null = null,
  singleRoot: boolean = false,
  once: boolean = false
): ComponentInternalInstance {
  const current = currentInstance!;
  const instance = createComponentInstance(
    comp,
    singleRoot ? withAttrs(rawProps) : rawProps,
    slots,
    once
  );
  setupComponent(instance, singleRoot);

  // register sub-component with current component for lifecycle management
  current.comps.add(instance);

  return instance;
}
```

### 処理の流れ

1. **createComponentInstance**: コンポーネントインスタンスを作成
2. **withAttrs**: `singleRoot` の場合，fallthrough attributes を処理
3. **setupComponent**: コンポーネントをセットアップ (props, slots, render 関数)
4. **current.comps.add**: 親コンポーネントに子コンポーネントを登録

### singleRoot と fallthrough attributes

`singleRoot: true` の場合，親から渡された attributes が子コンポーネントのルート要素に自動的に適用されます:

```ts
const instance = createComponentInstance(
  comp,
  singleRoot ? withAttrs(rawProps) : rawProps,
  slots,
  once
);
```

### ライフサイクル管理

子コンポーネントは親の `comps` Set に登録されます:

```ts
current.comps.add(instance);
```

これにより，親コンポーネントの unmount 時に子コンポーネントも適切に破棄されます．

---

コンポーネントは Vapor Mode でも Virtual DOM 版と同様の API をサポートしています．\
props は getter 関数としてラップされることで，リアクティブな更新が可能になっています．\
`createComponentInstance` と `setupComponent` の詳細については，別の章で詳しく見ていきます．
