"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRepository = void 0;
const redisClient_1 = require("../configs/redisClient");
class TokenRepository {
    constructor() { }
    static getInstance() {
        if (!TokenRepository.instance) {
            TokenRepository.instance = new TokenRepository();
        }
        return TokenRepository.instance;
    }
    /**
     * Save a token => fileId with TTL (seconds)
     */
    async save(token, fileId, ttlSeconds) {
        // SET key value EX ttl
        await redisClient_1.redisClient.set(token, fileId, { ex: ttlSeconds });
        return true;
    }
    /**
     * Atomically get and delete the token. Returns the fileId string or null.
     * Uses MULTI GET + DEL to avoid race.
     */
    async consume(token) {
        // MULTI
        const multi = redisClient_1.redisClient.multi();
        multi.get(token);
        multi.del(token);
        const res = await multi.exec(); // res is array of replies
        // res[0] is value from GET
        const getRes = res?.[0];
        if (!getRes)
            return null;
        return String(getRes);
    }
    /**
     * Peek token without deleting
     */
    async get(token) {
        const v = await redisClient_1.redisClient.get(token);
        return v ?? null;
    }
    async delete(token) {
        await redisClient_1.redisClient.del(token);
        return true;
    }
}
exports.TokenRepository = TokenRepository;
