import { Request, Response } from "express";
import User from "../models/userCV.model";

export const adminController = async (req:Request,res:Response) => {
    const userData = req.user;
    //console.log("userData",userData);
    const ALLOWED_EMAILS:string[] = process.env.ADMIN_EMAILS?.split(",") || [];
    //console.log("ALLOWED_EMAIL",ALLOWED_EMAIL);
    try {
        console.log("userData",userData);
        
        if(userData?.email && ALLOWED_EMAILS.includes(userData?.email)){
            const getAllUser = await User.find();
            if(!getAllUser){
                return res.status(404).json({message:"No User Found",success:false})
            }
            return res.status(200).json({message:"User Found",data:getAllUser,success:true})
        }
        return res.status(401).json({message:"Unauthorized",success:false})
    } catch (error) {
        console.log("ERROR:ADMIN_CONTROLLER",error)
        return res.status(500).json({message:"Something went wrong",error:error,success:false})
    }
}


export const updateSubscriptionPlan = async (req:Request,res:Response) => {
    const {email,subscriptionPlan} = req.body;
    const userData = req.user;
    //console.log("userData",userData);
    const ALLOWED_EMAILS:string[] = process.env.ADMIN_EMAILS?.split(",") || [];
    //console.log("ALLOWED_EMAIL",ALLOWED_EMAIL);
    try {
        if(email && ALLOWED_EMAILS.includes(userData?.email || "ajeetramverma10@gmail.com")){
            const userProfile = await User.findOneAndUpdate({email:email},{subscriptionPlan:subscriptionPlan,couponCode:""},{new:true});
            if(!userProfile){
                return res.status(404).json({message:"No User Found",success:false})
            }
            return res.status(200).json({message:"User Found",data:userProfile,success:true})
        }
        return res.status(401).json({message:"Unauthorized",success:false})
    } catch (error) {
        console.log("ERROR:ADMIN_CONTROLLER",error)
        return res.status(500).json({message:"Something went wrong",error:error,success:false})
    }
}