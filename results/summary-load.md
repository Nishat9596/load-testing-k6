# Load test summary – profile: load

| Metric | Value |
|---|---|
| Requests | 458 |
| Requests per second | 11.2 |
| Peak virtual users | 20 |
| Average response time | 77 ms |
| 95th percentile | 175 ms |
| Max response time | 200 ms |
| Error rate | 0.00% |
| Checks passed | 100.00% |

## Thresholds

| Metric | Threshold | Result |
|---|---|---|
| `http_req_failed` | `rate<0.01` | Pass |
| `wrong_intent` | `rate<0.01` | Pass |
| `http_req_duration` | `p(99)<1000` | Pass |
| `http_req_duration` | `p(95)<500` | Pass |
| `checks` | `rate>0.99` | Pass |
| `chat_latency{intent:order}` | `p(95)<400` | Pass |
