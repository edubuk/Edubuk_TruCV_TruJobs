import mongoose from "mongoose";

export const MongoConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: "Lisk",
    });
    console.log("MongoDB Connected !");
  } catch (error) {
    console.log("ERROR:While connecting to MongoDB", error);
  }
};
