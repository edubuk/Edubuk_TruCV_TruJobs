import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    logginedMailId:{
        type:String,
        required:true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: Boolean,
      required: true,
      default: false,
    },
    cvSubmittedStatus: {
      type: Boolean,
      default: false,
    },
  });

const couponSchema = new mongoose.Schema({
    code:{
        type:String,
        required:true,
        trim:true,
    },
    transactions:{
        type:[transactionSchema],
        default:[]
    }
})

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;