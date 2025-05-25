import {
  KinesisVideoSignalingClient,
  GetIceServerConfigCommand,
} from "@aws-sdk/client-kinesis-video-signaling";
import { cfg } from "./config.js";
const kv = new KinesisVideoSignalingClient({
  region: cfg.aws.region,
  endpoint: cfg.aws.endpoint,
  credentials: {
    accessKeyId: cfg.aws.accessKeyId,
    secretAccessKey: cfg.aws.secretAccessKey,
  },
});
export const getIce = async () => {
  try {
    let s =
      (
        await kv.send(
          new GetIceServerConfigCommand({ ChannelARN: cfg.kinesis.channelArn }),
        )
      ).IceServerList || [];
    if (cfg.kinesis.onlyTurn)
      s = s.filter((x) => x.Uris.some((u) => u.startsWith("turn:")));
    if (cfg.kinesis.onlyStun)
      s = s.filter((x) => x.Uris.some((u) => u.startsWith("stun:")));
    return {
      iceServers: s.map((x) => ({
        urls: x.Uris,
        username: x.Username,
        credential: x.Password,
      })),
    };
  } catch {
    return { iceServers: [] };
  }
};
