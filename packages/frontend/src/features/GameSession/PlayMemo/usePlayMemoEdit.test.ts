import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { usePlayMemoEdit } from '@/features/GameSession/PlayMemo/usePlayMemoEdit';
import { GAME_SESSION_PLAY_MEMO_MAX_LENGTH } from '@taku-biyori/shared';
import type { MyGameSessionPlayMemo } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  upsertMyPlayMemo: vi.fn(),
}));

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

/**
 * 本番と同じ環（save() 成功 → onSaved → 親が playMemo を差し替え → watch が
 * 発火）を再現するため、playMemo は ref で渡し、onSaved の既定実装はその
 * ref を更新する。静的な getter だと内部の watch が一度も発火せず、
 * 「保存成功のたびに reset() が走って入力が消える」バグをすり抜けてしまう。
 */
function setup(
  opts: {
    playMemo?: MyGameSessionPlayMemo | null;
    onSaved?: (saved: MyGameSessionPlayMemo) => void;
  } = {},
) {
  // playMemo は null を明示的に渡すケースがあるため、?? ではなくキー有無で判定する
  const initial: MyGameSessionPlayMemo | null =
    'playMemo' in opts ? (opts.playMemo ?? null) : makePlayMemo();
  const serverMemo = ref(initial);
  const onSaved =
    opts.onSaved ??
    ((saved: MyGameSessionPlayMemo) => {
      serverMemo.value = saved;
    });

  return {
    ...usePlayMemoEdit(SESSION_ID, serverMemo, onSaved),
    serverMemo,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // 実際の upsert は送った本文をそのまま返す（サーバは受理した内容を返す）。
  // 送信内容と無関係な固定値を返すと、テスト側で「保存成功のエコー」と
  // 「別内容の再取得」を区別できず、echo スキップの検証にならない。
  vi.mocked(upsertMyPlayMemo).mockImplementation(
    async (_gameSessionId, input) => makePlayMemo({ body: input.body }),
  );
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

describe('入力しただけでは保存しない', () => {
  it('setDraft を呼んでも API を呼ばない（自動保存はしない）', () => {
    // Arrange
    const { setDraft } = setup();

    // Act
    setDraft('書き足した本文');

    // Assert
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });

  it('入力を繰り返しても API を呼ばない', () => {
    // Arrange
    const { setDraft } = setup();

    // Act
    setDraft('あ');
    setDraft('あい');
    setDraft('あいう');

    // Assert
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
        resolveSave = () => resolve(makePlayMemo({ body: '書き足した本文' }));
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

  it('送信中に書き足された分は未保存のまま残る（勝手に送らない）', async () => {
    // Arrange
    let resolveSave!: () => void;
    vi.mocked(upsertMyPlayMemo).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = () => resolve(makePlayMemo({ body: '1回目' }));
      }),
    );
    const { status, isDirty, setDraft, save } = setup();
    setDraft('1回目');

    // Act
    const promise = save();
    setDraft('1回目と2回目'); // 送信中に書き足す
    resolveSave();
    await promise;

    // Assert: 書き足した分は未保存。ユーザーがもう一度保存するまで送らない
    expect(status.value).toBe('dirty');
    expect(isDirty.value).toBe(true);
    expect(upsertMyPlayMemo).toHaveBeenCalledTimes(1);
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

  it('送信中に書き足した本文は、保存応答の反映（サーバ値のエコー）後も保持される', async () => {
    // Arrange
    let resolveSave!: () => void;
    vi.mocked(upsertMyPlayMemo).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = () => resolve(makePlayMemo({ body: '1回目' }));
      }),
    );
    const { draftBody, setDraft, save } = setup();
    setDraft('1回目');

    // Act
    const promise = save();
    setDraft('1回目と2回目'); // 送信中に書き足す
    resolveSave();
    await promise;

    // Assert: onSaved → playMemo 差し替え → watch が発火しても、
    // 自分の保存のエコーでは reset() が走らないので書き足し分が残る
    expect(draftBody.value).toBe('1回目と2回目');
  });

  it('送信中に書き足してから再度保存しても PUT は2本飛ばない', async () => {
    // Arrange
    let resolveSave!: () => void;
    vi.mocked(upsertMyPlayMemo).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = () => resolve(makePlayMemo({ body: '1回目' }));
      }),
    );
    const { setDraft, save } = setup();
    setDraft('1回目');

    // Act: 1本目が送信中のまま書き足し、保存ボタンをもう一度押す
    const first = save();
    setDraft('1回目と2回目');
    const second = save();

    resolveSave();
    await Promise.all([first, second]);

    // Assert: status だけを見るガードなら、setDraft が saving を dirty に
    // 戻すため素通りしてしまう。inFlight を見るガードなら防げる
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

  it('失敗後にもう一度 save を呼べば再送する', async () => {
    // Arrange
    vi.mocked(upsertMyPlayMemo).mockRejectedValueOnce(new Error('network'));
    const { status, setDraft, save } = setup();
    setDraft('書き足した本文');
    await save();
    expect(status.value).toBe('failed');

    // Act
    await save();

    // Assert
    expect(upsertMyPlayMemo).toHaveBeenCalledTimes(2);
    expect(status.value).toBe('saved');
  });

  it('上限を超えていれば保存しない', async () => {
    // Arrange
    const { setDraft, isOverLimit, save } = setup();
    setDraft('あ'.repeat(GAME_SESSION_PLAY_MEMO_MAX_LENGTH + 1));

    // Act
    await save();

    // Assert
    expect(isOverLimit.value).toBe(true);
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });
});

describe('未保存の検知（離脱警告の判定材料）', () => {
  it('保存前は isDirty が true のまま', () => {
    // Arrange
    const { isDirty, setDraft } = setup();

    // Act
    setDraft('書き足した本文');

    // Assert
    expect(isDirty.value).toBe(true);
  });

  it('保存に成功すると isDirty が false になる', async () => {
    // Arrange
    const { isDirty, setDraft, save } = setup();
    setDraft('書き足した本文');

    // Act
    await save();

    // Assert
    expect(isDirty.value).toBe(false);
  });

  it('保存に失敗したら isDirty は true のまま（離脱時に警告できる）', async () => {
    // Arrange
    vi.mocked(upsertMyPlayMemo).mockRejectedValue(new Error('network'));
    const { isDirty, setDraft, save } = setup();
    setDraft('書き足した本文');

    // Act
    await save();

    // Assert
    expect(isDirty.value).toBe(true);
  });
});
