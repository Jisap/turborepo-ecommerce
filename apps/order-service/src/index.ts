import Fastify from 'fastify';
import Clerk from '@clerk/fastify'
import { shouldBeUser } from './middleware/authMiddleware.js';
import { connectOrderDB } from '@repo/order-db';
import { orderRoute } from './routes/session.js';
import { consumer, producer } from './utils/kafka.js';
import { runKafkaSubscriptions } from './utils/subscriptions.js';




const fastify = Fastify();

fastify.register(Clerk.clerkPlugin);

fastify.register(orderRoute)

fastify.get('/health', (request, reply) => {
  return reply.status(200).send({
    status: "ok",
    uptime: process.uptime(),
    timeStamp: Date.now(),
    message: "Payment service is running"
  })
});

fastify.get("/test", { preHandler: shouldBeUser }, (request, reply) => {
  return reply.send({
    message: "Order service is authenticated!",
    userId: request.userId,
  });
});


const start = async () => {
  try {
    console.log("🚀 Starting Order Service...");
    
    console.log("📦 Connecting to Order DB...");
    await connectOrderDB();
    console.log("✅ Order DB connected");
    
    console.log("📦 Connecting to Kafka...");
    await Promise.all([
      producer.connect(),
      consumer.connect(),
    ]);
    console.log("✅ Kafka connected");
    
    console.log("📡 Setting up Kafka subscriptions...");
    await runKafkaSubscriptions();
    
    console.log("🌐 Starting Fastify server...");
    await fastify.listen({ port: 8001 });
    console.log("✅ Order service is running on port 8001");
  } catch (err) {
    console.error("❌ Error starting service:", err);
    process.exit(1);
  }
};
start();