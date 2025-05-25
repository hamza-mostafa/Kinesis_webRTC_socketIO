import "dotenv/config";
export const cfg = {
  mongoUri: process.env.MONGO_URI,
  redisUrl: process.env.REDIS_URL,
  port: +process.env.PORT || 4000,
  sessionTtl: +process.env.SESSION_TTL_MS || 300000,
  queueTtl: +process.env.QUEUE_TTL_MS || 30000,
  activeTtl: 60,
  aws: {
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  kinesis: {
    chatStream: process.env.KINESIS_CHAT_STREAM,
    sessionStream: process.env.KINESIS_SESSION_STREAM,
    channelArn: process.env.KINESIS_CHANNEL_ARN,
    onlyTurn: process.env.KINESIS_ONLY_TURN === "true",
    onlyStun: process.env.KINESIS_ONLY_STUN === "true",
  },
  jwtSecret: process.env.JWT_SECRET || "dev",
  logLevel: process.env.LOG_LEVEL || "info",
};
