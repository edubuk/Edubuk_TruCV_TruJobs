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
    mailStatus?:string;
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
