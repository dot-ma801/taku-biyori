import { describe, expect, it } from 'vitest';
import { GAME_SESSION_OVERRIDE_MAX_LENGTHS } from '@taku-biyori/shared';
import {
  getDraftFieldCounter,
  getDraftFieldError,
  isDraftValid,
} from '@/features/Lobby/Detail/Schedule/ConfirmFlow/draftValidation';

const emptyDraft = {
  title: '',
  scenarioName: '',
  location: '',
  timeLabel: '',
  description: '',
};

describe('getDraftFieldError', () => {
  it.each([
    ['title', '卓名', 100],
    ['scenarioName', 'シナリオ名', 200],
    ['location', '場所', 200],
    ['timeLabel', '時間帯', 20],
    ['description', '当日の連絡事項', 1000],
  ] as const)('%s は %s として %d 文字まで', (field, label, max) => {
    // Arrange
    const justFit = 'あ'.repeat(max);
    const tooLong = 'あ'.repeat(max + 1);

    // Act / Assert
    expect(GAME_SESSION_OVERRIDE_MAX_LENGTHS[field]).toBe(max);
    expect(getDraftFieldError(field, justFit)).toBeNull();
    expect(getDraftFieldError(field, tooLong)).toBe(
      `${label}は${max}文字以内で入力してください`,
    );
  });

  it('未入力はエラーにしない（上書き項目はすべて任意）', () => {
    // Arrange / Act / Assert
    expect(getDraftFieldError('title', '')).toBeNull();
  });

  // 送信するのは正規化後の値なので、検証も正規化後の長さで数える
  it('時間帯は前後の空白を除いて数える', () => {
    // Arrange
    const padded = `  ${'あ'.repeat(20)}  `;

    // Act / Assert
    expect(getDraftFieldError('timeLabel', padded)).toBeNull();
  });

  // 時間帯以外は生値を送るので、空白も1文字として数える
  it('卓名は前後の空白も数える', () => {
    // Arrange
    const padded = ` ${'あ'.repeat(100)}`;

    // Act / Assert
    expect(getDraftFieldError('title', padded)).not.toBeNull();
  });
});

describe('getDraftFieldCounter', () => {
  it('上限内はカウンターのみ', () => {
    // Arrange / Act
    const counter = getDraftFieldCounter('timeLabel', '19:00〜');

    // Assert
    expect(counter).toEqual({ label: '6 / 20', isOver: false });
  });

  it('超過すると isOver が立つ', () => {
    // Arrange / Act
    const counter = getDraftFieldCounter('timeLabel', 'あ'.repeat(21));

    // Assert
    expect(counter).toEqual({ label: '21 / 20', isOver: true });
  });
});

describe('isDraftValid', () => {
  it('空の下書きは有効', () => {
    // Arrange / Act / Assert
    expect(isDraftValid(emptyDraft)).toBe(true);
  });

  it.each([
    'title',
    'scenarioName',
    'location',
    'timeLabel',
    'description',
  ] as const)('%s が超過していると無効', (field) => {
    // Arrange
    const draft = {
      ...emptyDraft,
      [field]: 'あ'.repeat(GAME_SESSION_OVERRIDE_MAX_LENGTHS[field] + 1),
    };

    // Act / Assert
    expect(isDraftValid(draft)).toBe(false);
  });
});
