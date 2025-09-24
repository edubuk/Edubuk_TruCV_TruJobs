import { FormDescription, FormField, FormItem } from "@/components/ui/form";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import CourseFields from "./CourseFields";
import ProjectFields from "./ProjectFields";
import AwardFields from "./AwardFields";

const Achievements = () => {
  const { control, getValues } = useFormContext();
  console.log(getValues());
  const { append, remove, fields } = useFieldArray({
    control,
    name: "Courses",
  });
  const {
    append: ProjectAppend,
    remove: ProjectRemove,
    fields: ProjectArrayFields,
  } = useFieldArray({
    control,
    name: "Projects",
  });
  const {
    append: AwardAppend,
    remove: AwardRemove,
    fields: AwardArrayFields,
  } = useFieldArray({
    control,
    name: "Awards",
  });

  return (
    <>
      {/* Achievements */}
      <div className="mt-3 px-2 sm:px-10 flex flex-col">
        <h1 className="text-xl sm:text-2xl font-semibold">
          Awards and Achievements
        </h1>
        <FormDescription className="sm:text-sm">
          You can add multiple awards
        </FormDescription>
        <div className="flex flex-col gap-3">
          <FormField
            name="Awards"
            control={control}
            render={() => (
              <FormItem>
                {AwardArrayFields.map((_, index) => (
                  <AwardFields
                    key={index}
                    fields={AwardArrayFields}
                    index={index}
                    removeAwardFields={(index) => AwardRemove(index)}
                  />
                ))}
              </FormItem>
            )}
          />
          <div className={``}>
            <Button
              type="button"
              className="bg-[rgb(0,102,102)] hover:bg-[rgb(0,102,102)] hover:opacity-90 w-fit px-10"
              onClick={() =>
                AwardAppend({
                  award_name: "",
                  awarding_organization: "",
                  date_of_achievement: "",
                  description: "",
                })
              }
            >
              Add Awards
            </Button>
          </div>
        </div>
      </div>
      {/* Awards and achievements */}

      {/* Courses and certifications */}
      <div className="flex flex-col px-2 sm:px-10 gap-1 sm:gap-3 h-full">
        <div className="">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Certifications and Courses
          </h1>
          <FormDescription className="sm:text-sm">
            You can add multiple courses
          </FormDescription>
        </div>
        <FormField
          name="Courses"
          control={control}
          render={() => (
            <FormItem>
              {fields.map((_, index) => (
                <CourseFields
                  key={index}
                  fields={fields}
                  index={index}
                  removeCourseFields={(index) => remove(index)}
                />
              ))}
            </FormItem>
          )}
        />

        <div className={``}>
          <Button
            type="button"
            className="bg-[rgb(0,102,102)] hover:bg-[rgb(0,102,102)] hover:opacity-90 w-fit px-10"
            onClick={() =>
              append({
                course_name: "",
                organization: "",
                duration: "",
                description: "",
              })
            }
          >
            Add Course
          </Button>
        </div>
      </div>
      {/* Project  */}
      <div className="flex flex-col gap-1 sm:gap-3 px-2 sm:px-10">
        <div className="mt-3">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Personal Projects or Milestones
          </h1>
          <FormDescription className="sm:text-sm">
            You can add multiple projects
          </FormDescription>
        </div>
        <FormField
          name="Projects"
          control={control}
          render={() => (
            <FormItem>
              {ProjectArrayFields.map((_, index) => (
                <ProjectFields
                  key={index}
                  fields={ProjectArrayFields}
                  index={index}
                  removeProjectFields={(index) => ProjectRemove(index)}
                />
              ))}
            </FormItem>
          )}
        />
        <div className={``}>
          <Button
            type="button"
            className="bg-[rgb(0,102,102)] hover:bg-[rgb(0,102,102)] hover:opacity-90 w-fit px-10"
            onClick={() =>
              ProjectAppend({
                project_name: "",
                project_url: "",
                duration: "",
                description: "",
              })
            }
          >
            Add Projects
          </Button>
        </div>
      </div>
    </>
  );
};

export default Achievements;
