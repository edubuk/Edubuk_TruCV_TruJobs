import SelfAttestButton from "@/components/Buttons/SelfAttest";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useCvFromContext } from "@/context/CvForm.context";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
// type ProfileSummaryVerificationType = {
//   profile_summary: {
//     isSelfAttested: boolean;
//   };
// };
const ProfileSummary = () => {
  const { control, setValue, getValues } = useFormContext();
  const { profileSummaryVerification, setProfileSummaryVerification } =
    useCvFromContext();
  console.log(profileSummaryVerification);
  useEffect(() => {
    setProfileSummaryVerification({
      profile_summary: {
        isSelfAttested: false,
      },
    });
  }, []);
  const handleSelfAttest = () => {
    setProfileSummaryVerification({
      profile_summary: {
        isSelfAttested: true,
      },
    });
    setValue(`profileSummaryVerification.profile_summary.isSelfAttested`, true);
    setValue(
      `profileSummarVerificationValidations.profile_summary.isSelfAttested`,
      true
    );
  };

  console.log("form object", getValues());
  return (
    <div className="flex flex-col gap-5 px-6 sm:px-10 mt-5">
      <div>
        <h1 className="text-2xl font-semibold">Profile Summary*</h1>
        <FormDescription className="text-sm">
          Provide a brief overview of professional background, key skills, and
          accomplishments. Highlight expertise, experience, and unique strengths
          in 2-3 sentences.
        </FormDescription>
      </div>

      <FormField
        name="profile_summary"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea {...field} placeholder="Enter profile summary" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* self attest button */}
      <FormField
        control={control}
        name="profileSummarVerificationValidations.profile_summary.isSelfAttested"
        render={() => (
          <FormItem className="flex-1">
            <SelfAttestButton
              className="lg:ml-5"
              onClick={handleSelfAttest}
              required={true}
              isAttested={
                profileSummaryVerification.profile_summary.isSelfAttested
              }
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ProfileSummary;
