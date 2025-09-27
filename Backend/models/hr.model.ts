// models/hr-and-job.ts
import mongoose, { Schema, Document, Types } from "mongoose";

/***** Types / Interfaces *****/

/** OAuth provider subdocument */
export interface IOAuthProvider {
  provider: string;            // 'google' | 'github' | etc.
  providerId: string;          // provider unique id (sub)
  email?: string;
  profile?: Record<string, any>;
  emailVerified?: boolean;
  refreshTokenId?: string;     // optional reference to secure token store
  linkedAt?: Date;
}

/** HR (recruiter/admin) interface */
export interface IHR {
  name: string;
  companyName: string;
  mobileNumber?: string;
  address?: string;
  documents?: string[];        // URLs/file ids
  email?: string;
  roles: ("admin" | "recruiter" | "viewer")[];
  status: "pending" | "approved" | "rejected";
  jobs?: Types.ObjectId[];     // references to Job documents
  oauthProviders: IOAuthProvider[];
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHRDocument extends IHR, Document {}

/** Salary structure (optional) */
// export interface ISalary {
//   text?: string;     // fallback freeform (e.g. "Competitive")
// }

/** Job post interface */
export interface IJob {
  title: string;
  company: string;
  job_description_id: string;
  location?: string;
  role?: string;
  employmentType?: "full-time" | "part-time" | "contract" | "internship" | "temporary";
  isRemote?: boolean;
  salary?: string;
  description: string;
  postedAt?: Date;
  applyUrl?: string[];         // multiple ways to apply
  postedBy?: Types.ObjectId;   // HR reference
  status?: "draft" | "open" | "closed" | "paused";
  tags?: string[];
  views?: number;
  applicantsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobDocument extends IJob, Document {}

/***** Sub-schemas & validators *****/

// OAuth subdocument
const OAuthProviderSchema = new Schema<IOAuthProvider>(
  {
    provider: { type: String, required: true, trim: true },
    providerId: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    profile: { type: Schema.Types.Mixed },
    emailVerified: { type: Boolean, default: false },
    refreshTokenId: { type: String },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);


/***** Job schema & model *****/
const JobSchema = new Schema<IJobDocument>(
  {
    title: { type: String, required: true, trim: true, index: true },
    company: { type: String, required: true, trim: true },
    job_description_id: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    role: { type: String, trim: true },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "temporary"],
      default: "full-time",
    },
    isRemote: { type: Boolean, default: false },
    salary: { type: String }, // or a string fallback
    description: { type: String, required: true },
    postedAt: { type: Date, default: Date.now, index: true },
    applyUrl: { type: [String], validate: { validator: (arr: string[]) => arr.every(u => typeof u === "string"), message: "applyUrl must be an array of strings" } },
    postedBy: { type: Schema.Types.ObjectId, ref: "HR", required: false, index: true },
    status: { type: String, enum: ["draft", "open", "closed", "paused"], default: "open" },
    tags: { type: [String], index: true },
    views: { type: Number, default: 0 },
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Useful index for search
JobSchema.index({ title: "text", company: "text", description: "text", tags: "text" });

// Static / instance helpers (examples)
JobSchema.methods.incrementViews = async function () {
  this.views = (this.views || 0) + 1;
  return this.save();
};

const Job = mongoose.models.Job || mongoose.model<IJobDocument>("Job", JobSchema);

/***** HR schema & model *****/
const HRSchema = new Schema<IHRDocument>(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    mobileNumber: {
      type: String,
      validate: {
        validator: (v: string) => !v || /^\+?[0-9\-\s]{7,15}$/.test(v),
        message: (props: any) => `${props.value} is not a valid phone number!`,
      },
    },
    address: { type: String },
    documents: { type: [String], default: [] },
    email: { type: String, lowercase: true, trim: true, index: true },
    roles: { type: [String], enum: ["admin", "recruiter", "viewer"], default: ["recruiter"] },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    jobs: [{ type: Schema.Types.ObjectId, ref: "Job" }],
    oauthProviders: { type: [OAuthProviderSchema], default: [] },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Hide internal fields on JSON
HRSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/** Example helper to attach a newly created job to HR */
HRSchema.methods.addJob = async function (jobData: Partial<IJob>) {
  // `this` is HRDocument
  const job = new Job({ ...jobData, postedBy: this._id });
  await job.save();
  this.jobs = this.jobs || [];
  this.jobs.push(job._id);
  await this.save();
  return job;
};

const HR = mongoose.models.HR || mongoose.model<IHRDocument>("HR", HRSchema);

export { HR, Job };
export default { HR, Job };
