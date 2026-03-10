import express from "express";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import athleteRouter from "./routes/athleteRoutes.js";
import coachRouter from "./routes/coachRoutes.js";
import clubRouter from "./routes/clubRoutes.js";
import joinRequestRouter from "./routes/joinRequestRoutes.js";
import teamRouter from "./routes/teamRoutes.js";
import playGroundRouter from "./routes/playGroundRoutes.js";
import playGroundBookingRouter from "./routes/playGroundBookingRoutes.js";
import competitionRouter from "./routes/competitionRoutes.js";

import "dotenv/config";

connectDB();
const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/athlete', athleteRouter);
app.use('/api/coach', coachRouter);
app.use('/api/club', clubRouter);
app.use('/api/join-request', joinRequestRouter);
app.use('/api/team', teamRouter);
app.use('/api/playground', playGroundRouter);
app.use('/api/booking', playGroundBookingRouter);
app.use('/api/competition', competitionRouter);

app.listen(5000, () => {
  console.log(`Server is running on port ${port}`);
});