/**
 * セッションのリポジトリを実 DB に対して検証する。
 *
 * 生成 SQL の文字列を突き合わせるのではなく、実際に行を入れて読み書きの結果を見る。
 * 全クエリを書き換える移行では、モックした SQL 文字列の一致は何も保証しないため
 * （移行計画 §1-3）。
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createGameSessionRepository } from '@/game-session/infrastructure/game-session-repository';
import { seats } from '@/system/infrastructure/database/game-session-schema';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import { dateFromToday } from '@/system/domain/date-from-today';
import { getTestDatabase, withRollback } from '@test/helpers/test-database';
import {
  insertGameSession,
  insertLobby,
  insertLobbyEntry,
  insertPlayMemo,
  insertSeat,
  insertUser,
} from '@test/helpers/fixtures';

beforeAll(() => {
  getTestDatabase();
});

describe('findDetailById', () => {
  it('上書きの生値とロビーの既定値を両方返す（解決済みの値は返さない）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        title: 'ロビーの題名',
        scenarioName: 'ロビーのシナリオ',
        location: 'オンライン',
        publishedAt: new Date(),
      });
      // location だけ上書きし、他は未設定にしておく
      const sessionId = await insertGameSession(db, lobbyId, {
        location: 'カフェ〇〇',
        scheduledAt: dateFromToday(3),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const detail = await repo.findDetailById(sessionId);

      // Assert
      expect(detail?.overrides).toEqual({
        title: null,
        scenarioName: null,
        location: 'カフェ〇〇',
        timeLabel: null,
      });
      expect(detail?.lobby.title).toBe('ロビーの題名');
      expect(detail?.lobby.scenarioName).toBe('ロビーのシナリオ');
      expect(detail?.lobby.location).toBe('オンライン');
      // 解決済みの表示値はレスポンスに現れない（design-v2 §5-5）
      expect(detail).not.toHaveProperty('title');
    });
  });

  it('着席者を seatedAt 昇順で返し、表示名を LobbyEntry から解決する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホスト' });
      const player = await insertUser(db, { name: 'プレイヤー' });
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const hostEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const playerEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: player.id,
      });
      const guestEntryId = await insertLobbyEntry(db, lobbyId, {
        guestName: 'みなと',
      });
      const sessionId = await insertGameSession(db, lobbyId);
      await insertSeat(db, sessionId, hostEntryId);
      await insertSeat(db, sessionId, playerEntryId, {
        characterName: '探索者A',
      });
      await insertSeat(db, sessionId, guestEntryId);
      const repo = createGameSessionRepository(db);

      // Act
      const detail = await repo.findDetailById(sessionId);

      // Assert
      expect(detail?.seats).toHaveLength(3);
      expect(detail?.seats.map((s) => s.userName)).toEqual([
        'ホスト',
        'プレイヤー',
        null,
      ]);
      expect(detail?.seats[2]?.guestName).toBe('みなと');
      expect(detail?.seats[1]?.characterName).toBe('探索者A');
      expect(detail?.seats[0]?.entryId).toBe(hostEntryId);
    });
  });

  it('着席が1件も無くてもセッション自体は返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sessionId = await insertGameSession(db, lobbyId);
      const repo = createGameSessionRepository(db);

      // Act
      const detail = await repo.findDetailById(sessionId);

      // Assert
      expect(detail?.seats).toEqual([]);
    });
  });

  it('存在しないセッションでは null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createGameSessionRepository(db);

      // Act
      const detail = await repo.findDetailById(
        '00000000-0000-4000-8000-000000000000',
      );

      // Assert
      expect(detail).toBeNull();
    });
  });

  it('ロビーを改名すると、上書きしていないセッションの既定値も追随する', async () => {
    await withRollback(async (db) => {
      // Arrange
      // 既定値を DB にコピーしていないことの確認（design-v2 §5-5）
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { title: '改名前' });
      const sessionId = await insertGameSession(db, lobbyId);
      const repo = createGameSessionRepository(db);

      // Act
      await db
        .update(
          (await import('@/system/infrastructure/database/lobby-schema'))
            .lobbies,
        )
        .set({ title: '改名後' })
        .where(
          eq(
            (await import('@/system/infrastructure/database/lobby-schema'))
              .lobbies.id,
            lobbyId,
          ),
        );
      const detail = await repo.findDetailById(sessionId);

      // Assert
      expect(detail?.lobby.title).toBe('改名後');
      expect(detail?.overrides.title).toBeNull();
    });
  });
});

describe('findByLobbyId', () => {
  it('中止・完了も含めて全件を scheduledAt 昇順で返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const later = await insertGameSession(db, lobbyId, {
        scheduledAt: dateFromToday(10),
      });
      const cancelled = await insertGameSession(db, lobbyId, {
        scheduledAt: dateFromToday(5),
        cancelledAt: new Date(),
      });
      const completed = await insertGameSession(db, lobbyId, {
        scheduledAt: dateFromToday(-5),
        completedAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const list = await repo.findByLobbyId(lobbyId);

      // Assert
      expect(list.map((item) => item.id)).toEqual([
        completed,
        cancelled,
        later,
      ]);
      expect(list.map((item) => item.status)).toEqual([
        GameSessionStatus.completed,
        GameSessionStatus.cancelled,
        GameSessionStatus.scheduled,
      ]);
    });
  });

  it('一覧では解決済みの表示値と着席の参照だけを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホスト' });
      const lobbyId = await insertLobby(db, host.id, {
        title: 'ロビーの題名',
        scenarioName: 'ロビーのシナリオ',
        publishedAt: new Date(),
      });
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const sessionId = await insertGameSession(db, lobbyId, {
        timeLabel: '19:00〜',
      });
      const seatId = await insertSeat(db, sessionId, entryId, {
        characterName: '探索者A',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const list = await repo.findByLobbyId(lobbyId);

      // Assert
      const item = list[0];
      expect(item?.title).toBe('ロビーの題名');
      expect(item?.scenarioName).toBe('ロビーのシナリオ');
      expect(item?.timeLabel).toBe('19:00〜');
      expect(item?.hostUserId).toBe(host.id);
      // SeatRef は id と userId だけ。表示名・キャラ名は載せない（design-v2 §6-11）
      expect(item?.seats).toEqual([{ id: seatId, userId: host.id }]);
    });
  });

  it('開催が0件なら空配列を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act
      const list = await repo.findByLobbyId(lobbyId);

      // Assert
      expect(list).toEqual([]);
    });
  });
});

describe('findByUserId', () => {
  it('自分がホストのロビーの開催を返す（完了・中止も含む）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const completed = await insertGameSession(db, lobbyId, {
        completedAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const list = await repo.findByUserId(host.id);

      // Assert
      expect(list.map((item) => item.id)).toContain(completed);
    });
  });

  it('自分が着席している他人の開催を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const player = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const entryId = await insertLobbyEntry(db, lobbyId, {
        userId: player.id,
      });
      const sessionId = await insertGameSession(db, lobbyId);
      await insertSeat(db, sessionId, entryId);
      const repo = createGameSessionRepository(db);

      // Act
      const list = await repo.findByUserId(player.id);

      // Assert
      expect(list.map((item) => item.id)).toContain(sessionId);
    });
  });

  it('下書きロビーの他人の開催は含まれない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { publishedAt: null });
      const sessionId = await insertGameSession(db, lobbyId);
      const repo = createGameSessionRepository(db);

      // Act
      const list = await repo.findByUserId(stranger.id);

      // Assert
      expect(list.map((item) => item.id)).not.toContain(sessionId);
    });
  });

  it('公開ロビーでも終わった他人の開催は含まれない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const completed = await insertGameSession(db, lobbyId, {
        completedAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const list = await repo.findByUserId(stranger.id);

      // Assert
      expect(list.map((item) => item.id)).not.toContain(completed);
    });
  });
});

describe('findHostUserId / findLobbyId / findStatusFields', () => {
  it('ホストはロビーから引く（セッションに host_user_id は無い）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sessionId = await insertGameSession(db, lobbyId);
      const repo = createGameSessionRepository(db);

      // Act
      const result = await repo.findHostUserId(sessionId);

      // Assert
      expect(result).toBe(host.id);
    });
  });

  it('findLobbyId は所属ロビーを返す（URL の :lobbyId 検証に使う）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sessionId = await insertGameSession(db, lobbyId);
      const repo = createGameSessionRepository(db);

      // Act
      const result = await repo.findLobbyId(sessionId);

      // Assert
      expect(result).toBe(lobbyId);
    });
  });

  it('findStatusFields は date 型の scheduled_at を YYYY-MM-DD の文字列で返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sessionId = await insertGameSession(db, lobbyId, {
        scheduledAt: '2026-09-01',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const facts = await repo.findStatusFields(sessionId);

      // Assert
      expect(facts).toEqual({
        scheduledAt: '2026-09-01',
        completedAt: null,
        cancelledAt: null,
      });
    });
  });

  it('存在しないセッションでは null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createGameSessionRepository(db);
      const missing = '00000000-0000-4000-8000-000000000000';

      // Act / Assert
      expect(await repo.findHostUserId(missing)).toBeNull();
      expect(await repo.findLobbyId(missing)).toBeNull();
      expect(await repo.findStatusFields(missing)).toBeNull();
    });
  });
});

describe('findLobbyForViewing', () => {
  it('ロビーのファクトから導出したステータスを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const draftId = await insertLobby(db, host.id, { publishedAt: null });
      const openId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const disbandedId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        disbandedAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act / Assert
      expect((await repo.findLobbyForViewing(draftId))?.status).toBe(
        LobbyStatus.draft,
      );
      expect((await repo.findLobbyForViewing(openId))?.status).toBe(
        LobbyStatus.open,
      );
      expect((await repo.findLobbyForViewing(disbandedId))?.status).toBe(
        LobbyStatus.disbanded,
      );
    });
  });
});

describe('createGameSession', () => {
  it('セッションと着席をまとめて作る', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const player = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const hostEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const playerEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: player.id,
      });
      const repo = createGameSessionRepository(db);

      // Act
      const created = await repo.createGameSession({
        lobbyId,
        scheduledAt: '2026-09-01',
        entryIds: [hostEntryId, playerEntryId],
        description: '19:00 集合',
      });

      // Assert
      expect(created.lobbyId).toBe(lobbyId);
      expect(created.scheduledAt).toBe('2026-09-01');
      expect(created.description).toBe('19:00 集合');
      const rows = await db
        .select({ id: seats.id })
        .from(seats)
        .where(eq(seats.gameSessionId, created.id));
      expect(rows).toHaveLength(2);
    });
  });

  it('上書きを渡さなければ overrides はすべて null になる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { title: 'ロビーの題名' });
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const repo = createGameSessionRepository(db);

      // Act
      const created = await repo.createGameSession({
        lobbyId,
        scheduledAt: '2026-09-01',
        entryIds: [entryId],
      });

      // Assert
      // 既定値を DB にコピーしないのが v2 の要点（design-v2 §5-5）
      expect(created.overrides).toEqual({
        title: null,
        scenarioName: null,
        location: null,
        timeLabel: null,
      });
      expect(created.lobby.title).toBe('ロビーの題名');
    });
  });

  it('同じロビーに複数の開催を作れる（二重確定の排除は不要になった）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const repo = createGameSessionRepository(db);

      // Act
      const first = await repo.createGameSession({
        lobbyId,
        scheduledAt: '2026-09-01',
        entryIds: [entryId],
      });
      const second = await repo.createGameSession({
        lobbyId,
        scheduledAt: '2026-09-08',
        entryIds: [entryId],
      });

      // Assert
      expect(first.id).not.toBe(second.id);
      expect(await repo.findByLobbyId(lobbyId)).toHaveLength(2);
    });
  });
});

describe('findActiveEntryIds', () => {
  it('そのロビーの在籍中の entry だけを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const otherLobbyId = await insertLobby(db, host.id);
      const activeId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const leftId = await insertLobbyEntry(db, lobbyId, {
        guestName: '脱退した人',
        leftAt: new Date(),
      });
      const otherLobbyEntryId = await insertLobbyEntry(db, otherLobbyId, {
        guestName: '別ロビーの人',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const result = await repo.findActiveEntryIds(lobbyId, [
        activeId,
        leftId,
        otherLobbyEntryId,
      ]);

      // Assert
      // 脱退済みと別ロビーの entry は落ちる。呼び出し側が件数差で 422 を判定する
      expect(result).toEqual([activeId]);
    });
  });

  it('空配列を渡したら空配列を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createGameSessionRepository(db);

      // Act / Assert
      expect(await repo.findActiveEntryIds(lobbyId, [])).toEqual([]);
    });
  });
});

describe('updateById', () => {
  it('null を渡すと上書きを解除し、キーを省略すると変更しない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { title: 'ロビーの題名' });
      const sessionId = await insertGameSession(db, lobbyId, {
        title: 'この回だけの題名',
        location: 'カフェ〇〇',
      });
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.updateById(sessionId, { title: null });

      // Assert
      expect(updated?.overrides.title).toBeNull();
      // キーを省略した location は据え置き
      expect(updated?.overrides.location).toBe('カフェ〇〇');
    });
  });

  it('存在しないセッションでは null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.updateById(
        '00000000-0000-4000-8000-000000000000',
        { title: 'x' },
      );

      // Assert
      expect(updated).toBeNull();
    });
  });
});

describe('complete / cancel', () => {
  it('完了すると completedAt が入り status が completed になる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sessionId = await insertGameSession(db, lobbyId);
      const repo = createGameSessionRepository(db);
      const now = new Date('2026-09-01T22:00:00.000Z');

      // Act
      const updated = await repo.complete(sessionId, now);

      // Assert
      expect(updated?.status).toBe(GameSessionStatus.completed);
      expect(updated?.completedAt).toBe(now.toISOString());
    });
  });

  it('すでに完了している行は更新しない（二重完了の排他）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sessionId = await insertGameSession(db, lobbyId, {
        completedAt: new Date('2026-09-01T22:00:00.000Z'),
      });
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.complete(sessionId, new Date());

      // Assert
      expect(updated).toBeNull();
    });
  });

  it('中止済みの行は完了できない（二重終端を防ぐ）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sessionId = await insertGameSession(db, lobbyId, {
        cancelledAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act / Assert
      expect(await repo.complete(sessionId, new Date())).toBeNull();
    });
  });

  it('完了済みの行は中止できない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sessionId = await insertGameSession(db, lobbyId, {
        completedAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act / Assert
      expect(await repo.cancel(sessionId, new Date())).toBeNull();
    });
  });
});

describe('countOtherSeats', () => {
  it('ホスト以外の着席者を数える（ゲストも数える）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const player = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const hostEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const playerEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: player.id,
      });
      const guestEntryId = await insertLobbyEntry(db, lobbyId, {
        guestName: 'みなと',
      });
      const sessionId = await insertGameSession(db, lobbyId);
      await insertSeat(db, sessionId, hostEntryId);
      await insertSeat(db, sessionId, playerEntryId);
      await insertSeat(db, sessionId, guestEntryId);
      const repo = createGameSessionRepository(db);

      // Act
      const count = await repo.countOtherSeats(sessionId, host.id);

      // Assert
      expect(count).toBe(2);
    });
  });

  it('着席者がホストだけなら0を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const hostEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const sessionId = await insertGameSession(db, lobbyId);
      await insertSeat(db, sessionId, hostEntryId);
      const repo = createGameSessionRepository(db);

      // Act / Assert
      expect(await repo.countOtherSeats(sessionId, host.id)).toBe(0);
    });
  });
});

describe('着席', () => {
  it('同じ entry を2回着席させようとすると null を返す（unique 制約）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const sessionId = await insertGameSession(db, lobbyId);
      const repo = createGameSessionRepository(db);

      // Act
      const first = await repo.addSeat(sessionId, entryId);
      const second = await repo.addSeat(sessionId, entryId);

      // Assert
      expect(first).not.toBeNull();
      expect(second).toBeNull();
    });
  });

  it('ゲストの着席も1件しか作れない（v0.2 の条件付き unique が不要になった）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const guestEntryId = await insertLobbyEntry(db, lobbyId, {
        guestName: 'みなと',
      });
      const sessionId = await insertGameSession(db, lobbyId);
      const repo = createGameSessionRepository(db);

      // Act
      await repo.addSeat(sessionId, guestEntryId);
      const second = await repo.addSeat(sessionId, guestEntryId);

      // Assert
      expect(second).toBeNull();
    });
  });

  it('findEntryLobbyId は脱退済みの entry では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const activeId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const leftId = await insertLobbyEntry(db, lobbyId, {
        guestName: '脱退した人',
        leftAt: new Date(),
      });
      const repo = createGameSessionRepository(db);

      // Act / Assert
      expect(await repo.findEntryLobbyId(activeId)).toBe(lobbyId);
      expect(await repo.findEntryLobbyId(leftId)).toBeNull();
    });
  });

  it('キャラクター名を割り当て・解除できる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const sessionId = await insertGameSession(db, lobbyId);
      const seatId = await insertSeat(db, sessionId, entryId);
      const repo = createGameSessionRepository(db);

      // Act
      const assigned = await repo.updateSeatCharacterName(seatId, '探索者A');
      const cleared = await repo.updateSeatCharacterName(seatId, null);

      // Assert
      expect(assigned?.characterName).toBe('探索者A');
      expect(cleared?.characterName).toBeNull();
    });
  });

  it('離席するとプレイメモも cascade で消える', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const sessionId = await insertGameSession(db, lobbyId);
      const seatId = await insertSeat(db, sessionId, entryId);
      await insertPlayMemo(db, seatId, { body: 'メモ' });
      const repo = createGameSessionRepository(db);

      // Act
      await repo.deleteSeatById(seatId);

      // Assert
      expect(await repo.findPlayMemoBySeatId(seatId)).toBeNull();
    });
  });

  it('findSeatByUserId はゲストの席にはヒットしない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const guestEntryId = await insertLobbyEntry(db, lobbyId, {
        guestName: 'みなと',
      });
      const sessionId = await insertGameSession(db, lobbyId);
      await insertSeat(db, sessionId, guestEntryId);
      const repo = createGameSessionRepository(db);

      // Act / Assert
      expect(await repo.findSeatByUserId(sessionId, host.id)).toBeNull();
    });
  });
});

describe('deleteById', () => {
  it('セッションを消すと着席とプレイメモも cascade で消える', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const sessionId = await insertGameSession(db, lobbyId);
      const seatId = await insertSeat(db, sessionId, entryId);
      await insertPlayMemo(db, seatId, { body: 'メモ' });
      const repo = createGameSessionRepository(db);

      // Act
      await repo.deleteById(sessionId);

      // Assert
      expect(await repo.findDetailById(sessionId)).toBeNull();
      const rows = await db
        .select({ id: seats.id })
        .from(seats)
        .where(eq(seats.id, seatId));
      expect(rows).toEqual([]);
    });
  });
});

describe('プレイメモ', () => {
  it('upsert は本文だけを更新し、公開状態を巻き戻さない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const sessionId = await insertGameSession(db, lobbyId);
      const seatId = await insertSeat(db, sessionId, entryId);
      const sharedAt = new Date('2026-08-01T00:00:00.000Z');
      await insertPlayMemo(db, seatId, { body: '最初', sharedAt });
      const repo = createGameSessionRepository(db);

      // Act
      const updated = await repo.upsertPlayMemo(seatId, '書き換えた');

      // Assert
      expect(updated.body).toBe('書き換えた');
      expect(updated.sharedAt).toBe(sharedAt.toISOString());
    });
  });

  it('公開済みのメモだけを sharedAt 昇順で返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const player = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const hostEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const playerEntryId = await insertLobbyEntry(db, lobbyId, {
        userId: player.id,
      });
      const sessionId = await insertGameSession(db, lobbyId);
      const hostSeatId = await insertSeat(db, sessionId, hostEntryId);
      const playerSeatId = await insertSeat(db, sessionId, playerEntryId);
      await insertPlayMemo(db, hostSeatId, {
        body: '後で公開',
        sharedAt: new Date('2026-08-02T00:00:00.000Z'),
      });
      await insertPlayMemo(db, playerSeatId, {
        body: '非公開',
        sharedAt: null,
      });
      const repo = createGameSessionRepository(db);

      // Act
      const memos = await repo.findSharedPlayMemos(sessionId);

      // Assert
      expect(memos.map((memo) => memo.memberId)).toEqual([hostSeatId]);
    });
  });
});
