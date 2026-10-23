// k6 load test for the chatbot API.
//
// Profiles (choose with -e PROFILE=...):
//   smoke   1 user for 10 s – checks the script and API work
//   load    ramps up to 20 users – normal busy traffic (default)
//   stress  ramps up to 100 users – finds where performance starts to drop
//
// Run: k6 run -e PROFILE=load scripts/chat-load-test.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const PROFILE = __ENV.PROFILE || 'load';

const PROFILES = {
  smoke: [{ duration: '10s', target: 1 }],
  load: [
    { duration: '10s', target: 10 }, // ramp up
    { duration: '20s', target: 20 }, // busy period
    { duration: '10s', target: 0 },  // ramp down
  ],
  stress: [
    { duration: '20s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '10s', target: 0 },
  ],
};

export const options = {
  stages: PROFILES[PROFILE],
  thresholds: {
    http_req_failed: ['rate<0.01'],                    // under 1% errors
    http_req_duration: ['p(95)<500', 'p(99)<1000'],    // 95% under 500 ms
    'chat_latency{intent:order}': ['p(95)<400'],       // slowest intent still fast
    checks: ['rate>0.99'],                             // over 99% of checks pass
    wrong_intent: ['rate<0.01'],                       // bot understands the question
  },
};

const chatLatency = new Trend('chat_latency', true);
const wrongIntent = new Rate('wrong_intent');

// Realistic mix of customer questions (including mixed case and typos).
const QUESTIONS = [
  { message: 'What is your refund policy?', intent: 'refund' },
  { message: 'can i RETURN my shoes', intent: 'refund' },
  { message: 'What are your opening hours?', intent: 'hours' },
  { message: 'are you open on friday', intent: 'hours' },
  { message: 'Where is my order?', intent: 'order' },
  { message: 'track my delivery please', intent: 'order' },
  { message: 'Tell me a joke', intent: 'fallback' },
];

const headers = { 'Content-Type': 'application/json' };

export default function () {
  group('chat – valid questions', () => {
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const res = http.post(`${BASE_URL}/chat`, JSON.stringify({ message: q.message }), { headers, tags: { name: 'POST /chat' } });

    const body = res.status === 200 ? res.json() : {};
    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'reply is not empty': () => typeof body.reply === 'string' && body.reply.length > 0,
    });
    wrongIntent.add(body.intent !== q.intent);
    if (ok) chatLatency.add(res.timings.duration, { intent: q.intent });
  });

  // About 1 in 10 users sends an empty message – the API must reject it cleanly.
  if (Math.random() < 0.1) {
    group('chat – invalid input', () => {
      const res = http.post(`${BASE_URL}/chat`, JSON.stringify({ message: '   ' }), {
        headers,
        tags: { name: 'POST /chat (invalid)' },
        responseCallback: http.expectedStatuses(400),
      });
      check(res, { 'empty message returns 400': (r) => r.status === 400 });
    });
  }

  sleep(Math.random() * 1 + 0.5); // think time between messages: 0.5–1.5 s
}

export function handleSummary(data) {
  const m = data.metrics;
  const ms = (v) => `${v.toFixed(0)} ms`;
  const thresholdRows = Object.entries(m)
    .filter(([, v]) => v.thresholds)
    .flatMap(([name, v]) => Object.entries(v.thresholds).map(([t, r]) => `| \`${name}\` | \`${t}\` | ${r.ok ? 'Pass' : 'FAIL'} |`));

  const summary = [
    `# Load test summary – profile: ${PROFILE}`,
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Requests | ${m.http_reqs.values.count} |`,
    `| Requests per second | ${m.http_reqs.values.rate.toFixed(1)} |`,
    `| Peak virtual users | ${m.vus_max.values.max} |`,
    `| Average response time | ${ms(m.http_req_duration.values.avg)} |`,
    `| 95th percentile | ${ms(m.http_req_duration.values['p(95)'])} |`,
    `| Max response time | ${ms(m.http_req_duration.values.max)} |`,
    `| Error rate | ${(m.http_req_failed.values.rate * 100).toFixed(2)}% |`,
    `| Checks passed | ${(m.checks.values.rate * 100).toFixed(2)}% |`,
    '',
    '## Thresholds',
    '',
    '| Metric | Threshold | Result |',
    '|---|---|---|',
    ...thresholdRows,
    '',
  ].join('\n');

  return {
    stdout: summary + '\n',
    [`results/summary-${PROFILE}.md`]: summary,
    [`results/summary-${PROFILE}.json`]: JSON.stringify(data, null, 2),
  };
}
