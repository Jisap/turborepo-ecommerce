import type { Kafka, Consumer } from "kafkajs";

/**
 * Crea una abstracción para un consumidor de Kafka.
 *
 * El objetivo es simplificar la suscripción a múltiples topics, asociando
 * un manejador (handler) específico para los mensajes de cada topic.
 *
 * @param kafka - Instancia del cliente Kafka.
 * @param groupId - Identificador del grupo de consumidores. Kafka distribuye las
 *   particiones de un topic entre los consumidores de un mismo grupo.
 * @returns Un objeto con métodos para gestionar el ciclo de vida del consumidor.
 */

export const createConsumer = (kafka: Kafka, groupId: string) => {  
  
  const consumer: Consumer = kafka.consumer({ groupId });                     // Crea la instancia del consumidor, asociándolo a un grupo específico.

  const connect = async () => {
    await consumer.connect();                                                 // Conecta el consumidor al clúster de Kafka.                                             
    console.log("Kafka consumer connected:" + groupId);
  };

  const subscribe = async (                                                   // Suscribe el consumidor a una lista de topics y comienza a procesar mensajes
    topics: {                                                                 // Cada microservicio decide a qué topics quiere suscribirse.
      topicName: string;
      topicHandler: (message: any) => Promise<void>;
    }[]
  ) => {  
    await consumer.subscribe({
      topics: topics.map((topic) => topic.topicName),                         // Se suscribe a todos los topics definidos. `fromBeginning: true` indica
      fromBeginning: true,                                                    // que leerá desde el offset más antiguo si es un grupo nuevo.
    });

    await consumer.run({                                                      // Inicia el bucle de consumo. `eachMessage` es un callback que se
      eachMessage: async ({ topic, partition, message }) => {                 // ejecutará por cada mensaje que llegue de los topics suscritos.
        try {
          
          const topicConfig = topics.find((t) => t.topicName === topic);      // Busca el manejador correspondiente al topic del mensaje.
          if (topicConfig) { 
            const value = message.value?.toString();                          // Deserializa el mensaje (asume que es JSON) y lo pasa al manejador.
            if (value) await topicConfig.topicHandler(JSON.parse(value));
          }
        } catch (error) {
          console.log("Error processing message", error);
        }
      },
    });
  };

  const disconnect = async () => {                                           // Desconecta al consumidor. Esto asegura que se guarden los offsets
    await consumer.disconnect();                                             // y el consumidor abandone el grupo de forma limpia
  };

  return { connect, subscribe, disconnect };
};