import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    try {
        await mongoose.connect(uri, {});
        console.log("MongoDB is now connected!");
    } catch (error) {
        console.log("MongoDB connection failed, ", error.message);
        process.exit(1);
    }
};

export default connectDB;