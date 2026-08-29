import type {
  Lobby,
  LobbyDetail,
  LobbyEntry,
  LobbyListItem,
  LobbyStatus,
} from '@taku-biyori/shared';
import { getLobbyStatus } from '@taku-biyori/shared';

/**
 * ロビー系の model と、DTO（`@taku-biyori/shared` の契約型）からの変換関数。
 *
 * **`@taku-biyori/shared` の型は API との通信契約（DTO）であって、frontend 内部で
 * 扱うデータ構造ではない。** DTO を見てよいのは `src/api/` と `src/models/` だけで、
 * composable / component は model だけを受け取る（issue #113 以降の規約）。
 *
 * model 側で引き受けること:
 * - タイムスタンプを `Date` にする（画面ごとに `new Date()` しない）
 * - 省略されうるフィールドを `null` に正規化する（`undefined` と `null` を混在させない）
 * - 導出値をあらかじめ持たせる（`activeEntries` など）
 *
 * 表示用のフォールバック文言（「未設定」など）は UI の関心事なのでここには置かない。
 */

/** ロビーへの参加。脱退しても行は消えず `leftAt` が入る（design-v2 §3-3） */
export type LobbyEntryModel = {
  id: string;
  userId: string | null;
  userName: string | null;
  guestName: string | null;
  joinedAt: Date;
  /** 脱退日時。null なら在籍中 */
  leftAt: Date | null;
};

export type LobbyModel = {
  id: string;
  title: string;
  description: string | null;
  scenarioName: string | null;
  location: string | null;
  /** ファクトから導出済みのステータス。画面側でタイムスタンプから導出しない */
  status: LobbyStatus;
  maxPlayers: number | null;
  /** 下書きを抜けて動き出した時点。null なら下書き */
  publishedAt: Date | null;
  /** 受付締め切り日（`YYYY-MM-DD`）。null なら無期限受付 */
  openUntil: string | null;
  /** ホストが受付を手動で閉じた時点。null なら閉じていない */
  receptionClosedAt: Date | null;
  /** 企画そのものを畳んだ日時。null なら継続中 */
  disbandedAt: Date | null;
  hostUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LobbyDetailModel = LobbyModel & {
  /** 参加者。**脱退者も含む全件**。参加者一覧の表示に使う */
  entries: LobbyEntryModel[];
  /** 在籍中の参加者だけ。**回答表・着席候補はこちらを使う** */
  activeEntries: LobbyEntryModel[];
};

export type LobbyListItemModel = {
  id: string;
  title: string;
  scenarioName: string | null;
  status: LobbyStatus;
  publishedAt: Date | null;
  openUntil: string | null;
  receptionClosedAt: Date | null;
  maxPlayers: number | null;
  /** 参加者。**脱退者も含む全件** */
  entries: LobbyEntryModel[];
  /** 在籍中の参加者だけ。人数の表示にはこちらを使う */
  activeEntries: LobbyEntryModel[];
  /**
   * ホストの userId。`hostUserId === myUserId` で自分がホストか判定する。
   * v0.2 の `role` を置き換えた（role は導出値でありながら誰がホストかを捨てていた）
   */
  hostUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const toLobbyEntryModel = (dto: LobbyEntry): LobbyEntryModel => ({
  id: dto.id,
  userId: dto.userId,
  userName: dto.userName,
  guestName: dto.guestName,
  joinedAt: new Date(dto.joinedAt),
  leftAt: dto.leftAt ? new Date(dto.leftAt) : null,
});

export const toLobbyModel = (dto: Lobby): LobbyModel => ({
  id: dto.id,
  title: dto.title,
  description: dto.description ?? null,
  scenarioName: dto.scenarioName ?? null,
  location: dto.location ?? null,
  // レスポンスの status をそのまま使わず、ファクトから導出し直す（design-v2 §4-5）。
  // 締め切りの判定に閲覧者のローカル日付を使えるため、サーバのタイムゾーンや
  // レスポンス時刻に引きずられない。
  // 導出はこの変換のとき1回だけ。日付をまたいで開いたままのページに反映するには
  // 再取得が要る（日付境界での再取得はこの層ではなく詳細を保持する composable の責務）
  status: getLobbyStatus({
    publishedAt: dto.publishedAt,
    openUntil: dto.openUntil ?? null,
    receptionClosedAt: dto.receptionClosedAt,
    disbandedAt: dto.disbandedAt ?? null,
  }),
  maxPlayers: dto.maxPlayers ?? null,
  publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
  openUntil: dto.openUntil ?? null,
  receptionClosedAt: dto.receptionClosedAt
    ? new Date(dto.receptionClosedAt)
    : null,
  disbandedAt: dto.disbandedAt ? new Date(dto.disbandedAt) : null,
  hostUserId: dto.hostUserId,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export const toLobbyDetailModel = (dto: LobbyDetail): LobbyDetailModel => {
  const entries = dto.entries.map(toLobbyEntryModel);

  return {
    ...toLobbyModel(dto),
    entries,
    activeEntries: entries.filter((entry) => entry.leftAt === null),
  };
};

/**
 * entries を差し替えた patch を作る。`activeEntries` は `entries` からの導出値なので、
 * 片方だけ更新して食い違うことがないようにここで揃える。
 */
export const withEntries = (
  entries: LobbyEntryModel[],
): Pick<LobbyDetailModel, 'entries' | 'activeEntries'> => ({
  entries,
  activeEntries: entries.filter((entry) => entry.leftAt === null),
});

export const toLobbyListItemModel = (
  dto: LobbyListItem,
): LobbyListItemModel => {
  const entries = dto.entries.map(toLobbyEntryModel);

  return {
    id: dto.id,
    title: dto.title,
    scenarioName: dto.scenarioName ?? null,
    // 一覧の契約には disbandedAt が無い（openapi.yml の LobbyListItem）ため、
    // ここだけはサーバが導出した status をそのまま使う。
    // ファクトから導出し直せるのは全ファクトが揃う詳細（LobbyModel）のほう
    status: dto.status,
    publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
    openUntil: dto.openUntil ?? null,
    receptionClosedAt: dto.receptionClosedAt
      ? new Date(dto.receptionClosedAt)
      : null,
    maxPlayers: dto.maxPlayers ?? null,
    entries,
    activeEntries: entries.filter((entry) => entry.leftAt === null),
    hostUserId: dto.hostUserId,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
};
