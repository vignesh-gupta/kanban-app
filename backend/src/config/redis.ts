import { createClient, RedisClientType } from "redis";

console.log("Redis URL", process.env.REDIS_URL || "redis://localhost:6379");

export const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

console.log("Redis client created with URL:", process.env.REDIS_URL);

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    // Don't exit process, app can work without Redis (with limited functionality)
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    console.log("✅ Redis disconnected");
  } catch (error) {
    console.error("❌ Redis disconnection failed:", error);
  }
};
