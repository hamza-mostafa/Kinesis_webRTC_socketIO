import Redis from "ioredis";
import { cfg } from "./config.js";
export const redis = new Redis(cfg.redisUrl);
