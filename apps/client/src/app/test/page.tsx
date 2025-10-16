import { auth } from '@clerk/nextjs/server';
import React from 'react'

const TestPage = async() => {

  const { getToken } = await auth();
  const token = await getToken();
  console.log(token);

  const res = await fetch("http://localhost:8000/test", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
 
  const data = await res.json() ;
  console.log("data",data);

  return (
    <div>test</div>
  )
}

export default TestPage