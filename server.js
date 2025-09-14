import express from 'express';
import dotenv from 'dotenv';
import connectedDB from './config/db.js';
import userRouter from './router/userRoutes.js';
import adminRouter from './router/adminRoutes.js';
import projectRouter from './router/projectRoutes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const getUsers = async () => {
  const res = await axios.get(`${API_URL}/api/users`, { withCredentials: true });
  return res.data;
};


dotenv.config();

const app = express();

// const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Backend API is running");
});

await connectedDB();

app.use(
  cors({
    origin: [
      "http://localhost:3000",              // untuk dev lokal
      "https://backend2-production-923e.up.railway.app/",  // domain vercel
    ],
    credentials: true,
  })
);


app.use(express.json());
app.use(cookieParser());
app.use(userRouter);
app.use(adminRouter);
app.use(projectRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});