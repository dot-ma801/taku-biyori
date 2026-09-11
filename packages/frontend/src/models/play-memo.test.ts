import { describe, expect, it } from 'vitest';
import { toMyPlayMemoModel, toSharedPlayMemoModel } from '@/models/play-memo';

describe('play memo model', () => {
  it('converts timestamps to Date and keeps seatId', () => {
    const model = toMyPlayMemoModel({
      seatId: '00000000-0000-4000-8000-000000000001',
      body: 'memo',
      sharedAt: null,
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(model.seatId).toBe('00000000-0000-4000-8000-000000000001');
    expect(model.updatedAt).toBeInstanceOf(Date);
  });

  it('converts shared timestamps', () => {
    const model = toSharedPlayMemoModel({
      seatId: '00000000-0000-4000-8000-000000000001',
      body: 'memo',
      sharedAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(model.sharedAt).toBeInstanceOf(Date);
  });
});
