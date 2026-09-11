import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUpdateGameSession } from '@/features/GameSession/Edit/useUpdateGameSession';
import { makeGameSessionDetailModel } from '@/models/__fixtures__/game-session';
import { ApiError } from '@/lib/api-client';

vi.mock('@/api/game-session', () => ({
  getGameSession: vi.fn(),
  updateGameSession: vi.fn(),
}));

const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack }),
}));

// composable を component 外で呼ぶため onMounted は no-op にする
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return { ...actual, onMounted: vi.fn() };
});

import { getGameSession, updateGameSession } from '@/api/game-session';

const LOBBY_ID = 'lobby-1';
const SESSION_ID = 'session-1';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateGameSession).mockResolvedValue(
    {} as Awaited<ReturnType<typeof updateGameSession>>,
  );
});

describe('fetchInitialValues', () => {
  it('上書きしていない項目は空欄で開く', async () => {
    // Arrange
    // 解決済みの表示値を初期値にすると、そのまま保存したときに
    // 意図しない上書きが発生する（design-v2 §5-5）
    vi.mocked(getGameSession).mockResolvedValue(
      makeGameSessionDetailModel({
        title: 'ロビーの題名',
        scenarioName: 'ロビーのシナリオ',
        location: 'オンライン',
        overrides: {
          title: null,
          scenarioName: null,
          location: null,
          timeLabel: null,
        },
      }),
    );
    const form = useUpdateGameSession(LOBBY_ID, SESSION_ID);

    // Act
    await form.fetchInitialValues();

    // Assert
    expect(form.title.value).toBe('');
    expect(form.scenarioName.value).toBe('');
    expect(form.location.value).toBe('');
    expect(form.timeLabel.value).toBe('');
  });

  it('上書きしている項目は生値で開く', async () => {
    // Arrange
    vi.mocked(getGameSession).mockResolvedValue(
      makeGameSessionDetailModel({
        title: '第2回',
        location: 'カフェ〇〇',
        overrides: {
          title: '第2回',
          scenarioName: null,
          location: 'カフェ〇〇',
          timeLabel: '13:00〜',
        },
      }),
    );
    const form = useUpdateGameSession(LOBBY_ID, SESSION_ID);

    // Act
    await form.fetchInitialValues();

    // Assert
    expect(form.title.value).toBe('第2回');
    expect(form.location.value).toBe('カフェ〇〇');
    expect(form.timeLabel.value).toBe('13:00〜');
    expect(form.scenarioName.value).toBe('');
  });

  it('ロビーの既定値をプレースホルダ用に保持する', async () => {
    // Arrange
    vi.mocked(getGameSession).mockResolvedValue(makeGameSessionDetailModel());
    const form = useUpdateGameSession(LOBBY_ID, SESSION_ID);

    // Act
    await form.fetchInitialValues();

    // Assert
    expect(form.lobbyDefaults.value?.title).toBe('テストロビー');
  });

  it('取得に失敗するとエラーメッセージを出す', async () => {
    // Arrange
    vi.mocked(getGameSession).mockRejectedValue(new ApiError(404, '無い'));
    const form = useUpdateGameSession(LOBBY_ID, SESSION_ID);

    // Act
    await form.fetchInitialValues();

    // Assert
    expect(form.errorMessage.value).toBe('無い');
  });
});

describe('submit', () => {
  const setup = () => useUpdateGameSession(LOBBY_ID, SESSION_ID);

  it('開催日が空なら送信せずエラーにする', async () => {
    // Arrange
    const form = setup();
    form.scheduledAt.value = '';

    // Act
    await form.submit();

    // Assert
    expect(updateGameSession).not.toHaveBeenCalled();
    expect(form.errorMessage.value).toBe('開催日を選択してください');
  });

  it('空欄の上書き項目は null（解除）として送る', async () => {
    // Arrange
    const form = setup();
    form.scheduledAt.value = '2026-09-01';
    form.title.value = '';
    form.scenarioName.value = '';
    form.location.value = '';
    form.timeLabel.value = '';
    form.description.value = '';

    // Act
    await form.submit();

    // Assert
    expect(updateGameSession).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, {
      scheduledAt: '2026-09-01',
      title: null,
      scenarioName: null,
      location: null,
      timeLabel: null,
      description: null,
    });
  });

  it('入力のある項目は値を送る', async () => {
    // Arrange
    const form = setup();
    form.scheduledAt.value = '2026-09-01';
    form.title.value = '第2回';
    form.location.value = 'カフェ〇〇';
    form.timeLabel.value = '13:00〜';

    // Act
    await form.submit();

    // Assert
    expect(updateGameSession).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, {
      scheduledAt: '2026-09-01',
      title: '第2回',
      scenarioName: null,
      location: 'カフェ〇〇',
      timeLabel: '13:00〜',
      description: null,
    });
  });

  it('空白だけの入力は上書きとして扱わない', async () => {
    // Arrange
    const form = setup();
    form.scheduledAt.value = '2026-09-01';
    form.title.value = '   ';

    // Act
    await form.submit();

    // Assert
    expect(updateGameSession).toHaveBeenCalledWith(
      LOBBY_ID,
      SESSION_ID,
      expect.objectContaining({ title: null }),
    );
  });

  it('成功すると開催の詳細へ戻る', async () => {
    // Arrange
    const form = setup();
    form.scheduledAt.value = '2026-09-01';

    // Act
    await form.submit();

    // Assert
    expect(mockRouterPush).toHaveBeenCalledWith({
      name: 'game-sessions-detail',
      params: { lobbyId: LOBBY_ID, gameSessionId: SESSION_ID },
    });
  });

  it('ApiError のメッセージをそのまま出す', async () => {
    // Arrange
    vi.mocked(updateGameSession).mockRejectedValue(
      new ApiError(422, '中止した開催は編集できません'),
    );
    const form = setup();
    form.scheduledAt.value = '2026-09-01';

    // Act
    await form.submit();

    // Assert
    expect(form.errorMessage.value).toBe('中止した開催は編集できません');
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('定員（maxMembers）はフォームから消えている', () => {
    // Arrange / Act
    const form = setup();

    // Assert
    // 定員はロビーの関心事へ移った（design-v2 §3-7）
    expect('maxMembers' in form).toBe(false);
  });
});

describe('cancel', () => {
  it('前の画面へ戻る', () => {
    // Arrange
    const form = useUpdateGameSession(LOBBY_ID, SESSION_ID);

    // Act
    form.cancel();

    // Assert
    expect(mockRouterBack).toHaveBeenCalled();
  });
});
