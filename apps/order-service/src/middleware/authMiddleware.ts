import { FastifyReply, FastifyRequest } from "fastify";
import Clerk from "@clerk/fastify";
import type { CustomJwtSessionClaims } from "@repo/types";



declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}


export const shouldBeUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {

    const auth = Clerk.getAuth(request);
    
    if (!auth?.userId) {
      return reply.status(401).send({ message: "You are not logged in!" });
    }


    request.userId = auth.userId;
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    return reply.status(401).send({ message: "Authentication error" });
  }
};

export const shouldBeAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const auth = Clerk.getAuth(request);

    if (!auth?.userId) {
      return reply.status(401).send({ message: "You are not logged in!" });
    }

    const claims = auth.sessionClaims as CustomJwtSessionClaims;

    if (claims.metadata?.role !== "admin") {
      return reply.status(403).send({ message: "Unauthorized!" });
    }

    request.userId = auth.userId;
    
  } catch (error) {
    console.error('❌ Error en autenticación admin:', error);
    return reply.status(401).send({ message: "Authentication error" });
  }
};