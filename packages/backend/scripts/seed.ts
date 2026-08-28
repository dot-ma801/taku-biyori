/// <reference types="node" />
/**
 * 開発用のシードスクリプト。
 *
 * ⚠️ **本番環境では絶対に実行しないこと。** 既存のシードデータを削除してから
 * 作り直すため、本番の DB に向けて実行するとデータが失われる。
 * マイグレーション（DDL・履歴管理あり・本番でも実行する）とは別物で、
 * シードは DML・履歴管理なし・開発環境専用である（migration-plan §1-3）。
 *
 * 破壊的なマイグレーションの直後に、開発用データを1コマンドで復元するためのもの。
 * スキーマ変更でこのスクリプトが壊れることが、そのまま早期警告になる。
 *
 * 実行: pnpm --filter @taku-biyori/backend db:seed
 */
import 'dotenv/config';
import { and, eq, inArray, like } from 'drizzle-orm';
import { createAuth } from '@/auth/infrastructure/create-auth';
import { createDatabase } from '@/system/infrastructure/database/client';
import type { Database } from '@/system/infrastructure/database/client';
import { loadBackendConfig } from '@/system/infrastructure/config/env';
import { assertLocalDatabaseUrl } from '@/system/infrastructure/database/assert-local-database-url';
import { firstRow } from '@/system/infrastructure/database/first-row';
import { dateFromToday } from '@/system/domain/date-from-today';
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

if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'db:seed は開発環境専用です。NODE_ENV=production では実行できません',
  );
}

const config = loadBackendConfig();

assertLocalDatabaseUrl(
  config.databaseUrl,
  process.env.SEED_ALLOW_REMOTE === '1',
);

/** シードで作ったユーザーを見分けるためのメールドメイン。後片付けの目印にもなる */
const SEED_EMAIL_DOMAIN = 'seed.taku-biyori.local';
const SEED_PASSWORD = 'seed-password-1234';
const db = createDatabase(config.databaseUrl);
const auth = createAuth({
  db,
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  trustedOrigin: config.frontendOrigin,
});

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * 前回のシードデータを消す。
 * ロビー・卓はシードユーザーがホストの行だけを対象にするので、
 * 手で作った開発データは残る。
 */
const clearPreviousSeed = async (database: Database): Promise<void> => {
  const seededUsers = await database
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, `%@${SEED_EMAIL_DOMAIN}`));

  if (seededUsers.length === 0) {
    return;
  }

  const userIds = seededUsers.map((row) => row.id);

  // 卓 → ロビー → ユーザーの順に消す。メンバー・候補日・回答・メモは
  // FK の ON DELETE CASCADE で一緒に消える
  await database
    .delete(gameSessions)
    .where(inArray(gameSessions.hostUserId, userIds));
  await database.delete(lobbies).where(inArray(lobbies.hostUserId, userIds));
  await database.delete(user).where(inArray(user.id, userIds));

  console.log(
    `前回のシードデータを削除しました（ユーザー ${userIds.length} 件）`,
  );
};

/**
 * ログインできるユーザーを作る。
 * パスワードのハッシュ化を自前で再実装しないよう、Better Auth のサーバ API を通す。
 */
const createSeedUser = async (
  username: string,
  name: string,
): Promise<string> => {
  const result = await auth.api.signUpEmail({
    body: {
      email: `${username}@${SEED_EMAIL_DOMAIN}`,
      password: SEED_PASSWORD,
      name,
      username,
    },
  });

  return result.user.id;
};

const insertLobby = async (
  database: Database,
  values: {
    hostUserId: string;
    title: string;
    scenarioName?: string | null;
    description?: string | null;
    location?: string | null;
    maxPlayers?: number | null;
    guestLinkToken: string;
    isPublished?: boolean;
    openUntil?: string | null;
  },
): Promise<string> => {
  const rows = await database
    .insert(lobbies)
    .values({
      hostUserId: values.hostUserId,
      title: values.title,
      scenarioName: values.scenarioName ?? null,
      description: values.description ?? null,
      location: values.location ?? null,
      maxPlayers: values.maxPlayers ?? null,
      guestLinkToken: values.guestLinkToken,
      isPublished: values.isPublished ?? false,
      openUntil: values.openUntil ?? null,
    })
    .returning({ id: lobbies.id });

  return firstRow(rows, 'insertLobby').id;
};

const addLobbyMember = async (
  database: Database,
  lobbyId: string,
  member: { userId?: string | null; guestName?: string | null },
): Promise<string> => {
  const rows = await database
    .insert(lobbyMembers)
    .values({
      lobbyId,
      userId: member.userId ?? null,
      guestName: member.guestName ?? null,
    })
    .returning({ id: lobbyMembers.id });

  return firstRow(rows, 'addLobbyMember').id;
};

const addCandidateDate = async (
  database: Database,
  lobbyId: string,
  date: string,
  dateNote: string | null,
): Promise<string> => {
  const rows = await database
    .insert(lobbyCandidates)
    .values({ lobbyId, date, dateNote })
    .returning({ id: lobbyCandidates.id });

  return firstRow(rows, 'addCandidateDate').id;
};

const main = async (): Promise<void> => {
  await clearPreviousSeed(db);

  // --- ユーザー ---
  const yukiId = await createSeedUser('yuki', 'ユキ');
  const haruId = await createSeedUser('haru', 'ハル');
  const natsuId = await createSeedUser('natsu', 'ナツ');
  const akiId = await createSeedUser('aki', 'アキ');
  console.log('ユーザーを4人作成しました');

  // --- ロビー1: 公開・募集中。候補日と◯△×回答がひととおり入っている ---
  const openLobbyId = await insertLobby(db, {
    hostUserId: yukiId,
    title: 'マダミス「霧の館」を遊びたい',
    scenarioName: '霧の館',
    description: '初心者歓迎です。VC ありでゆるく遊びましょう。',
    location: 'オンライン（Discord）',
    maxPlayers: 5,
    guestLinkToken: 'seed-lobby-open',
    isPublished: true,
  });
  const openHostMemberId = await addLobbyMember(db, openLobbyId, {
    userId: yukiId,
  });
  const openHaruMemberId = await addLobbyMember(db, openLobbyId, {
    userId: haruId,
  });
  const openNatsuMemberId = await addLobbyMember(db, openLobbyId, {
    userId: natsuId,
  });
  const openGuestMemberId = await addLobbyMember(db, openLobbyId, {
    guestName: 'そら（ゲスト）',
  });

  const firstDateId = await addCandidateDate(
    db,
    openLobbyId,
    dateFromToday(7),
    '20:00〜',
  );
  const secondDateId = await addCandidateDate(
    db,
    openLobbyId,
    dateFromToday(14),
    '13:00〜17:00',
  );
  const thirdDateId = await addCandidateDate(
    db,
    openLobbyId,
    dateFromToday(21),
    null,
  );

  await db.insert(lobbyAnswers).values([
    { candidateId: firstDateId, memberId: openHostMemberId, answer: 'ok' },
    { candidateId: firstDateId, memberId: openHaruMemberId, answer: 'ok' },
    {
      candidateId: firstDateId,
      memberId: openNatsuMemberId,
      answer: 'maybe',
      comment: '21時からなら確実です',
    },
    { candidateId: firstDateId, memberId: openGuestMemberId, answer: 'ok' },
    { candidateId: secondDateId, memberId: openHostMemberId, answer: 'ok' },
    { candidateId: secondDateId, memberId: openHaruMemberId, answer: 'ng' },
    { candidateId: secondDateId, memberId: openNatsuMemberId, answer: 'ok' },
    { candidateId: thirdDateId, memberId: openHostMemberId, answer: 'maybe' },
    { candidateId: thirdDateId, memberId: openGuestMemberId, answer: 'ng' },
  ]);
  console.log('公開・募集中のロビーを作成しました（候補日3件・回答9件）');

  // --- ロビー2: 募集締め切り済み（日程調整中） ---
  const closedLobbyId = await insertLobby(db, {
    hostUserId: haruId,
    title: 'TRPG「はじめての探索」',
    scenarioName: 'はじめての探索',
    description: '募集は締め切り、日程を詰めているところです。',
    location: 'オンライン',
    maxPlayers: 4,
    guestLinkToken: 'seed-lobby-closed',
    isPublished: true,
    openUntil: dateFromToday(-3),
  });
  const closedHostMemberId = await addLobbyMember(db, closedLobbyId, {
    userId: haruId,
  });
  const closedYukiMemberId = await addLobbyMember(db, closedLobbyId, {
    userId: yukiId,
  });
  const closedAkiMemberId = await addLobbyMember(db, closedLobbyId, {
    userId: akiId,
  });
  const closedDateId = await addCandidateDate(
    db,
    closedLobbyId,
    dateFromToday(3),
    '19:00〜',
  );
  await db.insert(lobbyAnswers).values([
    { candidateId: closedDateId, memberId: closedHostMemberId, answer: 'ok' },
    { candidateId: closedDateId, memberId: closedYukiMemberId, answer: 'ok' },
    { candidateId: closedDateId, memberId: closedAkiMemberId, answer: 'ok' },
  ]);

  const scheduledSessionRows = await db
    .insert(gameSessions)
    .values({
      hostUserId: haruId,
      title: 'TRPG「はじめての探索」',
      scenarioName: 'はじめての探索',
      description: '19:00 集合、19:15 開始予定です。',
      location: 'オンライン',
      maxPlayers: 4,
      guestLinkToken: 'seed-session-confirmed',
      isPublished: true,
      scheduledAt: dateFromToday(3),
    })
    .returning({ id: gameSessions.id });
  const scheduledSessionId = firstRow(
    scheduledSessionRows,
    '開催予定の卓の作成',
  ).id;

  const scheduledMemberRows = await db
    .insert(gameSessionMembers)
    .values([
      {
        gameSessionId: scheduledSessionId,
        userId: haruId,
        characterName: null,
      },
      {
        gameSessionId: scheduledSessionId,
        userId: yukiId,
        characterName: '探索者A',
      },
      {
        gameSessionId: scheduledSessionId,
        userId: akiId,
        characterName: '探索者B',
      },
    ])
    .returning({
      id: gameSessionMembers.id,
      userId: gameSessionMembers.userId,
    });
  console.log('締め切り済みのロビーと、開催予定の卓を作成しました');

  // --- 完了済みの卓（プレイメモつき） ---
  const completedSessionRows = await db
    .insert(gameSessions)
    .values({
      hostUserId: yukiId,
      title: 'クローズド「灯台の夜」',
      scenarioName: '灯台の夜',
      description: 'おつかれさまでした。',
      location: 'オンライン',
      maxPlayers: 4,
      guestLinkToken: 'seed-session-completed',
      isPublished: true,
      scheduledAt: dateFromToday(-7),
      completedAt: daysAgo(7),
    })
    .returning({ id: gameSessions.id });
  const completedSessionId = firstRow(
    completedSessionRows,
    '完了済み卓の作成',
  ).id;

  const completedMemberRows = await db
    .insert(gameSessionMembers)
    .values([
      {
        gameSessionId: completedSessionId,
        userId: yukiId,
        characterName: '灯台守',
      },
      {
        gameSessionId: completedSessionId,
        userId: natsuId,
        characterName: '訪問者',
      },
      {
        gameSessionId: completedSessionId,
        userId: null,
        guestName: 'みなと（ゲスト）',
        characterName: '船乗り',
      },
    ])
    .returning({ id: gameSessionMembers.id });

  const [lighthouseKeeperMember, visitorMember] = completedMemberRows;
  if (!lighthouseKeeperMember || !visitorMember) {
    throw new Error(
      'completedMemberRows の取得結果が想定（3件）より少ないです',
    );
  }

  await db.insert(gameSessionPlayMemos).values([
    {
      memberId: lighthouseKeeperMember.id,
      body: '灯台守視点のメモ。序盤に鍵の話を振れたのがよかった。',
      sharedAt: daysAgo(6),
    },
    {
      memberId: visitorMember.id,
      body: '（非公開）次に同じシナリオを回すときのための覚え書き。',
      sharedAt: null,
    },
  ]);
  console.log('完了済みの卓とプレイメモを作成しました');

  // --- ロビーに紐づかない単独の卓 ---
  const directSessionRows = await db
    .insert(gameSessions)
    .values({
      hostUserId: natsuId,
      title: '身内卓「週末セッション」',
      scenarioName: null,
      description: '固定メンバーで遊ぶ卓です。',
      location: 'カフェ・オンライン併用',
      maxPlayers: 6,
      guestLinkToken: 'seed-session-direct',
      isPublished: true,
      scheduledAt: dateFromToday(30),
    })
    .returning({ id: gameSessions.id });
  const directSessionId = firstRow(directSessionRows, '単独の卓の作成').id;
  await db.insert(gameSessionMembers).values([
    { gameSessionId: directSessionId, userId: natsuId },
    { gameSessionId: directSessionId, userId: akiId, characterName: 'PC2' },
  ]);
  console.log('単独の卓を作成しました');

  // --- ロビー3: 下書き（ホストにしか見えない） ---
  const draftLobbyId = await insertLobby(db, {
    hostUserId: akiId,
    title: '（下書き）クトゥルフ神話TRPG 初心者歓迎',
    scenarioName: null,
    description: '募集文を書いている途中。',
    location: null,
    maxPlayers: 4,
    guestLinkToken: 'seed-lobby-draft',
    isPublished: false,
  });
  await addLobbyMember(db, draftLobbyId, { userId: akiId });
  await addCandidateDate(db, draftLobbyId, dateFromToday(45), null);
  console.log('下書きのロビーを作成しました');

  // 集計を出しておくと、スキーマ変更でシードが壊れたときに気づきやすい
  const seededMemberIds = scheduledMemberRows.map((row) => row.id);
  const memberCheck = await db
    .select({ id: gameSessionMembers.id })
    .from(gameSessionMembers)
    .where(
      and(
        eq(gameSessionMembers.gameSessionId, scheduledSessionId),
        inArray(gameSessionMembers.id, seededMemberIds),
      ),
    );

  console.log('');
  console.log('シード完了');
  console.log(`  ユーザー: 4（パスワードはすべて ${SEED_PASSWORD}）`);
  console.log('    ユーザー名でログインできます: yuki / haru / natsu / aki');
  console.log('  ロビー: 3（公開・募集中 / 日程調整中 / 下書き）');
  console.log('  卓: 3（開催予定 / 完了済み / 単独作成）');
  console.log(`  開催予定の卓のメンバー: ${memberCheck.length}`);
  console.log('');
  console.log(
    '公開中のロビー・卓は role: null で誰の一覧にも出るため、Google ログインでも確認できます',
  );
};

await main();
process.exit(0);
