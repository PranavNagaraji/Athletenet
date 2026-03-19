import express from "express";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import athleteRouter from "./routes/athleteRoutes.js";
import coachRouter from "./routes/coachRoutes.js";
import clubRouter from "./routes/clubRoutes.js";
import joinRequestRouter from "./routes/joinRequestRoutes.js";
import teamRouter from "./routes/teamRoutes.js";
import playGroundRouter from "./routes/playGroundRoutes.js";
import playGroundBookingRouter from "./routes/playGroundBookingRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import tournamentRouter from "./routes/tournamentRoutes.js";
import postRouter from "./routes/postRoutes.js";
import path from "path";

import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./socket.js";

connectDB();
const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTENDURL,
    credentials: true
  }
});

// Initialize real-time chat
initializeSocket(io);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTENDURL,
  credentials: true
}))

app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/athlete', athleteRouter);
app.use('/api/coach', coachRouter);
app.use('/api/club', clubRouter);
app.use('/api/join-request', joinRequestRouter);
app.use('/api/team', teamRouter);
app.use('/api/playground', playGroundRouter);
app.use('/api/booking', playGroundBookingRouter);
app.use('/api/competition', tournamentRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/chat', chatRouter);
app.use('/api/tournament', tournamentRouter);
app.use('/api/post', postRouter);

// Serve static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

server.listen(port, () => {
  console.log(`Server & WebSockets running on port ${port}`);
});