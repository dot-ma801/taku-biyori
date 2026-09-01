/** セッションの表示値のうち、ロビーを既定値として解決するもの（design-v2 §5-5） */
export type GameSessionOverrideFields = {
  title: string | null;
  scenarioName: string | null;
  location: string | null;
  timeLabel: string | null;
};

/** 既定値の出所。`LobbySummary` の部分集合として受け取る */
export type GameSessionDisplayDefaults = {
  title: string;
  scenarioName?: string | null;
  location?: string | null;
};

export type GameSessionDisplay = {
  title: string;
  scenarioName: string | null;
  location: string | null;
  timeLabel: string | null;
};

/**
 * セッションの表示値を解決する（design-v2 §5-5）。
 *
 * API は**上書きの生値（`overrides`）とロビーの既定値（`lobby`）を両方返し、解決はクライアントが行う**。
 * 解決済みの値をサーバーが先回りして持たないのは、`lobby` を返す以上それが冗長になるため（§6-1）。
 * 既定値を DB に書き込まないので、ロビーを改名すると上書きしていないセッションの表示も追随する。
 *
 * **編集フォームの初期値にこの戻り値を使ってはいけない。** 上書きしていない項目にもロビーの値が
 * 入って見え、そのまま保存すると意図しない上書きが発生して以後ロビーに追随しなくなる。
 * フォームには `overrides` の生値を使い、「空欄＝上書きなし」を保つこと。
 *
 * FE と BE で `??` を二重に書かないよう、この関数を両方から呼ぶ（ステータス導出と同じ方針。§4-5）。
 */
export const resolveGameSessionDisplay = (
  session: { overrides: GameSessionOverrideFields },
  lobby: GameSessionDisplayDefaults,
): GameSessionDisplay => ({
  title: session.overrides.title ?? lobby.title,
  scenarioName: session.overrides.scenarioName ?? lobby.scenarioName ?? null,
  location: session.overrides.location ?? lobby.location ?? null,
  // ロビーに対応する既定値が無いため、生値がそのまま表示値になる
  timeLabel: session.overrides.timeLabel,
});
