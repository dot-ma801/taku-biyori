import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useScheduleEditHint } from '@/features/Lobby/Detail/Schedule/useScheduleEditHint';

const MY_ENTRY_ID = 'entry-me';
const GUEST_ENTRY_ID = 'entry-guest';

describe('useScheduleEditHint', () => {
  describe('isEditing', () => {
    it('編集可能なメンバーが1人もいないとき false になる', () => {
      // Arrange & Act
      const { isEditing } = useScheduleEditHint([], MY_ENTRY_ID, 'table');

      // Assert
      expect(isEditing.value).toBe(false);
    });

    it('編集可能なメンバーがいるとき true になる', () => {
      // Arrange & Act
      const { isEditing } = useScheduleEditHint(
        [GUEST_ENTRY_ID],
        null,
        'table',
      );

      // Assert
      expect(isEditing.value).toBe(true);
    });
  });

  describe('isMyAnswerEditable', () => {
    it('自分の列が編集可能なとき true になる', () => {
      // Arrange & Act
      const { isMyAnswerEditable } = useScheduleEditHint(
        [MY_ENTRY_ID],
        MY_ENTRY_ID,
        'table',
      );

      // Assert
      expect(isMyAnswerEditable.value).toBe(true);
    });

    it('ゲスト編集中で自分の列が対象外のとき false になる', () => {
      // Arrange & Act
      const { isMyAnswerEditable } = useScheduleEditHint(
        [GUEST_ENTRY_ID],
        MY_ENTRY_ID,
        'table',
      );

      // Assert
      expect(isMyAnswerEditable.value).toBe(false);
    });

    it('myEntryId が null のとき false になる', () => {
      // Arrange & Act
      const { isMyAnswerEditable } = useScheduleEditHint(
        [GUEST_ENTRY_ID],
        null,
        'table',
      );

      // Assert
      expect(isMyAnswerEditable.value).toBe(false);
    });
  });

  describe('editHint（表表示）', () => {
    it('自分の列を編集中はセルクリックで切り替わる旨を案内する', () => {
      // Arrange & Act
      const { editHint } = useScheduleEditHint(
        [MY_ENTRY_ID],
        MY_ENTRY_ID,
        'table',
      );

      // Assert
      expect(editHint.value).toBe(
        '「あなた」の列のセルをクリックすると ◯ → △ → ✕ の順に切り替わります',
      );
    });

    it('ゲスト編集中はゲストの列を案内する', () => {
      // Arrange & Act
      const { editHint } = useScheduleEditHint(
        [GUEST_ENTRY_ID],
        MY_ENTRY_ID,
        'table',
      );

      // Assert
      expect(editHint.value).toBe(
        'ゲストの列のセルをクリックすると ◯ → △ → ✕ の順に切り替わります',
      );
    });
  });

  describe('editHint（カード表示）', () => {
    it('自分の回答を編集中は「あなたの回答」のタップを案内する', () => {
      // Arrange & Act
      const { editHint } = useScheduleEditHint(
        [MY_ENTRY_ID],
        MY_ENTRY_ID,
        'card',
      );

      // Assert
      expect(editHint.value).toBe(
        '「あなたの回答」をタップすると ◯ → △ → ✕ の順に切り替わります',
      );
    });

    it('ゲスト編集中はゲストのチップのタップを案内する', () => {
      // Arrange & Act
      const { editHint } = useScheduleEditHint(
        [GUEST_ENTRY_ID],
        MY_ENTRY_ID,
        'card',
      );

      // Assert
      expect(editHint.value).toBe(
        'ゲストのチップをタップすると ◯ → △ → ✕ の順に切り替わります',
      );
    });
  });

  describe('リアクティビティ', () => {
    it('getter で渡した編集状態の変化に追従する', () => {
      // Arrange
      const editableEntryIds = ref<string[]>([]);
      const { isEditing, isMyAnswerEditable } = useScheduleEditHint(
        () => editableEntryIds.value,
        MY_ENTRY_ID,
        'table',
      );

      // Act & Assert（編集前）
      expect(isEditing.value).toBe(false);

      // Act
      editableEntryIds.value = [MY_ENTRY_ID];

      // Assert
      expect(isEditing.value).toBe(true);
      expect(isMyAnswerEditable.value).toBe(true);
    });
  });
});
