import { describe, expect, it } from 'vitest';
import { getLobbyStatus, LobbyStatus } from '@/lobby/status';
import type { LobbyStatusFacts } from '@/lobby/status';

const base: LobbyStatusFacts = {
  publishedAt: null,
  openUntil: null,
  receptionClosedAt: null,
  disbandedAt: null,
};

const TODAY = '2026-08-29';

describe('getLobbyStatus', () => {
  it('disbandedAt がセット済みなら disbanded（導出順の先頭）', () => {
    // Arrange — 他のどの条件が立っていても解散が優先される
    const facts: LobbyStatusFacts = {
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      openUntil: '2026-12-31',
      receptionClosedAt: new Date('2026-08-20T00:00:00Z'),
      disbandedAt: new Date('2026-08-25T00:00:00Z'),
    };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.disbanded);
  });

  it('publishedAt が null なら draft', () => {
    // Arrange
    const facts: LobbyStatusFacts = { ...base, publishedAt: null };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.draft);
  });

  it('公開済みでも receptionClosedAt がセット済みなら closed（手動クローズ）', () => {
    // Arrange — 締め切り日は未来のままでも手動クローズが優先される
    const facts: LobbyStatusFacts = {
      ...base,
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      openUntil: '2026-12-31',
      receptionClosedAt: new Date('2026-08-20T00:00:00Z'),
    };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.closed);
  });

  it('公開済みかつ openUntil が null なら open（無期限受付）', () => {
    // Arrange
    const facts: LobbyStatusFacts = {
      ...base,
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      openUntil: null,
    };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.open);
  });

  it('公開済みかつ openUntil が未来なら open', () => {
    // Arrange
    const facts: LobbyStatusFacts = {
      ...base,
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      openUntil: '2026-08-30',
    };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.open);
  });

  it('締め切り日が今日ちょうどなら open（today <= openUntil）', () => {
    // Arrange — 境界。締め切り当日はまだ受け付ける
    const facts: LobbyStatusFacts = {
      ...base,
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      openUntil: TODAY,
    };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.open);
  });

  it('公開済みかつ openUntil が過去なら closed（締め切り日の経過）', () => {
    // Arrange
    const facts: LobbyStatusFacts = {
      ...base,
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      openUntil: '2026-08-28',
    };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.closed);
  });

  it('未公開のまま解散したロビーは disbanded（draft より優先）', () => {
    // Arrange
    const facts: LobbyStatusFacts = {
      ...base,
      publishedAt: null,
      disbandedAt: new Date('2026-08-25T00:00:00Z'),
    };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.disbanded);
  });

  it('ファクトを ISO 文字列で受け取っても同じ判定になる（レスポンス由来の値）', () => {
    // Arrange — frontend は JSON の文字列をそのまま渡す
    const facts: LobbyStatusFacts = {
      publishedAt: '2026-08-01T00:00:00.000Z',
      openUntil: '2026-12-31',
      receptionClosedAt: '2026-08-20T00:00:00.000Z',
      disbandedAt: null,
    };

    // Act
    const result = getLobbyStatus(facts, TODAY);

    // Assert
    expect(result).toBe(LobbyStatus.closed);
  });

  it('today を省略すると実行時の今日で判定する', () => {
    // Arrange — 昨日を締め切りにしたロビーは今日から closed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // todayDateString() はローカル時刻の年月日なので、比較対象も同じ基準で作る
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, '0');
    const d = String(yesterday.getDate()).padStart(2, '0');
    const facts: LobbyStatusFacts = {
      ...base,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
      openUntil: `${y}-${m}-${d}`,
    };

    // Act
    const result = getLobbyStatus(facts);

    // Assert
    expect(result).toBe(LobbyStatus.closed);
  });
});
