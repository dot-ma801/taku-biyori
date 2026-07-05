export const MAX_MEMBERS_MIN = 2;
export const MAX_MEMBERS_MAX = 20;

export function parseMaxMembers(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  const parsed = Number(trimmed);
  const isInRange =
    Number.isInteger(parsed) &&
    parsed >= MAX_MEMBERS_MIN &&
    parsed <= MAX_MEMBERS_MAX;

  return isInRange ? parsed : null;
}

export function getMaxMembersError(value: string): string | undefined {
  if (value.trim() === '') {
    return undefined;
  }

  if (parseMaxMembers(value) === null) {
    return `募集人数は${MAX_MEMBERS_MIN}〜${MAX_MEMBERS_MAX}人の範囲で入力してください`;
  }

  return undefined;
}
