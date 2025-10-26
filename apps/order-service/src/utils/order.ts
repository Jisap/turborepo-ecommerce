import { Order } from "@repo/order-db";
import { OrderType } from "@repo/types";
import { producer } from "./kafka";


export const createOrder = async (order: OrderType) => {
  console.log("📝 Creating order with data:", order);
  const newOrder = new Order(order);

  try {
    const savedOrder = await newOrder.save();
    console.log(`✅ Order ${savedOrder._id} created successfully in the database.`);
    
    await producer.send("order.created", {
      email: savedOrder.email,
      amount: savedOrder.amount,
      status: savedOrder.status,
    });
    console.log("📤 Order.created event sent to Kafka");
  } catch (error) {
    console.error("❌ Error saving order:", error);
    throw error;
  }
};