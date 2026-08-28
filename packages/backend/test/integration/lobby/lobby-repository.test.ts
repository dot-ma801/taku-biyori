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
  lobbyAnswers,
  lobbyCandidates,
  lobbyMembers,
} from '@/system/infrastructure/database/lobby-schema';
import { closeTestDatabase, withRollback } from '@test/helpers/test-database';
import {
  insertAnswer,
  insertCandidateDate,
  insertLobby,
  insertLobbyMember,
  insertUser,
} from '@test/helpers/fixtures';

afterAll(closeTestDatabase);

describe('findByUserId', () => {
  it('ホストの募集枠を role: host・参加者数つきで返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { title: 'ホストの卓' });
      await insertLobbyMember(db, lobbyId, { userId: host.id });
      await insertLobbyMember(db, lobbyId, { guestName: 'ゲスト' });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(host.id);

      // Assert
      const target = rows.find((row) => row.id === lobbyId);
      expect(target).toMatchObject({
        title: 'ホストの卓',
        role: 'host',
        memberCount: 2,
      });
    });
  });

  it('参加している他人の募集枠を role: member で返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const member = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyMember(db, lobbyId, { userId: member.id });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(member.id);

      // Assert
      expect(rows.find((row) => row.id === lobbyId)?.role).toBe('member');
    });
  });

  it('未参加でも公開・募集中の募集枠は role: null で含まれる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        isPublished: true,
        openUntil: null,
      });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(stranger.id);

      // Assert
      expect(rows.find((row) => row.id === lobbyId)?.role).toBeNull();
    });
  });

  it('未公開・未参加の募集枠は含まれない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const stranger = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { isPublished: false });
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
        isPublished: true,
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
        isPublished: true,
        openUntil: '2000-01-01',
      });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(host.id);

      // Assert
      expect(rows.find((row) => row.id === lobbyId)?.role).toBe('host');
    });
  });

  it('ファクトからステータスを導出して返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const cancelledId = await insertLobby(db, host.id, {
        isPublished: true,
        cancelledAt: new Date(),
      });
      const draftId = await insertLobby(db, host.id, { isPublished: false });
      const repo = createLobbyRepository(db);

      // Act
      const rows = await repo.findByUserId(host.id);

      // Assert
      expect(rows.find((row) => row.id === cancelledId)?.status).toBe(
        LobbyStatus.cancelled,
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
      const lobbyId = await insertLobby(db, host.id, { isPublished: true });
      const repo = createLobbyRepository(db);

      // Act
      const status = await repo.findLobbyStatus(lobbyId);

      // Assert
      expect(status).toBe(LobbyStatus.open);
    });
  });

  it('期限切れなら scheduling を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        isPublished: true,
        openUntil: '2000-01-01',
      });
      const repo = createLobbyRepository(db);

      // Act
      const status = await repo.findLobbyStatus(lobbyId);

      // Assert
      expect(status).toBe(LobbyStatus.scheduling);
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

  it('findStatusFields は date 型の open_until を Date に変換して返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        isPublished: true,
        openUntil: '2100-06-01',
      });
      const repo = createLobbyRepository(db);

      // Act
      const fields = await repo.findStatusFields(lobbyId);

      // Assert
      expect(fields?.openUntil).toBeInstanceOf(Date);
      expect(fields?.openUntil?.toISOString().slice(0, 10)).toBe('2100-06-01');
    });
  });
});

describe('findDetailById', () => {
  it('募集枠とメンバー一覧を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホストさん' });
      const lobbyId = await insertLobby(db, host.id, { title: '詳細テスト' });
      await insertLobbyMember(db, lobbyId, { userId: host.id });
      await insertLobbyMember(db, lobbyId, { guestName: 'ゲストさん' });
      const repo = createLobbyRepository(db);

      // Act
      const detail = await repo.findDetailById(lobbyId);

      // Assert
      expect(detail?.title).toBe('詳細テスト');
      expect(detail?.members).toHaveLength(2);
      expect(detail?.members.map((m) => m.userName)).toContain('ホストさん');
      expect(detail?.members.map((m) => m.guestName)).toContain('ゲストさん');
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
      expect(detail?.members).toEqual([]);
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
  it('募集枠を削除し、メンバー・候補日・回答もカスケード削除される', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyMember(db, lobbyId, {
        userId: host.id,
      });
      const candidateId = await insertCandidateDate(db, lobbyId, '2100-01-01');
      await insertAnswer(db, candidateId, memberId, 'ok');
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
          .from(lobbyMembers)
          .where(eq(lobbyMembers.lobbyId, lobbyId)),
      ).toHaveLength(0);
      expect(
        await db
          .select()
          .from(lobbyAnswers)
          .where(eq(lobbyAnswers.candidateId, candidateId)),
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
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyMember(db, lobbyId, { userId: host.id });
      await insertLobbyMember(db, lobbyId, { userId: other.id });
      await insertLobbyMember(db, lobbyId, { guestName: 'ゲスト' });
      const repo = createLobbyRepository(db);

      // Act
      const count = await repo.countOtherMembers(lobbyId, host.id);

      // Assert
      expect(count).toBe(2);
    });
  });

  it('ホストしかいなければ 0 を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyMember(db, lobbyId, { userId: host.id });
      const repo = createLobbyRepository(db);

      // Act
      const count = await repo.countOtherMembers(lobbyId, host.id);

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
      const lobbyId = await insertLobby(db, host.id, { isPublished: false });
      const repo = createLobbyRepository(db);

      // Act
      const published = await repo.publish(lobbyId);

      // Assert
      expect(published?.isPublished).toBe(true);
      expect(published?.status).toBe(LobbyStatus.open);
    });
  });

  it('既に公開済みなら null を返す（二重公開の排他）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { isPublished: true });
      const repo = createLobbyRepository(db);

      // Act
      const published = await repo.publish(lobbyId);

      // Assert
      expect(published).toBeNull();
    });
  });
});

describe('cancel', () => {
  it('cancelled_at をセットして中止にする', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { isPublished: true });
      const repo = createLobbyRepository(db);

      // Act
      const cancelled = await repo.cancel(lobbyId);

      // Assert
      expect(cancelled?.status).toBe(LobbyStatus.cancelled);
      expect(cancelled?.cancelledAt).not.toBeNull();
    });
  });

  it('中止済みを再度中止しても null を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, {
        isPublished: true,
        cancelledAt: new Date(),
      });
      const repo = createLobbyRepository(db);

      // Act
      const cancelled = await repo.cancel(lobbyId);

      // Assert
      expect(cancelled).toBeNull();
    });
  });
});

describe('createWithHostAndCandidates', () => {
  it('募集枠・ホストメンバー・候補日を1トランザクションで作る', async () => {
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
          { date: '2100-01-01', dateNote: '13:00〜' },
          { date: '2100-01-02', dateNote: null },
        ],
      });

      // Assert
      expect(created.title).toBe('新しい募集');
      expect(created.status).toBe(LobbyStatus.draft);
      expect(
        await db
          .select()
          .from(lobbyMembers)
          .where(eq(lobbyMembers.lobbyId, created.id)),
      ).toHaveLength(1);
      expect(
        await db
          .select()
          .from(lobbyCandidates)
          .where(eq(lobbyCandidates.lobbyId, created.id)),
      ).toHaveLength(2);
    });
  });

  it('候補日が空でもホストメンバーだけ作られる', async () => {
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
          .from(lobbyCandidates)
          .where(eq(lobbyCandidates.lobbyId, created.id)),
      ).toHaveLength(0);
    });
  });
});

describe('findLobbyVisibility', () => {
  it('公開フラグとホストを返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id, { isPublished: true });
      const repo = createLobbyRepository(db);

      // Act
      const visibility = await repo.findLobbyVisibility(lobbyId);

      // Assert
      expect(visibility).toEqual({ isPublished: true, hostUserId: host.id });
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

describe('メンバー操作', () => {
  it('findMembersByLobbyId は参加順に返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db, { name: 'ホスト' });
      const lobbyId = await insertLobby(db, host.id);
      const first = await insertLobbyMember(db, lobbyId, { userId: host.id });
      const second = await insertLobbyMember(db, lobbyId, {
        guestName: 'あとから',
      });
      const repo = createLobbyRepository(db);

      // Act
      const members = await repo.findMembersByLobbyId(lobbyId);

      // Assert
      expect(members.map((m) => m.id)).toEqual([first, second]);
      expect(members[0]?.userName).toBe('ホスト');
      expect(members[1]?.guestName).toBe('あとから');
    });
  });

  it('findMembersByLobbyId はメンバーがいなければ空配列を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const members = await repo.findMembersByLobbyId(lobbyId);

      // Assert
      expect(members).toEqual([]);
    });
  });

  it('findMemberByUserId は参加していれば member id を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const member = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyMember(db, lobbyId, {
        userId: member.id,
      });
      const repo = createLobbyRepository(db);

      // Act & Assert
      expect(await repo.findMemberByUserId(lobbyId, member.id)).toBe(memberId);
      expect(await repo.findMemberByUserId(lobbyId, host.id)).toBeNull();
    });
  });

  it('addMember は参加者を追加してユーザー名つきで返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const joiner = await insertUser(db, { name: '参加者' });
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const added = await repo.addMember(lobbyId, joiner.id, {});

      // Assert
      expect(added).toMatchObject({
        userId: joiner.id,
        userName: '参加者',
        guestName: null,
      });
    });
  });

  it('addMember は同じユーザーの二重参加で null を返す（partial unique index）', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const joiner = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      await insertLobbyMember(db, lobbyId, { userId: joiner.id });
      const repo = createLobbyRepository(db);

      // Act
      const added = await repo.addMember(lobbyId, joiner.id, {});

      // Assert
      expect(added).toBeNull();
    });
  });

  it('addGuestMember は同名のゲストを何人でも追加できる', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const first = await repo.addGuestMember(lobbyId, {
        guestName: '同じ名前',
      });
      const second = await repo.addGuestMember(lobbyId, {
        guestName: '同じ名前',
      });

      // Assert
      expect(first.id).not.toBe(second.id);
      expect(second).toMatchObject({ userId: null, guestName: '同じ名前' });
    });
  });

  it('findMemberOwner はメンバーの所属と本人を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyMember(db, lobbyId, {
        userId: host.id,
      });
      const repo = createLobbyRepository(db);

      // Act
      const owner = await repo.findMemberOwner(memberId);

      // Assert
      expect(owner).toEqual({ lobbyId, userId: host.id });
    });
  });

  it('deleteMemberById はメンバーを削除し、回答もカスケード削除される', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyMember(db, lobbyId, {
        userId: host.id,
      });
      const candidateId = await insertCandidateDate(db, lobbyId, '2100-01-01');
      await insertAnswer(db, candidateId, memberId, 'ok');
      const repo = createLobbyRepository(db);

      // Act
      await repo.deleteMemberById(memberId);

      // Assert
      expect(await repo.findMemberOwner(memberId)).toBeNull();
      expect(
        await db
          .select()
          .from(lobbyAnswers)
          .where(eq(lobbyAnswers.memberId, memberId)),
      ).toHaveLength(0);
    });
  });

  it('isGuestMember はゲストのときだけ true を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const guestId = await insertLobbyMember(db, lobbyId, {
        guestName: 'ゲスト',
      });
      const userMemberId = await insertLobbyMember(db, lobbyId, {
        userId: host.id,
      });
      const repo = createLobbyRepository(db);

      // Act & Assert
      expect(await repo.isGuestMember(lobbyId, guestId)).toBe(true);
      expect(await repo.isGuestMember(lobbyId, userMemberId)).toBe(false);
    });
  });

  it('isGuestMember は別の募集枠のメンバーには false を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const otherLobbyId = await insertLobby(db, host.id);
      const guestId = await insertLobbyMember(db, otherLobbyId, {
        guestName: 'よそのゲスト',
      });
      const repo = createLobbyRepository(db);

      // Act & Assert
      expect(await repo.isGuestMember(lobbyId, guestId)).toBe(false);
    });
  });
});

describe('候補日と回答', () => {
  it('findByLobbyId は候補日を日付順に、回答をぶら下げて返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyMember(db, lobbyId, {
        userId: host.id,
      });
      const later = await insertCandidateDate(db, lobbyId, '2100-02-01');
      const earlier = await insertCandidateDate(
        db,
        lobbyId,
        '2100-01-01',
        '13:00〜',
      );
      await insertAnswer(db, earlier, memberId, 'ok', 'いけます');
      const repo = createLobbyRepository(db);

      // Act
      const dates = await repo.findByLobbyId(lobbyId);

      // Assert
      expect(dates.map((d) => d.id)).toEqual([earlier, later]);
      expect(dates[0]).toMatchObject({
        date: '2100-01-01',
        dateNote: '13:00〜',
      });
      expect(dates[0]?.answers).toEqual([
        {
          id: expect.any(String),
          memberId,
          answer: 'ok',
          comment: 'いけます',
        },
      ]);
      expect(dates[1]?.answers).toEqual([]);
    });
  });

  it('findByLobbyId は候補日が無ければ空配列を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const repo = createLobbyRepository(db);

      // Act
      const dates = await repo.findByLobbyId(lobbyId);

      // Assert
      expect(dates).toEqual([]);
    });
  });

  it('findCandidateOwner は所属募集枠と日付を返す', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const candidateId = await insertCandidateDate(db, lobbyId, '2100-04-04');
      const repo = createLobbyRepository(db);

      // Act
      const owner = await repo.findCandidateOwner(candidateId);

      // Assert
      expect(owner).toEqual({ lobbyId, date: '2100-04-04' });
    });
  });

  it('upsertAnswer は初回は挿入し、2回目は上書きする', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyMember(db, lobbyId, {
        userId: host.id,
      });
      const candidateId = await insertCandidateDate(db, lobbyId, '2100-06-06');
      const repo = createLobbyRepository(db);

      // Act
      const first = await repo.upsertAnswer(candidateId, memberId, {
        answer: 'maybe',
        comment: 'たぶん',
      });
      const second = await repo.upsertAnswer(candidateId, memberId, {
        answer: 'ok',
      });

      // Assert
      expect(first.answer).toBe('maybe');
      expect(second.id).toBe(first.id);
      expect(second.answer).toBe('ok');
      expect(second.comment).toBeNull();
      expect(
        await db
          .select()
          .from(lobbyAnswers)
          .where(eq(lobbyAnswers.candidateId, candidateId)),
      ).toHaveLength(1);
    });
  });
});

describe('applyDateChanges', () => {
  it('追加・削除・ひとこと更新を1トランザクションで適用する', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const keep = await insertCandidateDate(db, lobbyId, '2100-01-01', '旧');
      const remove = await insertCandidateDate(db, lobbyId, '2100-01-02');
      const repo = createLobbyRepository(db);

      // Act
      await repo.applyDateChanges(lobbyId, {
        datesToAdd: [{ date: '2100-01-03', dateNote: '新規' }],
        dateIdsToRemove: [remove],
        notesToUpdate: [{ id: keep, dateNote: '新' }],
      });

      // Assert
      const dates = await repo.findByLobbyId(lobbyId);
      expect(dates.map((d) => d.date)).toEqual(['2100-01-01', '2100-01-03']);
      expect(dates[0]?.dateNote).toBe('新');
    });
  });

  it('残る候補日の行 ID は変わらないので回答が保持される', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const memberId = await insertLobbyMember(db, lobbyId, {
        userId: host.id,
      });
      const keep = await insertCandidateDate(db, lobbyId, '2100-01-01', '旧');
      await insertAnswer(db, keep, memberId, 'ok');
      const repo = createLobbyRepository(db);

      // Act
      await repo.applyDateChanges(lobbyId, {
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: keep, dateNote: 'ひとことだけ変更' }],
      });

      // Assert
      const dates = await repo.findByLobbyId(lobbyId);
      expect(dates[0]?.id).toBe(keep);
      expect(dates[0]?.answers).toHaveLength(1);
    });
  });

  it('他の募集枠の候補日は削除対象に含まれていても消さない', async () => {
    await withRollback(async (db) => {
      // Arrange
      const host = await insertUser(db);
      const lobbyId = await insertLobby(db, host.id);
      const otherLobbyId = await insertLobby(db, host.id);
      const otherCandidate = await insertCandidateDate(
        db,
        otherLobbyId,
        '2100-01-01',
      );
      const repo = createLobbyRepository(db);

      // Act
      await repo.applyDateChanges(lobbyId, {
        datesToAdd: [],
        dateIdsToRemove: [otherCandidate],
        notesToUpdate: [],
      });

      // Assert
      expect(await repo.findCandidateOwner(otherCandidate)).not.toBeNull();
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
