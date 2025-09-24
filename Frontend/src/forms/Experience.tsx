import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useFieldArray, useFormContext } from "react-hook-form";

import ExperienceFields from "./ExperienceFields";
import { Input } from "@/components/ui/input";
import { twMerge } from "tailwind-merge";
import { useEffect } from "react";

const Experience = () => {
  const { control, watch, setValue } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "Experience",
  });
  const no_of_exp = watch(`Years_of_experience`);
  console.log("no of exp id:2233", no_of_exp);
  useEffect(() => {
    if (fields.length === 0) {
      setValue("Years_of_experience", "");
    }
  }, [fields.length]);
  // console.log("experience objects", fields.length);
  return (
    <>
      <div className="flex flex-col px-5 md:px-10 gap-2  h-full overflow-hidden">
        <div className="">
          <h1 className="text-2xl font-semibold">Experience</h1>
          <FormDescription className="text-sm mb-4">
            You can add multiple experience
          </FormDescription>
          {fields.length <= 0 && (
            <FormField
              name="Years_of_experience"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    How many months of experience do you have?*
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      placeholder="Enter months of experience"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          name="Experience"
          control={control}
          render={() => (
            <FormItem>
              {fields.map((_, index) => (
                <ExperienceFields
                  key={index}
                  fields={fields}
                  index={index}
                  removeExperienceFields={(index) => remove(index)}
                />
              ))}
            </FormItem>
          )}
        />

        <div className={`${fields.length === 0 ? "h-64" : "h-fit"}`}>
          {no_of_exp > 0 && (
            <Button
              type="button"
              disabled={no_of_exp === 0}
              className={twMerge(
                "bg-[rgb(0,102,102)] hover:bg-[rgb(0,102,102)] hover:opacity-90 w-fit px-10 disabled:cursor-not-allowed"
              )}
              onClick={() => {
                if (no_of_exp > 0) {
                  console.log("true exp is greater than 0");
                  append({
                    company_name: "",
                    job_role: "",
                    duration: "",
                    description: "",
                    experienceCertUrl: "",
                  });
                }
              }}
            >
              Add Experience
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Experience;
