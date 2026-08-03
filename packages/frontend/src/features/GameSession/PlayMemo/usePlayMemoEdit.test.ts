import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  usePlayMemoEdit,
  AUTOSAVE_DELAY_MS,
} from '@/features/GameSession/PlayMemo/usePlayMemoEdit';
import { GAME_SESSION_PLAY_MEMO_MAX_LENGTH } from '@taku-biyori/shared';
import type { MyGameSessionPlayMemo } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  upsertMyPlayMemo: vi.fn(),
}));

// composable を component 外で呼ぶため onUnmounted は no-op にする
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return { ...actual, onUnmounted: vi.fn() };
});

import { upsertMyPlayMemo } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';

const SESSION_ID = 'session-1';
const MEMBER_ID = 'member-1';
const SERVER_BODY = '書斎の鍵は青木さんが持っていた';

function makePlayMemo(
  overrides: Partial<MyGameSessionPlayMemo> = {},
): MyGameSessionPlayMemo {
  return {
    memberId: MEMBER_ID,
    body: SERVER_BODY,
    sharedAt: null,
    updatedAt: '2026-08-03T12:04:00Z',
    ...overrides,
  };
}

function setup(
  opts: {
    playMemo?: MyGameSessionPlayMemo | null;
    onSaved?: (saved: MyGameSessionPlayMemo) => void;
  } = {},
) {
  // playMemo は null を明示的に渡すケースがあるため、?? ではなくキー有無で判定する
  const playMemo: MyGameSessionPlayMemo | null =
    'playMemo' in opts ? (opts.playMemo ?? null) : makePlayMemo();
  return usePlayMemoEdit(SESSION_ID, () => playMemo, opts.onSaved ?? vi.fn());
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.mocked(upsertMyPlayMemo).mockResolvedValue(makePlayMemo());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ドラフトの初期化', () => {
  it('サーバ値の本文でドラフトを初期化する', () => {
    // Arrange & Act
    const { draftBody } = setup();

    // Assert
    expect(draftBody.value).toBe(SERVER_BODY);
  });

  it('サーバ値がまだ無ければ空文字で初期化する', () => {
    // Arrange & Act
    const { draftBody } = setup({ playMemo: null });

    // Assert
    expect(draftBody.value).toBe('');
  });

  it('未作成の空メモ（updatedAt が null）でも空文字として扱う', () => {
    // Arrange & Act
    const { draftBody } = setup({
      playMemo: makePlayMemo({ body: '', updatedAt: null }),
    });

    // Assert
    expect(draftBody.value).toBe('');
  });

  it('初期状態は idle で、変更なし扱いになる', () => {
    // Arrange & Act
    const { status, isDirty } = setup();

    // Assert
    expect(status.value).toBe('idle');
    expect(isDirty.value).toBe(false);
  });
});

describe('setDraft', () => {
  it('ドラフトを更新すると isDirty が true になり status が dirty になる', () => {
    // Arrange
    const { draftBody, isDirty, status, setDraft } = setup();

    // Act
    setDraft('書き足した本文');

    // Assert
    expect(draftBody.value).toBe('書き足した本文');
    expect(isDirty.value).toBe(true);
    expect(status.value).toBe('dirty');
  });

  it('サーバ値と同じ内容に戻すと idle に戻る', () => {
    // Arrange
    const { status, isDirty, setDraft } = setup();
    setDraft('書き足した本文');

    // Act
    setDraft(SERVER_BODY);

    // Assert
    expect(isDirty.value).toBe(false);
    expect(status.value).toBe('idle');
  });

  it('本文がロックされた後の入力は受け付けない', async () => {
    // Arrange
    vi.mocked(upsertMyPlayMemo).mockRejectedValue(new ApiError(409, 'locked'));
    const { draftBody, status, setDraft, save } = setup();
    setDraft('書き足した本文');
    await save();
    expect(status.value).toBe('locked');

    // Act
    setDraft('さらに書き足す');

    // Assert
    expect(draftBody.value).toBe('書き足した本文');
  });
});

describe('自動保存', () => {
  it('入力が止まってから AUTOSAVE_DELAY_MS 後に保存する', async () => {
    // Arrange
    const { setDraft } = setup();

    // Act
    setDraft('書き足した本文');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

    // Assert
    expect(upsertMyPlayMemo).toHaveBeenCalledWith(SESSION_ID, {
      body: '書き足した本文',
    });
  });

  it('入力が続いている間は保存しない（タイマーを引き直す）', async () => {
    // Arrange
    const { setDraft } = setup();

    // Act
    setDraft('あ');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 500);
    setDraft('あい');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 500);

    // Assert
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });

  it('変更が無ければ保存しない', async () => {
    // Arrange
    const { setDraft } = setup();

    // Act
    setDraft(SERVER_BODY);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

    // Assert
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });

  it('上限を超えている間は保存しない', async () => {
    // Arrange
    const { setDraft, isOverLimit } = setup();

    // Act
    setDraft('あ'.repeat(GAME_SESSION_PLAY_MEMO_MAX_LENGTH + 1));
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

    // Assert
    expect(isOverLimit.value).toBe(true);
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });
});

describe('save', () => {
  it('保存に成功すると status が saved になり isDirty が false に戻る', async () => {
    // Arrange
    const { status, isDirty, setDraft, save } = setup();
    setDraft('書き足した本文');

    // Act
    await save();

    // Assert
    expect(status.value).toBe('saved');
    expect(isDirty.value).toBe(false);
  });

  it('保存後のサーバ値を onSaved で所有者に返す', async () => {
    // Arrange
    const saved = makePlayMemo({ body: '書き足した本文' });
    vi.mocked(upsertMyPlayMemo).mockResolvedValue(saved);
    const onSaved = vi.fn();
    const { setDraft, save } = setup({ onSaved });
    setDraft('書き足した本文');

    // Act
    await save();

    // Assert
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it('変更が無ければ API を呼ばない', async () => {
    // Arrange
    const { save } = setup();

    // Act
    await save();

    // Assert
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });

  it('送信中は status が saving になる', async () => {
    // Arrange
    let resolveSave!: () => void;
    vi.mocked(upsertMyPlayMemo).mockReturnValue(
      new Promise((resolve) => {
        resolveSave = () => resolve(makePlayMemo());
      }),
    );
    const { status, setDraft, save } = setup();
    setDraft('書き足した本文');

    // Act
    const promise = save();
    expect(status.value).toBe('saving');

    resolveSave();
    await promise;

    // Assert
    expect(status.value).toBe('saved');
  });

  it('送信中に書き足された分は、保存後にもう一度予約する', async () => {
    // Arrange
    let resolveSave!: () => void;
    vi.mocked(upsertMyPlayMemo).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = () => resolve(makePlayMemo({ body: '1回目' }));
      }),
    );
    const { status, setDraft, save } = setup();
    setDraft('1回目');

    // Act
    const promise = save();
    setDraft('1回目と2回目'); // 送信中に書き足す
    resolveSave();
    await promise;

    // Assert
    expect(status.value).toBe('dirty');

    // 予約された2回目の保存が走る
    vi.mocked(upsertMyPlayMemo).mockResolvedValue(
      makePlayMemo({ body: '1回目と2回目' }),
    );
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
    expect(upsertMyPlayMemo).toHaveBeenLastCalledWith(SESSION_ID, {
      body: '1回目と2回目',
    });
  });

  it('二重送信を防ぐ（saving 中の再呼び出しは無視する）', async () => {
    // Arrange
    let resolveSave!: () => void;
    vi.mocked(upsertMyPlayMemo).mockReturnValue(
      new Promise((resolve) => {
        resolveSave = () => resolve(makePlayMemo());
      }),
    );
    const { setDraft, save } = setup();
    setDraft('書き足した本文');

    // Act
    const first = save();
    const second = save();
    resolveSave();
    await Promise.all([first, second]);

    // Assert
    expect(upsertMyPlayMemo).toHaveBeenCalledTimes(1);
  });

  it('409 なら status を locked にする（卓が完了・中止した）', async () => {
    // Arrange
    vi.mocked(upsertMyPlayMemo).mockRejectedValue(new ApiError(409, 'locked'));
    const { status, setDraft, save } = setup();
    setDraft('書き足した本文');

    // Act
    await save();

    // Assert
    expect(status.value).toBe('locked');
  });

  it('通信エラーなら status を failed にし、ドラフトは残す', async () => {
    // Arrange
    vi.mocked(upsertMyPlayMemo).mockRejectedValue(new Error('network'));
    const { status, draftBody, isDirty, setDraft, save } = setup();
    setDraft('書き足した本文');

    // Act
    await save();

    // Assert
    expect(status.value).toBe('failed');
    expect(draftBody.value).toBe('書き足した本文');
    expect(isDirty.value).toBe(true);
  });

  it('失敗後に入力を再開すると自動保存をやり直す', async () => {
    // Arrange
    vi.mocked(upsertMyPlayMemo).mockRejectedValueOnce(new Error('network'));
    const { setDraft, save } = setup();
    setDraft('1回目');
    await save();

    // Act
    setDraft('1回目と2回目');
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

    // Assert
    expect(upsertMyPlayMemo).toHaveBeenLastCalledWith(SESSION_ID, {
      body: '1回目と2回目',
    });
  });
});

describe('flush', () => {
  it('未保存が無ければ通信せず true を返す', async () => {
    // Arrange
    const { flush } = setup();

    // Act
    const canLeave = await flush();

    // Assert
    expect(canLeave).toBe(true);
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });

  it('未保存があれば保存してから true を返す', async () => {
    // Arrange
    const { setDraft, flush } = setup();
    setDraft('書き足した本文');

    // Act
    const canLeave = await flush();

    // Assert
    expect(upsertMyPlayMemo).toHaveBeenCalledWith(SESSION_ID, {
      body: '書き足した本文',
    });
    expect(canLeave).toBe(true);
  });

  it('保存に失敗したら false を返す（離脱の確認は呼び出し側に委ねる）', async () => {
    // Arrange
    vi.mocked(upsertMyPlayMemo).mockRejectedValue(new Error('network'));
    const { setDraft, flush } = setup();
    setDraft('書き足した本文');

    // Act
    const canLeave = await flush();

    // Assert
    expect(canLeave).toBe(false);
  });

  it('409 で本文が閉じた場合は true を返す（再試行しても通らないため）', async () => {
    // Arrange
    vi.mocked(upsertMyPlayMemo).mockRejectedValue(new ApiError(409, 'locked'));
    const { setDraft, flush } = setup();
    setDraft('書き足した本文');

    // Act
    const canLeave = await flush();

    // Assert
    expect(canLeave).toBe(true);
  });

  it('上限超過なら保存せず false を返す', async () => {
    // Arrange
    const { setDraft, flush } = setup();
    setDraft('あ'.repeat(GAME_SESSION_PLAY_MEMO_MAX_LENGTH + 1));

    // Act
    const canLeave = await flush();

    // Assert
    expect(canLeave).toBe(false);
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });
});
