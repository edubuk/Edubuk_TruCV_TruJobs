import PostGraduateCal from "@/components/calendars/PostGraduateCal";
import UnderGraduateCal from "@/components/calendars/UnderGradualteCal";
import { AnimatedVerification } from "@/components/ui/AnimatedVerification";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCvFromContext } from "@/context/CvForm.context";
import { convertDateToString } from "@/utils";
import dayjs from "dayjs";
//import { convertDateToString } from "@/utils";
//import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

const highestQualification: string[] = [
  "class10",
  "class12",
  "undergraduate",
  "postgraduate",
];

type Props = {
  selectedQualification: string;
  setSelectedQualification: React.Dispatch<React.SetStateAction<string>>;
};

const Education = ({
  selectedQualification,
  setSelectedQualification,
}: Props) => {
  const { control, getValues } = useFormContext();
  const [isAnswered, setIsAnswered] = useState<boolean>(() =>
    JSON.parse(localStorage.getItem("qualificationAnswered") || "false")
  );
  const { educationVerifications, setEducationVerifications } =
    useCvFromContext();
  const {
    class10SchoolName,
    class12CollegeName,
    underGraduateCollegeName,
    postGraduateCollegeName,
    underGraduateDegreeName,
    postGraduateDegreeName,
    educationVerificationValidations: storedVerifications,
  } = getValues();
  console.log("form values are", getValues());

  // Initialize date from localStorage only once
  const initialDate = useRef(() => {
    const storedFormData = localStorage.getItem("step2CvData");
    if (storedFormData) {
      const parsedFormData = JSON.parse(storedFormData);
      return (
        parsedFormData?.underGraduateDuration?.duration || {
          from: null,
          to: null,
        }
      );
    }
    return { from: null, to: null };
  });

  const initialDate2 = useRef(() => {
    const storedFormData = localStorage.getItem("step2CvData");
    // console.log("stored farm data", storedFormData);
    if (storedFormData) {
      const parsedFormData = JSON.parse(storedFormData);
      return (
        parsedFormData?.postGraduateDuration?.duration || {
          from: null,
          to: null,
        }
      );
    }
    return { from: null, to: null };
  });

  const { setValue } = useFormContext();

  const [date, setDate] = useState(initialDate.current);
  const [date2, setDate2] = useState(initialDate2.current);
  const [dateFrom, setDateFrom] = useState(dayjs(date.from));
  const [dateTo, setDateTo] = useState(dayjs(date.to));
  const [dateFrom2, setDateFrom2] = useState(dayjs(date2.from));
  const [dateTo2, setDateTo2] = useState(dayjs(date2.to));
  console.log("undergraduate date ", date);
  console.log("postgraduate date", date2);
  // Update the form field whenever date changes
  useEffect(() => {
    if (date.from && date.to) {
      setValue(`underGraduateDuration.duration`, date);
    }
    if (date2.from && date2.to) {
      setValue(`postGraduateDuration.duration`, date2);
    }
  }, [date, date2, setValue]);

  // Update date when dateFrom or dateTo changes
  useEffect(() => {
    if (dateFrom && dateTo) {
      setDate({
        from: convertDateToString(dateFrom),
        to: convertDateToString(dateTo),
      });
    }
    if (dateFrom2 && dateTo2) {
      setDate2({
        from: convertDateToString(dateFrom2),
        to: convertDateToString(dateTo2),
      });
    }
  }, [dateFrom, dateTo, dateFrom2, dateTo2]);

  useEffect(() => {
    setIsAnswered(
      localStorage.getItem("qualificationAnswered") === "true" ? true : false
    );
  }, [localStorage.getItem("qualificationAnswered")?.length]);
  console.log("stored verfications are", storedVerifications);
  return (
    <>
      {!isAnswered ? (
        <div className="px-1 md:px-10 mt-5 space-y-5">
          <h1 className="text-xl font-semibold">
            What is your highest qualification?*
          </h1>
          <div className="flex flex-wrap gap-5">
            {highestQualification.map((qualification) => (
              <Button
                type="button"
                key={qualification}
                className={`px-5 py-1 flex-1 md:flex-none shadow-md bg-white text-black border border-[#FA9110] hover:bg-white hover:text-black text-md font-semibold capitalize`}
                onClick={() => {
                  setIsAnswered(true);
                  localStorage.setItem("qualificationAnswered", "true");
                  localStorage.setItem(
                    "educationSelectedQualifications",
                    qualification
                  );
                  setSelectedQualification(qualification);
                }}
              >
                {qualification}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* class 10th */}
          <div className="flex flex-col xl:flex-row px-2 xl:px-10 gap-2 xl:gap-5">
            <FormField
              name="class10SchoolName"
              control={control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Class 10th school name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 10th school name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="class10Board"
              control={control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>10th Board (Ex:CBSE,ICSE,regional)*</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter 10th Board"
                      {...field}
                      onKeyDown={(e) => {
                        // Block numbers
                        if (/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="class10Grade"
              control={control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Class 10th Grade*</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter 10th Grade"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Animated skills section */}
          <div className="flex flex-col gap-4  sm:px-10">
            <FormField
              name="educationVerificationValidations.class10"
              control={control}
              render={() => (
                <FormItem className="">
                  <AnimatedVerification
                    firstButtonText={"Class 10"}
                    field="class10"
                    isSelfAttested={
                      storedVerifications
                        ? storedVerifications?.class10?.isSelfAttested
                        : false
                    }
                    storedVerifications={storedVerifications}
                    verificationStep={"educationVerifications"}
                    validationStep="educationVerificationValidations"
                    verificationObject={educationVerifications}
                    setterVerificationObject={setEducationVerifications}
                    class10SchoolName={class10SchoolName}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* class 12th */}
          {(selectedQualification === "class12" ||
            selectedQualification === "undergraduate" ||
            selectedQualification === "postgraduate") && (
            <>
              <div className="flex flex-col xl:flex-row px-2 xl:px-10 gap-2 xl:gap-5">
                <FormField
                  name="class12CollegeName"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Class 12th college name*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 12th college name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="class12Board"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-nowrap">
                        12th Board (Ex:CBSE,ICSE,regional)*
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 12 th Board"
                          {...field}
                          onKeyDown={(e) => {
                            // Block numbers
                            if (/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="class12Grade"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Class 12th Grade*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter 12th Grade"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Animated skills section */}
              <div className="flex flex-col gap-4 sm:px-10">
                <FormField
                  name="educationVerificationValidations.class12"
                  control={control}
                  render={() => (
                    <FormItem className="">
                      <AnimatedVerification
                        firstButtonText={"Class 12"}
                        field="class12"
                        isSelfAttested={
                          storedVerifications
                            ? storedVerifications?.class12?.isSelfAttested
                            : false
                        }
                        storedVerifications={storedVerifications}
                        verificationStep={"educationVerifications"}
                        validationStep="educationVerificationValidations"
                        verificationObject={educationVerifications}
                        setterVerificationObject={setEducationVerifications}
                        class12CollegeName={class12CollegeName}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          {/* undergraduation */}
          {(selectedQualification === "undergraduate" ||
            selectedQualification === "postgraduate") && (
            <>
              <div className="flex flex-col xl:flex-row px-2 xl:px-10 gap-2 xl:gap-5">
                <FormField
                  name="underGraduateCollegeName"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Undergraduation College name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter college name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="underGraduateDegreeName"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Degree (Ex:B-tech)*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter degree"
                          {...field}
                          onKeyDown={(e) => {
                            // Block numbers
                            if (/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="underGraduateGPA"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>CGPA*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter CGPA"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-center gap-2 items-center py-2">
                <FormField
                  name={`underGraduateDuration.duration`}
                  control={control}
                  render={() => (
                    <FormItem className="flex  gap-1 flex-col justify-center mt-2">
                      <FormLabel className="">Graduation Duration*</FormLabel>
                      <FormControl>
                        <div className="flex gap-10">
                          <div className="">
                            <p className="text-base">From</p>
                            <UnderGraduateCal
                              value={dateFrom}
                              setValue={setDateFrom}
                              isDateFrom
                            />
                          </div>
                          <div>
                            <p className="text-base">To</p>
                            <UnderGraduateCal
                              value={dateTo}
                              setValue={setDateTo}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Animated skills section */}
              <div className="flex flex-col gap-4 sm:px-10">
                {/* for tablets and desktops */}
                <div className="hidden sm:block">
                  <FormField
                    name="educationVerificationValidations.undergraduation"
                    control={control}
                    render={() => (
                      <FormItem className="">
                        <AnimatedVerification
                          firstButtonText={"Undergraduation"}
                          field="undergraduation"
                          isSelfAttested={
                            storedVerifications
                              ? storedVerifications?.undergraduation
                                  ?.isSelfAttested
                              : false
                          }
                          storedVerifications={storedVerifications}
                          verificationStep={"educationVerifications"}
                          validationStep="educationVerificationValidations"
                          verificationObject={educationVerifications}
                          setterVerificationObject={setEducationVerifications}
                          underGraduateCollegeName={underGraduateCollegeName}
                          underGraduateDegreeName={underGraduateDegreeName}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* for mobile  */}
                <div className="sm:hidden">
                  <FormField
                    name="educationVerificationValidations.undergraduation"
                    control={control}
                    render={() => (
                      <FormItem className="">
                        <AnimatedVerification
                          buttonClass="py-1 px-4 font-semibold"
                          firstButtonText={"UG"}
                          isSelfAttested={
                            storedVerifications
                              ? storedVerifications?.undergraduation
                                  ?.isSelfAttested
                              : false
                          }
                          storedVerifications={storedVerifications}
                          verificationStep={"educationVerifications"}
                          validationStep="educationVerificationValidations"
                          field="undergraduation"
                          verificationObject={educationVerifications}
                          setterVerificationObject={setEducationVerifications}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </>
          )}

          {/* postgraduation */}
          {selectedQualification === "postgraduate" && (
            <>
              <div className="flex flex-col xl:flex-row px-2 xl:px-10 gap-2 xl:gap-5">
                <FormField
                  name="postGraduateCollegeName"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Postgraduation College name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter college name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="postGraduateDegreeName"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Degree*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter degree"
                          {...field}
                          onKeyDown={(e) => {
                            // Block numbers
                            if (/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="postGraduateGPA"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>CGPA*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter CGPA"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-center gap-2 items-center py-2">
                <FormField
                  name={`postGraduateDuration.duration`}
                  control={control}
                  render={() => (
                    <FormItem className="flex  gap-1 flex-col justify-center mt-2">
                      <FormLabel className="">
                        Post Graduation Duration*
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-10">
                          <div className="">
                            <p className="text-base">From</p>
                            <PostGraduateCal
                              value={dateFrom2}
                              setValue={setDateFrom2}
                              isDateFrom
                            />
                          </div>
                          <div>
                            <p className="text-base">To</p>
                            <PostGraduateCal
                              value={dateTo2}
                              setValue={setDateTo2}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Animated skills section */}
              <div className="flex flex-col gap-4 sm:px-10">
                {/* for tablets and desktops */}
                <div className="hidden sm:block">
                  <FormField
                    name="educationVerificationValidations.postgraduation"
                    control={control}
                    render={() => (
                      <FormItem className="">
                        <AnimatedVerification
                          firstButtonText={"Postgraduation"}
                          field="postgraduation"
                          isSelfAttested={
                            storedVerifications
                              ? storedVerifications?.postgraduation
                                  ?.isSelfAttested
                              : false
                          }
                          storedVerifications={storedVerifications}
                          verificationStep={"educationVerifications"}
                          validationStep="educationVerificationValidations"
                          verificationObject={educationVerifications}
                          setterVerificationObject={setEducationVerifications}
                          postGraduateCollegeName={postGraduateCollegeName}
                          postGraduateDegreeName={postGraduateDegreeName}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* for mobile  */}
                <div className="sm:hidden">
                  <FormField
                    name="educationVerificationValidations.postgraduation"
                    control={control}
                    render={() => (
                      <FormItem className="">
                        <AnimatedVerification
                          buttonClass="py-1 px-4 font-semibold"
                          firstButtonText={"PG"}
                          field="postgraduation"
                          isSelfAttested={
                            storedVerifications
                              ? storedVerifications?.postgraduation
                                  ?.isSelfAttested
                              : false
                          }
                          storedVerifications={storedVerifications}
                          verificationStep={"educationVerifications"}
                          validationStep="educationVerificationValidations"
                          verificationObject={educationVerifications}
                          setterVerificationObject={setEducationVerifications}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Education;
