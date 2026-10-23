# Load test summary – profile: smoke

| Metric | Value |
|---|---|
| Requests | 10 |
| Requests per second | 0.9 |
| Peak virtual users | 1 |
| Average response time | 75 ms |
| 95th percentile | 124 ms |
| Max response time | 127 ms |
| Error rate | 0.00% |
| Checks passed | 100.00% |

## Thresholds

| Metric | Threshold | Result |
|---|---|---|
| `checks` | `rate>0.99` | Pass |
| `wrong_intent` | `rate<0.01` | Pass |
| `chat_latency{intent:order}` | `p(95)<400` | Pass |
| `http_req_duration` | `p(95)<500` | Pass |
| `http_req_duration` | `p(99)<1000` | Pass |
| `http_req_failed` | `rate<0.01` | Pass |
