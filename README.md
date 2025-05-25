# Speed Connect – Cloud-Native 1:1 Video Networking

A robust, cloud-ready template for real-time 1:1 video and chat, using Node.js/React, AWS-managed WebRTC (Kinesis Video Streams), ECS, and CI/CD best practices.

---

## Features

- Instant, tag-based user matching
- Encrypted 1:1 video chat (WebRTC + AWS KVS signaling/TURN/STUN)
- Auto-disconnect after 5 minutes
- Real-time chat
- Stateless, scalable, analytics-ready

---

## Architecture

### Flowchart Diagram

```mermaid
flowchart LR
    UA["User A (Browser)"] -- WebRTC Signaling --> KVS["Kinesis Video Streams (Signaling/TURN/STUN)"]
    UB["User B (Browser)"] -- WebRTC Signaling --> KVS
    UA -- Media (SRTP/DTLS) --- UB
    UA -- REST/AUTH/WS/SIGNALING --> BE[Backend<br>Node.js/Express/Socket.IO]
    UB -- REST/AUTH/WS/fetch ICE,SDP --> BE
    BE -- Redis --> R[Redis]
    BE -- Session Logs --> M[MongoDB Atlas]
```

### Sequence Diagram

```mermaid
sequenceDiagram
    participant UserA as User A (Browser)
    participant UserB as User B (Browser)
    participant Backend as Node.js/Express/Socket.IO
    participant Redis as Redis (Queue)
    participant Mongo as MongoDB (Session/Log)
    participant KDS as Kinesis Data Streams (Analytics)
    participant KVS as Kinesis Video Streams (WebRTC)
    participant TURN as AWS TURN Server (via KVS)

    %% Auth and Pairing
    UserA->>Backend: 1. POST /login (get token)
    UserB->>Backend: 2. POST /login (get token)
    UserA->>Backend: 3. Connect WebSocket/Socket.IO
    UserB->>Backend: 4. Connect WebSocket/Socket.IO
    Backend->>Redis: 5. Enqueue users, pair by tags
    Backend-->>UserA: 6. "paired" response (send KVS channel info)
    Backend-->>UserB: 6. "paired" response (send KVS channel info)

    %% WebRTC Signaling via KVS
    UserA->>KVS: 7. Connect to Signaling Channel
    UserB->>KVS: 7. Connect to Signaling Channel
    UserA->>KVS: 8. Send SDP/ICE candidate (WebRTC Offer)
    KVS->>UserB: 9. Forward SDP/ICE (Offer)
    UserB->>KVS: 10. Respond with SDP/ICE (Answer)
    KVS->>UserA: 11. Forward SDP/ICE (Answer)

    %% ICE Gathering / TURN usage
    UserA->>KVS: 12. Request ICE servers (STUN/TURN info)
    KVS->>UserA: 13. Provide ICE/TURN credentials
    UserB->>KVS: 12. Request ICE servers (STUN/TURN info)
    KVS->>UserB: 13. Provide ICE/TURN credentials

    %% If P2P fails, relay via TURN
    UserA->>TURN: 14. Connect via TURN (Encrypted SRTP)
    UserB->>TURN: 14. Connect via TURN (Encrypted SRTP)

    %% Media
    UserA-->>UserB: 15. Media streams (WebRTC, SRTP, DTLS, direct or via TURN)

    %% Chat/Session log persistence
    UserA->>Backend: 16. Chat message (Socket.IO)
    Backend->>UserB: 17. Relay chat message
    Backend->>Mongo: 18. Persist chat/session log
    Backend->>KDS: 19. Stream event/analytics

    %% Session end/timeout
    Backend->>UserA: 20. "session-ended"
    Backend->>UserB: 20. "session-ended"
    Backend->>Mongo: 21. Log session end
    Backend->>KDS: 22. Log session end event
```

---

## Run Locally (Docker Compose)

```sh
git clone &lt;repo-url&gt; speed-connect
cd speed-connect/other
cp .env.example .env   # Edit Mongo, Redis as needed
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

Usage:
- Open two browser tabs, login with different UIDs/tags
- Each sees their own camera; when paired, video and chat are enabled

---

## Cloud Deployment

### CloudFormation Stack

- Deploys KVS WebRTC signaling channel
- ECS Fargate backend (Dockerized)
- ElastiCache Redis
- IAM roles

**Edit your VPC/Subnets, Mongo Atlas URI, and ECR image in parameters.**

```sh
aws cloudformation deploy \
  --stack-name speedconnect-stack \
  --template-file cloudformation.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    BackendImage=&lt;ecr-url&gt; \
    MongoUrl=&lt;mongo-uri&gt; \
    VpcId=&lt;vpc-id&gt; \
    Subnets="subnet-xxxx,subnet-yyyy"
```

---

### GitHub Actions CI/CD

- Auto builds/pushes backend Docker image to ECR
- Deploys/updates CloudFormation stack on `main` branch push

1. Configure secrets:
    - AWS credentials, ECR info, Mongo URI, VPC/Subnets
2. Push to `main` branch—GitHub Actions takes care of build and deployment

---

## How it Works

1. Users login, backend matches on tags/interests
2. Backend provides KVS signaling channel (AWS-managed)
3. WebRTC media streams peer-to-peer or via AWS TURN (SRTP/DTLS encrypted)
4. Chat events relayed via backend, all events/analytics logged

---

## References

- [AWS Kinesis Video Streams WebRTC](https://docs.aws.amazon.com/kinesisvideostreams-webrtc-dg/latest/devguide/what-is-kinesis-video-webrtc.html)
- [ECS Fargate](https://aws.amazon.com/fargate/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [GitHub Actions](https://docs.github.com/en/actions)
- [WebRTC Security](https://webrtc-security.github.io/)

---

*Start local, scale to global in minutes. Built for ops-free video networking.*
