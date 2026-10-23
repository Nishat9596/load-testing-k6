# Load test summary – profile: stress

| Metric | Value |
|---|---|
| Requests | 3333 |
| Requests per second | 54.7 |
| Peak virtual users | 100 |
| Average response time | 79 ms |
| 95th percentile | 179 ms |
| Max response time | 201 ms |
| Error rate | 0.00% |
| Checks passed | 100.00% |

## Thresholds

| Metric | Threshold | Result |
|---|---|---|
| `wrong_intent` | `rate<0.01` | Pass |
| `http_req_failed` | `rate<0.01` | Pass |
| `http_req_duration` | `p(95)<500` | Pass |
| `http_req_duration` | `p(99)<1000` | Pass |
| `chat_latency{intent:order}` | `p(95)<400` | Pass |
| `checks` | `rate>0.99` | Pass |
