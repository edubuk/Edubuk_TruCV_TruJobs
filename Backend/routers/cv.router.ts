import { Router } from "express";
import { createCv, getAllCvIds, getCv, getCvByNanoId,verifyDoc } from "../controllers/cv.controller";
import { checkCvSubmittedStatus, checkout, couponVerification, paymentVerification, updateCvSubmittedStatus } from "../controllers/payment.controller";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken";

const router = Router();

router.post("/create",verifyGoogleToken, createCv);
router.get("/getCv/:id", getCv);
router.get("/getCvIds/:email",verifyGoogleToken,getAllCvIds);
router.get("/getCvByNanoId/:nanoId", getCvByNanoId);
router.get("/verifyDoc/:pinataHash/:field/:subfield/:nanoId",verifyDoc);
router.put("/verifyDoc/:pinataHash/:field/:subfield/:nanoId", verifyDoc);
router.get("/coupon_verify/:couponCode",couponVerification);
router.post("/checkout",checkout);
router.post("/payment_verification",paymentVerification);
router.get("/check_cv_status/:paymentId",checkCvSubmittedStatus);
router.put("/update_cv_status",updateCvSubmittedStatus);

export default router;
