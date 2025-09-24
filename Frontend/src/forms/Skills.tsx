import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { IoMdCheckmark } from "react-icons/io";
import { AlertCircle, X } from "lucide-react";
import { useCvFromContext } from "@/context/CvForm.context";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatedVerification } from "@/components/ui/AnimatedVerification";
const skills: string[] = [
  "Project management",
  "Software proficiency",
  "Technical writing",
  "Creativity",
  "Data analysis",
  "Leadership",
  "Problem solving",
  "Adaptability",
  "Teamwork",
  "Time management",
  "Cybersecurity",
  "Web development",
  "Ui/Ux design",
];

// type VerificationType = {
//   isSelfAttested: boolean;
//   proof: string;
//   mailStatus: string;
// };

// type SkillsVerificationType = {
//   [key: string]: VerificationType;
// };

const Skills = () => {
  const { control, setValue, getValues } = useFormContext();
  const {
    // selectedSkills,
    setSelectedSkills,
    skillError,
    setSkillError,
    showSkillError,
    setSkillShowError,
    skillsVerification,
    setSkillsVerification,
  } = useCvFromContext();
  const [typerSkill, setTyperSkill] = useState<string>("");
  const [isKeyDown, setIsKeyDown] = useState<boolean>(false);

  console.log("skills verification", skillsVerification);
  console.log("form object", getValues());

  const {
    skillsVerificationsValidations: storedVerification,
    Skills: formSkills,
  } = getValues();

  const localItem = JSON.parse(localStorage.getItem("step4CvData") || "{}");
  console.log(
    "stored skills verifications",
    localItem.skillsVerificationsValidations
  );
  const selectSkillsHandler = (skill: string) => {
    // Check if skill already exists by looking at skillName property
    const skillExists = formSkills.some(
      (selectedSkill: any) => selectedSkill.skillName === skill
    );

    if (!skillExists) {
      if (formSkills.length >= 5) {
        setSkillShowError(true);
        setSkillError("You can only select 5 skills");
        return;
      }
      setSelectedSkills((prev) => [
        ...prev,
        { skillName: skill, skillUrl: "" },
      ]);
      setValue("Skills", [...formSkills, { skillName: skill, skillUrl: "" }]);
      const updatedSKillsVerifications = {
        ...skillsVerification,
        [skill]: {
          isSelfAttested: false,
          proof: [],
          mailStatus: "",
        },
      };
      // setting skills verification object;
      setSkillsVerification(updatedSKillsVerifications);

      setValue("skillsVerifications", updatedSKillsVerifications);
      return;
    }

    setSelectedSkills((prev) =>
      prev.filter((prevSkill) => prevSkill.skillName !== skill)
    );
    // const filteredSkills = selectedSkills.filter(
    //   (prevSkill) => prevSkill !== skill
    // );
    const formFilteredSkills = formSkills.filter(
      (prevSkill: any) => prevSkill.skillName !== skill
    );
    setValue("Skills", formFilteredSkills);
    setSkillsVerification((prev) => {
      let updatedSkillsVerifications = { ...prev };
      delete updatedSkillsVerifications[skill];
      setValue("skillsVerifications", updatedSkillsVerifications);
      return updatedSkillsVerifications;
    });
  };

  const removeSkillHandler = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.filter((prevSkill) => prevSkill.skillName !== skill)
    );
    const formFilteredSkill = formSkills.filter(
      (prevSkill: any) => prevSkill.skillName !== skill
    );
    const filteredSkills = formFilteredSkill.filter(
      (prevSkill: any) => prevSkill.skillName !== skill
    );
    if (filteredSkills.length < 5) {
      setSkillShowError(false);
      setSkillError("");
    }
    setValue("Skills", formFilteredSkill);
    // remove from the sKillsVerificationObject;
    setSkillsVerification((prev) => {
      let updatedSkillsVerification = { ...prev };
      delete updatedSkillsVerification[skill];
      setValue("skillsVerifications", updatedSkillsVerification); //removing skills from the skillsVerifications object on the form object;
      return updatedSkillsVerification;
    });
  };

  // handling typing skill / custom skills;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setIsKeyDown(true);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (formSkills.length >= 5) {
        setTyperSkill("");
        setSkillShowError(true);
        setSkillError("You can only add 5 skills");
        return;
      }

      setSelectedSkills((prev) => [
        ...prev,
        { skillName: typerSkill, skillUrl: "" },
      ]);
      setValue("Skills", [
        ...formSkills,
        { skillName: typerSkill, skillUrl: "" },
      ]);
      const updatedSkillsVerifications = {
        ...skillsVerification,
        [typerSkill]: {
          isSelfAttested: false,
          proof: [],
          mailStatus: "",
        },
      };
      // setting skills verification object;
      setSkillsVerification(updatedSkillsVerifications);
      setValue("skillsVerifications", updatedSkillsVerifications);
      setIsKeyDown(false);
      setTyperSkill("");
    }
  };

  const typeSkillClickHanlder = () => {
    if (formSkills.length >= 5) {
      setSkillShowError(true);
      setSkillError("You can only add 5 skills");
      return;
    }
    setSelectedSkills((prev) => [
      ...prev,
      { skillName: typerSkill, skillUrl: "" },
    ]);
    setValue("Skills", [
      ...formSkills,
      { skillName: typerSkill, skillUrl: "" },
    ]);
    const updatedSkillsVerifications = {
      ...skillsVerification,
      [typerSkill]: {
        isSelfAttested: false,
        proof: [],
        mailStatus: "",
      },
    };
    // setting skills verification object;
    setSkillsVerification(updatedSkillsVerifications);
    setValue("skillsVerifications", updatedSkillsVerifications);
    setTyperSkill("");
  };
  console.log("stores skill verifications", storedVerification);
  console.log("skills are", skills);
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2 px-5 sm:px-10 mt-4">
        <h1 className="text-2xl font-semibold">Skills</h1>
        <h1 className="text-xl font-normal">
          ( Select or add your top 5 skills )
        </h1>
      </div>

      <div className="flex flex-wrap  mt-4 px-2 sm:px-10 gap-5">
        {skills.map((skill) => {
          const skillExist = formSkills.some((s: any) => s.skillName === skill);
          return (
            <Button
              type="button"
              key={skill}
              className={`px-2 sm:px-5 py-1 shadow-md bg-white text-black border border-[#FA9110] hover:bg-white hover:text-black text-sm sm:text-md font-semibold${
                skillExist
                  ? "border-green-500 text-green-600 hover:border-green-500 hover:text-green-600"
                  : "border-[#FA9110]"
              }`}
              onClick={() => selectSkillsHandler(skill)}
            >
              {skillExist && <IoMdCheckmark className="text-lg mr-2 mt-1" />}
              {/* <IoMdCheckmark className="text-lg mr-2 mt-1" /> */}
              {skill}
            </Button>
          );
        })}
      </div>

      {/* FIXME: bug culprit section start----------------- */}
      <div className="flex px-2 sm:px-10">
        <div className="border p-1 rounded-md flex flex-wrap w-full gap-2">
          {formSkills.length > 0 &&
            formSkills.map(({ skillName }: any) => {
              return (
                <Button
                  key={skillName}
                  type="button"
                  className="px-2 sm:px-4  bg-[rgb(0,102,102)] hover:bg-[rgb(0,102,102)] flex items-center text-xs sm:text-base"
                >
                  {skillName}
                  <X
                    type="button"
                    onClick={() => removeSkillHandler(skillName)}
                    size={20}
                    strokeWidth={2}
                    className="ml-2 mt-1"
                  />
                </Button>
              );
            })}
          {/* <Button className="px-4  bg-[rgb(0,102,102)] hover:bg-[rgb(0,102,102)]   flex items-center text-base">
            test
            <X size={20} strokeWidth={2} className="ml-2 mt-1" />
          </Button> */}
          <div className="relative">
            <FormField
              name="Skills"
              control={control}
              render={() => (
                <FormItem>
                  <FormControl>
                    <Input
                      value={typerSkill}
                      onChange={(e) => setTyperSkill(e.target.value)}
                      className="border-none outline-none focus-visible:ring-0 focus-visible:ring-transparent flex-1  min-w-48"
                      placeholder={`Add custom skills`}
                      onKeyDown={handleKeyDown}
                    />
                  </FormControl>
                  {typerSkill && (
                    <div
                      onClick={typeSkillClickHanlder}
                      className={`border border-zinc-300 absolute top-full left-5 px-5  max-w-xl w-full rounded-md cursor-pointer ${
                        isKeyDown ? "bg-[#F4F4F5]" : "bg-white"
                      } py-2  mt-2 overflow-hidden text-wrap z-10`}
                    >
                      <span className="">{typerSkill}</span>
                    </div>
                  )}
                  <FormMessage />
                  {showSkillError && (
                    <p className="text-[0.9rem] font-medium text-red-500">
                      {skillError}
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
      {/* bug culprit section end ----------------- */}

      {/* alert instruction */}
      <div className="px-2 sm:px-10">
        <Alert className="">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention! You need to verify your skills</AlertTitle>
          <AlertDescription>
            Please self-attest, upload the required proof, or send an email to
            the issuer for verification.
          </AlertDescription>
        </Alert>
      </div>
      {/* Animated skills section */}
      <div className="flex flex-col gap-4 sm:px-2">
        {formSkills.map((formSkill: any, i: any) => (
          <FormField
            name={`skillsVerificationsValidations[${formSkill.skillName}]`}
            control={control}
            render={() => (
              <FormItem className="">
                <AnimatedVerification
                  key={i}
                  firstButtonText={formSkill.skillName}
                  field={formSkill.skillName}
                  storedVerifications={storedVerification}
                  verificationObject={skillsVerification}
                  validationStep="skillsVerificationsValidations"
                  setterVerificationObject={setSkillsVerification}
                  verificationStep="skillsVerifications"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default Skills;
