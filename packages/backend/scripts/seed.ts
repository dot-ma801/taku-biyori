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
  scheduleAnswers,
  candidateDates,
  schedulePolls,
  lobbyEntries,
} from '@/system/infrastructure/database/lobby-schema';
import {
  gameSessionPlayMemos,
  gameSessions,
  seats,
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

  // ロビー → ユーザーの順に消す。開催・着席・候補日・回答・メモは
  // FK の ON DELETE CASCADE で一緒に消える（開催はロビーにぶら下がるようになった）
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
      // 公開のファクトは nullable timestamp。シードでは作成時刻で代用する
      publishedAt: values.isPublished ? new Date() : null,
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
    .insert(lobbyEntries)
    .values({
      lobbyId,
      userId: member.userId ?? null,
      guestName: member.guestName ?? null,
    })
    .returning({ id: lobbyEntries.id });

  return firstRow(rows, 'addLobbyMember').id;
};

const addSchedulePoll = async (
  database: Database,
  lobbyId: string,
): Promise<string> => {
  const rows = await database
    .insert(schedulePolls)
    .values({ lobbyId })
    .returning({ id: schedulePolls.id });

  return firstRow(rows, 'addSchedulePoll').id;
};

const addCandidateDate = async (
  database: Database,
  pollId: string,
  date: string,
  timeLabel: string | null,
): Promise<string> => {
  const rows = await database
    .insert(candidateDates)
    .values({ pollId, date, timeLabel })
    .returning({ id: candidateDates.id });

  return firstRow(rows, 'addCandidateDate').id;
};

const addGameSession = async (
  database: Database,
  values: {
    lobbyId: string;
    scheduledAt: string;
    title?: string | null;
    scenarioName?: string | null;
    description?: string | null;
    location?: string | null;
    timeLabel?: string | null;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
  },
): Promise<string> => {
  const rows = await database
    .insert(gameSessions)
    .values({
      lobbyId: values.lobbyId,
      scheduledAt: values.scheduledAt,
      title: values.title ?? null,
      scenarioName: values.scenarioName ?? null,
      description: values.description ?? null,
      location: values.location ?? null,
      timeLabel: values.timeLabel ?? null,
      completedAt: values.completedAt ?? null,
      cancelledAt: values.cancelledAt ?? null,
    })
    .returning({ id: gameSessions.id });

  return firstRow(rows, 'addGameSession').id;
};

const addSeats = async (
  database: Database,
  gameSessionId: string,
  values: { lobbyEntryId: string; characterName?: string | null }[],
): Promise<string[]> => {
  const rows = await database
    .insert(seats)
    .values(
      values.map((seat) => ({
        gameSessionId,
        lobbyEntryId: seat.lobbyEntryId,
        characterName: seat.characterName ?? null,
      })),
    )
    .returning({ id: seats.id });

  return rows.map((row) => row.id);
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

  const openPollId = await addSchedulePoll(db, openLobbyId);
  const firstDateId = await addCandidateDate(
    db,
    openPollId,
    dateFromToday(7),
    '20:00〜',
  );
  const secondDateId = await addCandidateDate(
    db,
    openPollId,
    dateFromToday(14),
    '13:00〜17:00',
  );
  const thirdDateId = await addCandidateDate(
    db,
    openPollId,
    dateFromToday(21),
    null,
  );

  await db.insert(scheduleAnswers).values([
    {
      candidateDateId: firstDateId,
      lobbyEntryId: openHostMemberId,
      answer: 'ok',
    },
    {
      candidateDateId: firstDateId,
      lobbyEntryId: openHaruMemberId,
      answer: 'ok',
    },
    {
      candidateDateId: firstDateId,
      lobbyEntryId: openNatsuMemberId,
      answer: 'maybe',
      comment: '21時からなら確実です',
    },
    {
      candidateDateId: firstDateId,
      lobbyEntryId: openGuestMemberId,
      answer: 'ok',
    },
    {
      candidateDateId: secondDateId,
      lobbyEntryId: openHostMemberId,
      answer: 'ok',
    },
    {
      candidateDateId: secondDateId,
      lobbyEntryId: openHaruMemberId,
      answer: 'ng',
    },
    {
      candidateDateId: secondDateId,
      lobbyEntryId: openNatsuMemberId,
      answer: 'ok',
    },
    {
      candidateDateId: thirdDateId,
      lobbyEntryId: openHostMemberId,
      answer: 'maybe',
    },
    {
      candidateDateId: thirdDateId,
      lobbyEntryId: openGuestMemberId,
      answer: 'ng',
    },
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
  const closedPollId = await addSchedulePoll(db, closedLobbyId);
  const closedDateId = await addCandidateDate(
    db,
    closedPollId,
    dateFromToday(3),
    '19:00〜',
  );
  await db.insert(scheduleAnswers).values([
    {
      candidateDateId: closedDateId,
      lobbyEntryId: closedHostMemberId,
      answer: 'ok',
    },
    {
      candidateDateId: closedDateId,
      lobbyEntryId: closedYukiMemberId,
      answer: 'ok',
    },
    {
      candidateDateId: closedDateId,
      lobbyEntryId: closedAkiMemberId,
      answer: 'ok',
    },
  ]);

  // --- ロビー2 の開催（開催予定） ---
  // 上書き項目（title / scenarioName / location）は**あえて入れない**。
  // 未設定ならロビーの値を表示する導出を、シードでそのまま確認できるようにするため（design-v2 §5-5）
  const scheduledSessionId = await addGameSession(db, {
    lobbyId: closedLobbyId,
    scheduledAt: dateFromToday(3),
    description: '19:00 集合、19:15 開始予定です。',
    timeLabel: '19:00〜',
  });
  const scheduledSeatIds = await addSeats(db, scheduledSessionId, [
    { lobbyEntryId: closedHostMemberId },
    { lobbyEntryId: closedYukiMemberId, characterName: '探索者A' },
    { lobbyEntryId: closedAkiMemberId, characterName: '探索者B' },
  ]);
  console.log('締め切り済みのロビーと、開催予定の開催を作成しました');

  // --- ロビー4: 完了済み（プレイメモつき） ---
  // セッションは必ずロビーに属するため、完了済みの開催にもロビーを作る（design-v2 §9-3）
  const completedLobbyId = await insertLobby(db, {
    hostUserId: yukiId,
    title: 'クローズド「灯台の夜」',
    scenarioName: '灯台の夜',
    description: '身内で遊んだ回です。',
    location: 'オンライン',
    maxPlayers: 4,
    guestLinkToken: 'seed-lobby-completed',
    isPublished: true,
    openUntil: dateFromToday(-10),
  });
  const completedYukiEntryId = await addLobbyMember(db, completedLobbyId, {
    userId: yukiId,
  });
  const completedNatsuEntryId = await addLobbyMember(db, completedLobbyId, {
    userId: natsuId,
  });
  const completedGuestEntryId = await addLobbyMember(db, completedLobbyId, {
    guestName: 'みなと（ゲスト）',
  });

  const completedSessionId = await addGameSession(db, {
    lobbyId: completedLobbyId,
    scheduledAt: dateFromToday(-7),
    description: 'おつかれさまでした。',
    completedAt: daysAgo(7),
  });
  const [lighthouseKeeperSeatId, visitorSeatId] = await addSeats(
    db,
    completedSessionId,
    [
      { lobbyEntryId: completedYukiEntryId, characterName: '灯台守' },
      { lobbyEntryId: completedNatsuEntryId, characterName: '訪問者' },
      { lobbyEntryId: completedGuestEntryId, characterName: '船乗り' },
    ],
  );
  if (!lighthouseKeeperSeatId || !visitorSeatId) {
    throw new Error('完了済みの開催の着席が想定（3件）より少ないです');
  }

  await db.insert(gameSessionPlayMemos).values([
    {
      seatId: lighthouseKeeperSeatId,
      body: '灯台守視点のメモ。序盤に鍵の話を振れたのがよかった。',
      sharedAt: daysAgo(6),
    },
    {
      seatId: visitorSeatId,
      body: '（非公開）次に同じシナリオを回すときのための覚え書き。',
      sharedAt: null,
    },
  ]);
  console.log('完了済みの開催とプレイメモを作成しました');

  // --- ロビー5: 直接卓立て（受付を開かないロビーに開催が1つ） ---
  // 下書きのまま公開せず、ホストが知っている相手だけを着席させた形（design-v2 §5-3）
  const directLobbyId = await insertLobby(db, {
    hostUserId: natsuId,
    title: '身内卓「週末セッション」',
    scenarioName: null,
    description: '固定メンバーで遊ぶ卓です。',
    location: 'カフェ・オンライン併用',
    maxPlayers: 6,
    guestLinkToken: 'seed-lobby-direct',
    isPublished: false,
  });
  const directNatsuEntryId = await addLobbyMember(db, directLobbyId, {
    userId: natsuId,
  });
  const directAkiEntryId = await addLobbyMember(db, directLobbyId, {
    userId: akiId,
  });
  const directSessionId = await addGameSession(db, {
    lobbyId: directLobbyId,
    scheduledAt: dateFromToday(30),
  });
  await addSeats(db, directSessionId, [
    { lobbyEntryId: directNatsuEntryId },
    { lobbyEntryId: directAkiEntryId, characterName: 'PC2' },
  ]);
  console.log('直接卓立てのロビーと開催を作成しました');

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
  const draftPollId = await addSchedulePoll(db, draftLobbyId);
  await addCandidateDate(db, draftPollId, dateFromToday(45), null);
  console.log('下書きのロビーを作成しました');

  // 集計を出しておくと、スキーマ変更でシードが壊れたときに気づきやすい
  const seatCheck = await db
    .select({ id: seats.id })
    .from(seats)
    .where(
      and(
        eq(seats.gameSessionId, scheduledSessionId),
        inArray(seats.id, scheduledSeatIds),
      ),
    );

  console.log('');
  console.log('シード完了');
  console.log(`  ユーザー: 4（パスワードはすべて ${SEED_PASSWORD}）`);
  console.log('    ユーザー名でログインできます: yuki / haru / natsu / aki');
  console.log('  ロビー: 5（公開・募集中 / 日程調整中 / 下書き / 完了済み / 直接卓立て）');
  console.log('  開催: 3（開催予定 / 完了済み / 直接卓立て）');
  console.log(`  開催予定の開催の着席: ${seatCheck.length}`);
  console.log('');
  console.log(
    '公開中のロビー・卓は role: null で誰の一覧にも出るため、Google ログインでも確認できます',
  );
};

await main();
process.exit(0);
