import mongoose, { Document, Schema } from "mongoose";
import {
  AwardVerificationType,
  CourseVerificationType,
  EducationVerificationsType,
  ExperienceVerificationsType,
  PersonalVerificationsType,
  ProfileSummaryVerificationType,
  ProjectVerificationType,
  SkillsVerificationType,
} from "../types/verifications.types";

type personalDetailsObjectType = {
  name: string;
  email: string;
  location: string;
  phoneNumber: string;
  profession: string;
  imageUrl: string;
  linkedinProfile?:string;
  twitterProfile?:string;
  telegramProfile?:string;
  instagramProfile?:string;
  githubProfile?:string;
  years_of_experience: string;
};
type EducationObjectType = {
  class10School: string;
  class10Board: string;
  class10Grade: Number;
  class10CertUrl?:string,
  class12College: string;
  class12Board: string;
  class12Grade: Number;
  class12CertUrl?:string;
  underGraduateCollege: string;
  underGraduateDegree: string;
  underGraduateGPA: Number;
  underGraduateCertUrl?:string;
  postGraduateCollege: string;
  postGraduateDegree: string;
  postGraduateGPA: Number;
  postGraduateCertUrl?:string;
};
export type ExperienceObjectType = {
  company_name: string;
  description: string;
  duration: {
    from: string;
    to: string;
  };
  job_role: string;
  experienceCertUrl?:string,
};
export type AwardObjectType = {
  award_name: string;
  awarding_organization: string;
  date_of_achievement: string;
  description: string;
  awardCertUrl?:string,
};
export type CourseObjectType = {
  course_name: string;
  organization: string;
  courseCertUrl?:string,
  duration: {
    from: string;
    to: string;
  };
  description: string;
};
export type ProjectObjectType = {
  project_name: string;
  project_url: string;
  projectCertUrl?:string,
  duration: {
    from: string;
    to: string;
  };
  description: string;
};

export type SkillObjectType = {
  skillName: string;
  skillUrl?:string,
};

interface cvSchemaDataType extends Document {
  nanoId: string;
  personalDetails: personalDetailsObjectType;
  education: EducationObjectType;
  experience: ExperienceObjectType[];
  skills: SkillObjectType[];
  achievements: {
    awards: AwardObjectType[];
    courses: CourseObjectType[];
    projects: ProjectObjectType[];
  };
  profile_summary: string;
  // verifications;
  personalDetailsVerification: PersonalVerificationsType;
  educationVerifications: EducationVerificationsType;
  experienceVerifications: ExperienceVerificationsType;
  skillsVerifications: SkillsVerificationType;
  awardVerifications: AwardVerificationType;
  courseVerifications: CourseVerificationType;
  projectsVerifications: ProjectVerificationType;
  profileSummaryVerification: ProfileSummaryVerificationType;
}

enum statusType {
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
}

const CvSchema: Schema<cvSchemaDataType> = new Schema(
  {
    nanoId: {
      type: String,
      required: true,
    },
    // adding nano id;
    personalDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      location: { type: String, required: true },
      profession: { type: String, required: true },
      imageUrl: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      linkedinProfile:{type:String},
      twitterProfile:{type:String},
      telegramProfile:{type:String},
      instagramProfile:{type:String},
      githubProfile:{type:String},
      years_of_experience: { type: String, required: true },
    },
    education: {
      class10School: { type: String },
      class10Board: { type: String },
      class10Grade: { type: Number },
      class10CertUrl: { type: String},
      class12College: { type: String },
      class12Board: { type: String },
      class12Grade: { type: Number },
      class12CertUrl: { type: String},
      underGraduateCollege: { type: String },
      underGraduateDegree: { type: String },
      underGraduateGPA: { type: Number },
      underGraduateCertUrl: { type: String},
      underGraduateDuration:{
        duration: {
          from: { type: String, required: true },
          to: { type: String, required: true },
        },
      },
      postGraduateCollege: { type: String },
      postGraduateDegree: { type: String },
      postGraduateGPA: { type: Number },
      postGraduateCertUrl: { type: String},
      postGraduateDuration:{
        duration: {
          from: { type: String, required: true },
          to: { type: String, required: true },
        },
      },
    },
    experience: [
      {
        company_name: { type: String, required: true },
        description: { type: String, required: true },
        duration: {
          from: { type: String, required: true },
          to: { type: String },
        },
        job_role: { type: String, required: true },
        experienceCertUrl: { type: String},
      },
    ],
    skills: [{
        skillName: { type: String, required: true },
        skillUrl: { type: String},
      }],
    achievements: {
      awards: [
        {
          award_name: { type: String, required: true },
          awarding_organization: { type: String, required: true },
          date_of_achievement: { type: String, required: true },
          description: { type: String, required: true },
          awardCertUrl: { type: String},
        },
      ],
      courses: [
        {
          course_name: { type: String, required: true },
          organization: { type: String, required: true },
          duration: {
            from: { type: String, required: true },
            to: { type: String, required: true },
          },
          description: { type: String, required: true },
          courseCertUrl: { type: String},
        },
      ],
      projects: [
        {
          project_name: { type: String, required: true },
          project_url: { type: String },
          duration: {
            from: { type: String, required: true },
            to: { type: String, required: true },
          },
          description: { type: String, required: true },
          projectCertUrl:{type:String},
        },
      ],
    },
    profile_summary: { type: String, required: true },
    // verifications;

    // step 1;
    personalDetailsVerification: {
      name: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
      },
      email: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
      },
      location: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
      },
      profession: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
      },
      imageUrl: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
      },
      phoneNumber: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
      },
    },
    // step 2;
    educationVerifications: {
      class10: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },
        // TODO: mail status;
        mailStatus: {
          type: String,
          enum: Object.values(statusType),
          default: statusType.pending,
        }

      },
      class12: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },
        // TODO: mail status;
        mailStatus: {
          type: String,
          enum: Object.values(statusType),
          default: statusType.pending,
        }
      },
      undergraduation: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },
        // TODO: mail status;
        mailStatus: {
          type: String,
          enum: Object.values(statusType),
          default: statusType.pending,
        },

      },
      postgraduation: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },
        // TODO: mail status;
        mailStatus: {
          type: String,
          enum: Object.values(statusType),
          default: statusType.pending,
        }
      },
    },
    // step 3;
    experienceVerifications: {
      type: Map,
      of: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },

        // TODO: mail status;
        mailStatus: {
          type: String,
          enum: Object.values(statusType),
          default: statusType.pending,
        }
      },
    },
    // step 4;
    skillsVerifications: {
      type: Map,
      of: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },

        // TODO: mail status;
        mailStatus: {
          type: String,
          enum: Object.values(statusType),
          default: statusType.pending,
        }
      },
    },
    // step 5;
    //awards verification
    awardVerifications: {
      type: Map,
      of: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },

        // TODO: mail status;
        mailStatus: {
          type: String,
          enum: Object.values(statusType),
          default: statusType.pending,
        }
      },
    },
    //course verification
    courseVerifications: {
      type: Map,
      of: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },

        // TODO: mail status;
        mailStatus: {
          type: String,
          enum: Object.values(statusType),
          default: statusType.pending,
        }
      },
    },
    //project verification
    projectsVerifications: {
      type: Map,
      of: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
        proof: {
          type: [String],
          default: [],
        },
        // TODO: mail status;
      },
    },

    // step 6 profile summary;
    profileSummaryVerification: {
      profile_summary: {
        isSelfAttested: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  { timestamps: true }
);

export const CV = mongoose.model<cvSchemaDataType>("CV", CvSchema);