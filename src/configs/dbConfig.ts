import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI!;
    await mongoose.connect(uri, {
      dbName: "SecurePrint"
    });

    console.log(":: MongoDB connected");
  } catch (err) {
    console.error(":: MongoDB connection failed", err);
    process.exit(1);
  }
};
