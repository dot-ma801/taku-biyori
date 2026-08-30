import { randomBytes } from 'node:crypto';
import {
  LobbyAction,
  canPerformLobbyAction,
  type LobbyStatus,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';

export interface RegenerateGuestLinkRepository extends LobbyHostRepository {
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  /** トークンを上書きする。旧トークンは即座に無効になる */
  replaceGuestLinkToken(id: string, token: string): Promise<string | null>;
}

export type RegenerateGuestLinkResult =
  | { type: 'ok'; token: string }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

/**
 * 招待トークンを再発行する（design-v2 §6-12-1）。
 *
 * 新しいリソースを作るわけではない（ロビーの属性の置き換え）ため 201 ではなく 200。
 * 冪等ではなく、呼ぶたびに別のトークンになる。
 */
export const regenerateGuestLink = async (
  repo: RegenerateGuestLinkRepository,
  id: string,
  userId: string,
): Promise<RegenerateGuestLinkResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const status = await repo.findLobbyStatus(id);
  if (
    status === null ||
    !canPerformLobbyAction(LobbyAction.regenerateGuestLink, status, 'host')
  ) {
    return { type: 'invalidStatus' };
  }

  const token = randomBytes(16).toString('base64url');
  const saved = await repo.replaceGuestLinkToken(id, token);
  if (saved === null) return { type: 'notFound' };

  return { type: 'ok', token: saved };
};
