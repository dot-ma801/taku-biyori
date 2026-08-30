import type {
  Lobby,
  LobbyDetail,
  LobbyEntry,
  LobbyListItem,
  LobbyMember,
  LobbyStatus,
} from '@taku-biyori/shared';

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
  status: LobbyStatus;
  maxPlayers: number | null;
  /** 受付締め切り日（`YYYY-MM-DD`）。null なら無期限受付 */
  openUntil: string | null;
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
  openUntil: string | null;
  memberCount: number;
  maxPlayers: number | null;
  role: 'host' | 'member' | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toLobbyEntryModel = (
  dto: LobbyMember | LobbyEntry,
): LobbyEntryModel => ({
  id: dto.id,
  userId: dto.userId,
  userName: dto.userName,
  guestName: dto.guestName,
  joinedAt: new Date(dto.joinedAt),
  // leftAt は移行タスク3 の backend PR で契約に入る。それまでは全員が在籍中
  leftAt: 'leftAt' in dto && dto.leftAt ? new Date(dto.leftAt) : null,
});

export const toLobbyModel = (dto: Lobby): LobbyModel => ({
  id: dto.id,
  title: dto.title,
  description: dto.description ?? null,
  scenarioName: dto.scenarioName ?? null,
  location: dto.location ?? null,
  status: dto.status,
  maxPlayers: dto.maxPlayers ?? null,
  openUntil: dto.openUntil ?? null,
  hostUserId: dto.hostUserId,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export const toLobbyDetailModel = (dto: LobbyDetail): LobbyDetailModel => {
  const entries = dto.members.map(toLobbyEntryModel);

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
): LobbyListItemModel => ({
  id: dto.id,
  title: dto.title,
  scenarioName: dto.scenarioName ?? null,
  status: dto.status,
  openUntil: dto.openUntil ?? null,
  memberCount: dto.memberCount,
  maxPlayers: dto.maxPlayers ?? null,
  role: dto.role,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});
