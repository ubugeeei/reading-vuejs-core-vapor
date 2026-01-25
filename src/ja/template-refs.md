# Template Refs

以下のようなコンポーネントを考えます．

```vue
<script setup>
import { ref, onMounted } from "vue";

const divRef = ref(null);

onMounted(() => {
  console.log(divRef.value); // <div>...</div>
});
</script>

<template>
  <div ref="divRef">Hello, Template Refs!</div>
</template>
```

## コンパイル結果と概要

### 静的な ref

```vue
<template>
  <div ref="foo">content</div>
</template>
```

コンパイル結果は以下のようになります．

```js
import { setRef as _setRef, template as _template } from "vue/vapor";
const t0 = _template("<div>content</div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  _setRef(n0, "foo");
  return n0;
}
```

`setRef` は要素に対して ref を設定するヘルパー関数です．

### 動的な ref

```vue
<template>
  <div :ref="foo">content</div>
</template>
```

コンパイル結果は以下のようになります．

```js
import {
  renderEffect as _renderEffect,
  setRef as _setRef,
  template as _template,
} from "vue/vapor";
const t0 = _template("<div>content</div>");

function _sfc_render(_ctx) {
  const n0 = t0();
  let r0;
  _renderEffect(() => (r0 = _setRef(n0, _ctx.foo, r0)));
  return n0;
}
```

動的な ref の場合は `renderEffect` 内で `setRef` を呼び出し，前の ref 値 (`r0`) を渡して古い ref を解除しています．

### ref + v-for

```vue
<template>
  <div v-for="i in [1, 2, 3]" ref="foo">{{ i }}</div>
</template>
```

コンパイル結果は以下のようになります．

```js
import {
  setRef as _setRef,
  createFor as _createFor,
  template as _template,
} from "vue/vapor";
const t0 = _template("<div></div>");

function _sfc_render(_ctx) {
  const n0 = _createFor(
    () => [1, 2, 3],
    (_ctx0) => {
      const n2 = t0();
      _setRef(n2, "foo", void 0, true);
      return n2;
    }
  );
  return n0;
}
```

v-for 内の ref は第 4 引数 `refFor` を `true` にすることで，配列として ref を管理します．

### ref + v-if

```vue
<template>
  <div v-if="true" ref="foo">content</div>
</template>
```

コンパイル結果は以下のようになります．

```js
import {
  setRef as _setRef,
  createIf as _createIf,
  template as _template,
} from "vue/vapor";
const t0 = _template("<div>content</div>");

function _sfc_render(_ctx) {
  const n0 = _createIf(
    () => true,
    () => {
      const n2 = t0();
      _setRef(n2, "foo");
      return n2;
    }
  );
  return n0;
}
```

v-if 内の ref は通常通り設定されますが，ブロックのスコープ破棄時に自動的にクリーンアップされます．

## コンパイラを読む

### IR

`SET_TEMPLATE_REF` の IR を確認します．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/ir/index.ts#L140-L146

```ts
export interface SetTemplateRefIRNode extends BaseIRNode {
  type: IRNodeTypes.SET_TEMPLATE_REF;
  element: number;
  value: SimpleExpressionNode;
  refFor: boolean;
  effect: boolean;
}
```

- `element`: ref を設定する要素の ID
- `value`: ref の名前または式
- `refFor`: v-for 内かどうか
- `effect`: 動的な ref かどうか

### Transformer

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/compiler-vapor/src/transforms/transformTemplateRef.ts#L12-L43

```ts
export const transformTemplateRef: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT) return;

  const dir = findProp(node, "ref", false, true);
  if (!dir) return;

  let value: SimpleExpressionNode;
  if (dir.type === NodeTypes.DIRECTIVE) {
    // :ref="foo" の場合
    value = dir.exp || normalizeBindShorthand(dir.arg!, context);
  } else {
    // ref="foo" の場合
    value = dir.value
      ? createSimpleExpression(dir.value.content, true, dir.value.loc)
      : EMPTY_EXPRESSION;
  }

  return () => {
    const id = context.reference();
    const effect = !isConstantExpression(value);

    // 動的な ref の場合は古い ref を追跡するための変数を宣言
    effect &&
      context.registerOperation({
        type: IRNodeTypes.DECLARE_OLD_REF,
        id,
      });

    context.registerEffect([value], {
      type: IRNodeTypes.SET_TEMPLATE_REF,
      element: id,
      value,
      refFor: !!context.inVFor,
      effect,
    });
  };
};
```

ポイント:

1. `ref` 属性または `:ref` ディレクティブを検出
2. 静的か動的かを判定 (`isConstantExpression`)
3. 動的な場合は `DECLARE_OLD_REF` で古い ref を追跡する変数を宣言
4. `SET_TEMPLATE_REF` で ref 設定を登録

## ランタイムを読む

`setRef` は `runtime-vapor` の `dom/templateRef.ts` に実装されています．

https://github.com/vuejs/vue-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/templateRef.ts#L30-L138

```ts
export function setRef(
  el: RefEl,
  ref: NodeRef,
  oldRef?: NodeRef,
  refFor = false
): NodeRef | undefined {
  if (!currentInstance) return;
  const { setupState, isUnmounted } = currentInstance;

  if (isUnmounted) {
    return;
  }

  const refValue = isVaporComponent(el) ? el.exposed || el : el;
  const refs =
    currentInstance.refs === EMPTY_OBJ
      ? (currentInstance.refs = {})
      : currentInstance.refs;

  // 動的な ref が変更された場合，古い ref を解除
  if (oldRef != null && oldRef !== ref) {
    if (isString(oldRef)) {
      refs[oldRef] = null;
      if (hasOwn(setupState, oldRef)) {
        setupState[oldRef] = null;
      }
    } else if (isRef(oldRef)) {
      oldRef.value = null;
    }
  }

  // ...
}
```

### ref の種類

`setRef` は 3 種類の ref をサポートしています:

1. **文字列 ref**: `ref="foo"` - `setupState.foo` または `refs.foo` に設定
2. **Ref オブジェクト**: `:ref="myRef"` - `myRef.value` に設定
3. **関数 ref**: `:ref="(el) => ..."` - 関数を呼び出し

### v-for での配列 ref

`refFor = true` の場合，ref は配列として管理されます:

```ts
if (refFor) {
  existing = _isString
    ? hasOwn(setupState, ref)
      ? setupState[ref]
      : refs[ref]
    : ref.value;

  if (!isArray(existing)) {
    existing = [refValue];
    // ...
  } else if (!existing.includes(refValue)) {
    existing.push(refValue);
  }
}
```

### クリーンアップ

`onScopeDispose` を使って，スコープ破棄時に ref をクリーンアップします:

```ts
onScopeDispose(() => {
  queuePostFlushCb(() => {
    if (isArray(existing)) {
      remove(existing, refValue);
    } else if (_isString) {
      refs[ref] = null;
      if (hasOwn(setupState, ref)) {
        setupState[ref] = null;
      }
    } else if (_isRef) {
      ref.value = null;
    }
  });
});
```

これにより，v-if や v-for でブロックが破棄された際に，自動的に ref がクリーンアップされます．

### queuePostFlushCb

ref の設定は `queuePostFlushCb` を使って Post Flush Queue に登録されます:

```ts
const doSet: SchedulerJob = () => {
  // ref 設定ロジック
};
doSet.id = -1;
queuePostFlushCb(doSet);
```

`id = -1` は他のジョブより先に実行されることを保証します．\
これにより，ref は DOM 更新後，他の effect より前に設定されます．

---

Template Refs は Vapor Mode でも Options API と同様の動作を提供します．\
動的な ref，v-for での配列 ref，関数 ref など，すべてのユースケースをサポートしています．\
`onScopeDispose` を活用することで，適切なクリーンアップも保証されています．
