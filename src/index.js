// import and execute the .env file to the program because when the application is loaded env file should be the first one that should be available to everyone 

// require('dotenv').config()
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
  path: '../env'
})
// "scripts": {  in order to run above config 
//   "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
// },


connectDB()
.then(() => { //server start 
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is runnning at port : ${process.env.PORT}`);
  })
})
.catch((err) => {
  console.log("mongoDB connection failed!! ", err);
})

/*
import express from "express"
const app = express()

( async() => {
  try {
    await mongoose.connect (`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error", () => {
      console.log("ERROR: ", error);
      throw error
    })

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    })
  } catch (error) {
    console.error("ERROR: ", error)
    throw err
  }
}) ()
*/