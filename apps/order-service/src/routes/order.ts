import { FastifyInstance } from "fastify";
import { shouldBeUser } from "../middleware/authMiddleware";
import { Order } from "@repo/order-db";


export const orderRoute = async (fastify:FastifyInstance) => {
  fastify.get("/user-orders", { preHandler: shouldBeUser }, async (request, reply) => {
    const orders = await Order.find({ userId: request.userId });
    return reply.send(orders);
  })
  fastify.get("/orders", async (request, reply) => {
    const orders = await Order.find();
    return reply.send(orders);
  })
}