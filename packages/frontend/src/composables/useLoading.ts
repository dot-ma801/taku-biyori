import { computed, ref } from 'vue';

// Module-scope singletons: すべての呼び出し元が同じローディング状態を共有する
const activeCount = ref(0);
const currentMessage = ref<string | null>(null);

const isLoading = computed(() => activeCount.value > 0);
const message = computed(() => currentMessage.value);

export function useLoading() {
  /** ローディングを開始する。多重呼び出しはカウントアップされる */
  function start(msg?: string) {
    activeCount.value += 1;
    if (msg !== undefined) currentMessage.value = msg;
  }

  /** ローディングを 1 件終了する。すべて終わったらメッセージも消す */
  function stop() {
    activeCount.value = Math.max(0, activeCount.value - 1);
    if (activeCount.value === 0) currentMessage.value = null;
  }

  /** カウントに関係なくローディングを強制終了する（bfcache 復帰時など） */
  function reset() {
    activeCount.value = 0;
    currentMessage.value = null;
  }

  /** 非同期処理をローディング表示で囲む。例外時も必ず解除する */
  async function withLoading<T>(fn: () => Promise<T>, msg?: string) {
    start(msg);
    try {
      return await fn();
    } finally {
      stop();
    }
  }

  return { isLoading, message, start, stop, reset, withLoading };
}
