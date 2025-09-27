import { Router } from "express";
import { adminController, updateSubscriptionPlan } from "../controllers/admin.controller";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken";

const router = Router();

router.get("/getAllUser",verifyGoogleToken, adminController);
router.put("/updateSubscriptionPlan",verifyGoogleToken, updateSubscriptionPlan);

export default router;