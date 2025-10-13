import Fastify from 'fastify';

const fastify = Fastify();

fastify.get('/', (request, reply) => {
  return reply.send('Order endpoint works!');
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