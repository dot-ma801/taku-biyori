export interface GameSessionHostRepository {
  findHostUserId(id: string): Promise<string | null>;
}
