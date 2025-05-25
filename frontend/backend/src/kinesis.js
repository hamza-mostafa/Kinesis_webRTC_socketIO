import { KinesisClient, PutRecordCommand } from "@aws-sdk/client-kinesis";
import { cfg } from "./config.js";
const k = new KinesisClient({
  region: cfg.aws.region,
  endpoint: cfg.aws.endpoint,
  credentials: {
    accessKeyId: cfg.aws.accessKeyId,
    secretAccessKey: cfg.aws.secretAccessKey,
  },
});
export const put = (stream, d) =>
  k
    .send(
      new PutRecordCommand({
        StreamName: stream,
        PartitionKey: d.sessionId || d.from,
        Data: Buffer.from(JSON.stringify(d)),
      }),
    )
    .catch(() => {});
