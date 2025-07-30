const express = require("express");
const promClient = require('prom-client');

const app = express();

// Prometheus metrics setup
const register = promClient.register;
const collectDefaultMetrics = promClient.collectDefaultMetrics;

// Collect default metrics
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    };
    
    httpRequestDurationMicroseconds.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  
  next();
});

app.get("/", (req, res) => {
  res.json({ Message: "Server is fine" });
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

app.listen(8090, () => {
  console.log("server is on 8090");
});
