import { FastifyInstance } from "fastify";
import { shouldBeAdmin, shouldBeUser } from "../middleware/authMiddleware";
import { Order } from "@repo/order-db";
import { startOfMonth, subMonths } from "date-fns";
import { OrderChartType } from "@repo/types";



export const orderRoute = async (fastify:FastifyInstance) => {
  fastify.get("/user-orders", { preHandler: shouldBeUser }, async (request, reply) => {
    const orders = await Order.find({ userId: request.userId });
    return reply.send(orders);
  });

  fastify.get("/orders", { preHandler: shouldBeAdmin }, async (request, reply) => {
    const { limit } = request.query as { limit: number };
    const orders = await Order.find().limit(limit).sort({ createdAt: -1 });
    return reply.send(orders);
  });

  fastify.get("/order-chart", { preHandler: shouldBeAdmin }, async (request, reply) => {
    const now = new Date();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    // { month: "April", total: 173, successful: 100 } Asi deben lucir los datos de los meses anteriores

    // La variable raw almacena el resultado de una consulta de agregación a la base de datos de MongoDB,
    // El objetivo de esta consulta es recopilar y estructurar datos sobre los pedidos de los últimos 6 meses para,
    // mostrarlos en un gráfico
    const raw = await Order.aggregate([
      {
        $match: {                                                   // Filtrado de datos
          createdAt: { $gte: sixMonthsAgo, $lte: now },             // Filtra todos los documentos de la colección "Order" de los últimos 6 meses
        },
      },
      {
        $group: {                                                   // Agrupación de datos
          _id: {                                                    // Agrupa todos los pedidos que pasaron el filtro anterior por el año y el mes en que fueron creados
            year: { $year: "$createdAt" },                        
            month: { $month: "$createdAt" },                      
          },
          total: { $sum: 1 },                                       // Para cada grupo (cada mes), cuenta el número total de pedidos.
          successful: {                                             // También para cada grupo, cuenta cuántos pedidos fueron exitosos. 
            $sum: {                                                 // Lo hace sumando 1 si el campo status del pedido es igual a "success", y 0 si no lo es.
              $cond: [{ $eq: ["$status", "success"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {                                                  // Este paso define la estructura final de los documentos que se devolverán.
          _id: 0,                                                    // Elimina el campo _id
          year: "$_id.year",                                         // Crea campos nuevos extrayendolos del campo _id del grupo "year"
          month: "$_id.month",                                       // y "month"
          total: 1,                                                  // Incluye los campos "total" y "successful"
          successful: 1,
        },
      },
      {
        $sort: { year: 1, month: 1 },                                // Ordena los documentos por el año y el mes en orden ascendente
      },
    ]);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const results: OrderChartType[] = [];

    for (let i = 5; i >= 0; i--) {                            // Se recorren los últimos 6 meses y en cada mes
      const d = subMonths(now, i);                            // Se calcula el día 
      const year = d.getFullYear();                           // Se extrae el año del día (año)
      const month = d.getMonth() + 1;                         // Se extrae el mes del día (mes)



      const match = raw.find(                                 // Busca en la base de datos agragegada (raw) el objeto que coincida con el año y el mes
        (item) => item.year === year && item.month === month
      );

      results.push({                                          // Si encuentra una coincidencia se agrega el objeto a la lista de resultados
        month: monthNames[month - 1] as string,
        total: match ? match.total : 0,
        successful: match ? match.successful : 0,
      });
    }

    return reply.send(results);

  })
}
