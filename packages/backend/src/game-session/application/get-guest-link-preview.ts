import type { GameSession } from '@taku-biyori/shared';

export interface GetGuestLinkPreviewRepository {
  findByGuestLinkToken(token: string): Promise<GameSession | null>;
}

export type GetGuestLinkPreviewResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' };

export const getGuestLinkPreview = async (
  repo: GetGuestLinkPreviewRepository,
  token: string,
): Promise<GetGuestLinkPreviewResult> => {
  const gameSession = await repo.findByGuestLinkToken(token);
  if (!gameSession) return { type: 'notFound' };
  return { type: 'ok', gameSession };
};
