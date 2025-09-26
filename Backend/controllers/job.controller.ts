// controllers/jobController.ts
import { Request, Response } from "express";
import { Job} from "../models/hr.model";
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
/**
 * Create Job (must be an approved HR)
 * - req.user should identify the HR (req.user.id)
 * - body contains job fields (title, description, salary, etc.)
 */
// Create Job - requires ensureAuthenticatedGoogle + attachHR + ensureApprovedHR
export const createJob = async (req: Request, res: Response) => {
    try {
      const hr = req.hr;
      if (!hr) return res.status(401).json({ error: "Unauthorized" });
      if (hr.status !== "approved") return res.status(403).json({ error: "HR not approved" });
  
      const {
        title, company, location, role,
        employmentType, isRemote, salary, description,
        job_description_id,
        applyUrl, tags, status
      } = req.body;
  
      if (!title || !company || !description) {
        return res.status(400).json({ error: "Missing required fields: title, company, description" });
      }
  
      const job = await Job.create({
        title,
        company,
        job_description_id,
        location,
        role,
        employmentType,
        isRemote: !!isRemote,
        salary,
        description,
        applyUrl: applyUrl || [],
        postedBy: hr._id,
        status: status || "open",
        tags: tags || []
      });
  
      // attach to hr.jobs
      hr.jobs = hr.jobs || [];
      hr.jobs.push(job._id);
      await hr.save();
  
      return res.status(201).json({ message: "Job posted", job });
    } catch (err) {
      console.error("createJob:", err);
      return res.status(500).json({ error: "Server error" });
    }
  };

/**
 * List Jobs (public)
 * Supports:
 *  - pagination: ?page=1&limit=20
 *  - text search: ?q=engineer
 *  - filters: ?location=Bangalore&isRemote=true&employmentType=full-time&status=open
 *  - sort: ?sort=postedAt:desc (format: field:dir)
 */
export const listJobs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const skip = (page - 1) * limit;

    const q = String(req.query.q || "").trim();
    const location = req.query.location ? String(req.query.location) : undefined;
    const isRemote = req.query.isRemote !== undefined ? (String(req.query.isRemote) === "true") : undefined;
    const employmentType = req.query.employmentType ? String(req.query.employmentType) : undefined;
    const status = req.query.status ? String(req.query.status) : "open";

    const filters: any = {};
    if (status) filters.status = status;
    if (location) filters.location = { $regex: new RegExp(location, "i") };
    if (typeof isRemote === "boolean") filters.isRemote = isRemote;
    if (employmentType) filters.employmentType = employmentType;

    const sortParam = String(req.query.sort || "postedAt:desc");
    const [sortField, sortDir] = sortParam.split(":");
    const sortObj: any = {};
    sortObj[sortField || "postedAt"] = sortDir === "asc" ? 1 : -1;

    let query = Job.find(filters).sort(sortObj).skip(skip).limit(limit).populate("postedBy", "name companyName email");

    if (q) {
      // use text search if you created a text index, else fallback to regex search
      query = query.find({ $text: { $search: q } });
    }

    const [jobs, total] = await Promise.all([
      query.exec(),
      Job.countDocuments(filters && !q ? filters : (q ? { $text: { $search: q }, ...filters } : filters))
    ]);

    return res.status(200).json({
      page, limit, total,
      pages: Math.ceil(total / limit),
      jobs
    });

  } catch (err) {
    console.error("listJobs:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * (Optional) Get single job by id
 */
export const getJobById = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId;
    if (!mongoose.Types.ObjectId.isValid(jobId)) return res.status(400).json({ error: "Invalid jobId" });

    const job = await Job.findById(jobId).populate("postedBy", "name companyName email");
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Update views asynchronously if you want (simple increment)
    job.views = (job.views || 0) + 1;
    await job.save();

    return res.status(200).json({ job });
  } catch (err) {
    console.error("getJobById:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getAllJobByHrId = async (req: Request, res: Response) => {
    try {
        console.log("req params", req.params);
        console.log("req query", req.query);
        const hrId = req.query.hrId as string;
        console.log("hrId", hrId);
        if (!mongoose.Types.ObjectId.isValid(hrId)) return res.status(400).json({ error: "Invalid hrId" });
        const jobs = await Job.find({ postedBy: hrId });
        return res.status(200).json({ jobs });
    } catch (err) {
        console.error("getAllJobByHrId:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

export const applyJob = async (req: Request, res: Response) => {
    try {
        const { resume_json, job_description_id } = req.body;
        console.log("resume_json", resume_json);
        console.log("job_description_id", job_description_id);
        if (!resume_json || !job_description_id) return res.status(400).json({ error: "Missing required fields: resume_json, job_description_id" });
        const result = await axios.post(`${process.env.AWS_BASE_URL}/prod/ResumeUpload`, 
          {
            "resume_json":resume_json,
            "job_description_id":job_description_id
          },
          {
            headers:{
              "Content-Type": "application/json",
              "x-api-key": `${process.env.AWS_API_KEY}`
            },
            timeout: 15000,
        });
        console.log("result", result);
        return res.status(200).json({success:true,data:result.data})
    } catch (err:any) {
        console.error("applyJob:", err);
        return res.status(500).json({success:false, error: err?.data?.message || "Server error" });
    }
};

