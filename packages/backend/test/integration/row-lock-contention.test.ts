/**
 * `SELECT ... FOR UPDATE` による TOCTOU 対策が実 DB で本当に効くかを検証する。
 *
 * ユースケース側の単体テストは `executeWithLock` をモックしており、
 * 「ロックのスコープにまとめている」ことしか確認できない。
 * ここでは実際に2本のトランザクションを同時に走らせ、
 * 行ロックが競合を直列化していることを確かめる。
 *
 * このファイルのテストだけは `withRollback` を使えない。
 * 同一トランザクション内では自分が取ったロックと競合しないため、
 * 競合を再現するには別接続・別トランザクションで**コミット**する必要がある。
 * 作成した行は `withCommitted` の後片付けで消す。
 */
import { afterAll, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { deleteLobby } from '@/lobby/application/delete-lobby';
import { bulkUpdateAvailabilityDates } from '@/lobby/application/bulk-update-availability-dates';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import { createLobbyRepository } from '@/lobby/infrastructure/lobby-repository';
import type { DeleteLobbyRepository } from '@/lobby/application/delete-lobby';
import type { BulkUpdateAvailabilityDatesRepository } from '@/lobby/application/bulk-update-availability-dates';
import { createGameSessionRepository } from '@/game-session/infrastructure/game-session-repository';
import { lobbyCandidates } from '@/system/infrastructure/database/lobby-schema';
import { closeTestDatabase, withCommitted } from '@test/helpers/test-database';
import {
  insertGameSession,
  insertGameSessionMember,
  insertLobby,
  insertLobbyEntry,
  insertUser,
} from '@test/helpers/fixtures';

// このファイルのテストだけ、別トランザクションの待ちを挟むため既定の
// testTimeout（5秒）では足りない。DB 不要な test/unit/ には影響させたくないので
// vite.config.ts をグローバルに延ばすのではなく、このファイル単位で延ばす。
// hookTimeout はこのファイルの afterAll（closeTestDatabase が接続を閉じるだけ）が
// 既定値（10秒）で十分収まるため延長しない。
vi.setConfig({ testTimeout: 30_000 });

afterAll(closeTestDatabase);

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

const createDeferred = (): Deferred => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 「ロックのせいで待たされている」ことを判定するための待ち時間。
 *
 * ⚠️ この方式には原理的な限界がある。実際にはロックが効いておらず対象の
 * 操作がただ遅いだけでも、BLOCK_PROBE_MS 以内に settle しなければ
 * 「ブロックされている」と判定してしまう（vacuous pass）。ロックが壊れた
 * ときにテストが検知できず緑のまま通り得る、ということ。ここでは
 * 「実測で安定して 300ms 以内に完了する軽い操作が、ロック保持中だけは
 * 明確に待たされる」ことの確認に留め、後段で `release.resolve()` した後に
 * 対象の Promise が実際に解決することも必ず assert して、
 * 「ロックが原因で待たされていた」こと自体は別途裏付けている。
 */
const BLOCK_PROBE_MS = 300;

describe('delete-lobby の TOCTOU（FOR UPDATE 競合）', () => {
  it('同じ募集枠への並行削除は直列化され、成功するのは1つだけ', async () => {
    await withCommitted(async (db, track) => {
      // Arrange
      const host = await insertUser(db);
      track('user', host.id);
      const lobbyId = await insertLobby(db, host.id);
      track('lobby', lobbyId);
      await insertLobbyEntry(db, lobbyId, { userId: host.id });
      const repo = createLobbyRepository(db);

      // Act
      const results = await Promise.all([
        deleteLobby(repo, lobbyId, host.id),
        deleteLobby(repo, lobbyId, host.id),
      ]);

      // Assert
      expect(results.map((result) => result.type).sort()).toEqual([
        'notFound',
        'ok',
      ]);
      expect(await repo.findHostUserId(lobbyId)).toBeNull();
    });
  });

  it('ロック保持中の参加はブロックされ、削除コミット後は FK 違反で弾かれる', async () => {
    await withCommitted(async (db, track) => {
      // Arrange
      const host = await insertUser(db);
      track('user', host.id);
      const joiner = await insertUser(db);
      track('user', joiner.id);
      const lobbyId = await insertLobby(db, host.id, {
        publishedAt: new Date(),
      });
      track('lobby', lobbyId);
      const repo = createLobbyRepository(db);

      const locked = createDeferred();
      const release = createDeferred();

      // Act: ロックを保持したまま削除するトランザクションを開く
      // LobbyRepository は複数の narrower interface（Update/Delete/BulkUpdate）
      // を交差しており、それぞれ executeWithLock の callback 引数型が異なるため、
      // 推論された lockedRepo の型に deleteById が現れない。
      // 実体は createLobbyRepository が返すフル機能のリポジトリなので、
      // DeleteLobbyRepository として明示的にキャストする。
      const deleting = repo.executeWithLock(lobbyId, async (lockedRepo) => {
        locked.resolve();
        await release.promise;
        await (lockedRepo as unknown as DeleteLobbyRepository).deleteById(
          lobbyId,
        );
      });
      // executeWithLock のコールバックが locked.resolve() 前に throw すると
      // locked.promise だけを await した場合 testTimeout（30秒）までハングする。
      // deleting も一緒に race しておけば、そのケースは deleting の reject で
      // 即座に検知できる。
      await Promise.race([locked.promise, deleting]);

      // 別トランザクションからの参加は親行の FOR KEY SHARE を取れずブロックされる
      const joining = repo.addEntry(lobbyId, joiner.id, {});
      const joiningSettled = joining.then(
        () => 'settled',
        () => 'settled',
      );
      const raced = await Promise.race([
        joiningSettled,
        sleep(BLOCK_PROBE_MS).then(() => 'blocked' as const),
      ]);

      // Assert
      expect(raced).toBe('blocked');

      release.resolve();
      await deleting;
      await expect(joining).rejects.toThrow();
      expect(await repo.findHostUserId(lobbyId)).toBeNull();
    });
  });
});

describe('delete-game-session の TOCTOU（FOR UPDATE 競合）', () => {
  it('同じ卓への並行削除は直列化され、成功するのは1つだけ', async () => {
    await withCommitted(async (db, track) => {
      // Arrange
      const host = await insertUser(db);
      track('user', host.id);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: false,
      });
      track('gameSession', gameSessionId);
      await insertGameSessionMember(db, gameSessionId, { userId: host.id });
      const repo = createGameSessionRepository(db);

      // Act
      const results = await Promise.all([
        deleteGameSession(repo, gameSessionId, host.id),
        deleteGameSession(repo, gameSessionId, host.id),
      ]);

      // Assert
      expect(results.map((result) => result.type).sort()).toEqual([
        'notFound',
        'ok',
      ]);
      expect(await repo.gameSessionExists(gameSessionId)).toBe(false);
    });
  });

  it('ロック保持中の参加はブロックされ、削除コミット後は FK 違反で弾かれる', async () => {
    await withCommitted(async (db, track) => {
      // Arrange
      const host = await insertUser(db);
      track('user', host.id);
      const joiner = await insertUser(db);
      track('user', joiner.id);
      const gameSessionId = await insertGameSession(db, host.id, {
        isPublished: true,
      });
      track('gameSession', gameSessionId);
      const repo = createGameSessionRepository(db);

      const locked = createDeferred();
      const release = createDeferred();

      // Act
      const deleting = repo.executeWithLock(
        gameSessionId,
        async (lockedRepo) => {
          locked.resolve();
          await release.promise;
          await lockedRepo.deleteById(gameSessionId);
        },
      );
      // deleting も race しておくことで、コールバックが locked.resolve() 前に
      // throw した場合に testTimeout までハングせず即座に検知できる。
      await Promise.race([locked.promise, deleting]);

      const joining = repo.addMember(gameSessionId, joiner.id, {});
      const joiningSettled = joining.then(
        () => 'settled',
        () => 'settled',
      );
      const raced = await Promise.race([
        joiningSettled,
        sleep(BLOCK_PROBE_MS).then(() => 'blocked' as const),
      ]);

      // Assert
      expect(raced).toBe('blocked');

      release.resolve();
      await deleting;
      await expect(joining).rejects.toThrow();
      expect(await repo.gameSessionExists(gameSessionId)).toBe(false);
    });
  });
});

describe('bulk-update-availability-dates の TOCTOU（FOR UPDATE 競合）', () => {
  it('同じ候補日を追加する並行更新が unique 違反にならず、候補日は1件になる', async () => {
    await withCommitted(async (db, track) => {
      // Arrange
      const host = await insertUser(db);
      track('user', host.id);
      const lobbyId = await insertLobby(db, host.id, { publishedAt: null });
      track('lobby', lobbyId);
      const repo = createLobbyRepository(db);
      const input = { dates: [{ date: '2100-11-11', dateNote: null }] };

      // Act
      const results = await Promise.all([
        bulkUpdateAvailabilityDates(repo, lobbyId, host.id, input),
        bulkUpdateAvailabilityDates(repo, lobbyId, host.id, input),
      ]);

      // Assert
      expect(results.map((result) => result.type)).toEqual(['ok', 'ok']);
      expect(
        await db
          .select()
          .from(lobbyCandidates)
          .where(eq(lobbyCandidates.lobbyId, lobbyId)),
      ).toHaveLength(1);
    });
  });

  it('ロック保持中の一括更新は待たされ、先行トランザクションの結果を踏まえて差分を計算する', async () => {
    await withCommitted(async (db, track) => {
      // Arrange
      const host = await insertUser(db);
      track('user', host.id);
      const lobbyId = await insertLobby(db, host.id, { publishedAt: null });
      track('lobby', lobbyId);
      const repo = createLobbyRepository(db);

      const locked = createDeferred();
      const release = createDeferred();

      // Act: 先行トランザクションがロックを握ったまま候補日を1件追加する
      // 同様に、交差型の推論では BulkUpdateAvailabilityDatesRepository が
      // 選ばれず applyDateChanges が見えないため明示的にキャストする。
      const leading = repo.executeWithLock(lobbyId, async (lockedRepo) => {
        locked.resolve();
        await release.promise;
        await (
          lockedRepo as unknown as BulkUpdateAvailabilityDatesRepository
        ).applyDateChanges(lobbyId, {
          datesToAdd: [{ date: '2100-12-12', dateNote: null }],
          dateIdsToRemove: [],
          notesToUpdate: [],
        });
      });
      // leading も race しておくことで、コールバックが locked.resolve() 前に
      // throw した場合に testTimeout までハングせず即座に検知できる。
      await Promise.race([locked.promise, leading]);

      const following = bulkUpdateAvailabilityDates(repo, lobbyId, host.id, {
        dates: [{ date: '2100-12-12', dateNote: null }],
      });
      const followingSettled = following.then(
        () => 'settled',
        () => 'settled',
      );
      const raced = await Promise.race([
        followingSettled,
        sleep(BLOCK_PROBE_MS).then(() => 'blocked' as const),
      ]);

      // Assert: 先行トランザクションのコミット前は待たされている
      expect(raced).toBe('blocked');

      release.resolve();
      await leading;
      const result = await following;

      expect(result.type).toBe('ok');
      expect(
        await db
          .select()
          .from(lobbyCandidates)
          .where(eq(lobbyCandidates.lobbyId, lobbyId)),
      ).toHaveLength(1);
    });
  });
});
