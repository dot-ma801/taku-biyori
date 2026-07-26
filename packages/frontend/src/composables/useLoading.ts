import { computed, ref } from 'vue';

// Module-scope singletons: すべての呼び出し元が同じローディング状態を共有する
const activeCount = ref(0);
const currentMessage = ref<string | null>(null);
// reset() のたびに世代を進め、リセット前の処理が後続の表示を消さないようにする
let generation = 0;

const isLoading = computed(() => activeCount.value > 0);
const message = computed(() => currentMessage.value);

export function useLoading() {
  /**
   * ローディングを開始し、その処理専用の解除関数を返す。
   * 多重呼び出しはカウントアップされ、解除関数は 1 度だけ有効。
   */
  function start(msg?: string) {
    const startedGeneration = generation;
    activeCount.value += 1;
    if (msg !== undefined) currentMessage.value = msg;

    let released = false;

    return () => {
      // 2 回目以降の呼び出しと、reset() をまたいだ解除は無視する
      if (released || startedGeneration !== generation) return;
      released = true;

      activeCount.value = Math.max(0, activeCount.value - 1);
      if (activeCount.value === 0) currentMessage.value = null;
    };
  }

  /** カウントに関係なくローディングを強制終了する（bfcache 復帰時など） */
  function reset() {
    generation += 1;
    activeCount.value = 0;
    currentMessage.value = null;
  }

  /** 非同期処理をローディング表示で囲む。例外時も必ず解除する */
  async function withLoading<T>(fn: () => Promise<T>, msg?: string) {
    const stop = start(msg);
    try {
      return await fn();
    } finally {
      stop();
    }
  }

  return { isLoading, message, start, reset, withLoading };
}
