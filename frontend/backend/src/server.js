import express from "express";
import http from "http";
import cors from "cors";
import { cfg } from "./config.js";
import mongoose from "mongoose";
import { redis } from "./redis.js";
import Session from "./models/sessionModel.js";
import { enqueue, dequeue, find as findMatch } from "./matcher.js";
import { logger } from "./logger.js";
import { put } from "./kinesis.js";
import { getIce } from "./ice.js";
import { Server } from "socket.io";
import crypto from "crypto";
import { cleanupRedisSession } from "./matcher.js";


await mongoose.connect(cfg.mongoUri);
logger.info("Mongo connected");
redis.on("connect", () => logger.info("Redis connected"));
const app = express();
app.use(cors());
app.use(express.json());
app.post('/login', (req, res) => {
    console.log("BODY", req.body); // debug line
    const { uid, tags } = req.body || {};
    if (!uid || !tags) return res.status(400).json({ error: 'Missing uid or tags' });
    res.json({ token: uid, tags });
  });
app.get("/webrtc-config", async (_, res) => res.json(await getIce()));
const sv = http.createServer(app);
const io = new Server(sv, { cors: { origin: "*" } });
io.use((s, n) => {
  const { token, tags = ["*"] } = s.handshake.auth || {};
  if (!token) return n(new Error("no token"));
  s.uid = token;
  s.tags = tags;
  n();
});
io.on("connection", async (s) => {
    logger.info({ uid: s.uid }, "ws");
    await enqueue(s);
    await tryAllPairs(s);

    s.on("heartbeat", () => refreshActive(s.uid));

    s.on("chat", async ({ msg }) => {
      if (!s.sessionId) return;
      const ses = await Session.findOne({ sessionId: s.sessionId });
      if (!ses) return;
      const m = { from: s.uid, message: msg, ts: new Date() };
      ses.chat.push(m);
      await ses.save();
      await put(cfg.kinesis.chatStream, { ...m, sessionId: s.sessionId });
      io.to(s.sessionId).emit("chat", { from: s.uid, msg });
    });

    s.on("sdp", (d) => s.sessionId && s.to(s.sessionId).emit("sdp", d));

    s.on("ice", (d) => s.sessionId && s.to(s.sessionId).emit("ice", d));

    s.on("disconnect", () => dequeue(s));
  });

async function pair(s) {
  const peerId = await findMatch(s);
  if (!peerId) return;
  const peer = [...io.sockets.sockets.values()].find((x) => x.uid === peerId);
  if (!peer) return;
  const id = crypto.randomUUID();
  [s, peer].forEach((c) => {
    c.sessionId = id;
    c.join(id);
  });
  await Session.create({
    sessionId: id,
    userA: s.uid,
    userB: peer.uid,
    tags: s.tags,
    startedAt: new Date(),
    chat: [],
  });
  io.to(id).emit("paired", { sessionId: id, ttl: cfg.sessionTtl });
  setTimeout(() => end(id), cfg.sessionTtl);
}

async function tryAllPairs(s) {
    for (const tag of s.tags) {
      const ids = await redis.zrange("tags:" + tag, 0, -1);
      for (const uid of ids) {
        const sock = [...io.sockets.sockets.values()].find(x => x.uid === uid);
        if (sock) await pair(sock);
      }
    }
  }
// // disconnect only
// async function end(id) {
//   io.to(id).emit("session-ended");
//   io.in(id).disconnectSockets();
//   await Session.updateOne({ sessionId: id }, { endedAt: new Date() });
//   await put(cfg.kinesis.sessionStream, { sessionId: id, endedAt: new Date() });
// }

async function end(id) {
  io.to(id).emit("session-ended");
  await Session.updateOne({ sessionId: id }, { endedAt: new Date() });
  await put(cfg.kinesis.sessionStream, { sessionId: id, endedAt: new Date() });

  await cleanupRedisSession(id);

  const room = io.sockets.adapter.rooms.get(id);
  if (room) {
    for (const socketId of room) {
      const s = io.sockets.sockets.get(socketId);
      if (s && s.connected) {
        delete s.sessionId;
        await enqueue(s);
        pair(s);
      }
    }
  }
}
sv.listen(cfg.port, "0.0.0.0", () => logger.info("HTTP " + cfg.port));
