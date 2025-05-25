#!/usr/bin/env bash
set -e
awslocal s3 mb s3://spdcon-meta || true
awslocal kinesis create-stream --stream-name chat-stream --shard-count 1 || true
awslocal kinesis create-stream --stream-name session-stream --shard-count 1 || true
# Signaling channel often fails on LocalStack; ignore error
awslocal kinesisvideo create-signaling-channel --channel-name spdcon --channel-type SINGLE_MASTER || true
