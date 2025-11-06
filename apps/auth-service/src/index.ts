import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { shouldBeUser } from './middleware/authMiddleware';
import userRoute from './routes/user.route';
import { producer } from './utils/kafka';



const app = express();

app.use(cors({
  origin: ["http://localhost:3003"],
  credentials: true,
  //allowedHeaders: ["Authorization", "Content-Type"]
}));

app.use(express.json());
app.use(clerkMiddleware());


app.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timeStamp: Date.now(),
    message: "Payment service is running"
  })
});



app.use("/users", shouldBeUser, userRoute);


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Inter Server Error!" });
});

const start = async () => {
  try {
    await producer.connect();
    app.listen(8003, () => {
      console.log("Auth service is running on 8003");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start()