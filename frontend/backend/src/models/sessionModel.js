import mongoose from "mongoose";
const Msg = new mongoose.Schema({
  from: String,
  message: String,
  ts: { type: Date, default: Date.now },
});
const Session = new mongoose.Schema({
  sessionId: { type: String, index: true, unique: true },
  userA: String,
  userB: String,
  tags: [String],
  startedAt: Date,
  endedAt: Date,
  chat: [Msg],
});
export default mongoose.model("Session", Session);
