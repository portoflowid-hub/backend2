import express from 'express';
import dotenv from 'dotenv';
import connectedDB from './config/db.js';
import userRouter from './router/userRoutes.js';
import adminRouter from './router/adminRoutes.js';
import projectRouter from './router/projectRoutes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();
const app = express();

// Ambil port dari Railway
const PORT = process.env.PORT || 5000;

// Connect DB
await connectedDB();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:3000",               // frontend local dev
      "https://frontend-peach-nu-40.vercel.app/",   // frontend di vercel
    ],
    credentials: true,
  })
);

// Root test route
app.get("/", (req, res) => {
  res.send("Backend API is running");
});

// Routes
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/projects", projectRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
