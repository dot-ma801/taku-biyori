import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { LobbyCandidateDateInput } from '@taku-biyori/shared';
import { useCandidateDateRows } from '@/features/Lobby/Edit/composables/useCandidateDateRows';

describe('useCandidateDateRows', () => {
  describe('selectedDates', () => {
    it('候補日リストから日付だけを取り出す（BaseDatePicker へ渡す形）', () => {
      // Arrange
      const candidates = ref<LobbyCandidateDateInput[]>([
        { date: '2026-08-01', timeNote: '午後から' },
        { date: '2026-08-02', timeNote: null },
      ]);

      // Act
      const { selectedDates } = useCandidateDateRows(candidates, vi.fn());

      // Assert
      expect(selectedDates.value).toEqual(['2026-08-01', '2026-08-02']);
    });
  });

  describe('setDates', () => {
    it('新しく選ばれた日付は時刻メモなしで追加する', () => {
      // Arrange
      const onChange = vi.fn();
      const candidates = ref<LobbyCandidateDateInput[]>([]);
      const { setDates } = useCandidateDateRows(candidates, onChange);

      // Act
      setDates(['2026-08-01']);

      // Assert
      expect(onChange).toHaveBeenCalledWith([
        { date: '2026-08-01', timeNote: null },
      ]);
    });

    // 日付の付け外しのたびにメモが消えると入力し直しになるため、
    // 選択に残っている日付のメモは必ず引き継ぐ。
    it('選択に残る日付の時刻メモは保持する', () => {
      // Arrange
      const onChange = vi.fn();
      const candidates = ref<LobbyCandidateDateInput[]>([
        { date: '2026-08-01', timeNote: '午後から' },
        { date: '2026-08-02', timeNote: '夕方から' },
      ]);
      const { setDates } = useCandidateDateRows(candidates, onChange);

      // Act
      setDates(['2026-08-01', '2026-08-03']);

      // Assert
      expect(onChange).toHaveBeenCalledWith([
        { date: '2026-08-01', timeNote: '午後から' },
        { date: '2026-08-03', timeNote: null },
      ]);
    });

    it('選択から外れた日付は時刻メモごと破棄する', () => {
      // Arrange
      const onChange = vi.fn();
      const candidates = ref<LobbyCandidateDateInput[]>([
        { date: '2026-08-01', timeNote: '午後から' },
      ]);
      const { setDates } = useCandidateDateRows(candidates, onChange);

      // Act
      setDates([]);

      // Assert
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('ピッカーが渡した順序をそのまま保つ', () => {
      // Arrange
      const onChange = vi.fn();
      const candidates = ref<LobbyCandidateDateInput[]>([]);
      const { setDates } = useCandidateDateRows(candidates, onChange);

      // Act
      setDates(['2026-08-03', '2026-08-01']);

      // Assert
      expect(onChange).toHaveBeenCalledWith([
        { date: '2026-08-03', timeNote: null },
        { date: '2026-08-01', timeNote: null },
      ]);
    });
  });

  describe('setTimeNote', () => {
    it('指定した日付の時刻メモだけを更新する', () => {
      // Arrange
      const onChange = vi.fn();
      const candidates = ref<LobbyCandidateDateInput[]>([
        { date: '2026-08-01', timeNote: null },
        { date: '2026-08-02', timeNote: '夕方から' },
      ]);
      const { setTimeNote } = useCandidateDateRows(candidates, onChange);

      // Act
      setTimeNote('2026-08-01', '午後から');

      // Assert
      expect(onChange).toHaveBeenCalledWith([
        { date: '2026-08-01', timeNote: '午後から' },
        { date: '2026-08-02', timeNote: '夕方から' },
      ]);
    });

    it('空文字にすると時刻メモを未入力（null）に戻す', () => {
      // Arrange
      const onChange = vi.fn();
      const candidates = ref<LobbyCandidateDateInput[]>([
        { date: '2026-08-01', timeNote: '午後から' },
      ]);
      const { setTimeNote } = useCandidateDateRows(candidates, onChange);

      // Act
      setTimeNote('2026-08-01', '');

      // Assert
      expect(onChange).toHaveBeenCalledWith([
        { date: '2026-08-01', timeNote: null },
      ]);
    });

    it('存在しない日付を指定しても候補日リストを壊さない', () => {
      // Arrange
      const onChange = vi.fn();
      const candidates = ref<LobbyCandidateDateInput[]>([
        { date: '2026-08-01', timeNote: null },
      ]);
      const { setTimeNote } = useCandidateDateRows(candidates, onChange);

      // Act
      setTimeNote('2026-08-09', '午後から');

      // Assert
      expect(onChange).toHaveBeenCalledWith([
        { date: '2026-08-01', timeNote: null },
      ]);
    });
  });

  describe('removeDate', () => {
    it('指定した日付を候補日リストから除く', () => {
      // Arrange
      const onChange = vi.fn();
      const candidates = ref<LobbyCandidateDateInput[]>([
        { date: '2026-08-01', timeNote: '午後から' },
        { date: '2026-08-02', timeNote: null },
      ]);
      const { removeDate } = useCandidateDateRows(candidates, onChange);

      // Act
      removeDate('2026-08-01');

      // Assert
      expect(onChange).toHaveBeenCalledWith([
        { date: '2026-08-02', timeNote: null },
      ]);
    });
  });

  it('getter で渡しても読み取れる（Ref を要求しない）', () => {
    // Arrange
    const candidates: LobbyCandidateDateInput[] = [
      { date: '2026-08-01', timeNote: null },
    ];

    // Act
    const { selectedDates } = useCandidateDateRows(() => candidates, vi.fn());

    // Assert
    expect(selectedDates.value).toEqual(['2026-08-01']);
  });
});
