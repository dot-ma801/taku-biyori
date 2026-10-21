import { ref, toValue, type MaybeRefOrGetter } from 'vue';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';
import { GameSessionDetailTab } from '@/features/GameSession/Detail/useGameSessionDetailTabs';

/** 参加直後に日程の回答を促してよい卓の状態。確定済み・中止・下書きでは出さない */
const GUIDE_STATUSES: (GameSessionCardStatus | null)[] = [
  GameSessionCardStatus.recruiting,
  GameSessionCardStatus.adjusting,
];

/**
 * 参加直後に日程調整タブへ送り、◯△× の回答を促す案内の状態。
 *
 * 参加操作をしたときだけ動く。参加済みでページを開いた人には出さない。
 * 参加した entryId はメモリ上にだけ持つ（ゲストの「自分の列」の識別に使う。再読み込みで消える）。
 */
export const useJoinScheduleGuide = (
  status: MaybeRefOrGetter<GameSessionCardStatus | null>,
  availableTabs: MaybeRefOrGetter<GameSessionDetailTab[]>,
  hasPendingSchedulePoll: MaybeRefOrGetter<boolean>,
) => {
  /** この画面で参加した entryId。参加操作をしていなければ null */
  const joinedEntryId = ref<string | null>(null);
  /** 案内バナーを出す段階か（閉じたら false） */
  const isGuideActive = ref(false);

  /**
   * 参加が成功したときに呼ぶ。案内を出すなら切り替え先のタブを、出さないなら null を返す。
   */
  function handleJoined(entryId: string): GameSessionDetailTab | null {
    joinedEntryId.value = entryId;
    const canGuide =
      GUIDE_STATUSES.includes(toValue(status)) &&
      toValue(hasPendingSchedulePoll) &&
      toValue(availableTabs).includes(GameSessionDetailTab.schedule);
    isGuideActive.value = canGuide;
    return canGuide ? GameSessionDetailTab.schedule : null;
  }

  function dismissGuide() {
    isGuideActive.value = false;
  }

  return { joinedEntryId, isGuideActive, handleJoined, dismissGuide };
};
