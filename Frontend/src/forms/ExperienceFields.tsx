import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import ReferenceDateUsingValue from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { MdDeleteOutline } from "react-icons/md";
import { Separator } from "@/components/ui/separator";
import { AnimatedVerification } from "@/components/ui/AnimatedVerification";
import { convertDateToString } from "@/utils";
import dayjs from "dayjs";

type Props = {
  fields: Record<"id", string>[];
  index: number;
  removeExperienceFields: (index: number) => void;
};

const ExperienceFields = ({ index, removeExperienceFields, fields }: Props) => {
  const { control, setValue, getValues, watch } = useFormContext();

  const [experienceVerifications, setExperienceVerifications] = useState({});
  // {
  //   from: new Date(2023, 0, 20),
  //   to: addDays(new Date(2024, 0, 20), 20),
  // }

  const watchExperienceArray = watch(`Experience[${index}].company_name`);

  const { Experience, experienceVerificationsValidations: storedVerification } =
    getValues();
  console.log("stored experience verification is", storedVerification);
  // const [dateFrom, setDateFrom] = useState<any | null>(null);
  // const [dateTo, setDateTo] = useState<any | null>(null);

  // Initialize date from localStorage only once
  const initialDate = useRef(() => {
    const storedFormData = localStorage.getItem("step3CvData");
    if (storedFormData) {
      const parsedFormData = JSON.parse(storedFormData);
      return (
        parsedFormData?.Experience?.[index]?.duration || {
          from: null,
          to: null,
        }
      );
    }
    return { from: null, to: null };
  });

  const [date, setDate] = useState(initialDate.current);
  const [isCurrentlyWorking, setCurrentlyWorking] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState(dayjs(date.from));
  const [dateTo, setDateTo] = useState(dayjs(date.to));
  console.log("date check is ", date);
  // Update the form field whenever date changes
  useEffect(() => {
    if (date.from && date.to) {
      setValue(`Experience.${index}.duration`, date);
    }
  }, [date, setValue, index]);

  // Update date when dateFrom or dateTo changes
  useEffect(() => {
    if (dateFrom && dateTo) {
      setDate({
        from: convertDateToString(dateFrom),
        to: isCurrentlyWorking ? "present" : convertDateToString(dateTo),
      });
    }
  }, [dateFrom, dateTo]);

  const { remove } = useFieldArray({ control, name: "Experience" });
  // testing useeffect for verifications;
  useEffect(() => {
    if (Experience.length > 0) {
      const verificationObject = Experience.reduce((acc: any, exp: any) => {
        acc[exp.company_name] = {
          isSelfAttested: false,
          proof: "",
          mailStatus: "",
        };
        return acc;
      }, {});
      console.log("New verification object", verificationObject);
      setExperienceVerifications(verificationObject);
    }
  }, [watchExperienceArray, Experience]);

  const deleteHandler = () => {
    remove(index);
    removeExperienceFields(index);
  };

  // verification object testing;

  return (
    <>
      {/* form inputs */}
      <div className="flex flex-col xl:flex-row gap-2 xl:gap-5 xl:items-center">
        <FormField
          name={`Experience.${index}.company_name`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Company name*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter company name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name={`Experience.${index}.job_role`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Job role / title*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter job role/title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-col xl:flex-row gap-2 xl:gap-5 xl:items-center">
        {/* duration */}
        <FormField
          name={`Experience.${index}.duration`}
          control={control}
          render={() => (
            <FormItem className="flex flex-1 gap-1 flex-col justify-center mt-2">
              <FormLabel className="">Duration*</FormLabel>
              <FormLabel className="flex  gap-1">
                <Input
                  className="size-4"
                  type="checkbox"
                  onChange={() => setCurrentlyWorking(!isCurrentlyWorking)}
                />
                You are currently working here
              </FormLabel>
              <FormControl>
                <div className="flex gap-10">
                  <div className="">
                    <p className="text-base">From</p>
                    <ReferenceDateUsingValue
                      value={dateFrom}
                      setValue={setDateFrom}
                      defaultDate={date}
                      index={index}
                      isDateFrom
                    />
                  </div>
                  <div>
                    <p className="text-base">To</p>
                    <ReferenceDateUsingValue
                      value={dateTo}
                      setValue={setDateTo}
                      defaultDate={date}
                      index={index}
                      isCurrentlyWorking={isCurrentlyWorking}
                    />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* work description */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-5">
        <FormField
          name={`Experience.${index}.description`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Work description*</FormLabel>
              <FormDescription className="text-sm">
                You can share your work experience, including your previous
                roles, key responsibilities
              </FormDescription>
              <FormControl>
                <Textarea {...field} placeholder="Enter description..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* {fields.length > 1 && index + 1 === fields.length && (
          <Button
            type="button"
            variant={"destructive"}
            className="mt-5 text-sm px-10"
            onClick={deleteHandler}
          >
            Remove
            <MdDeleteOutline className="text-xl ml-2" />
          </Button>
        )} */}
        <Button
          type="button"
          variant={"destructive"}
          className="mt-5 text-sm px-10"
          onClick={deleteHandler}
        >
          Remove
          <MdDeleteOutline className="text-xl ml-2" />
        </Button>
      </div>
      {/* Animated Verification section */}
      <div className="flex flex-col gap-4 sm:px-2">
        {Experience.length > 0 && Experience[index].company_name && (
          <FormField
            name={`experienceVerificationsValidations[${Experience[index].company_name}]`}
            control={control}
            render={() => (
              <FormItem className="">
                <AnimatedVerification
                  firstButtonText={Experience[index].company_name || "Company"}
                  field={`${Experience[index].company_name}`}
                  verificationStep="experienceVerifications"
                  storedVerifications={storedVerification}
                  validationStep="experienceVerificationsValidations"
                  verificationObject={experienceVerifications}
                  setterVerificationObject={setExperienceVerifications}
                  jobRole={Experience[index].job_role}
                  companyName={Experience[index].company_name}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
      {fields.length > 1 && <Separator />}
    </>
  );
};

export default ExperienceFields;
