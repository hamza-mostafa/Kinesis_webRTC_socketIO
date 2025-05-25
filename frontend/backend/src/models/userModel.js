import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  interests: { type: [String], default: [] },
});

export default mongoose.model("User", userSchema);