import express from "express";
import cors from "cors"
import cokkieParser from "cookie-parser"
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



export { app }  

// we mostly use app.use when we want to middleware or configure