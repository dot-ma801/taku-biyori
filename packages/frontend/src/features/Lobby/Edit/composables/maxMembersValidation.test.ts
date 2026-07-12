import { describe, it, expect } from 'vitest';
import {
  MAX_MEMBERS_MIN,
  MAX_MEMBERS_MAX,
  parseMaxMembers,
  getMaxMembersError,
} from '@/features/Lobby/Edit/composables/maxMembersValidation';

describe('parseMaxMembers', () => {
  it('空文字なら null を返す', () => {
    // Arrange
    const value = '';

    // Act
    const result = parseMaxMembers(value);

    // Assert
    expect(result).toBeNull();
  });

  it('前後に空白がある数値は trim して解釈する', () => {
    // Arrange
    const value = ' 5 ';

    // Act
    const result = parseMaxMembers(value);

    // Assert
    expect(result).toBe(5);
  });

  it('下限未満（1）は null を返す', () => {
    // Arrange
    const value = '1';

    // Act
    const result = parseMaxMembers(value);

    // Assert
    expect(result).toBeNull();
  });

  it('下限（2）は数値を返す', () => {
    // Arrange
    const value = '2';

    // Act
    const result = parseMaxMembers(value);

    // Assert
    expect(result).toBe(2);
  });

  it('上限（20）は数値を返す', () => {
    // Arrange
    const value = '20';

    // Act
    const result = parseMaxMembers(value);

    // Assert
    expect(result).toBe(20);
  });

  it('上限超過（21）は null を返す', () => {
    // Arrange
    const value = '21';

    // Act
    const result = parseMaxMembers(value);

    // Assert
    expect(result).toBeNull();
  });

  it('整数でない値（2.5）は null を返す', () => {
    // Arrange
    const value = '2.5';

    // Act
    const result = parseMaxMembers(value);

    // Assert
    expect(result).toBeNull();
  });

  it('数値でない文字列（abc）は null を返す', () => {
    // Arrange
    const value = 'abc';

    // Act
    const result = parseMaxMembers(value);

    // Assert
    expect(result).toBeNull();
  });
});

describe('getMaxMembersError', () => {
  it('空文字はエラーなし（undefined）を返す', () => {
    // Arrange
    const value = '';

    // Act
    const result = getMaxMembersError(value);

    // Assert
    expect(result).toBeUndefined();
  });

  it('範囲内（2〜20）はエラーなし（undefined）を返す', () => {
    // Arrange & Act & Assert
    expect(getMaxMembersError('2')).toBeUndefined();
    expect(getMaxMembersError('20')).toBeUndefined();
  });

  it('下限未満（1）はエラーメッセージを返す', () => {
    // Arrange
    const value = '1';

    // Act
    const result = getMaxMembersError(value);

    // Assert
    expect(result).toBe(
      `募集人数は${MAX_MEMBERS_MIN}〜${MAX_MEMBERS_MAX}人の範囲で入力してください`,
    );
  });

  it('上限超過（21）はエラーメッセージを返す', () => {
    // Arrange
    const value = '21';

    // Act
    const result = getMaxMembersError(value);

    // Assert
    expect(result).toBe(
      `募集人数は${MAX_MEMBERS_MIN}〜${MAX_MEMBERS_MAX}人の範囲で入力してください`,
    );
  });
});
