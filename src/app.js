import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN, 
  credentials: true
}))

app.use(express.json({limit: "16kb"})) // limiting the number of json coming
app.use(express.urlencoded({extended: true, limit: "16kb"})) //handling the url 

app.use(express.static("public")) // storing in server 
app.use(cookieParser())

//routes import 

import userRouter from './routes/user.routes.js'

// routes declaration

app.use("/api/v1/users", userRouter)
// http://localhost:8000/api/v1/users/register  => this how app.js tranfers control to userrouter and from there "registration" or "login" is hit


export { app }  
// we upload file thorugh multer and upload it to local server temporarily and upload it to cloudnairy 
// we mostly use app.use when we want to middleware or configure