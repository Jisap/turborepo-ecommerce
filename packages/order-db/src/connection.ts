import mongoose from 'mongoose';

let isConnected = false;

export const connectOrderDB = async () => {

  if(isConnected) return;

  if(!process.env.MONGO_URL) {
    throw new Error('MONGO_URL not found')
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    isConnected = true;
    console.log('MongoDB connected')

  } catch (error) {
    console.log(error)
    throw new Error('Error connecting to database')
  }

}