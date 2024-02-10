import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// when async function is completed a promise is also returned 

const connectDB = async() => {
  try {
    const connetionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`\n MongoDB connected !! DB HOST: ${connetionInstance.connection.host}`);
  } catch (error) {
    console.log("MONGODB Connection error ", error);
    process.exit(1);
  }
}

export default connectDB