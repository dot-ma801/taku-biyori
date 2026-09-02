import { describe, expect, it, vi } from 'vitest';
import { updateCharacterAssignment } from '@/game-session/application/update-character-assignment';
import type { CharacterAssignmentRepository } from '@/game-session/application/update-character-assignment';
import type { Seat } from '@taku-biyori/shared';

const HOST = 'user-host';
const OWNER = 'user-2';
const seat: Seat = {
  id: 'seat-1',
  entryId: 'entry-1',
  userId: OWNER,
  userName: 'たくみ',
  guestName: null,
  characterName: 'アルベルト',
  seatedAt: '2026-08-30T10:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<CharacterAssignmentRepository> = {},
): CharacterAssignmentRepository => ({
  findHostUserId: vi.fn().mockResolvedValue(HOST),
  findStatusFields: vi.fn().mockResolvedValue({
    scheduledAt: '2026-09-01',
    completedAt: null,
    cancelledAt: null,
  }),
  findSeatOwner: vi.fn().mockResolvedValue({
    gameSessionId: 'session-1',
    userId: OWNER,
  }),
  updateSeatCharacterName: vi.fn().mockResolvedValue(seat),
  ...overrides,
});

describe('updateCharacterAssignment', () => {
  it('本人はキャラクター名を割り当てられる', async () => {
    const repo = makeRepo();
    const result = await updateCharacterAssignment(
      repo,
      'session-1',
      'seat-1',
      OWNER,
      { characterName: 'アルベルト' },
    );
    expect(result).toEqual({ type: 'ok', seat });
  });

  it('ホストも他人の席を更新できる', async () => {
    const result = await updateCharacterAssignment(
      makeRepo(),
      'session-1',
      'seat-1',
      HOST,
      { characterName: '探偵' },
    );
    expect(result.type).toBe('ok');
  });

  it('本人でもホストでもなければ forbidden を返す', async () => {
    const result = await updateCharacterAssignment(
      makeRepo(),
      'session-1',
      'seat-1',
      'user-9',
      { characterName: 'x' },
    );
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('中止した開催では更新できない', async () => {
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-09-01',
        completedAt: null,
        cancelledAt: new Date(),
      }),
    });
    const result = await updateCharacterAssignment(
      repo,
      'session-1',
      'seat-1',
      OWNER,
      { characterName: 'x' },
    );
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('別セッションの席なら notFound を返す', async () => {
    const repo = makeRepo({
      findSeatOwner: vi.fn().mockResolvedValue({
        gameSessionId: 'session-other',
        userId: OWNER,
      }),
    });
    const result = await updateCharacterAssignment(
      repo,
      'session-1',
      'seat-1',
      OWNER,
      { characterName: 'x' },
    );
    expect(result).toEqual({ type: 'notFound' });
  });
});
