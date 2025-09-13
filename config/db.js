import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DB_URI = process.env.MONGODB_URI;

async function connectedDB() {
    try {
        const connect = await mongoose.connect(DB_URI);
        console.log(`MongoDB Connected: ${connect.connection.host}`);
    } catch (err) {
        console.error('Failed to connect: ', err);
        process.exit(1);
    }
}

export default connectedDB;