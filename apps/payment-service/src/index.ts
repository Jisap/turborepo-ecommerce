import { serve } from '@hono/node-server'
import { timeStamp } from 'console'
import { Hono } from 'hono'
import { uptime } from 'process'
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { cors } from 'hono/cors';
import { shouldBeUser } from './middleware/authMiddleware.js';
import stripe from './utils/stripe.js';
import sessionRoute from './routes/session.route.js';
import webhookRoute from './routes/webhooks.route.js';
import { consumer, producer } from './utils/kafka.js';
import { runKafkaSubscriptions } from './utils/subscriptions.js';

const app = new Hono();

app.use("*", clerkMiddleware());
app.use("*", cors({ origin: ["http://localhost:3002"] }));

app.get('/health', (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    timeStamp: Date.now(),
    message: "Payment service is running"
  })
})


app.get('/test', shouldBeUser, (c) => {
  return c.json({
    message: "Payment service is authenticated!",
    userId: c.get("userId")
  })

});

app.route("/sessions", sessionRoute);
app.route("/webhooks", webhookRoute);


const start = async () => {
  try {
    Promise.all([await producer.connect(), await consumer.connect()]);
    await runKafkaSubscriptions()
    serve(
      {
        fetch: app.fetch,
        port: 8002,
      },
      (info) => {
        console.log(`Payment service is running on port 8002`);
      }
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
start();
