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
import { Textarea } from "@/components/ui/textarea";
import { MdDeleteOutline } from "react-icons/md";
import { Separator } from "@/components/ui/separator";
import { AnimatedVerification } from "@/components/ui/AnimatedVerification";
import { useCvFromContext } from "@/context/CvForm.context";
import AwardCalendar from "@/components/calendars/AwardCalendar";
import { convertDateToString } from "@/utils";
import dayjs from "dayjs";
type Props = {
  fields: Record<"id", string>[];
  index: number;
  removeAwardFields: (index: number) => void;
};

const AwardFields = ({ index, removeAwardFields, fields }: Props) => {
  const { control, setValue, getValues, watch } = useFormContext();

  const { AwardVerification, setAwardVerification } = useCvFromContext();

  const { Awards, awardVerificationsValidations: storedVerifications } =
    getValues();
  // Initialize date from localStorage only once
  // Initialize date from localStorage only once
  // const initialDate = useRef(() => {
  //   const storedFormData = localStorage.getItem("step5CvData");
  //   if (storedFormData) {
  //     const parsedFormData = JSON.parse(storedFormData);
  //     return parsedFormData?.Awards?.[index]?.date_of_achievement || null;
  //   }
  //   return null;
  // });

  const initialDate = useRef(
    (() => {
      const storedFormData = localStorage.getItem("step5CvData");
      if (storedFormData) {
        const parsedFormData = JSON.parse(storedFormData);
        return parsedFormData?.Awards?.[index]?.date_of_achievement || null;
      }
      return null;
    })()
  );

  const [dateOfAchievement, setDateOfAchievement] = useState(
    initialDate.current ? dayjs(initialDate.current) : null
  );
  // console.log(Awards);
  const { remove } = useFieldArray({ control, name: "Experience" });

  const watchAwardsArray = watch(`Awards[${index}].award_name`);

  useEffect(() => {
    if (dateOfAchievement) {
      setValue(
        `Awards.${index}.date_of_achievement`,
        convertDateToString(dateOfAchievement)
      );
    }
  }, [dateOfAchievement, setValue, index]);

  useEffect(() => {
    if (Awards.length > 0) {
      const verificationObject = Awards.reduce((acc: any, awrd: any) => {
        acc[awrd.award_name] = {
          isSelfAttested: false,
          proof: "",
          mailStatus: "",
        };

        return acc;
      }, {});
      console.log("Award custom verification object", verificationObject);
      setAwardVerification(verificationObject);
      setValue("awardVerifications", verificationObject);
    }
  }, [watchAwardsArray, Awards]);

  // const keys = Object.keys(AwardVerification);
  // const firstKey = AwardVerification[keys[0]];

  const deleteHandler = () => {
    remove(index);
    removeAwardFields(index);
    // deleting award key from the awardverification object;
    const keys = Object.keys(AwardVerification);
    delete AwardVerification[keys[index]];
    setValue("awardVerifications", AwardVerification); //updating store object in the form ;
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-5 lg:items-center">
        <FormField
          name={`Awards.${index}.award_name`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Award name*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter award name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name={`Awards.${index}.awarding_organization`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Awarding organization*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter organization" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* duration */}
        <FormField
          name={`Awards.${index}.date_of_achievement`}
          control={control}
          render={() => (
            <FormItem className="flex flex-1 gap-1 flex-col justify-center">
              <FormLabel className="">Date of achievement*</FormLabel>
              <FormControl>
                {/* <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !dateOfAchievement && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateOfAchievement ? (
                        format(dateOfAchievement, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateOfAchievement}
                      onSelect={setDateOfAchievement}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover> */}
                <AwardCalendar
                  value={dateOfAchievement}
                  setValue={setDateOfAchievement}
                  index={index}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* award description */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-5">
        <FormField
          name={`Awards.${index}.description`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Award description*</FormLabel>
              <FormDescription className="text-sm">
                A brief description of the award or achievement and its
                significance.
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
        {Awards.length > 0 && Awards[index].award_name && (
          <FormField
            name={`awardVerificationsValidations[${Awards[index].award_name}]`}
            control={control}
            render={() => (
              <FormItem className="">
                <AnimatedVerification
                  firstButtonText={Awards[index].award_name || "Award"}
                  field={Awards[index].award_name}
                  verificationObject={AwardVerification}
                  storedVerifications={storedVerifications}
                  validationStep="awardVerificationsValidations"
                  setterVerificationObject={setAwardVerification}
                  verificationStep="awardVerifications"
                  awardName={Awards[index].award_name}
                  awardOrg = {Awards[index].awarding_organization}
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

export default AwardFields;
