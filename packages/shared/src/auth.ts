import { z } from 'zod';

/**
 * Better Auth で共有するユーザー情報のスキーマです。
 * バックエンドとフロントエンドで同じ契約を参照できるようにします。
 */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  image: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Better Auth の getSession 系レスポンスを表すスキーマです。
 * 既存の `SessionSchema` は後方互換のために残しています。
 */
export const SessionResponseSchema = z.object({
  user: UserSchema,
  session: z
    .object({
      id: z.string(),
      expiresAt: z.date(),
      token: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .optional(),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/**
 * 後方互換用のエイリアスです。
 * 既存コードが `SessionSchema` を参照していても壊れないように残します。
 */
export const SessionSchema = SessionResponseSchema;

export type Session = SessionResponse;
