import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DB_URI = process.env.DB_URI as string;

const connect_mongodb = async (): Promise<void> => {
  try {
    await mongoose.connect(DB_URI);
    console.log("Database Connected SuccessFully");
  } catch (error) {
    console.log("Database Connection Error", error);
    process.exit(1);
  }
};  

export default connect_mongodb;
