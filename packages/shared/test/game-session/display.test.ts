import { describe, expect, it } from 'vitest';
import { resolveGameSessionDisplay } from '@/game-session/display';
import { LobbyStatus } from '@/lobby/status';

// design-v2 §5-5: セッションの title / scenarioName / location は
// 「上書きの生値（overrides）?? ロビーの既定値（lobby）」で解決する。
// timeLabel はロビー側に対応列が無いため生値がそのまま表示値になる。

const lobby = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'マダミス「蒼き月」',
  scenarioName: '蒼き月の夜',
  location: 'オンライン',
  maxPlayers: 6,
  hostUserId: 'user-host',
  status: LobbyStatus.open,
};

const noOverrides = {
  title: null,
  scenarioName: null,
  location: null,
  timeLabel: null,
};

describe('resolveGameSessionDisplay', () => {
  it('上書きが無ければロビーの値を表示値にする', () => {
    // Arrange
    const session = { overrides: noOverrides };

    // Act
    const result = resolveGameSessionDisplay(session, lobby);

    // Assert
    expect(result).toEqual({
      title: 'マダミス「蒼き月」',
      scenarioName: '蒼き月の夜',
      location: 'オンライン',
      timeLabel: null,
    });
  });

  it('上書きがあればロビーの値より優先する', () => {
    // Arrange
    const session = {
      overrides: {
        title: '第2回',
        scenarioName: '別シナリオ',
        location: 'カフェ〇〇',
        timeLabel: '13:00〜',
      },
    };

    // Act
    const result = resolveGameSessionDisplay(session, lobby);

    // Assert
    expect(result).toEqual({
      title: '第2回',
      scenarioName: '別シナリオ',
      location: 'カフェ〇〇',
      timeLabel: '13:00〜',
    });
  });

  it('項目ごとに独立して解決する（片方だけの上書き）', () => {
    // Arrange
    const session = {
      overrides: { ...noOverrides, location: 'カフェ〇〇' },
    };

    // Act
    const result = resolveGameSessionDisplay(session, lobby);

    // Assert
    expect(result).toEqual({
      title: 'マダミス「蒼き月」',
      scenarioName: '蒼き月の夜',
      location: 'カフェ〇〇',
      timeLabel: null,
    });
  });

  it('ロビー側も未設定なら null になる（表示用の文言は入れない）', () => {
    // Arrange
    const session = { overrides: noOverrides };
    const bareLobby = { ...lobby, scenarioName: null, location: null };

    // Act
    const result = resolveGameSessionDisplay(session, bareLobby);

    // Assert
    expect(result.scenarioName).toBeNull();
    expect(result.location).toBeNull();
  });

  it('timeLabel はロビーに既定値が無いので生値をそのまま返す', () => {
    // Arrange
    const session = { overrides: { ...noOverrides, timeLabel: '午後' } };

    // Act
    const result = resolveGameSessionDisplay(session, lobby);

    // Assert
    expect(result.timeLabel).toBe('午後');
  });

  it('空文字の上書きは「上書きしていない」とは区別してそのまま返す', () => {
    // Arrange
    const session = { overrides: { ...noOverrides, location: '' } };

    // Act
    const result = resolveGameSessionDisplay(session, lobby);

    // Assert
    expect(result.location).toBe('');
  });
});
