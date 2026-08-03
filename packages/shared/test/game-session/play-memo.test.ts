import { describe, expect, it } from 'vitest';
import {
  canViewSharedPlayMemos,
  GameSessionPlayMemoSchema,
  MyGameSessionPlayMemoSchema,
  SharedGameSessionPlayMemoSchema,
  UpdateGameSessionPlayMemoVisibilityInputSchema,
  UpsertGameSessionPlayMemoInputSchema,
} from '@/game-session/play-memo';
import { GameSessionStatus } from '@/game-session';

const ALL_STATUSES: GameSessionStatus[] = Object.values(GameSessionStatus);

// 他人の公開メモを読めるのは終端状態（完了・中止）のみ（design-v1.2 §4）
const VIEWABLE_STATUSES: GameSessionStatus[] = [
  GameSessionStatus.completed,
  GameSessionStatus.cancelled,
];

describe('canViewSharedPlayMemos', () => {
  it.each(ALL_STATUSES)('%s のとき期待どおりの可否を返す', (status) => {
    // Arrange
    const expected = VIEWABLE_STATUSES.includes(status);

    // Act
    const result = canViewSharedPlayMemos(status);

    // Assert
    expect(result).toBe(expected);
  });
});

describe('UpsertGameSessionPlayMemoInputSchema', () => {
  it('本文を受け付ける', () => {
    // Arrange
    const input = { body: '今日のセッションのメモ' };

    // Act
    const result = UpsertGameSessionPlayMemoInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  // 本文を空にしても行は残す（公開状態を失わせない）ため空文字を許可する（design-v1.2 §8）
  it('空文字を許可する', () => {
    // Arrange
    const input = { body: '' };

    // Act
    const result = UpsertGameSessionPlayMemoInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('5000 文字を許可する', () => {
    // Arrange
    const input = { body: 'あ'.repeat(5000) };

    // Act
    const result = UpsertGameSessionPlayMemoInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('5000 文字を超える本文を拒否する', () => {
    // Arrange
    const input = { body: 'あ'.repeat(5001) };

    // Act
    const result = UpsertGameSessionPlayMemoInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('body がないと拒否する', () => {
    // Arrange
    const input = {};

    // Act
    const result = UpsertGameSessionPlayMemoInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('GameSessionPlayMemoSchema', () => {
  it('非公開メモ（sharedAt が null）を受け付ける', () => {
    // Arrange
    const memo = {
      memberId: '00000000-0000-4000-8000-000000000001',
      body: 'メモ',
      sharedAt: null,
      updatedAt: '2026-08-02T00:00:00.000Z',
    };

    // Act
    const result = GameSessionPlayMemoSchema.safeParse(memo);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe('SharedGameSessionPlayMemoSchema', () => {
  it('公開済みのみを返すため sharedAt が null のメモを拒否する', () => {
    // Arrange
    const memo = {
      memberId: '00000000-0000-4000-8000-000000000001',
      body: 'メモ',
      sharedAt: null,
      updatedAt: '2026-08-02T00:00:00.000Z',
    };

    // Act
    const result = SharedGameSessionPlayMemoSchema.safeParse(memo);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('MyGameSessionPlayMemoSchema', () => {
  // 未作成のメンバーには 404 ではなく空メモを返すため updatedAt は null になりうる（design-v1.2 §8）
  it('未作成の空メモ（updatedAt が null）を受け付ける', () => {
    // Arrange
    const memo = {
      memberId: '00000000-0000-4000-8000-000000000001',
      body: '',
      sharedAt: null,
      updatedAt: null,
    };

    // Act
    const result = MyGameSessionPlayMemoSchema.safeParse(memo);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe('UpdateGameSessionPlayMemoVisibilityInputSchema', () => {
  it('公開する指定（shared: true）を受け付ける', () => {
    // Arrange
    const input = { shared: true };

    // Act
    const result =
      UpdateGameSessionPlayMemoVisibilityInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  // 公開を取りやめて非公開に戻せる（要求 §3-2）
  it('非公開に戻す指定（shared: false）を受け付ける', () => {
    // Arrange
    const input = { shared: false };

    // Act
    const result =
      UpdateGameSessionPlayMemoVisibilityInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('shared が無いと拒否する', () => {
    // Arrange
    const input = {};

    // Act
    const result =
      UpdateGameSessionPlayMemoVisibilityInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  // 文字列の 'true' を真として通すと、誤って公開する事故につながる
  it('真偽値でない shared を拒否する', () => {
    // Arrange
    const input = { shared: 'true' };

    // Act
    const result =
      UpdateGameSessionPlayMemoVisibilityInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
