import type {
  MyGameSessionPlayMemo,
  SharedGameSessionPlayMemo,
} from '@taku-biyori/shared';

/** Frontend representation of a play memo.  `seatId` is the stable owner key. */
export type MyPlayMemoModel = Omit<
  MyGameSessionPlayMemo,
  'sharedAt' | 'updatedAt'
> & {
  sharedAt: Date | null;
  updatedAt: Date | null;
};
export type SharedPlayMemoModel = Omit<
  SharedGameSessionPlayMemo,
  'sharedAt' | 'updatedAt'
> & {
  sharedAt: Date;
  updatedAt: Date;
};

export const toMyPlayMemoModel = (
  dto: MyGameSessionPlayMemo,
): MyPlayMemoModel => ({
  ...dto,
  sharedAt: dto.sharedAt ? new Date(dto.sharedAt) : null,
  updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
});
export const toSharedPlayMemoModel = (
  dto: SharedGameSessionPlayMemo,
): SharedPlayMemoModel => ({
  ...dto,
  sharedAt: new Date(dto.sharedAt),
  updatedAt: new Date(dto.updatedAt),
});
