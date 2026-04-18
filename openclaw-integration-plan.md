# OpenClaw Integration Plan

## Goal

Make Memory Hub the durable memory layer for OpenClaw without replacing OpenClaw's existing workspace memory files.

## Near-term approach

- continue writing raw memory to `memory/*.md`
- ingest those files into the normalized memory store
- preserve source paths and excerpts
- enrich the graph with entities, topics, and conversations

## Mid-term approach

Add an adapter that can:
- read session summaries
- import message/channel metadata
- classify memories into people, projects, decisions, and topics
- emit structured memory records for the hub

## Long-term approach

Use Memory Hub as a retrieval layer for OpenClaw:
- lookup related entities before replying
- show source-linked memory suggestions
- surface prior conversations, files, and decisions across platforms

## Safe boundary

OpenClaw should remain the active assistant runtime.
Memory Hub should remain the durable, inspectable, user-browseable memory system.
