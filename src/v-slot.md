# v-slot Directive

Consider the following components:

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

## Compilation Result and Overview

### Implicit Default Slot

```vue
<template>
  <Comp>
    <div></div>
  </Comp>
</template>
```

Compilation result:

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

Slots are passed as an array to the 3rd argument of `createComponent`.\
Static slots are in object format, and each slot is defined as a function.

### Named Slots

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

Compilation result:

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

### Slot Props (Scoped Slots)

```vue
<template>
  <Comp v-slot="{ foo }">
    {{ foo + bar }}
  </Comp>
</template>
```

Compilation result:

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

`withDestructure` is used to destructure slot props and convert them to array format.\
`_ctx0[0]` corresponds to `foo`.

### Dynamic Slot Name

```vue
<template>
  <Comp>
    <template #[name]>foo</template>
  </Comp>
</template>
```

Compilation result:

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

For dynamic slot names, it's wrapped in a function that returns an object with `name` and `fn` properties.

### Conditional Slots (v-if)

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

Compilation result:

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

Conditional branches are compiled into ternary operators.

### Loop Slots (v-for)

```vue
<template>
  <Comp>
    <template v-for="item in list" #[item]="{ bar }">foo</template>
  </Comp>
</template>
```

Compilation result:

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

`createForSlots` is used to generate slots with a loop.

## Reading the Compiler

### IR

Let's look at the slot-related IRs.

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

There are 4 types of slots:

- **STATIC**: Static slot name
- **DYNAMIC**: Dynamic slot name
- **LOOP**: Slots with v-for
- **CONDITIONAL**: Slots with v-if

### Transformer

`transformVSlot` handles 2 cases:

1. **Component slot**: `<Comp v-slot:default>` format
2. **Template slot**: `<template #foo>` format

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

`transformTemplateSlot` handles combinations with v-if, v-else-if, and v-for:

```ts
if (!vFor && !vIf && !vElse) {
  // Static slot
  registerSlot(slots, arg, block);
} else if (vIf) {
  // Conditional slot
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
  // Loop slot
  registerDynamicSlot(slots, {
    slotType: IRSlotType.LOOP,
    name: arg!,
    fn: block,
    loop: vFor.forParseResult as IRFor,
  });
}
```

### Codegen

The `genRawSlots` function handles slot code generation.

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

Destructuring of slot props is wrapped with `withDestructure`:

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

v-slot in Vapor Mode supports the following features:

- Static/dynamic slot names
- Scoped slots (slot props)
- Combinations with v-if/v-else-if/v-else
- Combinations with v-for
- Nested slots

By using `withDestructure` and array-format contexts (`_ctx0`),\
an efficient and reactive slot implementation is achieved.
