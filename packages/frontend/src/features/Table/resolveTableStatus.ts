import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import { TableCardStatus } from '@/features/Table/tableCardStatus';

/**
 * 卓の状態を決めるのに要る開催の最小情報。
 * 一覧（`GameSessionListItemModel`）と詳細（`GameSessionDetailModel`）の
 * どちらからも渡せるよう、共通する4つだけに絞ってある。
 */
export type TableSessionFacts = {
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
const byNewest = (a: TableSessionFacts, b: TableSessionFacts): number =>
  b.scheduledAt.localeCompare(a.scheduledAt) ||
  b.createdAt.getTime() - a.createdAt.getTime();

const pickNewest = <T extends TableSessionFacts>(
  sessions: T[],
  statuses: readonly GameSessionStatus[],
): T | null =>
  sessions.filter((s) => statuses.includes(s.status)).sort(byNewest)[0] ?? null;

/**
 * ロビーと、そのロビーに属する開催から卓の状態を決める。
 *
 * 1つのロビーから複数の開催が生まれていても、卓が見せる「いま」は常に1つ。
 * ここが代表になる開催も一緒に返す。
 *
 * 優先順位:
 * 1. 下書きのロビーは `draft`（系列の外）
 * 2. 解散したロビーは `cancelled`。企画そのものが畳まれている
 * 3. 進行中の開催があれば `scheduled`
 * 4. 完了した開催があれば `completed`
 * 5. どちらも無ければロビーの受付状態で決める（受付中なら `recruiting`、
 *    締めていれば `adjusting`）
 *
 * 中止された開催しか無い卓が 5 に落ちるのは意図どおり。開催をやめても
 * ロビーが生きているなら、その卓はまた日程調整からやり直す状態に戻る。
 */
export const resolveTableStatus = <T extends TableSessionFacts>(
  lobbyStatus: LobbyStatus,
  sessions: T[],
): { status: TableCardStatus; session: T | null } => {
  if (lobbyStatus === LobbyStatus.draft) {
    return { status: TableCardStatus.draft, session: null };
  }
  if (lobbyStatus === LobbyStatus.disbanded) {
    return { status: TableCardStatus.cancelled, session: null };
  }

  const live = pickNewest(sessions, LIVE_SESSION_STATUSES);
  if (live !== null) {
    return { status: TableCardStatus.scheduled, session: live };
  }

  const completed = pickNewest(sessions, [GameSessionStatus.completed]);
  if (completed !== null) {
    return { status: TableCardStatus.completed, session: completed };
  }

  return {
    status:
      lobbyStatus === LobbyStatus.open
        ? TableCardStatus.recruiting
        : TableCardStatus.adjusting,
    session: null,
  };
};
