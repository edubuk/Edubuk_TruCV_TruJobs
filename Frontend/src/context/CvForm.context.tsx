import React, { createContext, useContext, useState } from "react";

interface AppState {
  account: string | null;
  isLogin: boolean;
  isFreeCoupon: boolean;
  setFreeCoupon: React.Dispatch<React.SetStateAction<boolean>>;
  setLogin: React.Dispatch<React.SetStateAction<boolean>>;
  setAccount: React.Dispatch<React.SetStateAction<string | null>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  selectedSkills: { skillName: string; skillUrl: string }[];
  setSelectedSkills: React.Dispatch<
    React.SetStateAction<{ skillName: string; skillUrl: string }[]>
  >;
  skillError: string;
  setSkillError: React.Dispatch<React.SetStateAction<string>>;
  showSkillError: boolean;
  setSkillShowError: React.Dispatch<React.SetStateAction<boolean>>;
  // verifications;
  // step1;
  personalDetailsVerifications: PersonalVerificationsType;
  setPersonalDetailsVerifications: React.Dispatch<
    React.SetStateAction<PersonalVerificationsType>
  >;
  educationVerifications: EducationVerificationsType;
  setEducationVerifications: React.Dispatch<
    React.SetStateAction<EducationVerificationsType>
  >;
  skillsVerification: SkillsVerificationType;
  setSkillsVerification: React.Dispatch<
    React.SetStateAction<SkillsVerificationType>
  >;
  AwardVerification: SkillsVerificationType;
  setAwardVerification: React.Dispatch<
    React.SetStateAction<SkillsVerificationType>
  >;
  courseVerification: SkillsVerificationType;
  setCourseVerification: React.Dispatch<
    React.SetStateAction<SkillsVerificationType>
  >;
  projectVerification: SkillsVerificationType;
  setProjectVerification: React.Dispatch<
    React.SetStateAction<SkillsVerificationType>
  >;
  profileSummaryVerification: ProfileSummaryVerificationType;
  setProfileSummaryVerification: React.Dispatch<
    React.SetStateAction<ProfileSummaryVerificationType>
  >;
}
type PersonalVerificationsType = {
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
type ProfileSummaryVerificationType = {
  profile_summary: {
    isSelfAttested: boolean;
  };
};
type EducationVerificationsType = {
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
type VerificationType = {
  isSelfAttested: boolean;
  proof: any[];
  mailStatus: string;
};

type SkillsVerificationType = {
  [key: string]: VerificationType;
};

const AppContext = createContext<AppState | undefined>(undefined);

export const CvFomContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [step, setStep] = useState<number>(1);
  const [isLogin, setLogin] = useState<boolean>(false);
  const [isFreeCoupon, setFreeCoupon] = useState<boolean>(false);
  const [selectedSkills, setSelectedSkills] = useState<
    { skillName: string; skillUrl: string }[]
  >(() => {
    const demo = localStorage.getItem("step4CvData");
    const parsedDemo = JSON.parse(demo!);
    return parsedDemo?.Skills?.length > 0 ? parsedDemo?.Skills : [];
  });
  const [skillError, setSkillError] = useState("");
  const [showSkillError, setSkillShowError] = useState(false);
  const [account, setAccount] = useState<string | null>("");
  const [personalDetailsVerifications, setPersonalDetailsVerifications] =
    useState<PersonalVerificationsType>({
      name: {
        isSelfAttested: false,
      },
      email: {
        isSelfAttested: false,
      },
      location: {
        isSelfAttested: false,
      },
      profession: {
        isSelfAttested: false,
      },
      imageUrl: {
        isSelfAttested: false,
      },
      phoneNumber: {
        isSelfAttested: false,
      },
    });
  const [educationVerifications, setEducationVerifications] =
    useState<EducationVerificationsType>({
      class10: {
        isSelfAttested: false,
        proof: [],
        mailStatus: "",
      },
      class12: {
        isSelfAttested: false,
        proof: [],
        mailStatus: "",
      },
      undergraduation: {
        isSelfAttested: false,
        proof: [],
        mailStatus: "",
      },
      postgraduation: {
        isSelfAttested: false,
        proof: [],
        mailStatus: "",
      },
    });
  const [skillsVerification, setSkillsVerification] =
    useState<SkillsVerificationType>({});
  const [AwardVerification, setAwardVerification] =
    useState<SkillsVerificationType>({});
  const [courseVerification, setCourseVerification] =
    useState<SkillsVerificationType>({});
  const [projectVerification, setProjectVerification] =
    useState<SkillsVerificationType>({});
  const [profileSummaryVerification, setProfileSummaryVerification] =
    useState<ProfileSummaryVerificationType>({
      profile_summary: {
        isSelfAttested: false,
      },
    });
  return (
    <AppContext.Provider
      value={{
        step,
        setStep,
        selectedSkills,
        setSelectedSkills,
        skillError,
        setSkillError,
        showSkillError,
        setSkillShowError,
        personalDetailsVerifications,
        setPersonalDetailsVerifications,
        educationVerifications,
        setEducationVerifications,
        skillsVerification,
        setSkillsVerification,
        AwardVerification,
        setAwardVerification,
        courseVerification,
        setCourseVerification,
        projectVerification,
        setProjectVerification,
        profileSummaryVerification,
        setProfileSummaryVerification,
        setAccount,
        account,
        isLogin,
        setLogin,
        setFreeCoupon,
        isFreeCoupon,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useCvFromContext = (): AppState => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "Error:useCvFormContext must be used within CvFomContextProvider"
    );
  }

  return context;
};
