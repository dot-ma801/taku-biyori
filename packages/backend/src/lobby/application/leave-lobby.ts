import { LobbyStatus } from '@taku-biyori/shared';

export interface LeaveLobbyRepository {
  findMemberOwner(
    memberId: string,
  ): Promise<{ lobbyId: string; userId: string | null } | null>;
  findHostUserId(id: string): Promise<string | null>;
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  deleteMemberById(memberId: string): Promise<void>;
}

export type LeaveLobbyResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'hostCannotLeave' }
  | { type: 'invalidStatus' };

// 退出可能なステータスは open / scheduling のみ。
// game-session 側の leaveGameSession は open 以外をすべて禁止する実装だが（既知のバグ）、
// design-v1.1 §6 が要求するのは「確定済み・中止済みは 409」のみのため、
// open と scheduling の両方を許可する。
const LEAVABLE_STATUSES: LobbyStatus[] = [
  LobbyStatus.open,
  LobbyStatus.scheduling,
];

export const leaveLobby = async (
  repo: LeaveLobbyRepository,
  lobbyId: string,
  memberId: string,
  userId: string,
): Promise<LeaveLobbyResult> => {
  const memberOwner = await repo.findMemberOwner(memberId);
  if (!memberOwner || memberOwner.lobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  const status = await repo.findLobbyStatus(lobbyId);
  if (status === null || !LEAVABLE_STATUSES.includes(status)) {
    return { type: 'invalidStatus' };
  }

  const hostUserId = await repo.findHostUserId(lobbyId);
  const isHost = hostUserId === userId;
  const isSelf = memberOwner.userId === userId;

  if (!isHost && !isSelf) return { type: 'forbidden' };

  // ホストは退出不可
  if (memberOwner.userId === hostUserId) return { type: 'hostCannotLeave' };

  await repo.deleteMemberById(memberId);
  return { type: 'ok' };
};
