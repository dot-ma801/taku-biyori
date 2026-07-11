export interface LobbyHostRepository {
  findHostUserId(id: string): Promise<string | null>;
}
