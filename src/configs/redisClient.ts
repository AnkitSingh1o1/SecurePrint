import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn("Missing Upstash Redis config (UPSTASH_REDIS_REST_URL / _TOKEN)");
}

export const redisClient = new Redis({
  url: url || "",
  token: token || "",
});

export const testRedisConnection = async () => {
  try {
    await redisClient.set("secureprint:test", "ok", { ex: 10 });
    const result = await redisClient.get("secureprint:test");

    if (result === "ok") {
      console.log(":: Redis (Upstash) ready");
    } else {
      console.warn(":: Redis test failed");
    }
  } catch (err) {
    console.error(":: Redis connection error:", err);
  }
};
