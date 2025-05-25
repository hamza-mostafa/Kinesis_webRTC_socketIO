import { redis } from "./redis.js";
import { cfg } from "./config.js";
import Session from "./models/sessionModel.js";

const TAG_PREFIX = "tags:";
const ACTIVE_PREFIX = "active:";

  export async function enqueue(socket) {
    const { uid, tags } = socket;
    for (const tag of tags) {
      await redis.zadd(TAG_PREFIX + tag, Date.now(), uid);
    }
    await redis.set(ACTIVE_PREFIX + uid, 1, "EX", cfg.activeTtl || 60); // 60s TTL by default
  }

  export async function dequeue(socket) {
    const { uid, tags } = socket;
    for (const tag of tags) {
      await redis.zrem(TAG_PREFIX + tag, uid);
    }
    await redis.del(ACTIVE_PREFIX + uid);
  }

export async function find(socket) {
  const { uid, tags } = socket;
  for (const tag of tags) {
    const ids = await redis.zrange(TAG_PREFIX + tag, 0, -1);
    for (const id of ids) {
      if (id === uid) continue;
      const isActive = await redis.exists(ACTIVE_PREFIX + id);
      if (!isActive) continue;
      const removed = await redis.zrem(TAG_PREFIX + tag, uid, id);
      if (removed === 2) {
        await redis.del(ACTIVE_PREFIX + uid, ACTIVE_PREFIX + id);
        return id;
      }
    }
  }
  return null;
}

export async function cleanupRedisSession(sessionId) {
  const session = await Session.findOne({ sessionId });
  if (!session) return;
  const users = [session.userA, session.userB];
  for (const uid of users) {
    await redis.del("wait:" + uid);
    if (session.tags) {
      for (const tag of session.tags) {
        await redis.zrem("tags:" + tag, uid);
      }
    }
  }
}
