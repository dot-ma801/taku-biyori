import { z } from 'zod';

/** A character assigned to a seat for one game session. */
export const CharacterAssignmentSchema = z.object({
  id: z.string().uuid(),
  seatId: z.string().uuid(),
  characterName: z.string().min(1).max(100),
});
export type CharacterAssignment = z.infer<typeof CharacterAssignmentSchema>;

export const CharacterAssignmentInputSchema = z.object({
  characterName: z.string().min(1).max(100),
});
export type CharacterAssignmentInput = z.infer<
  typeof CharacterAssignmentInputSchema
>;
