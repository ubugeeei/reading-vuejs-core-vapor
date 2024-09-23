# スケジューラ

これまでに何度か「スケジューラ」という言葉が出てきました．
このページではそのスケジューラについて詳しく見てきます．

## スケジューラとは

スケジューラはあるタスクをスケジューリングして実行するためのものです．\
時には実行タイミングの調整であったり，時にはキューイングあったり．

OS なんかにも，プロセスをスケジューリングするスケジューラがあったりします．

Vue.js に関してもさまざまな作用をスケジュールする機構があります．\
これは vuejs/core-vapor (runtime-vapor) に限らず，vuejs/core (runtime-core) から元々あるコンセプトです．\
例えば，皆さんがよく知る `nextTick` というのはこのスケジューラの API です．

https://vuejs.org/api/general.html#nexttick

他にも，`watch` や `watchEffect` などのウォッチャにオプションとして設定できる `flush` の項目もスケジュールの実行に関するものです．

https://vuejs.org/api/reactivity-core.html#watch

https://github.com/vuejs/core/blob/a177092754642af2f98c33a4feffe8f198c3c950/packages/runtime-core/src/apiWatch.ts#L44-L46

## スケジューラ API の概要

詳細な実装を見ていく前に，実際にスケジューラをどのように使うのかという部分を見ていきます．\
これは Vue.js が内部的にどう使うか，という話で， Vue.js のユーザーが直接使う API ではありません．

スケジューラの実装は [packages/runtime-vapor/src/scheduler.ts](https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts) にあります．

まず，基本的な構造として `queue` と `job` があります．\
そして，queue には 2 種類のもがあります．\
`queue` と `pendingPostFlushCbs` です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L22-L23

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L28-L30

ここでは実際にキューされた job と，現在実行中の index を管理しています．

`job` は実際の実行対象です．
Function に `id` と `flag` (後述) を生やしたものです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/scheduler.ts#L23-L30

次にこれらを操作する関数についてです．

`queue` に `job` を追加する `queueJob` と，`queue` にある `job` を実行する `queueFlush`, `flushJobs` があります．\
(`flushJobs` は `queueFlush` から呼ばれます．)\
そして，`flushJobs` では queue のジョブを実行した後に，`pendingPostFlushCbs` にあるジョブも実行します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L35

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L74

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L110

また，`flushPostFlushCbs` に `job` を追加する `queuePostFlushCb` と，`pendingPostFlushCbs` にある `job` を実行する `flushPostFlushCbs` があります．\
(前述の通り`flushPostFlushCbs` は `flushJobs` からも呼ばれています．)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L57

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L81

そしてこれらのジョブの実行 (flushJobs) は Promise でラップされており (`Promise.resolve().then(flushJobs)` のイメージ)，現在のジョブ実行 (Promise) は `currentFlushPromise` として管理されています．\
そしてこの `currentFlushPromise` に then に繋ぐ形でタスクのスケジューリングを行なっています．

そして，皆さんのよく知る `nextTick` はこの `currentFlushPromise` の `then` に cb を登録するだけの関数です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L144-L150

## どこで使われている？

実際に queue を操作している実装がどこにあるかを見てもます．

### queueJob

Vapor で現状使われているのは 3 箇所です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L161

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directivesChildFragment.ts#L65-L68

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L41

いずれに共通しているのは，`effect.scheduler` に設定しているというところです．\
これらが何なのかについては少し先を読んでからにしましょう．

### queueFlush

queueFlush に反しては scheduler の実装の内部でしか扱われていません．\
どのタイミングでこれらが実行されるかは実装の詳細を見る時に見ていきましょう．

### queuePostFlushCb

こちらは何箇所か使われています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L165-L171

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/componentLifecycle.ts#L16-L29

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directives.ts#L251-L262

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/directivesChildFragment.ts#L137-L154

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L74-L85

上記の 5 に共通することは，何らかしらのライフサイクルフックであることです．
そのフックに登録されたコールバック関数の実行を `pendingPostFlushCbs` に追加しておくようです．

updated や mounted, unmounted などのライフサイクルはその場で実行してしまうとまだ DOM にその内容が反映されていないことがあると思います．\
スケジューラによって Promise (イベントループ) をコントロールすることで実行タイミングを制御していそうです．
詳しくはまた実装の詳細と合わせて読んでみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/event.ts#L29-L40

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/dom/templateRef.ts#L117-L132

上記の 2 つに関してはそもそもまだ event や templateRef が登場していないので一旦スルーしましょう．

### flushPostFlushCbs

こちらは主に `apiRender.ts` で登場します．
この本の t ランタイムの解説でも登場しましたね．

コンポーネントをマウントした後で flush しているようです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L106-L112

アンマウント時も同様です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/apiRender.ts#L155-L173

## 実装の詳細

さて，続いてはこれら 4 つの関数の実装を見ていきましょう．

### queueJob

まずは `queueJob` です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L35-L55

引数で渡された `job` の `flags` をみて，すでにキューに追加されているかどうかを判定しています．\
されている場合は無視します．

そして，`job` に `id` が設定されていない場合は無条件で queue に追加します．\
なぜならもうこれは重複排除等の制御が不可能だからです (識別できないので).

それからは，`flags` が `PRE` 出ない場合は末尾に追加し，そうでない場合は然るべき index に挿入します．\
その index は `findInsertionIndex` で `id` を元に探します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L152-L176

キューは id が増加する順が守られているという仕様なので，二分探索によって高速に位置を特定します．

そこまで終わったら `flags` を `QUEUED` に設定しておしまいです．\
ここでポイントとなるのは，最後に `queueFlush()` している点です．

続いて `queueFlush` を見ていきましょう．

### queueFlush -> flushJobs

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L74-L79

queueFlush は resolvedPromise.then(flushJobs) を呼び出しているだけです．\
この時，`flushJobs` は `resolvedPromise.then` でラップし，その Promise を currentFlushPromise に設定しておきます．

`flushJobs` をみてみましょう．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L110-L142

まず queue は id によってソートされます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L121

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L181-L190

そうしたら，順に実行していきます．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L123-L127

finally で `flushPostFlushCbs` も実行してあげつつ，最後にまた `queue` と `pendingPostFlushCbs` をみて，まだ job が残っている場合は再度 `flushJobs` を再帰的に呼び出します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L128-L140

### queuePostFlushCb

こちらも，対象が `pendingPostFlushCbs` になっただけで，基本的な流れは `queueJob` と同じです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L57-L72

キューイング後の flush に関しては `queueFlush` であることだけ覚えておけば大丈夫です． (`queue` も消化される)

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L71

### flushPostFlushCbs

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L81-L107

こちらも `new Set` によって重複排除を行いつつ．`id` によってソートして順に pendingPostFlushCbs を実行しているだけです．

## ReactiveEffect と Scheduler

さて，スケジューラに関してもう一箇所，把握しておかなければならないところがあります．

> いずれに共通しているのは，`effect.scheduler` に設定しているというところです．

の部分です．

effect が持つ scheduler というオプションいたしして，処理をラップする形で `queueJob` を行なっていました．\
果たしてこの `effect.scheduler` とは何なのでしょうか．

`effect` は `ReactiveEffect` のインスタンスです．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L113

実際に実行したい関数 (fn) を受け取り，インスタンスを生成します．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L142

そして，`ReactiveEffect` を実行するためのメソッドは 2 つあります.\
`run` と `trigger` です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L182

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L226

`run` の方は，

```ts
const effect = new ReactiveEffect(() => console.log("effect"));
effect.run();
```

のように任意のタイミングで実行することができます．

renderEffect の初回実行時にもこの `run` によって実行されています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L37-L50

一方で，`trigger` の方は基本的にはリアクティビティが形成されている時に使われます．\
例えば，ref オブジェクトの set が走った時です．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/ref.ts#L134

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/ref.ts#L153

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/dep.ts#L118-L122

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/dep.ts#L148-L150

↓

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L173

そして，この trigger 関数を見てみると，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/reactivity/src/effect.ts#L226-L234

`scheduler` を持っている場合にはそちらが優先的に実行されるようになっています．

これは，ある依存関係を元にリアクティブにエフェクトがトリガーされる際，余計な実行が起こらないようにするための仕組みです．\
`scheduler` プロパティにはスケジューラにキューする処理を適切に設定し，作用の実行を最適化することができます．

例えば，`renderEffect` の実装を見てみましょう．\
`renderEffect` では，scheduler に `() => queueJob(job)` を設定しています．

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/renderEffect.ts#L37-L41

そして，以下のように renderEffect を呼び出していたとします．

```ts
const t0 = template("<p></p>");

const n0 = t0();
const count = ref(0);
const effect = () => setText(n0, count.value);
renderEffect(effect);
```

こうすると，`count` に `effect` (をラップした `job`) が track され，count が変更された際にその `job` を `trigger` します．\
`trigger` じには内部で設定された `scheduler` プロパティの方が実行されますが，今回は「`job` の実行」ではなく，あくまで「`job` を `queue` に追加する」が設定されているため，即時には実行されずにスケジューラに渡されます．

ここで，このような trigger を考えてみましょう．

```ts
const count = ref(0);
const effect = () => setText(n0, count.value);
renderEffect(effect);

count.value = 1; // enqueue job
count.value = 2; // enqueue job
```

このようにすると 2 回 `() => queueJob(job)` が実行されることになります．\
そして，`queueJob` の実装を思い出して欲しいのですが，

https://github.com/vuejs/core-vapor/blob/30583b9ee1c696d3cb836f0bfd969793e57e849d/packages/runtime-vapor/src/scheduler.ts#L37

すでにその job が追加されている場合は無視されるようになっています．\
この関数の最後に `queueFlush` を実行しているので，毎回空っぽになりそうな気はしますが，実はこれは Promise で繋がっているため，この時点ではまだ `flush` されておらず，`queue` には `job` が残っている状態になります．

これにより，イベントループを媒介した job の重複排除を実現し，不要な実行を抑制することができます．\
実際に，考えてみて欲しいのですが，

```ts
count.value = 1;
count.value = 2;
```

と書いたところで，画面的には，2 回目の

```ts
setText(n0, 2);
```

だけの実行で問題ないはずです．

これであらかたスケジューラの理解はできたはずです．\
余計な作用の実行を制御するために Promise と `queue` を活用し，ライフサイクルフックの実行で画面の更新などを待った後で実行するのが正しいものは `pendingPostFlushCbs` という別のキューを用意し，実行タイミングを制御しています．
