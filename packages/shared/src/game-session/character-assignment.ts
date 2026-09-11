import { z } from 'zod';

/**
 * キャラクター割り当て（`game_session.character_assignments`）。
 * 1着席1割り当て（`seat_id` が UNIQUE。design-v2 §3-9）。
 */
export const CharacterAssignmentSchema = z.object({
  id: z.string().uuid(),
  seatId: z.string().uuid(),
  characterName: z.string().min(1).max(100),
});
export type CharacterAssignment = z.infer<typeof CharacterAssignmentSchema>;
