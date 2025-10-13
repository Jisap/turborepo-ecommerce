import Fastify from 'fastify';

const fastify = Fastify();

fastify.get('/health', (request, reply) => {
  return reply.status(200).send({
    status: "ok",
    uptime: process.uptime(),
    timeStamp: Date.now(),
    message: "Payment service is running"
  })
});

const start = async () => {
  try {
    await fastify.listen({ port: 8001 });
    console.log(`Order Service is listening on port 8001`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);  
  }
}

start()