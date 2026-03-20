import express, { json } from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
config();
import session from "express-session";
import http from "http";
import connectDB from "./config/db.js";
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});
 connectDB();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
