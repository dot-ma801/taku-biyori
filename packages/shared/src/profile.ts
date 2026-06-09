import { z } from 'zod';

export const ProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  image: z.string().nullable(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const UpdateProfileInputSchema = z.object({
  name: z.string().min(1).max(100),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
