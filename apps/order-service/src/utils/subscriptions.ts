import { consumer } from "./kafka";
import { createOrder } from "./order";


export const runKafkaSubscriptions = async () => {
  console.log("🔔 Setting up Kafka subscriptions...");
  
  await consumer.subscribe([
    {
      topicName: "payment.successful",
      topicHandler: async (message) => {
        console.log("📨 Received 'payment.successful' message, creating order:", message);
        try {
          await createOrder(message);
        } catch (error) {
          console.error("❌ Error creating order:", error);
        }
      },
    },
  ]);
  
  console.log("✅ Kafka subscriptions set up successfully");
};