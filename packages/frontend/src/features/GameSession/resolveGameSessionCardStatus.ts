import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';

/**
 * 卓の状態を決めるのに要る開催の最小情報。
 * 一覧（`GameSessionListItemModel`）と詳細（`GameSessionDetailModel`）の
 * どちらからも渡せるよう、共通する4つだけに絞ってある。
 */
export type GameSessionCardFacts = {
  id: string;
  status: GameSessionStatus;
  /** 開催日（`YYYY-MM-DD`） */
  scheduledAt: string;
  createdAt: Date;
};

/** 進行中の開催（この卓の「いま」を決める） */
const LIVE_SESSION_STATUSES: readonly GameSessionStatus[] = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
];

/**
 * 開催の新しさ。開催日が新しいものを優先し、同日なら後から作ったほうを採る。
 */
export const byNewestSession = (
  a: GameSessionCardFacts,
  b: GameSessionCardFacts,
): number =>
  b.scheduledAt.localeCompare(a.scheduledAt) ||
  b.createdAt.getTime() - a.createdAt.getTime();

const pickNewest = <T extends GameSessionCardFacts>(
  sessions: T[],
  statuses: readonly GameSessionStatus[],
): T | null =>
  sessions
    .filter((s) => statuses.includes(s.status))
    .sort(byNewestSession)[0] ?? null;

/**
 * ロビーと、そのロビーに属する開催から卓の状態を決める。
 *
 * 1つのロビーから複数の開催が生まれていても、卓が見せる「いま」は常に1つ。
 * ここが代表になる開催も一緒に返す。
 *
 * 優先順位:
 * 1. 解散したロビーは `cancelled`。企画そのものが畳まれているので開催より強い
 * 2. 進行中の開催があれば `scheduled`
 * 3. 完了した開催があれば `completed`
 * 4. 下書きのロビーは `draft`（系列の外）
 * 5. どれでもなければロビーの受付状態で決める（受付中なら `recruiting`、
 *    締めていれば `adjusting`）
 *
 * **下書きの判定を開催より後ろに置いている**のは、「日程が決まっている」で
 * 卓を作る経路がロビーを下書きのまま残したうえで開催を作るため。
 * 先に下書きへ倒すと、作ったばかりの卓が一覧からも「日程の決まった卓」からも
 * 消えて、下書きの1行だけが残ってしまう。
 *
 * 中止された開催しか無い卓が 5 に落ちるのは意図どおり。開催をやめても
 * ロビーが生きているなら、その卓はまた日程調整からやり直す状態に戻る。
 */
export const resolveGameSessionCardStatus = <T extends GameSessionCardFacts>(
  lobbyStatus: LobbyStatus,
  sessions: T[],
): { status: GameSessionCardStatus; session: T | null } => {
  if (lobbyStatus === LobbyStatus.disbanded) {
    return { status: GameSessionCardStatus.cancelled, session: null };
  }

  const live = pickNewest(sessions, LIVE_SESSION_STATUSES);
  if (live !== null) {
    return { status: GameSessionCardStatus.scheduled, session: live };
  }

  const completed = pickNewest(sessions, [GameSessionStatus.completed]);
  if (completed !== null) {
    return { status: GameSessionCardStatus.completed, session: completed };
  }

  if (lobbyStatus === LobbyStatus.draft) {
    return { status: GameSessionCardStatus.draft, session: null };
  }

  return {
    status:
      lobbyStatus === LobbyStatus.open
        ? GameSessionCardStatus.recruiting
        : GameSessionCardStatus.adjusting,
    session: null,
  };
};
