import { onMounted, onUnmounted, readonly, ref } from 'vue';

type UseHideOnScrollOptions = {
  /** この位置より上（px）では常に表示する。ヘッダーの高さ相当を渡す想定 */
  offset?: number;
  /** 表示・非表示を切り替えるのに必要な最小スクロール量（px）。細かい揺れでのちらつきを防ぐ */
  threshold?: number;
};

/**
 * スクロール方向に応じた表示・非表示を管理する。
 * 下スクロールで隠し、上スクロールで戻す、よくあるアプリのヘッダー挙動。
 *
 * 状態の所有者はこの composable 自身なので、内部で ref を書き換える。
 */
export const useHideOnScroll = (options: UseHideOnScrollOptions = {}) => {
  const { offset = 0, threshold = 8 } = options;

  const isVisible = ref(true);

  // 直近で表示状態を判断したときのスクロール位置。
  // threshold 未満の移動では更新しないので、ゆっくりスクロールしても差分が積み上がる。
  let lastY = 0;

  const handleScroll = () => {
    // バウンススクロールで負になることがあるため 0 で下限を切る
    const currentY = Math.max(0, window.scrollY);
    const delta = currentY - lastY;

    // 最上部付近は常に表示する。ヘッダーが隠れたまま戻らない状態を作らない
    if (currentY <= offset) {
      isVisible.value = true;
      lastY = currentY;
      return;
    }

    if (Math.abs(delta) < threshold) return;

    isVisible.value = delta < 0;
    lastY = currentY;
  };

  onMounted(() => {
    lastY = Math.max(0, window.scrollY);
    // スクロールを妨げないよう passive で登録する
    window.addEventListener('scroll', handleScroll, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });

  return {
    /** 表示すべきかどうか。下スクロールで false、上スクロールで true になる */
    isVisible: readonly(isVisible),
  };
};
