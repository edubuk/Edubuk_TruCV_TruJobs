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
import dayjs from "dayjs";
import { convertDateToString } from "@/utils";
import ProjectCalendar from "@/components/calendars/ProjectCalendar";
type Props = {
  fields: Record<"id", string>[];
  index: number;
  removeProjectFields: (index: number) => void;
};

const ProjectFields = ({ index, removeProjectFields, fields }: Props) => {
  const { control, setValue, getValues, watch } = useFormContext();
  const { projectVerification, setProjectVerification } = useCvFromContext();
  const { Projects, projectVerificationsValidations: storedVerification } =
    getValues();

  const watchProjectArray = watch(`Projects[${index}].project_name`);
  // Initialize date from localStorage only once
  const initialDate = useRef(() => {
    const storedFormData = localStorage.getItem("step5CvData");
    if (storedFormData) {
      const parsedFormData = JSON.parse(storedFormData);
      return (
        parsedFormData?.Projects?.[index]?.duration || {
          from: null,
          to: null,
        }
      );
    }
    return { from: null, to: null };
  });

  const [date, setDate] = useState(initialDate.current);
  const [dateFrom, setDateFrom] = useState(dayjs(date.from));
  const [dateTo, setDateTo] = useState(dayjs(date.to));

  useEffect(() => {
    if (date?.from && date?.to) {
      setValue(`Projects.${index}.duration`, {
        from: date.from,
        to: date.to,
      });
    }
  }, [date, setValue, index]);

  // Update date when dateFrom or dateTo changes
  useEffect(() => {
    if (dateFrom && dateTo) {
      setDate({
        from: convertDateToString(dateFrom),
        to: convertDateToString(dateTo),
      });
    }
  }, [dateFrom, dateTo]);

  const { remove } = useFieldArray({ control, name: "Experience" });

  useEffect(() => {
    if (Projects.length > 0) {
      const verificationObject = Projects.reduce((acc: any, awrd: any) => {
        acc[awrd.project_name] = {
          isSelfAttested: false,
          proof: "",
          mailStatus: "",
        };

        return acc;
      }, {});
      console.log("Project custom verification object", verificationObject);
      setProjectVerification(verificationObject);
      setValue("projectsVerifications", verificationObject);
    }
  }, [watchProjectArray, Projects]);

  const deleteHandler = () => {
    remove(index);
    removeProjectFields(index);
    // deleting award key from the projectverification object;
    const keys = Object.keys(projectVerification);
    delete projectVerification[keys[index]];
    setValue("awardVerifications", projectVerification); //updating store object in the form ;
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-5 lg:items-center">
        <FormField
          name={`Projects.${index}.project_name`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Project name*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter project name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name={`Projects.${index}.project_url`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Project url</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter project url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* duration */}
      <FormField
        name={`Projects.${index}.duration`}
        control={control}
        render={() => (
          <FormItem className="flex flex-1 gap-1 flex-col justify-center mt-10">
            <FormLabel className="mt-5">Duration*</FormLabel>
            <FormControl>
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="">
                  <p className="text-base">From</p>
                  <ProjectCalendar
                    value={dateFrom}
                    setValue={setDateFrom}
                    index={index}
                    isDateFrom
                  />
                </div>
                <div>
                  <p className="text-base">To</p>
                  <ProjectCalendar
                    value={dateTo}
                    setValue={setDateTo}
                    index={index}
                  />
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* work description */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-5">
        <FormField
          name={`Projects.${index}.description`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Project description*</FormLabel>
              <FormDescription className="text-sm">
                A brief overview of the project, its objectives, and outcomes.
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
        {Projects.length > 0 && Projects[index].project_name && (
          <FormField
            name={`projectVerificationsValidations[${Projects[index].project_name}]`}
            control={control}
            render={() => (
              <FormItem className="">
                <AnimatedVerification
                  firstButtonText={Projects[index].project_name || "Project"}
                  field={Projects[index].project_name}
                  storedVerifications={storedVerification}
                  verificationObject={projectVerification}
                  validationStep="projectVerificationsValidations"
                  setterVerificationObject={setProjectVerification}
                  verificationStep="projectsVerifications"
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

export default ProjectFields;
