import type { GameSessionStatus } from '@/game-session';

export type GameSessionRole = 'host' | 'member';

export type GameSessionAction =
  | 'leaveSession'
  | 'joinSession'
  | 'inputScheduleResponse'
  | 'addCandidates'
  | 'confirmSchedule'
  | 'editSession'
  | 'publishSession'
  | 'completeSession'
  | 'deleteSession';

type ActionPolicy = {
  roles: GameSessionRole[];
  statuses: GameSessionStatus[];
};

const ALL_STATUSES: GameSessionStatus[] = [
  'draft',
  'open',
  'scheduling',
  'confirmed',
  'today',
  'completed',
];

const ACTION_POLICIES = {
  leaveSession: {
    roles: ['member'],
    statuses: ['open', 'scheduling'],
  },
  joinSession: {
    roles: ['member'],
    statuses: ['open'],
  },
  inputScheduleResponse: {
    roles: ['host', 'member'],
    statuses: ['open', 'scheduling'],
  },
  addCandidates: {
    roles: ['host'],
    statuses: ALL_STATUSES,
  },
  confirmSchedule: {
    roles: ['host'],
    statuses: ['scheduling'],
  },
  editSession: {
    roles: ['host'],
    statuses: ['draft', 'open', 'scheduling'],
  },
  publishSession: {
    roles: ['host'],
    statuses: ['draft'],
  },
  completeSession: {
    roles: ['host'],
    statuses: ['today'],
  },
  deleteSession: {
    roles: ['host'],
    statuses: ['draft'],
  },
} as Record<GameSessionAction, ActionPolicy>;

export function canPerform(
  action: GameSessionAction,
  status: GameSessionStatus,
  role: GameSessionRole,
): boolean {
  const { roles, statuses } = ACTION_POLICIES[action];
  return roles.includes(role) && statuses.includes(status);
}
