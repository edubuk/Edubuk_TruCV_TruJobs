import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { IoCheckmarkOutline } from "react-icons/io5";
import student from "/student.png";
import employee from "/employee.png";
import { useState } from "react";
import SelfAttestButton from "@/components/Buttons/SelfAttest";
import { useCvFromContext } from "@/context/CvForm.context";
import {
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaTelegram,
  FaTwitter,
} from "react-icons/fa";
import { MdEmail, MdLocationPin, MdPerson, MdPhone } from "react-icons/md";
import { uploadFile } from "@/uploadFile";

type Props = {
  handleProfessionSelect: (profession: string) => void;
  // setImagePreview: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // imagePreview: string;
  isImageUploading: boolean;
  setIsImageUploading: React.Dispatch<React.SetStateAction<boolean>>;
  profession: string;
  setProfession: React.Dispatch<React.SetStateAction<string | null>>;
};

type PersonalVerificationsType = {
  name: {
    isSelfAttested: boolean;
  };
  email: {
    isSelfAttested: boolean;
  };
  location: {
    isSelfAttested: boolean;
  };
  profession: {
    isSelfAttested: boolean;
  };
  imageUrl: {
    isSelfAttested: boolean;
  };
  phoneNumber: {
    isSelfAttested: boolean;
  };
  linkedinProfile: {
    isSelfAttested: boolean;
  };
  twitterProfile: {
    isSelfAttested: boolean;
  };
  telegramProfile: {
    isSelfAttested: boolean;
  };
  instagramProfile: {
    isSelfAttested: boolean;
  };
  githubProfile: {
    isSelfAttested: boolean;
  };
};

const PersonalDetails = ({
  handleProfessionSelect,
  profession,
  setProfession,
  isImageUploading,
  setIsImageUploading,
}: Props) => {
  const { control, setValue, getValues } = useFormContext();
  const storedData = localStorage.getItem("step1CvData");
  const localDataImage = storedData ? JSON.parse(storedData) : null;
  const [imagePreview, setImagePreview] = useState<string>(
    localDataImage?.imageUrl || ""
  );
  const [imageError, setImageError] = useState<string>("");
  const { personalDetailsVerifications, setPersonalDetailsVerifications } =
    useCvFromContext();
  console.log(personalDetailsVerifications);
  // verification states;
  //   name
  // email
  // location
  // profession
  // imageUrl
  // phoneNumber

  // const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const { personalDetailsVerification: storedVerification } = getValues();
  const uploadImageToDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setImageError("");
    setImagePreview("");
    setIsImageUploading(true);
    setValue("imageFile", e.target.files[0]);
    console.log("imageFile", e.target.files[0]);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    console.log("file", file);
    const response: any = await uploadFile(formData);
    console.log("Imgres", response);
    if (response) {
      if (response.data.success) {
        setImagePreview(response.data.url);
        setValue("imageUrl", response.data.url);
        setIsImageUploading(false);
      } else if (!response.response.data.success) {
        setImageError(`Could not upload (${response.response.data.error})`);
        setIsImageUploading(false);
      }
    }

    //const storage = getStorage(app);
    //const fileName = new Date().getTime() + e.target.files[0]?.name!;
    //const storageRef = ref(storage, fileName);

    //const uploadTask = uploadBytesResumable(storageRef, e.target.files[0]);
    // uploadTask.on(
    //   "state_changed",
    //   (snapshot) => {
    //     console.log("image upload starting", snapshot);
    //   },
    //   (error) => {
    //     console.log(`Error while uploading to the firebase, ${error}`);
    //     setImageError("Could not upload image (file must be less than 2MB)");
    //     setIsImageUploading(false);
    //   },
    // () => {
    //   getDownloadURL(uploadTask.snapshot.ref).then((downloadUrl) => {
    //     // imageUrl = downloadUrl;
    //     // console.log(downloadUrl);
    //     setImagePreview(downloadUrl);
    //     setValue("imageUrl", downloadUrl);
    //     setIsImageUploading(false);
    //   });
    // }
    //);
  };
  const handleSelfAttest = (field: keyof PersonalVerificationsType) => {
    setPersonalDetailsVerifications((prev) => ({
      ...prev,
      [field]: {
        isSelfAttested: true,
      },
    }));
    setValue(`personalDetailsVerification.${field}.isSelfAttested`, true);
    setValue(`personalVerifications.${field}.isSelfAttested`, true);
  };

  const validateImageFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const maxSize = 5 * 1024 * 1024; // 5MB limit (optional)

    if (!file) return { isValid: false, error: "No file selected" };

    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Invalid file type. Please upload JPG, JPEG, or PNG files only.",
      };
    }

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error:
          "Invalid file extension. Please upload JPG, JPEG, or PNG files only.",
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size too large. Please upload files smaller than 5MB.",
      };
    }

    return { isValid: true };
  };

  // console.log(personalDetailsVerifications);
  return (
    <div className="flex flex-col gap-4 py-2">
      {/* name and email */}
      <div className="flex flex-col md:flex-row gap-2 px-2 md:px-10">
        <div className="flex-1">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    {" "}
                    <MdPerson className="text-[#006666]" />
                    Full name*
                  </div>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.name.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("name");
                  }}
                  required={true}
                  isAttested={
                    storedVerification &&
                    storedVerification?.name?.isSelfAttested
                  }
                />
                <FormMessage />
                {/* {fieldState && <p>fieldState.error</p>} */}
              </FormItem>
            )}
          />
        </div>
        <div className="flex-1">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    <MdEmail className="text-[#006666]" />
                    Email*
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    required
                    type="email"
                    placeholder="Enter email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.email.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("email");
                  }}
                  required={true}
                  isAttested={
                    storedVerification &&
                    storedVerification?.email?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex-1">
          <FormField
            control={control}
            name="location"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    <MdLocationPin className="text-[#006666]" />
                    Location*
                  </div>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Your current location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.location.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("location");
                  }}
                  required={true}
                  isAttested={
                    storedVerification &&
                    storedVerification?.location?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      {/* location and phone number */}
      <div className="flex flex-col md:flex-row gap-2 px-2 md:px-10">
        <div className="flex-1">
          <FormField
            control={control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    <MdPhone className="text-[#006666]" /> Phone number*
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter phone number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.phoneNumber.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("phoneNumber");
                  }}
                  required={true}
                  isAttested={
                    storedVerification &&
                    storedVerification?.phoneNumber?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex-1">
          <FormField
            control={control}
            name="linkedinProfile"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    <FaLinkedin className="text-[#0a66c2]" />
                    LinkedIn Profile URL
                  </div>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Your linkedin url" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.linkedinProfile.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("linkedinProfile");
                  }}
                  isAttested={
                    storedVerification &&
                    storedVerification?.linkedinProfile?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex-1">
          <FormField
            control={control}
            name="twitterProfile"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    <FaTwitter className="text-[#1da1f2]" /> X(twitter) Profile
                    URL{" "}
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    type="string"
                    placeholder="Your twitter profile"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.twitterProfile.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("twitterProfile");
                  }}
                  isAttested={
                    storedVerification &&
                    storedVerification?.twitterProfile?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      {/* social links */}
      <div className="flex flex-col md:flex-row gap-2 px-2 md:px-10">
        <div className="flex-1">
          <FormField
            control={control}
            name="telegramProfile"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    <FaTelegram className="text-[#0088cc]" />
                    Telegram Profile URL
                  </div>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Your telegram url" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.telegramProfile.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("telegramProfile");
                  }}
                  isAttested={
                    storedVerification &&
                    storedVerification?.telegramProfile?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex-1">
          <FormField
            control={control}
            name="instagramProfile"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    <FaInstagram className="text-[#c32aa3]" />
                    Instagram Profile URL
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    type="string"
                    placeholder="Your instagram profile"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.instagramProfile.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("instagramProfile");
                  }}
                  isAttested={
                    storedVerification &&
                    storedVerification?.instagramProfile?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex-1">
          <FormField
            control={control}
            name="githubProfile"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  <div className="flex gap-1">
                    <FaGithub className="text-[#171515]" />
                    Github Profile URL
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    type="string"
                    placeholder="Your github profile"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.githubProfile.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("githubProfile");
                  }}
                  isAttested={
                    storedVerification &&
                    storedVerification?.githubProfile?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      {/* profession and image */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-5 px-1 md:px-10">
        <div className="lg:flex-1">
          <FormField
            control={control}
            name="profession"
            render={() => (
              <FormItem className="lg:flex-1">
                <FormLabel>Profession*</FormLabel>
                <FormControl>
                  <div className="flex gap-10 lg:px-12">
                    {/* student */}
                    <div
                      onClick={() => {
                        setProfession("student");
                        handleProfessionSelect("student");
                      }}
                    >
                      <div
                        className={`border-2 cursor-pointer border-[rgb(0,102,102)] p-2 rounded-full relative`}
                      >
                        {/* check selector for profession */}
                        {profession && profession === "student" && (
                          <>
                            <div className="absolute inset-0 top-0 left-0 bg-green-500 rounded-full opacity-70 m-1"></div>
                            <IoCheckmarkOutline className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-80 text-6xl " />
                          </>
                        )}
                        <img
                          src={student}
                          alt="student"
                          className="h-20 w-20 object-cover rounded-full"
                        />
                      </div>
                      <h1 className="text-center font-semibold text-base tracking-tight">
                        Student
                      </h1>
                    </div>
                    {/* Employee */}
                    <div
                      onClick={() => {
                        setProfession("employee");
                        handleProfessionSelect("employee");
                      }}
                      className=""
                    >
                      <div className="border-2 cursor-pointer border-[rgb(0,102,102)] p-2 rounded-full relative">
                        {/* check selector for profession */}
                        {profession && profession === "employee" && (
                          <>
                            <div className="absolute inset-0 top-0 left-0 bg-green-500 rounded-full opacity-70 m-1"></div>
                            <IoCheckmarkOutline className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-80 text-6xl " />
                          </>
                        )}
                        <img
                          src={employee}
                          alt="employee"
                          className="h-20 w-20 object-cover rounded-full"
                        />
                      </div>
                      <h1 className="text-center font-semibold text-base tracking-tight">
                        Employee
                      </h1>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* self attest button */}
          <FormField
            control={control}
            name="personalVerifications.profession.isSelfAttested"
            render={() => (
              <FormItem className="flex-1">
                <SelfAttestButton
                  onClick={() => {
                    handleSelfAttest("profession");
                  }}
                  required={true}
                  isAttested={
                    storedVerification &&
                    storedVerification?.profession?.isSelfAttested
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* image section id:2805*/}
        <FormField
          control={control}
          name="imageFile"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Upload image*</FormLabel>
              <FormControl>
                {/* <Input
                  type="file"
                  accept=".jpg, .jpeg, .png"
                  onChange={(event) => {
                    field.onChange(
                      event.target.files ? event.target.files[0] : null
                    );
                    uploadImageToDB(event);
                    // setImagePreview(event);
                  }}
                /> */}
                <Input
                  type="file"
                  accept=".jpg, .jpeg, .png"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const validation = validateImageFile(file);

                    if (!validation.isValid) {
                      alert(validation.error);
                      event.target.value = ""; // Clear the input
                      // field.onChange(null);
                      return;
                    }

                    field.onChange(file);
                    uploadImageToDB(event);
                  }}
                />
              </FormControl>
              <FormMessage />
              {imageError && (
                <p className="text-sm text-red-500  font-semibold">
                  {imageError}
                </p>
              )}
              {isImageUploading && (
                <p className="text-sm text-green-500  font-semibold">
                  Uploading image please wait
                </p>
              )}
              {imagePreview && (
                <>
                  <img
                    src={imagePreview}
                    alt="previewImage"
                    className="h-48 w-full object-cover rounded-lg shadow-lg"
                  />
                  {/* self attest button */}
                  <FormField
                    control={control}
                    name="personalVerifications.imageUrl.isSelfAttested"
                    render={() => (
                      <FormItem className="flex-1">
                        <SelfAttestButton
                          onClick={() => {
                            handleSelfAttest("imageUrl");
                          }}
                          required={true}
                          isAttested={
                            storedVerification &&
                            storedVerification?.imageUrl?.isSelfAttested
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PersonalDetails;
