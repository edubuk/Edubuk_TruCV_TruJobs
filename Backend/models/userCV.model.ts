import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  subscriptionPlan: "Free" | "Pro";
  paymentId: string;
  couponCode: string;
  documentIds: Types.ObjectId[]; 
  nanoIds: string[];
}

const UserSchema: Schema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  subscriptionPlan: {
    type: String,
    enum: ["Free", "Pro"],
    default: "Free",
  },
  paymentId: {
    type: String,
  },
  couponCode: {
    type: String,
    default: "N/A",
  },
  nanoIds: [{
    type: String,
    unique: true,
  }],
});

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
