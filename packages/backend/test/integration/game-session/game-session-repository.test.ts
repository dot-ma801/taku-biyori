/**
 * 卓リポジトリの実 DB テスト。
 *
 * 以前は drizzle のメソッドチェーンを `vi.fn()` でモックし、生成された SQL 文字列を
 * assert していた。それでは「クエリが実際に正しい結果を返すか」を検証できないため、
 * `TEST_DATABASE_URL` が指す実データベースに対して実行する形へ移行した。
 * 各テストはトランザクションで包まれ、終了時にロールバックされる。
 */
import { afterAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { GameSessionStatus } from '@taku-biyori/shared';
import { createGameSessionRepository } from '@/game-session/infrastructure/game-session-repository';
import {
  gameSessionMembers,
  gameSessionPlayMemos,
  gameSessions,
} from '@/system/infrastructure/database/game-session-schema';
import { closeTestDatabase, withRollback } from '@test/helpers/test-database';
import {
  dateFromToday,
  insertGameSession,
  insertGameSessionMember,
  insertPlayMemo,
  insertUser,
} from '@test/helpers/fixtures';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

afterAll(closeTestDatabase);

describe('findByUserId', () => {
  it('ホストの卓を role: host・メンバー数つきで返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        title: 'ホストの卓',
      });
      await insertGameSessionMember(db, gameSessionId, { userId: host.id });
      await insertGameSessionMember(db, gameSessionId, { guestName: 'ゲスト' });
      const repo = createGameSessionRepository(db);

      // Act
      const rows = await repo.findByUserId(host.id);

      // Assert
      expect(rows.find((row) => row.id === gameSessionId)).toMatchObject({
        title: 'ホストの卓',
        role: 'host',
        memberCount: 2,
      });
    });
  });

  it('参加している他人の卓を role: member で返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const member = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      await insertGameSessionMember(db, gameSessionId, { userId: member.id });
      const repo = createGameSessionRepository(db);

      // Act
      const rows = await repo.findByUserId(member.id);

      // Assert
      expect(rows.find((row) => row.id === gameSessionId)?.role).toBe('member');
    });
  });

  it('未参加でも公開・未終端の卓は role: null で含まれる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
      });
      const repo = createGameSessionRepository(db);

      // Act
      const rows = await repo.findByUserId(stranger.id);

      // Assert
      expect(rows.find((row) => row.id === gameSessionId)?.role).toBeNull();
    });
  });

  it('公開済みでも完了・中止した他人の卓は含まれない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const completedId = await insertGameSession(db, host.id, {
        isPublished: true,
        completedAt: new Date(),
      });
      const cancelledId = await insertGameSession(db, host.id, {
        isPublished: true,
        cancelledAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const rows = await repo.findByUserId(stranger.id);

      // Assert
      expect(rows.find((row) => row.id === completedId)).toBeUndefined();
      expect(rows.find((row) => row.id === cancelledId)).toBeUndefined();
    });
  });

  it('完了・中止していても自分がホストの卓は含まれる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const completedId = await insertGameSession(db, host.id, {
        isPublished: true,
        completedAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const rows = await repo.findByUserId(host.id);

      // Assert
      expect(rows.find((row) => row.id === completedId)?.status).toBe(
        GameSessionStatus.completed,
      );
    });
  });

  it('未公開・未参加の卓は含まれない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const draftId = await insertGameSession(db, host.id, {
        isPublished: false,
      });
      const repo = createGameSessionRepository(db);

      // Act
      const rows = await repo.findByUserId(stranger.id);

      // Assert
      expect(rows.find((row) => row.id === draftId)).toBeUndefined();
    });
  });
});

describe('findHostUserId / gameSessionExists', () => {
  it('ホストの userId と存在有無を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findHostUserId(gameSessionId)).toBe(host.id);
      expect(await repo.gameSessionExists(gameSessionId)).toBe(true);
    });
  });

  it('存在しない卓では null / false を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findHostUserId(MISSING_ID)).toBeNull();
      expect(await repo.gameSessionExists(MISSING_ID)).toBe(false);
    });
  });
});

describe('findGameSessionStatus / findStatusFields', () => {
  it('未公開なら draft を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: false,
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findGameSessionStatus(gameSessionId)).toBe(
        GameSessionStatus.draft,
      );
    });
  });

  it('開催日が今日なら today を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
        scheduledAt: dateFromToday(0),
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findGameSessionStatus(gameSessionId)).toBe(
        GameSessionStatus.today,
      );
    });
  });

  it('開催日が未来なら confirmed を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
        scheduledAt: dateFromToday(7),
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findGameSessionStatus(gameSessionId)).toBe(
        GameSessionStatus.confirmed,
      );
    });
  });

  it('中止済みは最優先で cancelled を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
        completedAt: new Date(),
        cancelledAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findGameSessionStatus(gameSessionId)).toBe(
        GameSessionStatus.cancelled,
      );
    });
  });

  it('存在しない卓では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findGameSessionStatus(MISSING_ID)).toBeNull();
      expect(await repo.findStatusFields(MISSING_ID)).toBeNull();
    });
  });

  it('findStatusFields は date 型の scheduled_at を Date に変換して返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        scheduledAt: '2100-08-08',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const fields = await repo.findStatusFields(gameSessionId);

      // Assert
      expect(fields?.scheduledAt).toBeInstanceOf(Date);
      expect(fields?.scheduledAt.toISOString().slice(0, 10)).toBe('2100-08-08');
    });
  });
});

describe('findDetailById', () => {
  it('卓とメンバー一覧を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホストさん' });
      const gameSessionId = await insertGameSession(db, host.id, {
        title: '詳細テスト',
      });
      await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
        characterName: '探偵',
      });
      await insertGameSessionMember(db, gameSessionId, {
        guestName: 'ゲストさん',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const detail = await repo.findDetailById(gameSessionId);

      // Assert
      expect(detail?.title).toBe('詳細テスト');
      expect(detail?.members).toHaveLength(2);
      expect(detail?.members[0]).toMatchObject({
        userName: 'ホストさん',
        characterName: '探偵',
      });
    });
  });

  it('メンバーが1人もいなくても卓自体は返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act
      const detail = await repo.findDetailById(gameSessionId);

      // Assert
      expect(detail?.id).toBe(gameSessionId);
      expect(detail?.members).toEqual([]);
    });
  });

  it('存在しない卓では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findDetailById(MISSING_ID)).toBeNull();
    });
  });
});

describe('updateById', () => {
  it('指定されたカラムだけを更新する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        title: '旧タイトル',
        location: 'オンライン',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.updateById(gameSessionId, {
        title: '新タイトル',
      });

      // Assert
      expect(updated?.title).toBe('新タイトル');
      expect(updated?.location).toBe('オンライン');
    });
  });

  it('maxMembers は max_players カラムへ書き込まれる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.updateById(gameSessionId, { maxMembers: 6 });

      // Assert
      expect(updated?.maxMembers).toBe(6);
    });
  });

  it('scheduledAt を更新できる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        scheduledAt: '2100-01-01',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.updateById(gameSessionId, {
        scheduledAt: '2100-02-02',
      });

      // Assert
      expect(updated?.scheduledAt).toBe('2100-02-02');
    });
  });

  it('存在しない卓では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.updateById(MISSING_ID, { title: 'x' })).toBeNull();
    });
  });
});

describe('deleteById', () => {
  it('卓を削除し、メンバーとプレイメモもカスケード削除される', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      await insertPlayMemo(db, memberId, { body: 'メモ' });
      const repo = createGameSessionRepository(db);

      // Act
      await repo.deleteById(gameSessionId);

      // Assert
      expect(
        await db
          .select()
          .from(gameSessions)
          .where(eq(gameSessions.id, gameSessionId)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(gameSessionMembers)
          .where(eq(gameSessionMembers.gameSessionId, gameSessionId)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(gameSessionPlayMemos)
          .where(eq(gameSessionPlayMemos.memberId, memberId)),
      ).toHaveLength(0);
    });
  });
});

describe('countOtherMembers', () => {
  it('ホスト以外のメンバー数を数える', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const other = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      await insertGameSessionMember(db, gameSessionId, { userId: host.id });
      await insertGameSessionMember(db, gameSessionId, { userId: other.id });
      await insertGameSessionMember(db, gameSessionId, { guestName: 'ゲスト' });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.countOtherMembers(gameSessionId, host.id)).toBe(2);
    });
  });
});

describe('publish / complete / cancel', () => {
  it('publish は未公開の卓だけを公開する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: false,
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect((await repo.publish(gameSessionId))?.isPublished).toBe(true);
      expect(await repo.publish(gameSessionId)).toBeNull();
    });
  });

  it('complete は公開済み・未終端の卓を完了にする', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
      });
      const repo = createGameSessionRepository(db);

      // Act
      const completed = await repo.complete(gameSessionId, new Date());

      // Assert
      expect(completed?.status).toBe(GameSessionStatus.completed);
    });
  });

  it('complete は未公開の卓には効かない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: false,
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.complete(gameSessionId, new Date())).toBeNull();
    });
  });

  it('complete は中止済みの卓には効かない（二重終端の排他）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
        cancelledAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.complete(gameSessionId, new Date())).toBeNull();
    });
  });

  it('cancel は公開済み・未終端の卓を中止にする', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
      });
      const repo = createGameSessionRepository(db);

      // Act
      const cancelled = await repo.cancel(gameSessionId, new Date());

      // Assert
      expect(cancelled?.status).toBe(GameSessionStatus.cancelled);
    });
  });

  it('cancel は完了済みの卓には効かない（二重終端の排他）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
        completedAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.cancel(gameSessionId, new Date())).toBeNull();
    });
  });

  it('cancel は未公開の卓には効かない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: false,
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.cancel(gameSessionId, new Date())).toBeNull();
    });
  });
});

describe('createWithHost', () => {
  it('卓とホストメンバーを1トランザクションで作る', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const repo = createGameSessionRepository(db);

      // Act
      const created = await repo.createWithHost({
        hostUserId: host.id,
        title: '新しい卓',
        description: null,
        scenarioName: null,
        location: null,
        maxMembers: 4,
        scheduledAt: '2100-09-09',
        guestLinkToken: 'token-create',
      });

      // Assert
      expect(created).toMatchObject({
        title: '新しい卓',
        scheduledAt: '2100-09-09',
        maxMembers: 4,
        status: GameSessionStatus.draft,
      });
      expect(
        await db
          .select()
          .from(gameSessionMembers)
          .where(eq(gameSessionMembers.gameSessionId, created.id)),
      ).toHaveLength(1);
    });
  });
});

describe('メンバー操作', () => {
  it('findMembersByGameSessionId は参加順に返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホスト' });
      const gameSessionId = await insertGameSession(db, host.id);
      const first = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      const second = await insertGameSessionMember(db, gameSessionId, {
        guestName: 'あとから',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const members = await repo.findMembersByGameSessionId(gameSessionId);

      // Assert
      expect(members.map((m) => m.id)).toEqual([first, second]);
      expect(members[0]?.userName).toBe('ホスト');
    });
  });

  it('findMemberByUserId は参加していれば member id を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const member = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: member.id,
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findMemberByUserId(gameSessionId, member.id)).toBe(
        memberId,
      );
      expect(await repo.findMemberByUserId(gameSessionId, host.id)).toBeNull();
    });
  });

  it('addMember はキャラクター名つきで参加者を追加する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const joiner = await insertUser(db, { name: '参加者' });
      const gameSessionId = await insertGameSession(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act
      const added = await repo.addMember(gameSessionId, joiner.id, {
        characterName: '医師',
      });

      // Assert
      expect(added).toMatchObject({
        userId: joiner.id,
        userName: '参加者',
        characterName: '医師',
      });
    });
  });

  it('addMember は同じユーザーの二重参加で null を返す（partial unique index）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const joiner = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      await insertGameSessionMember(db, gameSessionId, { userId: joiner.id });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.addMember(gameSessionId, joiner.id, {})).toBeNull();
    });
  });

  it('addGuestMember は同名のゲストを何人でも追加できる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act
      const first = await repo.addGuestMember(gameSessionId, {
        guestName: '同じ名前',
      });
      const second = await repo.addGuestMember(gameSessionId, {
        guestName: '同じ名前',
      });

      // Assert
      expect(first.id).not.toBe(second.id);
      expect(second).toMatchObject({ userId: null, characterName: null });
    });
  });

  it('findMemberOwner はメンバーの所属と本人を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findMemberOwner(memberId)).toEqual({
        gameSessionId,
        userId: host.id,
      });
      expect(await repo.findMemberOwner(MISSING_ID)).toBeNull();
    });
  });

  it('updateMemberById はキャラクター名を更新する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホスト' });
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
        characterName: '旧キャラ',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.updateMemberById(memberId, {
        characterName: '新キャラ',
      });

      // Assert
      expect(updated).toMatchObject({
        characterName: '新キャラ',
        userName: 'ホスト',
      });
    });
  });

  it('updateMemberById はゲストメンバーでもユーザー名を引かずに返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        guestName: 'ゲスト',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.updateMemberById(memberId, {
        characterName: '看護師',
      });

      // Assert
      expect(updated).toMatchObject({
        userId: null,
        userName: null,
        guestName: 'ゲスト',
        characterName: '看護師',
      });
    });
  });

  it('deleteMemberById はメンバーとプレイメモを削除する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      await insertPlayMemo(db, memberId, { body: 'メモ' });
      const repo = createGameSessionRepository(db);

      // Act
      await repo.deleteMemberById(memberId);

      // Assert
      expect(await repo.findMemberOwner(memberId)).toBeNull();
      expect(await repo.findPlayMemoByMemberId(memberId)).toBeNull();
    });
  });
});

describe('ゲストリンク', () => {
  it('findGuestLinkInfo はホストとトークンを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        guestLinkToken: 'gs-token-1',
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findGuestLinkInfo(gameSessionId)).toEqual({
        hostUserId: host.id,
        token: 'gs-token-1',
      });
      expect(await repo.findGuestLinkInfo(MISSING_ID)).toBeNull();
    });
  });

  it('findGuestLinkToken はトークンだけを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        guestLinkToken: 'gs-token-2',
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findGuestLinkToken(gameSessionId)).toBe('gs-token-2');
      expect(await repo.findGuestLinkToken(MISSING_ID)).toBeNull();
    });
  });

  it('findByGuestLinkToken はトークンから卓を引ける', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id, {
        guestLinkToken: 'gs-token-3',
        title: 'トークンで引く卓',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const found = await repo.findByGuestLinkToken('gs-token-3');

      // Assert
      expect(found).toMatchObject({
        id: gameSessionId,
        title: 'トークンで引く卓',
      });
      expect(await repo.findByGuestLinkToken('unknown-token')).toBeNull();
    });
  });
});

describe('プレイメモ', () => {
  it('findPlayMemoByMemberId はメモが無ければ null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(await repo.findPlayMemoByMemberId(memberId)).toBeNull();
    });
  });

  it('upsertPlayMemo は初回作成し、2回目は本文を上書きする', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      const repo = createGameSessionRepository(db);

      // Act
      const first = await repo.upsertPlayMemo(memberId, '1回目');
      const second = await repo.upsertPlayMemo(memberId, '2回目');

      // Assert
      expect(first.body).toBe('1回目');
      expect(second.body).toBe('2回目');
      expect(
        await db
          .select()
          .from(gameSessionPlayMemos)
          .where(eq(gameSessionPlayMemos.memberId, memberId)),
      ).toHaveLength(1);
    });
  });

  it('upsertPlayMemo は公開状態（shared_at）を巻き戻さない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      await insertPlayMemo(db, memberId, {
        body: '公開済み',
        sharedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.upsertPlayMemo(memberId, '本文だけ変更');

      // Assert
      expect(updated.body).toBe('本文だけ変更');
      expect(updated.sharedAt).not.toBeNull();
    });
  });

  it('updatePlayMemoVisibility は公開・非公開を切り替える', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      await insertPlayMemo(db, memberId, { body: '本文' });
      const repo = createGameSessionRepository(db);

      // Act
      const shared = await repo.updatePlayMemoVisibility(memberId, new Date());
      const unshared = await repo.updatePlayMemoVisibility(memberId, null);

      // Assert
      expect(shared?.sharedAt).not.toBeNull();
      expect(shared?.body).toBe('本文');
      expect(unshared?.sharedAt).toBeNull();
    });
  });

  it('updatePlayMemoVisibility はメモ未作成なら null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const memberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      const repo = createGameSessionRepository(db);

      // Act & Assert
      expect(
        await repo.updatePlayMemoVisibility(memberId, new Date()),
      ).toBeNull();
    });
  });

  it('findSharedPlayMemos は同じ卓の公開済みメモだけを公開順に返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const otherSessionId = await insertGameSession(db, host.id);

      const laterMemberId = await insertGameSessionMember(db, gameSessionId, {
        userId: host.id,
      });
      const earlierMemberId = await insertGameSessionMember(db, gameSessionId, {
        guestName: 'ゲスト',
      });
      const privateMemberId = await insertGameSessionMember(db, gameSessionId, {
        guestName: '非公開の人',
      });
      const otherMemberId = await insertGameSessionMember(db, otherSessionId, {
        guestName: 'よその人',
      });

      await insertPlayMemo(db, laterMemberId, {
        body: 'あとで公開',
        sharedAt: new Date('2025-02-01T00:00:00.000Z'),
      });
      await insertPlayMemo(db, earlierMemberId, {
        body: 'さきに公開',
        sharedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
      await insertPlayMemo(db, privateMemberId, { body: '非公開' });
      await insertPlayMemo(db, otherMemberId, {
        body: 'よその卓',
        sharedAt: new Date('2025-01-15T00:00:00.000Z'),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const memos = await repo.findSharedPlayMemos(gameSessionId);

      // Assert
      expect(memos.map((memo) => memo.body)).toEqual([
        'さきに公開',
        'あとで公開',
      ]);
    });
  });
});

describe('executeWithLock', () => {
  it('コールバックにトランザクション版のリポジトリを渡し、戻り値をそのまま返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act
      const result = await repo.executeWithLock(
        gameSessionId,
        async (locked) => {
          const hostUserId = await locked.findHostUserId(gameSessionId);
          await locked.deleteById(gameSessionId);
          return hostUserId;
        },
      );

      // Assert
      expect(result).toBe(host.id);
      expect(await repo.gameSessionExists(gameSessionId)).toBe(false);
    });
  });

  it('コールバックが例外を投げるとトランザクションごとロールバックされる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const gameSessionId = await insertGameSession(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act
      const act = repo.executeWithLock(gameSessionId, async (locked) => {
        await locked.deleteById(gameSessionId);
        throw new Error('途中で失敗');
      });

      // Assert
      await expect(act).rejects.toThrow('途中で失敗');
      expect(await repo.gameSessionExists(gameSessionId)).toBe(true);
    });
  });
});
