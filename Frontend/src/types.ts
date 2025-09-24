// Define the type for education object
type EducationType = {
  class10School?: string;
  class10Board?: string;
  class10Grade?: Number;
  class10CertUrl?: string;
  class12College?: string;
  class12Board?: string;
  class12Grade?: Number;
  class12CertUrl?: string;
  underGraduateCollege?: string;
  underGraduateDegree?: string;
  underGraduateGPA?: Number;
  underGraduateDuration?:{
    duration: {
      from: string;
      to: string;
    };
  };
  underGraduateCertUrl?: string;
  postGraduateCollege?: string;
  postGraduateDegree?: string;
  postGraduateGPA?: Number;
  postGraduateDuration?:{
    duration: {
      from: string;
      to: string;
    };
  };
  postGraduateCertUrl?: string;
};

export type ExperienceObjectType = {
  company_name: string;
  description: string;
  duration: {
    from: string;
    to: string;
  };
  job_role: string;
  experienceCertUrl?: string;
};
export type AwardObjectType = {
  award_name: string;
  awarding_organization: string;
  date_of_achievement: string;
  description: string;
  awardCertUrl?: string;
};
export type CourseObjectType = {
  course_name: string;
  organization: string;
  duration: {
    from: string;
    to: string;
  };
  description: string;
  courseCertUrl?: string;
};
export type ProjectObjectType = {
  project_name: string;
  project_url: string;
  duration: {
    from: string;
    to: string;
  };
  description: string;
  projectCertUrl?: string;
};
// Define the type for personal details object
type PersonalDetailsType = {
  name: string;
  email: string;
  location: string;
  profession: string;
  imageUrl: string;
  phoneNumber: string;
  linkedinProfile:string;
  twitterProfile:string;
  telegramProfile:string;
  instagramProfile:string;
  githubProfile:string;
  years_of_experience: string;
};

type AchievementsObjectType = {
  awards: AwardObjectType[] | [];
  courses: CourseObjectType[] | [];
  projects: ProjectObjectType[] | [];
};
export type VerificationType = {
  isSelfAttested: boolean;
  proof: [];
  mailStatus: string;
};

export type PersonalVerificationsType = {
  name: {
    isSelfAttested: boolean;
  };
  email: {
    isSelfAttested: boolean;
  };
  location: {
    isSelfAttested: boolean;
  };
  profession: {
    isSelfAttested: boolean;
  };
  imageUrl: {
    isSelfAttested: boolean;
  };
  phoneNumber: {
    isSelfAttested: boolean;
  };
};
export type EducationVerificationsType = {
  class10: {
    isSelfAttested?: boolean;
    proof?: [];
    mailStatus?: string;
  };
  class12: {
    isSelfAttested?: boolean;
    proof?: [];
    mailStatus?: string;
  };
  undergraduation: {
    isSelfAttested?: boolean;
    proof?: [];
    mailStatus?: string;
  };
  postgraduation: {
    isSelfAttested?: boolean;
    proof?: [];
    mailStatus?: string;
  };
};
export type ExperienceVerificationsType = {
  [key: string]: VerificationType;
};
export type SkillsVerificationType = {
  [key: string]: VerificationType;
};
export type AwardVerificationType = {
  [key: string]: VerificationType;
};
export type CourseVerificationType = {
  [key: string]: VerificationType;
};
export type ProjectVerificationType = {
  [key: string]: VerificationType;
};
export type ProfileSummaryVerificationType = {
  profile_summary: {
    isSelfAttested: boolean;
  };
};
// Main data type with personal details and education
export type Cv_resoponse_type = {
  nanoId: string;
  personalDetails: PersonalDetailsType;
  education: EducationType;
  experience: ExperienceObjectType[] | [];
  skills: any[] | [];
  achievements: AchievementsObjectType;
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
};



