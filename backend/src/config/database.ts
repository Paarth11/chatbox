import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

export const connectDatabase = async (): Promise<void> => {
  
  try {
    const mongoURI =process.env.MONGOURI as string

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed", err);
    process.exit(1);
  }
};
