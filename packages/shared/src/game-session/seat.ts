import { z } from 'zod';

/**
 * 着席（`game_session.seats`）。v0.2 の `GameSessionMember` を置き換える。
 *
 * テーブルとしては `game_session_id` と `lobby_entry_id` の2 FK だけの「純粋な選出ファクト」だが
 * （design-v2 §3-8）、レスポンスには LobbyEntry と キャラクター割り当てを JOIN した解決値が現れる。
 * フロントが着席者を描くたびに entries を引き当てなくて済むようにするため。
 *
 * - ログインユーザー: `userId` が非 null、`guestName` は null
 * - ゲスト: `userId` が null、`guestName` が非 null
 *
 * v0.2 にあった出自の突合用フィールドは**廃止**。選出＝Seat の有無で表せるため不要になった。
 */
export const SeatSchema = z.object({
  id: z.string().uuid(),
  /** `lobby_entries.id`。表示名の出所であり、Seat の唯一の紐付け */
  entryId: z.string().uuid(),
  /** 由来の LobbyEntry から解決。ゲストは null */
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  guestName: z.string().nullable(),
  characterName: z.string().nullable(),
  /** `seats.created_at`。v0.2 の `joinedAt` の改名 */
  seatedAt: z.string(),
});
export type Seat = z.infer<typeof SeatSchema>;

/**
 * 着席の軽量参照。一覧（`GameSessionListItem.seats` / `GameSessionSummary.seats`）で使う。
 *
 * 一覧で要るのは「何人いるか」（長さ）と「自分が着席しているか」（`userId` の一致）の2つだけなので、
 * 表示名・キャラクター名・`seatedAt` は載せない。v0.2 の `memberCount`（件数だけ）を置き換えたもの。
 * `userId` を落とすと着席状態を描くために開催ごとに `GET .../seats` を引くことになるため残す。
 */
export const SeatRefSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
});
export type SeatRef = z.infer<typeof SeatRefSchema>;

/**
 * 着席の入力。**`entryId` は必須で、操作できるのはホストだけ**（design-v2 §6-6）。
 *
 * 着席は選出のファクトであり、選出はホストの仕事である。ログインユーザーもゲストも
 * 自分の操作は「ロビーに参加する」までで、v0.2 の「自分で着席する」経路と
 * ゲストの「参加 + 着席」（`guest-seats`）はどちらも廃止した。
 *
 * ホストによる代理の新規参加登録も持たないため、`entryId` は既存の在籍中
 * （`leftAt == null`）の LobbyEntry でなければならない。
 */
export const CreateSeatInputSchema = z.object({
  entryId: z.string().uuid(),
});
export type CreateSeatInput = z.infer<typeof CreateSeatInputSchema>;

/**
 * 着席の更新入力。更新できるのはキャラクター名だけ
 * （それ以外は着席というファクトそのものなので変更できない）。
 *
 * `required` にしているのは、キーの有無で「変更しない」と「解除する」を区別させないため。
 * `null` は明示的な解除であって未指定ではない。
 *
 * 実体は `character_assignments` に分離されたが（design-v2 §9-4）、API から見た
 * 更新対象は着席（Seat）のまま。`.../seats/:seatId/character` のようなサブリソースは
 * 作らない（design-v2 §6-11 の「サブリソースにしない」）。
 */
export const UpdateSeatInputSchema = z.object({
  characterName: z.string().min(1).max(100).nullable(),
});
export type UpdateSeatInput = z.infer<typeof UpdateSeatInputSchema>;

/** ゲストの着席（アカウントを持たず招待リンクからロビーに参加した人）かどうかを判定する */
export const isGuestSeat = (seat: Pick<Seat, 'userId'>): boolean =>
  seat.userId === null;
