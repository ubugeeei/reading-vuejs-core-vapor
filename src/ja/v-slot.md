# v-slot ディレクティブ

以下のようなコンポーネントを考えます．

```vue
<!-- Comp.vue -->
<template>
  <div>
    <slot name="header" :count="1" />
    <slot />
    <slot name="footer" />
  </div>
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import Comp from "./Comp.vue";
</script>

<template>
  <Comp>
    <template #header="{ count }">Header: {{ count }}</template>
    <template #default>Default Content</template>
    <template #footer>Footer</template>
  </Comp>
</template>
```

## コンパイル結果と概要

### 暗黙の default スロット

```vue
<template>
  <Comp>
    <div></div>
  </Comp>
</template>
```

コンパイル結果:

```js
import {
  resolveComponent as _resolveComponent,
  createComponent as _createComponent,
  template as _template,
} from "vue/vapor";
const t0 = _template("<div></div>");

function _sfc_render(_ctx) {
  const _component_Comp = _resolveComponent("Comp");
  const n1 = _createComponent(_component_Comp, null, [
    {
      default: () => {
        const n0 = t0();
        return n0;
      },
    },
  ], true);
  return n1;
}
```

スロットは `createComponent` の第 3 引数に配列として渡されます．\
静的なスロットはオブジェクト形式で，各スロットは関数として定義されます．

### 名前付きスロット

```vue
<template>
  <Comp>
    <template #one>foo</template>
    <template #default>
      bar
      <span></span>
    </template>
  </Comp>
</template>
```

コンパイル結果:

```js
const n4 = _createComponent(_component_Comp, null, [
  {
    one: () => {
      const n0 = t0();
      return n0;
    },
    default: () => {
      const n2 = t1();
      const n3 = t2();
      return [n2, n3];
    },
  },
], true);
```

### スロット props (スコープ付きスロット)

```vue
<template>
  <Comp v-slot="{ foo }">
    {{ foo + bar }}
  </Comp>
</template>
```

コンパイル結果:

```js
const n1 = _createComponent(_component_Comp, null, [
  {
    default: _withDestructure(
      ({ foo }) => [foo],
      (_ctx0) => {
        const n0 = _createTextNode(() => [_ctx0[0] + _ctx.bar]);
        return n0;
      }
    ),
  },
], true);
```

`withDestructure` を使ってスロット props を分割代入し，配列形式に変換しています．\
`_ctx0[0]` が `foo` に対応します．

### 動的スロット名

```vue
<template>
  <Comp>
    <template #[name]>foo</template>
  </Comp>
</template>
```

コンパイル結果:

```js
const n2 = _createComponent(_component_Comp, null, [
  () => ({
    name: _ctx.name,
    fn: () => {
      const n0 = t0();
      return n0;
    },
  }),
], true);
```

動的なスロット名の場合は，関数でラップして `name` と `fn` プロパティを持つオブジェクトを返します．

### 条件付きスロット (v-if)

```vue
<template>
  <Comp>
    <template v-if="condition" #condition>condition slot</template>
    <template v-else-if="anotherCondition" #condition="{ foo, bar }">
      another condition
    </template>
    <template v-else #condition>else condition</template>
  </Comp>
</template>
```

コンパイル結果:

```js
const n6 = _createComponent(_component_Comp, null, [
  () =>
    _ctx.condition
      ? {
          name: "condition",
          fn: () => {
            const n0 = t0();
            return n0;
          },
        }
      : _ctx.anotherCondition
        ? {
            name: "condition",
            fn: _withDestructure(({ foo, bar }) => [foo, bar], (_ctx0) => {
              const n2 = t1();
              return n2;
            }),
          }
        : {
            name: "condition",
            fn: () => {
              const n4 = t2();
              return n4;
            },
          },
], true);
```

条件分岐は三項演算子にコンパイルされます．

### ループスロット (v-for)

```vue
<template>
  <Comp>
    <template v-for="item in list" #[item]="{ bar }">foo</template>
  </Comp>
</template>
```

コンパイル結果:

```js
const n2 = _createComponent(_component_Comp, null, [
  () =>
    _createForSlots(_ctx.list, (item) => ({
      name: item,
      fn: _withDestructure(({ bar }) => [bar], (_ctx0) => {
        const n0 = t0();
        return n0;
      }),
    })),
], true);
```

`createForSlots` を使ってループでスロットを生成しています．

## コンパイラを読む

### IR

スロット関連の IR を確認します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/component.ts#L34-L66

```ts
export enum IRSlotType {
  STATIC,
  DYNAMIC,
  LOOP,
  CONDITIONAL,
}

export type IRSlots =
  | IRSlotsStatic
  | IRSlotDynamicBasic
  | IRSlotDynamicLoop
  | IRSlotDynamicConditional;

export interface IRSlotsStatic {
  slotType: IRSlotType.STATIC;
  slots: Record<string, SlotBlockIRNode>;
}

export interface IRSlotDynamicBasic {
  slotType: IRSlotType.DYNAMIC;
  name: SimpleExpressionNode;
  fn: SlotBlockIRNode;
}

export interface IRSlotDynamicLoop {
  slotType: IRSlotType.LOOP;
  name: SimpleExpressionNode;
  fn: SlotBlockIRNode;
  loop: IRFor;
}

export interface IRSlotDynamicConditional {
  slotType: IRSlotType.CONDITIONAL;
  condition: SimpleExpressionNode;
  positive: IRSlotDynamicBasic | IRSlotDynamicConditional;
  negative?: IRSlotDynamicBasic | IRSlotDynamicConditional;
}
```

4 種類のスロットタイプがあります:

- **STATIC**: 静的なスロット名
- **DYNAMIC**: 動的なスロット名
- **LOOP**: v-for でのスロット
- **CONDITIONAL**: v-if でのスロット

### Transformer

`transformVSlot` は 2 つのケースを処理します:

1. **コンポーネントスロット**: `<Comp v-slot:default>` 形式
2. **テンプレートスロット**: `<template #foo>` 形式

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/vSlot.ts#L28-L59

```ts
export const transformVSlot: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT) return;

  const dir = findDir(node, "slot", true);
  const { tagType, children } = node;
  const { parent } = context;

  const isComponent = tagType === ElementTypes.COMPONENT;
  const isSlotTemplate =
    isTemplateNode(node) &&
    parent &&
    parent.node.type === NodeTypes.ELEMENT &&
    parent.node.tagType === ElementTypes.COMPONENT;

  if (isComponent && children.length) {
    return transformComponentSlot(node, dir, context);
  } else if (isSlotTemplate && dir) {
    return transformTemplateSlot(node, dir, context);
  }
};
```

`transformTemplateSlot` では v-if，v-else-if，v-for との組み合わせを処理:

```ts
if (!vFor && !vIf && !vElse) {
  // 静的スロット
  registerSlot(slots, arg, block);
} else if (vIf) {
  // 条件付きスロット
  registerDynamicSlot(slots, {
    slotType: IRSlotType.CONDITIONAL,
    condition: vIf.exp!,
    positive: {
      slotType: IRSlotType.DYNAMIC,
      name: arg!,
      fn: block,
    },
  });
} else if (vFor) {
  // ループスロット
  registerDynamicSlot(slots, {
    slotType: IRSlotType.LOOP,
    name: arg!,
    fn: block,
    loop: vFor.forParseResult as IRFor,
  });
}
```

### Codegen

`genRawSlots` 関数でスロットのコード生成を行います．

```ts
function genRawSlots(slots: IRSlots[], context: CodegenContext) {
  if (!slots.length) return;
  return genMulti(
    DELIMITERS_ARRAY_NEWLINE,
    ...slots.map((slot) =>
      slot.slotType === IRSlotType.STATIC
        ? genStaticSlots(slot, context)
        : genDynamicSlot(slot, context, true)
    )
  );
}
```

スロット props の分割代入は `withDestructure` でラップ:

```ts
if (isDestructureAssignment) {
  blockFn = genCall(
    context.vaporHelper("withDestructure"),
    ["(", rawProps, ") => ", ...genMulti(DELIMITERS_ARRAY, ...idsOfProps)],
    blockFn
  );
}
```

---

v-slot は Vapor Mode でも以下の機能をサポートしています:

- 静的/動的スロット名
- スコープ付きスロット (スロット props)
- v-if/v-else-if/v-else との組み合わせ
- v-for との組み合わせ
- ネストしたスロット

`withDestructure` と配列形式のコンテキスト (`_ctx0`) を使うことで，\
効率的かつリアクティブなスロット実装を実現しています．
