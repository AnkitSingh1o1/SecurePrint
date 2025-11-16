import { redisClient } from "../configs/redisClient";

export class TokenRepository {
  private static instance: TokenRepository;

  private constructor() {}

  public static getInstance(): TokenRepository {
    if (!TokenRepository.instance) {
      TokenRepository.instance = new TokenRepository();
    }
    return TokenRepository.instance;
  }

  /**
   * Save a token => fileId with TTL (seconds)
   */
  public async save(token: string, fileId: string, ttlSeconds: number) {
    // SET key value EX ttl
    await redisClient.set(token, fileId, { ex: ttlSeconds });
    return true;
  }

  /**
   * Atomically get and delete the token. Returns the fileId string or null.
   * Uses MULTI GET + DEL to avoid race.
   */
  public async consume(token: string): Promise<string | null> {
    // MULTI
    const multi = redisClient.multi();
    multi.get(token);
    multi.del(token);
    const res = await multi.exec(); // res is array of replies
    // res[0] is value from GET
    const getRes = res?.[0];
    if (!getRes) return null;
    return String(getRes);
  }

  /**
   * Peek token without deleting
   */
  public async get(token: string): Promise<string | null> {
    const v = await redisClient.get(token);
    return (v as string) ?? null;
  }

  public async delete(token: string) {
    await redisClient.del(token);
    return true;
  }
}
