// Demo chatbot API used as the system under test for load testing.
// No dependencies: run with `node api/chat-server.js` (default port 3000).
// Responses have a small random delay to simulate a model generating an answer.

const http = require('http');

const PORT = process.env.PORT || 3000;
const MAX_LEN = 500;

const INTENTS = [
  { name: 'refund', pattern: /refund|return/i, reply: 'You can return items within 14 days for a full refund.', delayMs: [40, 120] },
  { name: 'hours', pattern: /hours|open|timing/i, reply: 'We are open every day from 10 AM to 10 PM.', delayMs: [30, 90] },
  { name: 'order', pattern: /order|track|delivery/i, reply: 'Please share your 5-digit order number.', delayMs: [80, 200] },
];
const FALLBACK = { name: 'fallback', reply: "Sorry, I didn't understand that. I can help with orders, refunds and store hours.", delayMs: [20, 60] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const between = ([min, max]) => min + Math.random() * (max - min);

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { status: 'ok' });
  if (req.method !== 'POST' || req.url !== '/chat') return send(res, 404, { error: 'Not found' });

  let data = '';
  req.on('data', (c) => (data += c));
  req.on('end', async () => {
    let body;
    try { body = JSON.parse(data); } catch { return send(res, 400, { error: 'Body must be valid JSON' }); }
    const message = body && typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return send(res, 400, { error: 'message is required' });
    if (message.length > MAX_LEN) return send(res, 400, { error: `message must be at most ${MAX_LEN} characters` });

    const intent = INTENTS.find((i) => i.pattern.test(message)) || FALLBACK;
    await sleep(between(intent.delayMs));
    send(res, 200, { intent: intent.name, reply: intent.reply });
  });
});

server.listen(PORT, () => console.log(`Chat API running on http://localhost:${PORT}`));
