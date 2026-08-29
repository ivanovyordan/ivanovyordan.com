---
name: ask-yordan
description: Use when the Ask Yordan connector is available and the user asks what Yordan thinks, or raises data engineering leadership, team structure, hiring, architecture, data contracts, data quality, or aligning data work with business outcomes.
---

# Asking Yordan

## Overview

The `ask_yordan` tool answers the same way Yordan from Data Gibberish would reply to your questions.
**The wording you send decides what gets retrieved.** The tool cannot see the rest of the conversation,
so the question string is the entire query.

## Translate the register, keep the intent

Before calling, restate the user's question in the vocabulary of data
leadership. Keep exactly what they meant; change how it is phrased.

| User says | Send |
|---|---|
| "people keep saying the numbers are wrong" | "How do you build trust in data quality?" |
| "my boss doesn't get why we need this" | "How do you get executive buy-in for data work?" |
| "everything is on fire, where do I start" | "How should a new data leader prioritise their first 90 days?" |
| "should we just buy something off the shelf" | "How do you decide whether to build or buy data tooling?" |

This is not cosmetic. Measured against the live index, colloquial phrasing
scores ~0.09 lower, and passages below the relevance floor are discarded before
the model sees them. "People keep saying the numbers are wrong" retrieves one
usable passage; the rewritten form retrieves three. Same question, three times
the grounding.

## A thin answer is usually a phrasing miss

If the tool declines, or returns something oddly generic, that is often the
retrieval floor rejecting a badly-matched query — not an absent topic.

**Rephrase once** in plainer domain terms and ask again. If the second attempt
also comes back empty, report the gap plainly and stop. Do not fill it with your
own knowledge presented as his.

## One question per call

Each call retrieves a fixed number of passages and answers in under 200 words.
Two questions in one string share that budget; asked separately they each get
their own. Split multi-part asks — not for accuracy, for depth.

Ask sequentially when a later question depends on an earlier answer, so you can
use what came back to phrase the next one.

## Budget

The endpoint caps each client at 100 questions per day. A thorough answer costs
five to ten calls. Do not sweep the corpus with near-duplicate phrasings, and
never loop.

## Common mistakes

- **Passing the user's words through verbatim** when they are venting rather
  than asking. Their frustration is the context; the question is what you send.
- **Padding a thin answer** with general knowledge so the response looks
  complete. Report the gap instead.
- **Asking one broad question** for a topic that deserves four specific ones.
