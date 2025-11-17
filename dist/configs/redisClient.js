"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRedisConnection = exports.redisClient = void 0;
const redis_1 = require("@upstash/redis");
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
    console.warn("Missing Upstash Redis config (UPSTASH_REDIS_REST_URL / _TOKEN)");
}
exports.redisClient = new redis_1.Redis({
    url: url || "",
    token: token || "",
});
const testRedisConnection = async () => {
    try {
        await exports.redisClient.set("secureprint:test", "ok", { ex: 10 });
        const result = await exports.redisClient.get("secureprint:test");
        if (result === "ok") {
            console.log(":: Redis (Upstash) ready");
        }
        else {
            console.warn(":: Redis test failed");
        }
    }
    catch (err) {
        console.error(":: Redis connection error:", err);
    }
};
exports.testRedisConnection = testRedisConnection;
