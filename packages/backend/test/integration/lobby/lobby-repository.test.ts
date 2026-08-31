/**
 * 募集枠リポジトリの実 DB テスト。
 *
 * 以前は drizzle のメソッドチェーンを `vi.fn()` でモックし、生成された SQL 文字列を
 * assert していた。それでは「クエリが実際に正しい結果を返すか」を検証できないため、
 * `TEST_DATABASE_URL` が指す実データベースに対して実行する形へ移行した。
 * 各テストはトランザクションで包まれ、終了時にロールバックされる。
 */
import { afterAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { LobbyStatus } from '@taku-biyori/shared';
import { createLobbyRepository } from '@/lobby/infrastructure/lobby-repository';
import type { DeleteLobbyRepository } from '@/lobby/application/delete-lobby';
import {
  lobbies,
  lobbyEntries,
  schedulePolls,
  candidateDates,
  scheduleAnswers,
} from '@/system/infrastructure/database/lobby-schema';
import { closeTestDatabase, withRollback } from '@test/helpers/test-database';
import {
  insertCandidateDate,
  insertGameSession,
  insertLobby,
  insertLobbyEntry,
  insertSchedulePoll,
  insertScheduleAnswer,
  insertUser,
} from '@test/helpers/fixtures';

afterAll(closeTestDatabase);

/** 文字列としての昇順比較（uuid の DB 上の並びと同じ基準で比べる） */
const sortStringsAsc = (values: string[]): string[] =>
  [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

describe('findByUserId', () => {
  it('ホストのロビーを hostUserId・参加者つきで返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { title: 'ホストの卓' });
      await insertLobbyEntry(db, lobbyId, { userId: host.id });
      await insertLobbyEntry(db, lobbyId, { guestName: 'ゲスト' });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(host.id);

      // Assert
      const target = rows.find((row) => row.id === lobbyId);
      expect(target).toMatchObject({
        title: 'ホストの卓',
        hostUserId: host.id,
      });
      expect(target?.entries).toHaveLength(2);
    });
  });

  it('参加している他人のロビーを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const member = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyEntry(db, lobbyId, { userId: member.id });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(member.id);

      // Assert
      const row = rows.find((r) => r.id === lobbyId);
      expect(row?.hostUserId).toBe(host.id);
      expect(row?.entries.map((e) => e.userId)).toContain(member.id);
    });
  });

  it('未参加でも公開・受付中のロビーは含まれる（探索用）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        openUntil: null,
      });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(stranger.id);

      // Assert
      const row = rows.find((r) => r.id === lobbyId);
      expect(row).toBeDefined();
      expect(row?.entries.some((e) => e.userId === stranger.id)).toBe(false);
    });
  });

  it('未公開・未参加の募集枠は含まれない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { publishedAt: null });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(stranger.id);

      // Assert
      expect(rows.find((row) => row.id === lobbyId)).toBeUndefined();
    });
  });

  it('締め切りを過ぎた公開募集枠は未参加ユーザーには含まれない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        openUntil: '2000-01-01',
      });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(stranger.id);

      // Assert
      expect(rows.find((row) => row.id === lobbyId)).toBeUndefined();
    });
  });

  it('締め切りを過ぎていてもホスト自身の募集枠は含まれる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        openUntil: '2000-01-01',
      });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(host.id);

      // Assert
      expect(rows.find((row) => row.id === lobbyId)?.hostUserId).toBe(host.id);
    });
  });

  it('ファクトからステータスを導出して返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const disbandedId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        disbandedAt: new Date(),
      });
      const draftId = await insertLobby(db, host.id, { publishedAt: null });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(host.id);

      // Assert
      expect(rows.find((row) => row.id === disbandedId)?.status).toBe(
        LobbyStatus.disbanded,
      );
      expect(rows.find((row) => row.id === draftId)?.status).toBe(
        LobbyStatus.draft,
      );
    });
  });
});

describe('findHostUserId', () => {
  it('ホストの userId を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const result = await repo.findHostUserId(lobbyId);

      // Assert
      expect(result).toBe(host.id);
    });
  });

  it('存在しない募集枠では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createLobbyRepository(db);

      // Act
      const result = await repo.findHostUserId(
        '00000000-0000-0000-0000-000000000000',
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});

describe('findLobbyStatus / findStatusFields', () => {
  it('公開済み・期限なしなら open を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const status = await repo.findLobbyStatus(lobbyId);

      // Assert
      expect(status).toBe(LobbyStatus.open);
    });
  });

  it('締め切り日を過ぎていれば closed を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        openUntil: '2000-01-01',
      });
      const repo = createLobbyRepository(db);

      // Act
      const status = await repo.findLobbyStatus(lobbyId);

      // Assert
      expect(status).toBe(LobbyStatus.closed);
    });
  });

  it('存在しない募集枠では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createLobbyRepository(db);

      // Act
      const status = await repo.findLobbyStatus(
        '00000000-0000-0000-0000-000000000000',
      );

      // Assert
      expect(status).toBeNull();
    });
  });

  it('findStatusFields は date 型の open_until を YYYY-MM-DD の文字列で返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        openUntil: '2100-06-01',
      });
      const repo = createLobbyRepository(db);

      // Act
      const fields = await repo.findStatusFields(lobbyId);

      // Assert
      expect(fields?.openUntil).toBe('2100-06-01');
    });
  });
});

describe('findDetailById', () => {
  it('募集枠とメンバー一覧を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホストさん' });
      const lobbyId = await insertLobby(db, host.id, { title: '詳細テスト' });
      await insertLobbyEntry(db, lobbyId, { userId: host.id });
      await insertLobbyEntry(db, lobbyId, { guestName: 'ゲストさん' });
      const repo = createLobbyRepository(db);

      // Act
      const detail = await repo.findDetailById(lobbyId);

      // Assert
      expect(detail?.title).toBe('詳細テスト');
      expect(detail?.entries).toHaveLength(2);
      expect(detail?.entries.map((e) => e.userName)).toContain('ホストさん');
      expect(detail?.entries.map((e) => e.guestName)).toContain('ゲストさん');
    });
  });

  it('メンバーが1人もいなくても募集枠自体は返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const detail = await repo.findDetailById(lobbyId);

      // Assert
      expect(detail?.id).toBe(lobbyId);
      expect(detail?.entries).toEqual([]);
      expect(detail?.schedulePolls).toEqual([]);
    });
  });

  it('日程調整の履歴を created_at 降順で含める', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const older = await insertSchedulePoll(db, lobbyId, {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const newer = await insertSchedulePoll(db, lobbyId, {
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      });
      const repo = createLobbyRepository(db);

      // Act
      const detail = await repo.findDetailById(lobbyId);

      // Assert
      expect(detail?.schedulePolls.map((p) => p.id)).toEqual([newer, older]);
    });
  });

  it('存在しない募集枠では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createLobbyRepository(db);

      // Act
      const detail = await repo.findDetailById(
        '00000000-0000-0000-0000-000000000000',
      );

      // Assert
      expect(detail).toBeNull();
    });
  });
});

describe('updateById', () => {
  it('指定されたカラムだけを更新する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        title: '旧タイトル',
        location: 'オンライン',
      });
      const repo = createLobbyRepository(db);

      // Act
      const updated = await repo.updateById(lobbyId, { title: '新タイトル' });

      // Assert
      expect(updated?.title).toBe('新タイトル');
      expect(updated?.location).toBe('オンライン');
    });
  });

  it('null を渡した項目は null で保存される', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        location: 'オンライン',
      });
      const repo = createLobbyRepository(db);

      // Act
      const updated = await repo.updateById(lobbyId, { location: null });

      // Assert
      expect(updated?.location).toBeNull();
    });
  });

  it('存在しない募集枠では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createLobbyRepository(db);

      // Act
      const updated = await repo.updateById(
        '00000000-0000-0000-0000-000000000000',
        { title: 'x' },
      );

      // Assert
      expect(updated).toBeNull();
    });
  });
});

describe('deleteById', () => {
  it('募集枠を削除し、メンバー・日程調整・候補日・回答もカスケード削除される', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const pollId = await insertSchedulePoll(db, lobbyId);
      const candidateId = await insertCandidateDate(db, pollId, '2100-01-01');
      await insertScheduleAnswer(db, candidateId, memberId, 'ok');
      const repo = createLobbyRepository(db);

      // Act
      await repo.deleteById(lobbyId);

      // Assert
      expect(
        await db.select().from(lobbies).where(eq(lobbies.id, lobbyId)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(lobbyEntries)
          .where(eq(lobbyEntries.lobbyId, lobbyId)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(schedulePolls)
          .where(eq(schedulePolls.lobbyId, lobbyId)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(scheduleAnswers)
          .where(eq(scheduleAnswers.candidateDateId, candidateId)),
      ).toHaveLength(0);
    });
  });
});

describe('countOtherEntries', () => {
  it('ホスト以外のメンバー数を数える', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const other = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyEntry(db, lobbyId, { userId: host.id });
      await insertLobbyEntry(db, lobbyId, { userId: other.id });
      await insertLobbyEntry(db, lobbyId, { guestName: 'ゲスト' });
      const repo = createLobbyRepository(db);

      // Act
      const count = await repo.countOtherEntries(lobbyId, host.id);

      // Assert
      expect(count).toBe(2);
    });
  });

  it('ホストしかいなければ 0 を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const repo = createLobbyRepository(db);

      // Act
      const count = await repo.countOtherEntries(lobbyId, host.id);

      // Assert
      expect(count).toBe(0);
    });
  });
});

describe('countGameSessions', () => {
  it('中止・完了も含めてぶら下がっている開催を数える', async () => {
    await withRollback(async (db) => {
      // Arrange
      // lobby_id が ON DELETE CASCADE なので、開催が残っているロビーは消させない
      // （design-v2 §6-13-3）。「終わった開催なら消してよい」ではない
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertGameSession(db, lobbyId);
      await insertGameSession(db, lobbyId, { completedAt: new Date() });
      await insertGameSession(db, lobbyId, { cancelledAt: new Date() });
      const repo = createLobbyRepository(db);

      // Act
      const count = await repo.countGameSessions(lobbyId);

      // Assert
      expect(count).toBe(3);
    });
  });

  it('他のロビーの開催は数えない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const otherLobbyId = await insertLobby(db, host.id);
      await insertGameSession(db, otherLobbyId);
      const repo = createLobbyRepository(db);

      // Act
      const count = await repo.countGameSessions(lobbyId);

      // Assert
      expect(count).toBe(0);
    });
  });
});

describe('publish', () => {
  it('未公開の募集枠を公開する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { publishedAt: null });
      const repo = createLobbyRepository(db);

      // Act
      const published = await repo.publish(lobbyId);

      // Assert
      expect(published?.publishedAt).not.toBeNull();
      expect(published?.status).toBe(LobbyStatus.open);
    });
  });

  it('既に公開済みなら null を返す（二重公開の排他）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const published = await repo.publish(lobbyId);

      // Assert
      expect(published).toBeNull();
    });
  });
});

describe('closeReception / reopenReception', () => {
  it('closeReception は reception_closed_at をセットして受付終了にする', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const closed = await repo.closeReception(lobbyId);

      // Assert
      expect(closed?.status).toBe(LobbyStatus.closed);
      expect(closed?.receptionClosedAt).not.toBeNull();
    });
  });

  it('closeReception は受付終了済みなら null を返す（二重クローズの排他）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        receptionClosedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const closed = await repo.closeReception(lobbyId);

      // Assert
      expect(closed).toBeNull();
    });
  });

  it('reopenReception は reception_closed_at を消して受付中に戻す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        receptionClosedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const reopened = await repo.reopenReception(lobbyId);

      // Assert
      expect(reopened?.receptionClosedAt).toBeNull();
      expect(reopened?.status).toBe(LobbyStatus.open);
    });
  });

  // CASE 式は実 DB でしか検証できない（モックの単体テストでは式の誤りを検出できない）
  it('reopenReception は過去日の open_until を NULL に戻す', async () => {
    await withRollback(async (db) => {
      // Arrange — 締め切り日が過ぎたまま再開すると closed のままになってしまう
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        openUntil: '2020-01-01',
        receptionClosedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const reopened = await repo.reopenReception(lobbyId);

      // Assert
      expect(reopened?.openUntil).toBeNull();
      expect(reopened?.status).toBe(LobbyStatus.open);
    });
  });

  it('reopenReception は未来日の open_until を保持する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        openUntil: '2099-12-31',
        receptionClosedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const reopened = await repo.reopenReception(lobbyId);

      // Assert
      expect(reopened?.openUntil).toBe('2099-12-31');
      expect(reopened?.status).toBe(LobbyStatus.open);
    });
  });
});

describe('disband', () => {
  it('disbanded_at をセットして解散にする', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const disbanded = await repo.disband(lobbyId);

      // Assert
      expect(disbanded?.status).toBe(LobbyStatus.disbanded);
      expect(disbanded?.disbandedAt).not.toBeNull();
    });
  });

  it('解散済みを再度解散しても null を返す（二重解散の排他）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
        disbandedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const disbanded = await repo.disband(lobbyId);

      // Assert
      expect(disbanded).toBeNull();
    });
  });
});

describe('createWithHostAndCandidates', () => {
  it('候補日が1件以上のとき募集枠・ホストメンバー・日程調整・候補日を1トランザクションで作る', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const repo = createLobbyRepository(db);

      // Act
      const created = await repo.createWithHostAndCandidates({
        hostUserId: host.id,
        title: '新しい募集',
        maxPlayers: 4,
        guestLinkToken: 'token-create',
        candidateDates: [
          { date: '2100-01-01', timeLabel: '13:00〜' },
          { date: '2100-01-02', timeLabel: null },
        ],
      });

      // Assert
      expect(created.title).toBe('新しい募集');
      expect(created.status).toBe(LobbyStatus.draft);
      expect(
        await db
          .select()
          .from(lobbyEntries)
          .where(eq(lobbyEntries.lobbyId, created.id)),
      ).toHaveLength(1);

      const pollRows = await db
        .select()
        .from(schedulePolls)
        .where(eq(schedulePolls.lobbyId, created.id));
      expect(pollRows).toHaveLength(1);

      expect(
        await db
          .select()
          .from(candidateDates)
          .where(eq(candidateDates.pollId, pollRows[0]!.id)),
      ).toHaveLength(2);
    });
  });

  it('候補日が空のときホストメンバーだけ作られ schedule_polls は0行のまま', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const repo = createLobbyRepository(db);

      // Act
      const created = await repo.createWithHostAndCandidates({
        hostUserId: host.id,
        title: '候補日なし',
        guestLinkToken: 'token-empty',
        candidateDates: [],
      });

      // Assert
      expect(
        await db
          .select()
          .from(schedulePolls)
          .where(eq(schedulePolls.lobbyId, created.id)),
      ).toHaveLength(0);
    });
  });
});

describe('findLobbyVisibility', () => {
  it('公開日時とホストを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const visibility = await repo.findLobbyVisibility(lobbyId);

      // Assert
      expect(visibility?.hostUserId).toBe(host.id);
      expect(visibility?.publishedAt).toBeInstanceOf(Date);
    });
  });

  it('存在しない募集枠では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createLobbyRepository(db);

      // Act
      const visibility = await repo.findLobbyVisibility(
        '00000000-0000-0000-0000-000000000000',
      );

      // Assert
      expect(visibility).toBeNull();
    });
  });
});

describe('エントリー操作', () => {
  it('findEntriesByLobbyId は参加順に返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホスト' });
      const lobbyId = await insertLobby(db, host.id);
      const first = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const second = await insertLobbyEntry(db, lobbyId, {
        guestName: 'あとから',
      });
      const repo = createLobbyRepository(db);

      // Act
      const entries = await repo.findEntriesByLobbyId(lobbyId);

      // Assert
      expect(entries.map((e) => e.id)).toEqual([first, second]);
      expect(entries[0]?.userName).toBe('ホスト');
      expect(entries[1]?.guestName).toBe('あとから');
    });
  });

  it('findEntriesByLobbyId はメンバーがいなければ空配列を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const entries = await repo.findEntriesByLobbyId(lobbyId);

      // Assert
      expect(entries).toEqual([]);
    });
  });

  it('findActiveEntryByUserId は参加していれば entry id を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const member = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyEntry(db, lobbyId, {
        userId: member.id,
      });
      const repo = createLobbyRepository(db);

      // Act & Assert
      expect(await repo.findActiveEntryByUserId(lobbyId, member.id)).toBe(
        memberId,
      );
      expect(await repo.findActiveEntryByUserId(lobbyId, host.id)).toBeNull();
    });
  });

  it('addEntry は参加者を追加してユーザー名つきで返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const joiner = await insertUser(db, { name: '参加者' });
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const added = await repo.addEntry(lobbyId, joiner.id, {});

      // Assert
      expect(added).toMatchObject({
        userId: joiner.id,
        userName: '参加者',
        guestName: null,
      });
    });
  });

  it('addEntry は同じユーザーの二重参加で null を返す（partial unique index）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const joiner = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyEntry(db, lobbyId, { userId: joiner.id });
      const repo = createLobbyRepository(db);

      // Act
      const added = await repo.addEntry(lobbyId, joiner.id, {});

      // Assert
      expect(added).toBeNull();
    });
  });

  it('addGuestEntry は同名のゲストを何人でも追加できる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const first = await repo.addGuestEntry(lobbyId, {
        guestName: '同じ名前',
      });
      const second = await repo.addGuestEntry(lobbyId, {
        guestName: '同じ名前',
      });

      // Assert
      expect(first.id).not.toBe(second.id);
      expect(second).toMatchObject({ userId: null, guestName: '同じ名前' });
    });
  });

  it('findEntryOwner は参加の所属・本人・脱退日時を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const repo = createLobbyRepository(db);

      // Act
      const owner = await repo.findEntryOwner(memberId);

      // Assert
      expect(owner).toEqual({ lobbyId, userId: host.id, leftAt: null });
    });
  });

  it('markEntryLeft は行を消さず left_at をセットし、過去の回答も残る', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const pollId = await insertSchedulePoll(db, lobbyId);
      const candidateId = await insertCandidateDate(db, pollId, '2100-01-01');
      await insertScheduleAnswer(db, candidateId, entryId, 'ok');
      const repo = createLobbyRepository(db);

      // Act
      await repo.markEntryLeft(entryId);

      // Assert
      const owner = await repo.findEntryOwner(entryId);
      expect(owner?.leftAt).toBeInstanceOf(Date);
      expect(
        await db
          .select()
          .from(scheduleAnswers)
          .where(eq(scheduleAnswers.lobbyEntryId, entryId)),
      ).toHaveLength(1);
    });
  });

  it('rejoinEntry は left_at を NULL に戻し、過去の回答が繋がったまま復帰する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const member = await insertUser(db, { name: '戻ってきた人' });
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, {
        userId: member.id,
      });
      const pollId = await insertSchedulePoll(db, lobbyId);
      const candidateId = await insertCandidateDate(db, pollId, '2100-01-01');
      await insertScheduleAnswer(db, candidateId, entryId, 'ok');
      const repo = createLobbyRepository(db);
      await repo.markEntryLeft(entryId);

      // Act
      const rejoined = await repo.rejoinEntry(entryId);

      // Assert — 同じ行が復帰するので、回答の紐付け先も変わらない
      expect(rejoined?.id).toBe(entryId);
      expect(rejoined?.leftAt).toBeNull();
      expect(rejoined?.userName).toBe('戻ってきた人');
      expect(
        await db
          .select()
          .from(scheduleAnswers)
          .where(eq(scheduleAnswers.lobbyEntryId, entryId)),
      ).toHaveLength(1);
    });
  });

  it('rejoinEntry は在籍中の行には何もしない（null を返す）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const entryId = await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const repo = createLobbyRepository(db);

      // Act
      const rejoined = await repo.rejoinEntry(entryId);

      // Assert
      expect(rejoined).toBeNull();
    });
  });

  it('脱退済みの参加も findEntriesByLobbyId には含まれる（参加者一覧は全件）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const leftId = await insertLobbyEntry(db, lobbyId, {
        guestName: '脱退した人',
        leftAt: new Date('2026-08-10T00:00:00.000Z'),
      });
      const repo = createLobbyRepository(db);

      // Act
      const entries = await repo.findEntriesByLobbyId(lobbyId);

      // Assert
      expect(entries).toHaveLength(2);
      expect(entries.find((e) => e.id === leftId)?.leftAt).not.toBeNull();
    });
  });

  it('isGuestEntry はゲストのときだけ true を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const guestId = await insertLobbyEntry(db, lobbyId, {
        guestName: 'ゲスト',
      });
      const userMemberId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const repo = createLobbyRepository(db);

      // Act & Assert
      expect(await repo.isGuestEntry(lobbyId, guestId)).toBe(true);
      expect(await repo.isGuestEntry(lobbyId, userMemberId)).toBe(false);
    });
  });

  it('isGuestEntry は別の募集枠のメンバーには false を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const otherLobbyId = await insertLobby(db, host.id);
      const guestId = await insertLobbyEntry(db, otherLobbyId, {
        guestName: 'よそのゲスト',
      });
      const repo = createLobbyRepository(db);

      // Act & Assert
      expect(await repo.isGuestEntry(lobbyId, guestId)).toBe(false);
    });
  });
});

describe('findSchedulePollSummaries', () => {
  it('created_at DESC, id DESC で返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const older = await insertSchedulePoll(db, lobbyId, {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const newer = await insertSchedulePoll(db, lobbyId, {
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      });
      const repo = createLobbyRepository(db);

      // Act
      const summaries = await repo.findSchedulePollSummaries(lobbyId);

      // Assert
      expect(summaries.map((s) => s.id)).toEqual([newer, older]);
      expect(summaries[0]?.createdAt).toBe('2026-02-01T00:00:00.000Z');
    });
  });

  it('同一 created_at でも id DESC で決定的な順序になる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sameTimestamp = new Date('2026-03-01T00:00:00.000Z');
      const pollA = await insertSchedulePoll(db, lobbyId, {
        createdAt: sameTimestamp,
      });
      const pollB = await insertSchedulePoll(db, lobbyId, {
        createdAt: sameTimestamp,
      });
      const [expectedFirst, expectedSecond] = sortStringsAsc([
        pollA,
        pollB,
      ]).reverse();
      const repo = createLobbyRepository(db);

      // Act
      const summaries = await repo.findSchedulePollSummaries(lobbyId);

      // Assert
      expect(summaries.map((s) => s.id)).toEqual([
        expectedFirst,
        expectedSecond,
      ]);
    });
  });

  it('調整が無ければ空配列を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const summaries = await repo.findSchedulePollSummaries(lobbyId);

      // Assert
      expect(summaries).toEqual([]);
    });
  });
});

describe('findLatestSchedulePollId', () => {
  it('最新（created_at 降順の先頭）の調整 id を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertSchedulePoll(db, lobbyId, {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const newer = await insertSchedulePoll(db, lobbyId, {
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      });
      const repo = createLobbyRepository(db);

      // Act
      const latest = await repo.findLatestSchedulePollId(lobbyId);

      // Assert
      expect(latest).toBe(newer);
    });
  });

  it('同一 created_at でも id DESC の先頭を決定的に返す', async () => {
    await withRollback(async (db) => {
      // Arrange — created_at が完全に同値の2件を用意し、タイブレークが id 頼みであることを確認する
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const sameTimestamp = new Date('2026-03-01T00:00:00.000Z');
      const pollA = await insertSchedulePoll(db, lobbyId, {
        createdAt: sameTimestamp,
      });
      const pollB = await insertSchedulePoll(db, lobbyId, {
        createdAt: sameTimestamp,
      });
      const [expected] = sortStringsAsc([pollA, pollB]).reverse();
      const repo = createLobbyRepository(db);

      // Act
      const latest = await repo.findLatestSchedulePollId(lobbyId);

      // Assert
      expect(latest).toBe(expected);
    });
  });

  it('調整が無ければ null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const latest = await repo.findLatestSchedulePollId(lobbyId);

      // Assert
      expect(latest).toBeNull();
    });
  });
});

describe('findSchedulePollLobbyId', () => {
  it('poll が属するロビー id を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const pollId = await insertSchedulePoll(db, lobbyId);
      const repo = createLobbyRepository(db);

      // Act
      const result = await repo.findSchedulePollLobbyId(pollId);

      // Assert
      expect(result).toBe(lobbyId);
    });
  });

  it('存在しない調整では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createLobbyRepository(db);

      // Act
      const result = await repo.findSchedulePollLobbyId(
        '00000000-0000-0000-0000-000000000000',
      );

      // Assert
      expect(result).toBeNull();
    });
  });
});

describe('候補日の一意制約', () => {
  it('同じ調整に同じ日付を2件入れると unique 制約違反になる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const pollId = await insertSchedulePoll(db, lobbyId);
      await insertCandidateDate(db, pollId, '2100-01-01');

      // Act
      const act = insertCandidateDate(db, pollId, '2100-01-01');

      // Assert
      await expect(act).rejects.toThrow();
    });
  });

  it('別の調整には同じ日付を挙げ直せる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const firstPollId = await insertSchedulePoll(db, lobbyId);
      const secondPollId = await insertSchedulePoll(db, lobbyId);
      await insertCandidateDate(db, firstPollId, '2100-01-01');

      // Act
      const act = insertCandidateDate(db, secondPollId, '2100-01-01');

      // Assert
      await expect(act).resolves.toEqual(expect.any(String));
    });
  });
});

describe('findCandidateDatesByPollId', () => {
  it('date 昇順で返す（回答は含まない）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const pollId = await insertSchedulePoll(db, lobbyId);
      const later = await insertCandidateDate(db, pollId, '2100-02-01');
      const earlier = await insertCandidateDate(
        db,
        pollId,
        '2100-01-01',
        '13:00〜',
      );
      const repo = createLobbyRepository(db);

      // Act
      const dates = await repo.findCandidateDatesByPollId(pollId);

      // Assert
      expect(dates.map((d) => d.id)).toEqual([earlier, later]);
      expect(dates[0]).toMatchObject({
        date: '2100-01-01',
        timeLabel: '13:00〜',
      });
    });
  });

  it('候補日が無ければ空配列を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const pollId = await insertSchedulePoll(db, lobbyId);
      const repo = createLobbyRepository(db);

      // Act
      const dates = await repo.findCandidateDatesByPollId(pollId);

      // Assert
      expect(dates).toEqual([]);
    });
  });
});

describe('findCandidateDateIdsByPollId', () => {
  it('その調整の候補日 id をすべて返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const pollId = await insertSchedulePoll(db, lobbyId);
      const first = await insertCandidateDate(db, pollId, '2100-01-01');
      const second = await insertCandidateDate(db, pollId, '2100-01-02');
      const repo = createLobbyRepository(db);

      // Act
      const ids = await repo.findCandidateDateIdsByPollId(pollId);

      // Assert
      expect(sortStringsAsc(ids)).toEqual(sortStringsAsc([first, second]));
    });
  });
});

describe('findSchedulePollWithAnswers', () => {
  it('候補日を日付順に、回答をぶら下げて返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const pollId = await insertSchedulePoll(db, lobbyId);
      const later = await insertCandidateDate(db, pollId, '2100-02-01');
      const earlier = await insertCandidateDate(
        db,
        pollId,
        '2100-01-01',
        '13:00〜',
      );
      await insertScheduleAnswer(db, earlier, memberId, 'ok', 'いけます');
      const repo = createLobbyRepository(db);

      // Act
      const poll = await repo.findSchedulePollWithAnswers(pollId);

      // Assert
      expect(poll?.lobbyId).toBe(lobbyId);
      expect(poll?.candidateDates.map((d) => d.id)).toEqual([earlier, later]);
      expect(poll?.candidateDates[0]).toMatchObject({
        date: '2100-01-01',
        timeLabel: '13:00〜',
      });
      expect(poll?.candidateDates[0]?.answers).toEqual([
        {
          id: expect.any(String),
          entryId: memberId,
          answer: 'ok',
          comment: 'いけます',
        },
      ]);
      expect(poll?.candidateDates[1]?.answers).toEqual([]);
    });
  });

  it('脱退した参加者の回答も含める（過去の記録は消さない）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const activeId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const leftId = await insertLobbyEntry(db, lobbyId, {
        guestName: '脱退した人',
        leftAt: new Date('2026-08-10T00:00:00.000Z'),
      });
      const pollId = await insertSchedulePoll(db, lobbyId);
      const candidateId = await insertCandidateDate(db, pollId, '2100-01-01');
      await insertScheduleAnswer(db, candidateId, activeId, 'ok');
      await insertScheduleAnswer(db, candidateId, leftId, 'ng');
      const repo = createLobbyRepository(db);

      // Act
      const poll = await repo.findSchedulePollWithAnswers(pollId);

      // Assert — findByLobbyId（旧・回答表）と異なり、脱退者の回答も表に残す
      expect(
        poll?.candidateDates[0]?.answers.map((a) => a.entryId).sort(),
      ).toEqual([activeId, leftId].sort());
    });
  });

  it('候補日が無ければ空配列を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const pollId = await insertSchedulePoll(db, lobbyId);
      const repo = createLobbyRepository(db);

      // Act
      const poll = await repo.findSchedulePollWithAnswers(pollId);

      // Assert
      expect(poll?.candidateDates).toEqual([]);
    });
  });

  it('存在しない調整では null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const repo = createLobbyRepository(db);

      // Act
      const poll = await repo.findSchedulePollWithAnswers(
        '00000000-0000-0000-0000-000000000000',
      );

      // Assert
      expect(poll).toBeNull();
    });
  });
});

describe('createSchedulePollWithDates', () => {
  it('新規の調整を1件作り、候補日ぶんの answers は空配列で date 昇順に返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const poll = await repo.createSchedulePollWithDates(lobbyId, [
        { date: '2100-02-01', timeLabel: null },
        { date: '2100-01-01', timeLabel: '13:00〜' },
      ]);

      // Assert
      expect(poll.lobbyId).toBe(lobbyId);
      expect(poll.candidateDates.map((d) => d.date)).toEqual([
        '2100-01-01',
        '2100-02-01',
      ]);
      expect(poll.candidateDates.every((d) => d.answers.length === 0)).toBe(
        true,
      );
      expect(
        await db
          .select()
          .from(schedulePolls)
          .where(eq(schedulePolls.id, poll.id)),
      ).toHaveLength(1);
    });
  });
});

describe('applyCandidateDateChanges', () => {
  it('追加・削除・時間帯更新を1トランザクションで適用する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const pollId = await insertSchedulePoll(db, lobbyId);
      const keep = await insertCandidateDate(db, pollId, '2100-01-01', '旧');
      const remove = await insertCandidateDate(db, pollId, '2100-01-02');
      const repo = createLobbyRepository(db);

      // Act
      await repo.applyCandidateDateChanges(pollId, {
        datesToAdd: [{ date: '2100-01-03', timeLabel: '新規' }],
        dateIdsToRemove: [remove],
        timeLabelsToUpdate: [{ id: keep, timeLabel: '新' }],
      });

      // Assert
      const dates = await repo.findCandidateDatesByPollId(pollId);
      expect(dates.map((d) => d.date)).toEqual(['2100-01-01', '2100-01-03']);
      expect(dates[0]?.timeLabel).toBe('新');
    });
  });

  it('残る候補日の行 id は変わらないので回答が保持される', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const pollId = await insertSchedulePoll(db, lobbyId);
      const keep = await insertCandidateDate(db, pollId, '2100-01-01', '旧');
      await insertScheduleAnswer(db, keep, memberId, 'ok');
      const repo = createLobbyRepository(db);

      // Act
      await repo.applyCandidateDateChanges(pollId, {
        datesToAdd: [],
        dateIdsToRemove: [],
        timeLabelsToUpdate: [{ id: keep, timeLabel: '時間帯だけ変更' }],
      });

      // Assert
      const dates = await repo.findCandidateDatesByPollId(pollId);
      expect(dates[0]?.id).toBe(keep);
      expect(
        await db
          .select()
          .from(scheduleAnswers)
          .where(eq(scheduleAnswers.candidateDateId, keep)),
      ).toHaveLength(1);
    });
  });

  it('他の調整の候補日は削除対象に含まれていても消さない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const pollId = await insertSchedulePoll(db, lobbyId);
      const otherPollId = await insertSchedulePoll(db, lobbyId);
      const otherCandidate = await insertCandidateDate(
        db,
        otherPollId,
        '2100-01-01',
      );
      const repo = createLobbyRepository(db);

      // Act
      await repo.applyCandidateDateChanges(pollId, {
        datesToAdd: [],
        dateIdsToRemove: [otherCandidate],
        timeLabelsToUpdate: [],
      });

      // Assert
      expect(await repo.findCandidateDatesByPollId(otherPollId)).toHaveLength(
        1,
      );
    });
  });
});

describe('upsertScheduleAnswers', () => {
  it('初回は挿入し、2回目は同じ id を上書きする', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const pollId = await insertSchedulePoll(db, lobbyId);
      const candidateId = await insertCandidateDate(db, pollId, '2100-06-06');
      const repo = createLobbyRepository(db);

      // Act
      const first = await repo.upsertScheduleAnswers(memberId, [
        { candidateDateId: candidateId, answer: 'maybe', comment: 'たぶん' },
      ]);
      const second = await repo.upsertScheduleAnswers(memberId, [
        { candidateDateId: candidateId, answer: 'ok' },
      ]);

      // Assert
      expect(first[0]?.answer).toBe('maybe');
      expect(second[0]?.id).toBe(first[0]?.id);
      expect(second[0]?.answer).toBe('ok');
      expect(second[0]?.comment).toBeNull();
      expect(
        await db
          .select()
          .from(scheduleAnswers)
          .where(eq(scheduleAnswers.candidateDateId, candidateId)),
      ).toHaveLength(1);
    });
  });

  it('items と同じ順で entryId つきの回答を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyEntry(db, lobbyId, {
        userId: host.id,
      });
      const pollId = await insertSchedulePoll(db, lobbyId);
      const first = await insertCandidateDate(db, pollId, '2100-01-01');
      const second = await insertCandidateDate(db, pollId, '2100-01-02');
      const repo = createLobbyRepository(db);

      // Act
      const answers = await repo.upsertScheduleAnswers(memberId, [
        { candidateDateId: second, answer: 'ng' },
        { candidateDateId: first, answer: 'ok' },
      ]);

      // Assert
      expect(answers.map((a) => a.entryId)).toEqual([memberId, memberId]);
      expect(
        answers.map((a) => [a.answer, a.comment ?? null] as const),
      ).toEqual([
        ['ng', null],
        ['ok', null],
      ]);
    });
  });
});

describe('ゲストリンク', () => {
  it('findGuestLinkInfo はホストとトークンを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        guestLinkToken: 'guest-token-1',
      });
      const repo = createLobbyRepository(db);

      // Act
      const info = await repo.findGuestLinkInfo(lobbyId);

      // Assert
      expect(info).toEqual({ hostUserId: host.id, token: 'guest-token-1' });
    });
  });

  it('findGuestLinkToken はトークンだけを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        guestLinkToken: 'guest-token-2',
      });
      const repo = createLobbyRepository(db);

      // Act & Assert
      expect(await repo.findGuestLinkToken(lobbyId)).toBe('guest-token-2');
      expect(
        await repo.findGuestLinkToken('00000000-0000-0000-0000-000000000000'),
      ).toBeNull();
    });
  });
});

describe('executeWithLock', () => {
  it('コールバックにトランザクション版のリポジトリを渡し、戻り値をそのまま返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { title: 'ロック対象' });
      const repo = createLobbyRepository(db);

      // Act
      // 複数の narrower interface（Update/Delete/BulkUpdate/Confirm）が
      // それぞれ異なる callback 引数型で executeWithLock を宣言しているため、
      // 交差型の LobbyRepository では最初の宣言（UpdateLobbyRepository）が
      // 採用され locked の推論型に deleteById が現れない。実体は
      // createLobbyRepository が返すフル機能のリポジトリなので、ここでは
      // DeleteLobbyRepository として明示的にキャストする。
      const result = await repo.executeWithLock(lobbyId, async (locked) => {
        const hostUserId = await locked.findHostUserId(lobbyId);
        await (locked as unknown as DeleteLobbyRepository).deleteById(lobbyId);
        return hostUserId;
      });

      // Assert
      expect(result).toBe(host.id);
      expect(await repo.findHostUserId(lobbyId)).toBeNull();
    });
  });

  it('コールバックが例外を投げるとトランザクションごとロールバックされる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const act = repo.executeWithLock(lobbyId, async (locked) => {
        await (locked as unknown as DeleteLobbyRepository).deleteById(lobbyId);
        throw new Error('途中で失敗');
      });

      // Assert
      await expect(act).rejects.toThrow('途中で失敗');
      expect(await repo.findHostUserId(lobbyId)).toBe(host.id);
    });
  });
});
