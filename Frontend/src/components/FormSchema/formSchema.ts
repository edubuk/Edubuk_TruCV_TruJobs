import { z } from "zod";
import dayjs from "dayjs";

export const formSchema = z.object({
  loginMailId: z
    .string({
      required_error: "loginMaidId is required",
    })
    .max(50),
  nanoId: z.string().optional(),
  name: z
    .string({
      required_error: "Name is required",
    })
    .max(50),
  location: z.string({
    required_error: "Location is required",
  }),
  profession: z.string({
    required_error: "Profession is required",
  }),
  email: z
    .string({
      required_error: "email is required",
    })
    .email({ message: "Invalid email format" }),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits" }),
  imageFile: z
    .union([z.instanceof(File, { message: "Image is required" }), z.string()])
    .refine(
      (value) =>
        value instanceof File ||
        (typeof value === "string" && value.length > 0),
      {
        message: "Image is required",
      }
    ),
  imageUrl: z.string().optional(),
  //------------------>>  step2 fields;
  class10SchoolName: z.string({ required_error: "School name is required" }),
  class10Board: z.string({ required_error: "10th board is required" }),
  class10Grade: z.preprocess(
    (val) => {
      const parsed = Number(val);
      return isNaN(parsed) || val === "" ? undefined : parsed;
    },
    z
      .number({
        required_error: "10th grade is required",
      })
      .max(100, { message: "Grades cannot be greater than 100" })
      .min(0, { message: "Enter grades between 0 and 100" })
  ),
  class10CertUrl: z.string().optional(),
  class12CollegeName: z.string({
    required_error: "College name is required",
  }),
  class12Board: z.string({ required_error: "12th board is required" }),
  class12Grade: z.preprocess((val) => {
    const parsed = Number(val);
    return isNaN(parsed) || val === "" ? undefined : parsed;
  }, z.number({ required_error: "12th grade is required" }).max(100, "Grades can not be greater than 100").min(0, { message: "Enter grades between 0 to 100" })),
  class12CertUrl: z.string().optional(),
  // undergraduation
  underGraduateCollegeName: z.string({
    required_error: "undergraduation college is required",
  }),
  underGraduateDegreeName: z.string({
    required_error: "undergraduation Degree name is required",
  }),
  underGraduateGPA: z.preprocess(
    (val) => {
      const parsed = Number(val);
      return isNaN(parsed) || val === "" ? undefined : parsed;
    },
    z
      .number({
        required_error: "undergraduation GPA till time is required",
      })
      .min(0, { message: "Enter GPA between 0 to 10" })
      .max(10, { message: "Enter GPA between 0 to 10" })
  ),
  underGraduateCertUrl: z.string().optional(),
  underGraduateDuration: z.object({
    duration: z
      .object({
        from: z
          .union([z.string(), z.date()])
          .refine((val) => val && dayjs(val).isValid(), {
            message: "Start date is required",
          }),
        to: z
          .union([z.string(), z.date()])
          .refine((val) => val && dayjs(val).isValid(), {
            message: "End date is required",
          }),
      })
      .refine(
        (data) => {
          const isFromValid = data.from && dayjs(data.from).isValid();
          const isToValid = data.to && dayjs(data.to).isValid();
          return isFromValid && isToValid;
        },
        {
          message: "Both start date and end date are required.",
        }
      )
      .refine(
        (data) => {
          if (!data.from || !dayjs(data.from).isValid()) return true;
          return dayjs(data.from).isBefore(dayjs().add(1, "day"));
        },
        {
          message: "Start date cannot be in the future",
        }
      )
      .refine(
        (data) => {
          const fromDate = dayjs(data.from);
          const toDate = dayjs(data.to);

          if (!fromDate.isValid() || !toDate.isValid()) {
            return true;
          }

          return fromDate.isBefore(toDate) || fromDate.isSame(toDate, "day");
        },
        {
          message: "Start date must be before or equal to end date",
        }
      ),
  }),
  //postgraduation
  postGraduateCollegeName: z.string({
    required_error: "post graduation college is required",
  }),
  postGraduateDegreeName: z.string({
    required_error: "post graduation Degree name is required",
  }),
  postGraduateGPA: z.preprocess(
    (val) => {
      const parsed = Number(val);
      return isNaN(parsed) || val === "" ? undefined : parsed;
    },
    z
      .number({
        required_error: "post graduation GPA till time is required",
      })
      .min(0, { message: "Enter GPA between 0 to 10" })
      .max(10, { message: "Enter GPA between 0 to 10" })
  ),
  postGraduateCertUrl: z.string().optional(),
  postGraduateDuration: z.object({
    duration: z
      .object({
        from: z
          .union([z.string(), z.date()])
          .refine((val) => val && dayjs(val).isValid(), {
            message: "Start date is required",
          }),
        to: z
          .union([z.string(), z.date()])
          .refine((val) => val && dayjs(val).isValid(), {
            message: "End date is required",
          }),
      })
      .refine(
        (data) => {
          const isFromValid = data.from && dayjs(data.from).isValid();
          const isToValid = data.to && dayjs(data.to).isValid();
          return isFromValid && isToValid;
        },
        {
          message: "Both start date and end date are required.",
        }
      )
      .refine(
        (data) => {
          if (!data.from || !dayjs(data.from).isValid()) return true;
          return dayjs(data.from).isBefore(dayjs().add(1, "day"));
        },
        {
          message: "Start date cannot be in the future",
        }
      )
      .refine(
        (data) => {
          const fromDate = dayjs(data.from);
          const toDate = dayjs(data.to);

          if (!fromDate.isValid() || !toDate.isValid()) {
            return true;
          }

          return fromDate.isBefore(toDate) || fromDate.isSame(toDate, "day");
        },
        {
          message: "Start date must be before or equal to end date",
        }
      ),
  }),

  // step 3 fields  (Experience)
  Years_of_experience: z.preprocess(
    (val) => {
      const parsed = Number(val);
      return isNaN(parsed) || val === "" ? undefined : parsed;
    },
    z
      .number({
        required_error: "Years of experience is required",
      })
      .min(0, { message: "Enter valid years of experience" })
      .max(100, { message: "Enter valid years of experience" })
  ),
  Experience: z.array(
    z.object({
      company_name: z
        .string({ required_error: "Company name is required" })
        .min(1, { message: "Company name is required" }),
      job_role: z
        .string({ required_error: "job role is required" })
        .min(1, "Job role is required"),
      duration: z.object({
        from: z
          .union([z.string(), z.date()])
          .refine((val) => val && dayjs(val).isValid(), {
            message: "Start date is required",
          }),
        to: z
          .union([z.string(), z.date()])
          .refine((val) => val || dayjs(val).isValid(), {
            message: "End date is required",
          }),
      }),
      // }).refine(
      //   (data) => {
      //     const isFromValid = data.from && dayjs(data.from).isValid();
      //     const isToValid = !data.to || dayjs(data.to).isValid(); // Allow `to` to be optional
      //     return isFromValid && isToValid;
      //   },
      //   {
      //     message: "Start date is required, and end date must be valid if provided.",
      //   }
      // ),
      description: z
        .string({ required_error: "Work description is required" })
        .min(1, { message: "description is required" }),
      experienceCertUrl: z.string().optional(),
    })
  ),

  // Step 4: Skills
  Skills: z
    .array(
      z.object({
        skillName: z.string({ required_error: "Skill name is required" }),
        skillUrl: z.string().optional(),
      })
    )
    .min(1, { message: "Please select or enter at least one skill" })
    .max(5, { message: "You can only select 5 skills" })
    .default([]),
  // Step 5 : Achievements
  Awards: z.array(
    z.object({
      award_name: z
        .string({ required_error: "Award name is required" })
        .min(1, { message: "Award name is required" }),
      awarding_organization: z
        .string({ required_error: "Awarding organization is required" })
        .min(1, "Awarding organization is required"),
      date_of_achievement: z
        .union([z.string(), z.date()])
        .refine((val) => val && dayjs(val).isValid(), {
          message: "Date of achievement is required and must be a valid date",
        })
        .refine(
          (val) => {
            if (!val || !dayjs(val).isValid()) return true;
            return dayjs(val).isBefore(dayjs().add(1, "day"));
          },
          {
            message: "Date of achievement cannot be in the future",
          }
        ),
      description: z
        .string({ required_error: "A brief description is required" })
        .min(1, { message: "A brief description is required" }),
    })
  ),
  Courses: z.array(
    z.object({
      course_name: z
        .string({ required_error: "Course name is required" })
        .min(1, { message: "Course name is required" }),
      organization: z
        .string({ required_error: "Institution/organization is required" })
        .min(1, "Institution/organization is required"),
      duration: z
        .object({
          from: z
            .union([z.string(), z.date()])
            .refine((val) => val && dayjs(val).isValid(), {
              message: "Start date is required",
            }),
          to: z
            .union([z.string(), z.date()])
            .refine((val) => val && dayjs(val).isValid(), {
              message: "End date is required",
            }),
        })
        .refine(
          (data) => {
            // Check if both from and to are valid and present
            const isFromValid = data.from && dayjs(data.from).isValid();
            const isToValid = data.to && dayjs(data.to).isValid();

            // Both dates must be valid
            return isFromValid && isToValid;
          },
          {
            message: "Both start date and end date are required.",
          }
        )
        .refine(
          (data) => {
            if (!data.from || !dayjs(data.from).isValid()) return true;
            return dayjs(data.from).isBefore(dayjs().add(1, "day"));
          },
          {
            message: "Start date cannot be in the future",
          }
        )
        .refine(
          (data) => {
            if (!data.to || !dayjs(data.to).isValid()) return true;
            return dayjs(data.to).isBefore(dayjs().add(1, "day"));
          },
          {
            message: "End date cannot be in the future",
          }
        )
        .refine(
          (data) => {
            const fromDate = dayjs(data.from);
            const toDate = dayjs(data.to);

            if (!fromDate.isValid() || !toDate.isValid()) {
              return true;
            }

            return fromDate.isBefore(toDate) || fromDate.isSame(toDate, "day");
          },
          {
            message: "Start date must be before or equal to end date",
          }
        ),
      description: z
        .string({ required_error: "Course description is required" })
        .min(1, { message: "Course description is required" }),
    })
  ),
  Projects: z.array(
    z.object({
      project_name: z
        .string({ required_error: "Project name is required" })
        .min(1, { message: "Project name is required" }),
      project_url: z
        .string()
        .transform((val) => (val === "" ? undefined : val)) // treat "" as undefined
        .optional()
        .refine((url) => !url || url.startsWith("https://"), {
          message: "Project url must start with https://",
        }),
      duration: z
        .object({
          from: z
            .union([z.string(), z.date()])
            .refine((val) => val && dayjs(val).isValid(), {
              message: "Start date is required",
            }),
          to: z
            .union([z.string(), z.date()])
            .refine((val) => val && dayjs(val).isValid(), {
              message: "End date is required",
            }),
        })
        .refine(
          (data) => {
            // Check if both from and to are valid and present
            const isFromValid = data.from && dayjs(data.from).isValid();
            const isToValid = data.to && dayjs(data.to).isValid();

            // Both dates must be valid
            return isFromValid && isToValid;
          },
          {
            message: "Both start date and end date are required.",
          }
        )
        .refine(
          (data) => {
            if (!data.from || !dayjs(data.from).isValid()) return true;
            return dayjs(data.from).isBefore(dayjs().add(1, "day"));
          },
          {
            message: "Start date cannot be in the future",
          }
        )
        .refine(
          (data) => {
            if (!data.to || !dayjs(data.to).isValid()) return true;
            return dayjs(data.to).isBefore(dayjs().add(1, "day"));
          },
          {
            message: "End date cannot be in the future",
          }
        )
        .refine(
          (data) => {
            const fromDate = dayjs(data.from);
            const toDate = dayjs(data.to);

            if (!fromDate.isValid() || !toDate.isValid()) {
              return true;
            }

            return fromDate.isBefore(toDate) || fromDate.isSame(toDate, "day");
          },
          {
            message: "Start date must be before or equal to end date",
          }
        ),
      description: z
        .string({ required_error: "Project description is required" })
        .min(1, { message: "Project description is required" }),
    })
  ),

  // step 6: Profile Summary;
  profile_summary: z
    .string({ required_error: "Profile summary is required" })
    .min(1, { message: "Profile summary is required" })
    .max(300, {
      message: "Enter profile summary within 300 characters only",
    }),
  // verifications;

  // 1) personal Details verifications validations;
  personalVerifications: z.object({
    name: z.object(
      {
        isSelfAttested: z.boolean({
          message: "Name needs to be self-attested",
        }),
        // .refine((val) => val === false, {
        //   message: "Name needs to be self-attested",
        // }),
      },
      { message: "Name need to self attested" }
    ),
    email: z.object(
      {
        isSelfAttested: z.boolean({
          message: "Email needs to be self-attested",
        }),
        // .refine((val) => val === false, {
        //   message: "Email needs to be self-attested",
        // }),
      },
      { message: "Email need to self attested" }
    ),
    location: z.object(
      {
        isSelfAttested: z.boolean({
          message: "Location needs to be self-attested",
        }),
        // .refine((val) => val === false, {
        //   message: "location needs to be self-attested",
        // }),
      },
      { message: "Location needs to self attested" }
    ),
    profession: z.object(
      {
        isSelfAttested: z.boolean({
          message: "Profession needs to be self-attested",
        }),
        // .refine((val) => val === false, {
        //   message: "Profession needs to be self-attested",
        // }),
      },
      {
        message: "Profession needs to be self-attested",
      }
    ),
    imageUrl: z.object(
      {
        isSelfAttested: z.boolean({
          message: "Image needs to be self attested",
        }),
        // .refine((val) => val === false, {
        //   message: "Profile needs to be self-attested",
        // }),
      },
      {
        message: "Your photo needs to be self-attested",
      }
    ),
    phoneNumber: z.object(
      {
        isSelfAttested: z.boolean({
          message: "Phone number needs to be self attested",
        }),
        // .refine((val) => val === false, {
        //   message: "Phone number needs to be self-attested",
        // }),
      },
      {
        message: "Phone number needs to be self-attested",
      }
    ),
  }),
  // 2) Education verifications validations
  educationVerificationValidations: z.object({
    class10: z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required for class10",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of isSelfAttested, mailStatus, or proofs is required for class10",
        }
      ),
    class12: z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required for class12",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of isSelfAttested, mailStatus, or proofs is required for class10",
        }
      ),
    undergraduation: z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required for undergraduation",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of isSelfAttested, mailStatus, or proofs is required for class10",
        }
      ),
    postgraduation: z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required for postgraduation",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of isSelfAttested, mailStatus, or proofs is required for class10",
        }
      ),
  }),

  // 3) Experience verifications validations
  experienceVerificationsValidations: z.record(
    z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
  ),

  // 4) Skills verifications validations;
  skillsVerificationsValidations: z.record(
    z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
  ),

  // 5) award verifications validations;
  awardVerificationsValidations: z.record(
    z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
  ),

  // 6) course verifications validations;
  courseVerificationsValidations: z.record(
    z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
  ),

  //7) project verifications validations;
  projectVerificationsValidations: z.record(
    z
      .object(
        {
          isSelfAttested: z.boolean().optional(),
          mailStatus: z.string().optional(),
          proof: z.array(z.string()).optional(),
        },
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
      .refine(
        (data) =>
          data.isSelfAttested !== undefined ||
          data.mailStatus !== undefined ||
          (data.proof && data.proof.length > 0),
        {
          message:
            "At least one of selfAssested, mail to Issuer, or proofs is required",
        }
      )
  ),

  // 8) profile summary verification validations;
  profileSummarVerificationValidations: z.object({
    profile_summary: z.object(
      {
        isSelfAttested: z.boolean({
          message: "Profile summary needs to be self-attested",
        }),
        // .refine((val) => val === false, {
        //   message: "Name needs to be self-attested",
        // }),
      },
      { message: "Name need to self attested" }
    ),
  }),
});
