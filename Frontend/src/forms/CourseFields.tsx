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
import CourseCalendar from "@/components/calendars/CourseCalendar";
type Props = {
  fields: Record<"id", string>[];
  index: number;
  removeCourseFields: (index: number) => void;
};

const CourseFields = ({ index, removeCourseFields, fields }: Props) => {
  const { control, setValue, getValues, watch } = useFormContext();
  const { courseVerification, setCourseVerification } = useCvFromContext();

  const watchCoursesArray = watch(`Courses[${index}].course_name`);

  const { remove } = useFieldArray({ control, name: "Experience" });
  const { Courses, courseVerificationsValidations: storedVerification } =
    getValues();
  // Initialize date from localStorage only once
  const initialDate = useRef(() => {
    const storedFormData = localStorage.getItem("step5CvData");
    if (storedFormData) {
      const parsedFormData = JSON.parse(storedFormData);
      return (
        parsedFormData?.Courses?.[index]?.duration || {
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

  // console.log(Courses);

  useEffect(() => {
    if (date?.from && date?.to) {
      setValue(`Courses.${index}.duration`, {
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

  useEffect(() => {
    if (Courses.length > 0) {
      const verificationObject = Courses.reduce((acc: any, awrd: any) => {
        acc[awrd.course_name] = {
          isSelfAttested: false,
          proof: "",
          mailStatus: "",
        };

        return acc;
      }, {});
      console.log("Courses custom verification object", verificationObject);
      setCourseVerification(verificationObject);
      setValue("courseVerifications", verificationObject);
    }
  }, [watchCoursesArray, Courses]);

  const deleteHandler = () => {
    remove(index);
    removeCourseFields(index);
    // deleting award key from the awardverification object;
    const keys = Object.keys(courseVerification);
    delete courseVerification[keys[index]];
    setValue("awardVerifications", courseVerification); //updating store object in the form ;
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-5 lg:items-center">
        <FormField
          name={`Courses.${index}.course_name`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Course name*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter course name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name={`Courses.${index}.organization`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Institution/Organization*</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter institution/organization"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* duration */}
      </div>
      <FormField
        name={`Courses.${index}.duration`}
        control={control}
        render={() => (
          <FormItem className="flex flex-1 gap-1 flex-col justify-center mt-10">
            <FormLabel className="mt-5">Duration*</FormLabel>
            <FormControl>
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="">
                  <p className="text-base">From</p>
                  <CourseCalendar
                    value={dateFrom}
                    setValue={setDateFrom}
                    index={index}
                    isDateFrom
                  />
                </div>
                <div>
                  <p className="text-base">To</p>
                  <CourseCalendar
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
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-5">
        <FormField
          name={`Courses.${index}.description`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Course description*</FormLabel>
              <FormDescription className="text-sm">
                You can share a short description of the course content and what
                was learned.
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
        {Courses.length > 0 && Courses[index].course_name && (
          <FormField
            name={`courseVerificationsValidations[${Courses[index].course_name}]`}
            control={control}
            render={() => (
              <FormItem className="">
                <AnimatedVerification
                  firstButtonText={Courses[index].course_name || "Course"}
                  field={Courses[index].course_name}
                  storedVerifications={storedVerification}
                  verificationObject={courseVerification}
                  validationStep="courseVerificationsValidations"
                  setterVerificationObject={setCourseVerification}
                  verificationStep="courseVerifications"
                  courseName={Courses[index].course_name}
                  courseOrg={Courses[index].organization}
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

export default CourseFields;
