import { serve } from '@hono/node-server'
import { timeStamp } from 'console'
import { Hono } from 'hono'
import { uptime } from 'process'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    timeStamp: Date.now(),
    message: "Payment service is running"
  })
})


const start = async () => {
  try {
    serve({
      fetch: app.fetch,
      port: 8002
    }, (info) => {
      console.log(`Payment service is running on port:${info.port}`)
    })
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

start()
