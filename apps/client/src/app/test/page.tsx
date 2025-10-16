import { auth } from '@clerk/nextjs/server';
import React from 'react'

const TestPage = async() => {

  const { getToken } = await auth();
  const token = await getToken();

  // Express
  const resProduct = await fetch("http://localhost:8000/test", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // Fastify
  const dataProduct = await resProduct.json() ;
  console.log("data-Product",dataProduct);
  
  const resOrder = await fetch("http://localhost:8001/test", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
 
  const dataOrder = await resOrder.json() ;
  console.log("data-Order",dataOrder);


  // Hono
  const resPayment = await fetch("http://localhost:8002/test", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const dataPayment = await resPayment.json();
  console.log("data-Payment", dataPayment);




  return (
    <div>test</div>
  )
}

export default TestPage