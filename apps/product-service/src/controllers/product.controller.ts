import { Request, Response } from "express";
import { prisma, Prisma } from "@repo/product-db";
import { producer } from "../utils/kafka";
import { StripeProductType } from "@repo/types";

export const createProduct = async (req: Request, res: Response) => {
  
  const data: Prisma.ProductCreateInput = req.body;                            // Obtenemos la data para la creación del producto

  const { colors, images } = data;                                             // Obtenemos las propiedades de la imagen y de los colores del producto
  if (!colors || !Array.isArray(colors) || colors.length === 0) {              // Si no existe el array de colores o es un array vacío, devolvemos un error
    return res.status(400).json({ message: "Colors array is required!" });
  }

  if (!images || typeof images !== "object") {                                 // Si no existe imagen o no es un objeto, devolvemos un error
    return res.status(400).json({ message: "Images object is required!" });
  }

  const missingColors = colors.filter((color) => !(color in images));          // Buscamos los colores que faltan en la imagen

  if (missingColors.length > 0) {                                              // Si hay colores faltantes, devolvemos un error
    return res
      .status(400)
      .json({ message: "Missing images for colors!", missingColors });
  }

  const product = await prisma.product.create({ data });                       // Creamos el producto en la base de datos

  const stripeProduct: StripeProductType = {                                   // Creamos un objeto de tipo StripeProductType
    id: product.id.toString(),
    name: product.name,
    price: product.price,
  };

  // product-service -> payment-service - order-service
  producer.send("product.created", { value: stripeProduct });                  // Enviamos el producto a Kafka para que se registre en Stripe (payment-service/src/utils/subscriptions)
  res.status(201).json(product);                                               // Creado el producto en stripe esperamos a que se efectue el pago -> se emite entonces el topic ""payment.successful""
};                                                                             // y el order-service con su kafka-suscriptions lo procesa y crea el order correspondiente

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: Prisma.ProductUpdateInput = req.body;


  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No data provided" });
  }

  const updatedProduct = await prisma.product.update({
    where: { id: Number(id) },
    data,
  });

  return res.status(200).json(updatedProduct);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedProduct = await prisma.product.delete({
    where: { id: Number(id) },
  });

  producer.send("product.deleted", { value: Number(id) });                     // Enviamos el producto a Kafka para que se registre en Stripe (payment-service/src/utils/subscriptions)

  return res.status(200).json(deletedProduct);
};

export const getProducts = async (req: Request, res: Response) => {
  const { sort, category, search, limit } = req.query; // La función extrae cuatro posibles parámetros de la URL. 

  const orderBy = (() => {
    switch (sort) {
      case "asc":
        return { price: Prisma.SortOrder.asc };
        break;
      case "desc":
        return { price: Prisma.SortOrder.desc };
        break;
      case "oldest":
        return { createdAt: Prisma.SortOrder.asc };
        break;
      default:
        return { createdAt: Prisma.SortOrder.desc };
        break;
    }
  })();

  const products = await prisma.product.findMany({
    where: {
      category: {
        slug: category as string,
      },
      name: {
        contains: search as string,
        mode: "insensitive",
      },
    },
    orderBy,
    take: limit ? Number(limit) : undefined,
  });

  res.status(200).json(products);
};

export const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
  });

  return res.status(200).json(product);
};