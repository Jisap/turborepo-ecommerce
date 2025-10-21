import { FastifyInstance } from "fastify";
import { shouldBeUser } from "../middleware/authMiddleware";
import { Order } from "@repo/order-db";
import { OrderSchemaType } from '../../../../packages/order-db/src/order-model';

export const orderRoute = async (fastify:FastifyInstance) => {
  fastify.get("user-order", { preHandler: shouldBeUser }, async (request, reply) => {
    const orders = await Order.find({ userId: request.userId });
    return reply.send(orders);
  })
  fastify.get("orders", async (request, reply) => {
    const orders = await Order.find();
    return reply.send(orders);
  })
}