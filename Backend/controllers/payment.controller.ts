
import crypto from "crypto";
import Coupon from "../models/payment.model";
import { Request,Response } from "express";
import Razorpay from "razorpay";
import { config } from "dotenv";

config();

const keyId = process.env.RZP_KEY_ID;
const keySecret = process.env.RZP_SECRET_KEY;
if (!keyId || !keySecret) {
  throw new Error(
    "Razorpay key ID or secret is missing in environment variables"
  );
}
const instance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export const checkout = async (req:Request,res:Response) => {
  const options = {
    "amount": Number(req.body.amount),
    "currency": "INR",
  };
  
  const order = await instance.orders.create(options);

  res.status(200).json({
    success: true,
    order,
  });
};


export const paymentVerification = async (req:Request, res:Response) => {
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature,couponCode, userMailId } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;
  //console.log("Auth :",isAuthentic)
  if (isAuthentic) {
    if(couponCode)
    {
   let coupon = await Coupon.findOne({code:couponCode})
    if(!coupon)
    {
      coupon = new Coupon({ code: couponCode,transactions:[{logginedMailId:userMailId,paymentId:razorpay_payment_id,paymentStatus:true,cvSubmittedStatus:false}] });
      await coupon.save();
    }
    else{
      coupon.transactions.push({
        logginedMailId:userMailId,
        paymentId:razorpay_payment_id,
        paymentStatus:true,
        cvSubmittedStatus:false
      });
      await coupon.save();
    }
  }else{
    let withoutCoupon = new Coupon({ code:"withoutCode",transactions:[{logginedMailId:userMailId,paymentId:razorpay_payment_id,paymentStatus:true,cvSubmittedStatus:false}] });
      await withoutCoupon.save();
  }
    res.status(200).json({
      success:true,
      paymentId:razorpay_payment_id,
    });
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

export const checkCvSubmittedStatus= async(req:Request,res:Response)=>{
  try {
    const {paymentId}=req.params;
    const coupon = await Coupon.findOne(
      { 'transactions.paymentId': paymentId },
    );
    if(!coupon)
    {
      return res.status(404).json({
        success: false,
        message: "invalid paymentId",
      });
    }

    const transaction = coupon.transactions.find((tx:any)=>tx.paymentId===paymentId);

    if(transaction)
    {
      res.status(200).json({
        success:true,
        value:transaction.cvSubmittedStatus
      })
    }
    else
    {
      res.status(404).json({
        success:false,
        message:`No transaction found with paymentId:${paymentId}`
      })
    }
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the transaction status",
    });
  }
}


export const updateCvSubmittedStatus = async(req:Request,res:Response)=>{
  try {
    const {paymentId} = req.body;
    const updatedCVStatus = await Coupon.findOneAndUpdate(
      { "transactions.paymentId": paymentId },
      {
        $set: {
          "transactions.$.cvSubmittedStatus":true,
        },
      },
      { new: true }
    )
    if(updatedCVStatus)
    {
      res.status(200).json({
        success:true,
        message:"cv submitted successfully",
      })
    }
    else
    {
      res.status(404).json({
        success:false,
        message:"invalid paymentId",
      })
    }
  } catch (error) {
    res.status(501).json({
      success:false,
      message:"something went wrong",
      err:error
    })
  }
}

export const couponVerification= async(req:Request,res:Response)=>{
  try {
    const {couponCode} = req.params;
    console.log("couponcode ",couponCode)
    let currPrice=499;
    switch (couponCode) {
      case "CVPRODIS":
        currPrice=89;
        break;
      case "UPLOADITDIS":
        currPrice=89;
        break;
      case "RESUMEDIS":
        currPrice=89;
        break;
      case "CVCODIS":
        currPrice=89;
        break;
      case "CVUPDIS":
        currPrice=89;
        break;
      case "JOBSAVEDIS":
        currPrice=89;
        break;
      case "PROCVDIS":
        currPrice=89;
        break;
      case "UPLOADDIS":
        currPrice=89;
        break;
      case "CARPRODIS":
        currPrice=89;
        break;
      case "CVUPLOADDIS":
        currPrice=89;
        break;
      case "RESUMEPRODIS":
        currPrice=89;
        break;
      case "DISCOUNTCV":
        currPrice=89;
        break;
      case "CAREERUPDIS":
        currPrice=89;
        break;
      case "JOBSCVDIS":
        currPrice=89;
        break;
      case "UPLOADCVDIS":
        currPrice=89;
        break;
      case "RESPACKDIS":
        currPrice=89;
        break;
      case "CAREERCVDIS":
        currPrice=89;
        break;
      case "CVJOBDIS":
        currPrice=89;
        break;
      default:
      res.status(200).json({
          success:false,
          value:currPrice
        })
    }
    if(currPrice!==499)
    res.status(200).json({
      success:true,
      value:currPrice
    })
  } catch (error) {
    res.status(501).json({
      success:false,
      message:"error while coupon verification",
      error
    })
  }
}


