import { AccessTokenRecord } from "../models/token";

export class TokenRepository {
  private static instance: TokenRepository;
  private readonly tokens: AccessTokenRecord[] = [];

  private constructor() {}

  public static getInstance(): TokenRepository {
    if (!TokenRepository.instance) {
      TokenRepository.instance = new TokenRepository();
    }
    return TokenRepository.instance;
  }

  public saveToken(token: AccessTokenRecord) {
    this.tokens.push(token);
    return token;
  }

  public getToken(token: string) {
    return this.tokens.find(t => t.token === token);
  }

  public markUsed(token: string) {
    const t = this.getToken(token);
    if (t) t.used = true;
  }
}
