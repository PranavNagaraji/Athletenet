import mongoose from "mongoose";

const connectDB=async ()=>{
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/AthleteNet", {});
        console.log("MongoDB is now connected!");
    }catch(error){
        console.log("MongoDB connection failed!", error.message);
        process.exit();
    }
};

export default connectDB;