import type { Kafka, Producer, ProducerConfig } from "kafkajs";

/**
 * Crea una abstracción de alto nivel para un productor de Kafka.
 *
 * Esta función factoría encapsula la creación y el ciclo de vida de un productor de Kafka,
 * exponiendo únicamente los métodos esenciales para interactuar con él. Esto simplifica
 * su uso en el resto de la aplicación.
 *
 * @param kafka - La instancia del cliente Kafka, ya configurada con los brokers y el `clientId`.
 * @param config - (Opcional) Configuración específica para el productor, como `idempotent` o `transactionalId`.
 * @returns Un objeto que expone los métodos `connect`, `send` y `disconnect` para gestionar el productor.
 */

export const createProducer = (kafka: Kafka, config?: ProducerConfig) => {
  /**
   * Se crea la instancia del productor. `kafkajs` permite configuraciones avanzadas aquí,
   * como la idempotencia (`idempotent: true`) para garantizar que los mensajes no se dupliquen
   * en caso de reintentos, o la configuración transaccional (`transactionalId`).
   */
  const producer: Producer = kafka.producer(config);

  /**
   * Conecta el productor al clúster de Kafka.
   *
   * Este método establece las conexiones TCP con los brokers definidos en el cliente Kafka.
   * Durante la conexión, el productor también puede realizar tareas iniciales como
   * solicitar metadatos del clúster (líderes de partición, etc.).
   * Es un paso asíncrono y obligatorio antes de poder enviar mensajes.
   */
  const connect = async () => {
    await producer.connect();
    console.log("Kafka producer connected");
  };

  /**
   * Serializa y envía un mensaje a un topic específico de Kafka.
   * @param topic - El nombre del topic al que se enviará el mensaje.
   * @param message - El objeto (payload) del mensaje que se va a enviar.
   */
  const send = async (topic: string, message: object) => {
    await producer.send({
      topic,
      messages: [
        {
          /**
           * El `value` del mensaje debe ser un Buffer o un string.
           * Es una práctica común serializar objetos complejos como JSON.
           * El consumidor deberá realizar el proceso inverso (deserializar).
           */
          value: JSON.stringify(message),
        },
      ],
    });
  };

  /**
   * Cierra la conexión del productor con el clúster de Kafka.
   *
   * Este método se debe invocar durante el apagado controlado de la aplicación (graceful shutdown)
   * para asegurar que todos los mensajes en buffer se envíen y se cierren las conexiones limpiamente.
   */
  const disconnect = async () => {
    await producer.disconnect();
    console.log("Kafka producer disconnected");
  };

  // Se retorna un objeto que expone la API simplificada para interactuar con el productor.
  return { connect, send, disconnect };
};
