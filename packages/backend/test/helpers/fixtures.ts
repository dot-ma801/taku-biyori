/**
 * 実 DB テスト用のフィクスチャ生成ヘルパー。
 *
 * ID はすべてランダムに採番する。テストはロールバックで分離されるが、
 * `withCommitted`（ロック競合のテスト）ではコミットされるため、
 * 他のテストと衝突しない値を使うことを前提にしている。
 */
import { randomUUID } from 'node:crypto';
import type { Database } from '@/system/infrastructure/database/client';
import { firstRow } from '@/system/infrastructure/database/first-row';
import { user } from '@/system/infrastructure/database/schema';
import {
  lobbies,
  lobbyAnswers,
  lobbyCandidates,
  lobbyMembers,
} from '@/system/infrastructure/database/lobby-schema';
import {
  gameSessionMembers,
  gameSessionPlayMemos,
  gameSessions,
} from '@/system/infrastructure/database/game-session-schema';

export const insertUser = async (
  db: Database,
  overrides: { name?: string | null } = {},
): Promise<{ id: string; name: string | null }> => {
  const id = `test-user-${randomUUID()}`;
  const name = overrides.name === undefined ? 'テストユーザー' : overrides.name;

  await db.insert(user).values({
    id,
    name,
    email: `${id}@example.test`,
  });

  return { id, name };
};

export interface InsertLobbyOverrides {
  title?: string;
  scenarioName?: string | null;
  description?: string | null;
  location?: string | null;
  maxPlayers?: number | null;
  guestLinkToken?: string;
  isPublished?: boolean;
  openUntil?: string | null;
  closedAt?: Date | null;
  cancelledAt?: Date | null;
}

export const insertLobby = async (
  db: Database,
  hostUserId: string,
  overrides: InsertLobbyOverrides = {},
): Promise<string> => {
  const rows = await db
    .insert(lobbies)
    .values({
      hostUserId,
      title: overrides.title ?? 'テスト募集',
      scenarioName: overrides.scenarioName ?? null,
      description: overrides.description ?? null,
      location: overrides.location ?? null,
      maxPlayers: overrides.maxPlayers ?? null,
      guestLinkToken: overrides.guestLinkToken ?? `token-${randomUUID()}`,
      isPublished: overrides.isPublished ?? false,
      openUntil: overrides.openUntil ?? null,
      closedAt: overrides.closedAt ?? null,
      cancelledAt: overrides.cancelledAt ?? null,
    })
    .returning({ id: lobbies.id });

  return firstRow(rows, 'insertLobby').id;
};

export const insertLobbyMember = async (
  db: Database,
  lobbyId: string,
  member: { userId?: string | null; guestName?: string | null } = {},
): Promise<string> => {
  const rows = await db
    .insert(lobbyMembers)
    .values({
      lobbyId,
      userId: member.userId ?? null,
      guestName: member.guestName ?? null,
    })
    .returning({ id: lobbyMembers.id });

  return firstRow(rows, 'insertLobbyMember').id;
};

export const insertCandidateDate = async (
  db: Database,
  lobbyId: string,
  date: string,
  dateNote: string | null = null,
): Promise<string> => {
  const rows = await db
    .insert(lobbyCandidates)
    .values({ lobbyId, date, dateNote })
    .returning({ id: lobbyCandidates.id });

  return firstRow(rows, 'insertCandidateDate').id;
};

export const insertAnswer = async (
  db: Database,
  candidateId: string,
  memberId: string,
  answer: 'ok' | 'maybe' | 'ng',
  comment: string | null = null,
): Promise<string> => {
  const rows = await db
    .insert(lobbyAnswers)
    .values({ candidateId, memberId, answer, comment })
    .returning({ id: lobbyAnswers.id });

  return firstRow(rows, 'insertAnswer').id;
};

export interface InsertGameSessionOverrides {
  title?: string;
  scenarioName?: string | null;
  description?: string | null;
  location?: string | null;
  maxPlayers?: number | null;
  guestLinkToken?: string;
  isPublished?: boolean;
  scheduledAt?: string;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  lobbyId?: string | null;
}

export const insertGameSession = async (
  db: Database,
  hostUserId: string,
  overrides: InsertGameSessionOverrides = {},
): Promise<string> => {
  const rows = await db
    .insert(gameSessions)
    .values({
      hostUserId,
      title: overrides.title ?? 'テスト卓',
      scenarioName: overrides.scenarioName ?? null,
      description: overrides.description ?? null,
      location: overrides.location ?? null,
      maxPlayers: overrides.maxPlayers ?? null,
      guestLinkToken: overrides.guestLinkToken ?? `token-${randomUUID()}`,
      isPublished: overrides.isPublished ?? false,
      scheduledAt: overrides.scheduledAt ?? '2999-12-31',
      completedAt: overrides.completedAt ?? null,
      cancelledAt: overrides.cancelledAt ?? null,
      lobbyId: overrides.lobbyId ?? null,
    })
    .returning({ id: gameSessions.id });

  return firstRow(rows, 'insertGameSession').id;
};

export const insertGameSessionMember = async (
  db: Database,
  gameSessionId: string,
  member: {
    userId?: string | null;
    guestName?: string | null;
    characterName?: string | null;
    lobbyMemberId?: string | null;
  } = {},
): Promise<string> => {
  const rows = await db
    .insert(gameSessionMembers)
    .values({
      gameSessionId,
      userId: member.userId ?? null,
      guestName: member.guestName ?? null,
      characterName: member.characterName ?? null,
      lobbyMemberId: member.lobbyMemberId ?? null,
    })
    .returning({ id: gameSessionMembers.id });

  return firstRow(rows, 'insertGameSessionMember').id;
};

export const insertPlayMemo = async (
  db: Database,
  memberId: string,
  memo: { body?: string; sharedAt?: Date | null } = {},
): Promise<void> => {
  await db.insert(gameSessionPlayMemos).values({
    memberId,
    body: memo.body ?? '',
    sharedAt: memo.sharedAt ?? null,
  });
};

// dateFromToday（`scheduled_at` の境界テスト用の相対日付ヘルパー）は
// scripts/seed.ts と重複していたため `@/system/domain/date-from-today` へ
// 切り出した。ここでは re-export せず、利用側にそちらを直接 import させる。
