import { Kafka } from "kafkajs";

export const createKafkaClient = (service: string) => {
  return new Kafka({
    clientId: service,
    brokers: ["localhost:9094", "localhost:9095", "localhost:9096"],
    // retry: {
    //   initialRetryTime: 100, // Tiempo inicial de reintento en ms
    //   retries: 8, // Número de reintentos
    // },
  });
};