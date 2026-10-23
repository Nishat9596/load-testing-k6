# Load Testing a Chatbot API with k6

![Load Test](https://github.com/Nishat9596/load-testing-k6/actions/workflows/load-test.yml/badge.svg)
![k6](https://img.shields.io/badge/k6-7D64FF?logo=k6&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

Performance testing of a chatbot API with **k6**. The test simulates many customers chatting at the same time and checks that the bot stays **fast, stable and correct** under load.

## What the test does
- Sends a realistic mix of customer questions (refunds, opening hours, order tracking, unknown questions, mixed case)
- About 1 in 10 users sends an empty message to check the API rejects bad input cleanly under load
- Adds think time between messages (0.5–1.5 s), like real users
- Checks **every response**, not just speed: status code, non-empty reply, and that the bot understood the question (correct intent)
- Fails the build automatically if any threshold is missed

## Load profiles

| Profile | Users | Duration | Purpose |
|---|---|---|---|
| `smoke` | 1 | 10 s | Check the script and API work |
| `load` | ramps to 20 | 40 s | Normal busy traffic (runs in CI) |
| `stress` | ramps to 100 | 60 s | Find where performance starts to drop |

## Pass/fail thresholds

| Metric | Threshold | Why |
|---|---|---|
| Error rate | under 1% | Users shouldn't see failures |
| Response time (p95) | under 500 ms | 95% of replies feel instant |
| Response time (p99) | under 1000 ms | Even the slowest replies are acceptable |
| Order-tracking replies (p95) | under 400 ms | Slowest intent still meets target |
| Checks passed | over 99% | Replies are correct, not just fast |
| Wrong intent | under 1% | The bot still understands questions under load |

## Results

| Profile | Requests | Req/s | Peak users | Avg | p95 | Errors | Thresholds |
|---|---|---|---|---|---|---|---|
| smoke | 10 | 0.9 | 1 | 75 ms | 124 ms | 0% | All passed |
| load | 458 | 11.2 | 20 | 77 ms | 175 ms | 0% | All passed |
| stress | 3,333 | 54.7 | 100 | 79 ms | 179 ms | 0% | All passed |

Full summaries are in [`results/`](results/). **Finding:** response times stayed flat from 1 to 100 users (p95 ~175 ms), so the demo API has plenty of headroom. The order-tracking intent is the slowest because it simulates a back-end lookup. That makes it the first place to watch with a real model.

## Run it

```bash
# 1. Start the demo chat API
node api/chat-server.js

# 2. In another terminal, run a profile (install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/)
k6 run -e PROFILE=smoke  scripts/chat-load-test.js
k6 run -e PROFILE=load   scripts/chat-load-test.js
k6 run -e PROFILE=stress scripts/chat-load-test.js

# Test a different server
k6 run -e BASE_URL=https://your-api.example.com scripts/chat-load-test.js
```

Each run writes a Markdown and JSON summary to `results/`. On GitHub you can also run any profile from the **Actions** tab (Run workflow).

## Project structure

```
api/chat-server.js           Demo chat API (Node.js, no dependencies) with simulated model delay
scripts/chat-load-test.js    k6 test: profiles, checks, thresholds, custom metrics, summary report
results/                     Summaries from the runs above
.github/workflows/           CI: starts the API, runs k6, uploads results
```

---
**Nishat Shareef** · QA Tester · Dubai, UAE · [LinkedIn](https://www.linkedin.com/in/nishat-shareef-qa)
