import React, { forwardRef, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "./animated-beam";
import SelfAttestButton from "../Buttons/SelfAttest";
import UploadProofButton from "../Buttons/UploadProofButton";
import IssuerButton from "../Buttons/IssuerButton";
import { twMerge } from "tailwind-merge";
import { useFormContext } from "react-hook-form";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import { FileUpload } from "./file-upload";
import {uploadToIpfs} from "./PinFileOnPinata";
import {sendEmail} from './MailToVerify';
import toast from "react-hot-toast";
import { Input } from "./input";
import { Button } from "./button";


const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

// type VerificationObjectType = {
//   isSelfAttested?: boolean;
//   proof?: string;
//   mailStatus?: string;
// };

export function AnimatedVerification({
  className,
  firstButtonText,
  buttonClass,
  field,
  // isSelfAttested,
  verificationStep,
  storedVerifications,
  validationStep,
  // verificationObject,
  setterVerificationObject,
  jobRole,
  companyName,
  skill,
  awardName,
  awardOrg,
  courseName,
  courseOrg,
  underGraduateCollegeName,
  postGraduateCollegeName,
  class10SchoolName,
  class12CollegeName,
  underGraduateDegreeName,
  postGraduateDegreeName,
}: {
  className?: string;
  firstButtonText: string;
  buttonClass?: string;
  field: string;
  isSelfAttested?: boolean;
  verificationStep: string;
  validationStep?: string;
  storedVerifications?: any;
  verificationObject: {
    [key: string]: {
      isSelfAttested?: boolean;
      proof?: string[];
      mailStatus?: string;
    };
  };
  setterVerificationObject: React.Dispatch<React.SetStateAction<any>>;
  jobRole?:string;
  companyName?:string;
  skill?:string;
  awardName?:string;
  awardOrg?:string;
  courseName?:string;
  courseOrg?:string;
  class12CollegeName?:string;
  class10SchoolName?:string;
  underGraduateCollegeName?:string;
  postGraduateCollegeName?:string;
  underGraduateDegreeName?:string;
  postGraduateDegreeName?:string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  // states;
  const [files, setFiles] = useState<File[]>([]);
  const [ipfsHash,setIpfsHash] = useState<string>("");
  const { setValue, getValues } = useFormContext();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [mailId,setMailId] = useState<string>("");
  const [openMailDialog, setOpenMailDialog] = useState<boolean>(false);
  // Safely check if the verificationObject contains the field
  // const verificationData = verificationObject[field] || {};
  console.log(field==="class10");
  const verificationData = (storedVerifications?.[field]) || {};
  //console.log(files);
  // console.log("form object", getValues());
  const formObject = getValues();
  useEffect(() => {
    console.log("form object ", formObject);
  }, [formObject]);

  const handleSelfAttest = (field: string) => {
    setterVerificationObject((prev: any) => ({
      ...prev,
      [field]: {
        ...prev[field],
        isSelfAttested: true,
      },
    }));
    setValue(`${verificationStep}[${field}].isSelfAttested`, true); //setting updated value in form;
    // for validations needed to stop the user from directly skip verifications;
    setValue(`${validationStep}[${field}].isSelfAttested`, true);
  };
  
  const uploadImageToDB = async () => {
    if (files.length === 0) return;

    const proofArray: string[] = [];
    const hashArray: string[] = [];
  
    let metaDataHash,docHash;
    const userName = localStorage.getItem("userName");
    switch(verificationStep)
    {
      case "educationVerifications":
        if(field==="class10")
        {
          const eduUserData1 = `completing ${firstButtonText} by ${userName} from ${class10SchoolName}`;
        ({ metaDataHash, docHash } = await uploadToIpfs(files[0], setIsUploading,eduUserData1));
        }
        else if(field==="class12")
        {
          const eduUserData1 = `completing ${firstButtonText} by ${userName} from ${class12CollegeName}`;
        ({ metaDataHash, docHash } = await uploadToIpfs(files[0], setIsUploading,eduUserData1));
        }
        else if(field==="undergraduation")
        {
          const eduUserData1 = `completing ${underGraduateDegreeName} by ${userName} from ${underGraduateCollegeName}`;
        ({ metaDataHash, docHash } = await uploadToIpfs(files[0], setIsUploading,eduUserData1));
        }
        else if(field==="postgraduation")
        {
          const eduUserData1 = `completing ${postGraduateDegreeName} by ${userName} from ${postGraduateCollegeName}`;
        ({ metaDataHash, docHash } = await uploadToIpfs(files[0], setIsUploading,eduUserData1));
        }
        break;
      case "experienceVerifications":
        const userData1 = `completing ${jobRole} job by ${userName} at ${companyName}`;
        ({ metaDataHash, docHash } = await uploadToIpfs(files[0], setIsUploading,userData1));
        break;

      case "skillsVerifications":
        const userData2 = `completing ${skill} skill by ${userName}`;
        ({ metaDataHash, docHash } = await uploadToIpfs(files[0], setIsUploading,userData2));
        break;

      case "awardVerifications":
        const userData3 = `receiving ${awardName} certificate by ${userName} at ${awardOrg}`;
        ({ metaDataHash, docHash } = await uploadToIpfs(files[0], setIsUploading,userData3));
        break;
      case "courseVerifications":
        const userData4 = `completing ${courseName} course by ${userName} at ${courseOrg}`;
        ({ metaDataHash, docHash } = await uploadToIpfs(files[0], setIsUploading,userData4));
        break;
    }
    console.log("metaData and docHash",metaDataHash,docHash);
    if(docHash)
      {
        if (
          verificationStep === "educationVerifications" ||
          verificationStep === "experienceVerifications" ||
          verificationStep === "skillsVerifications" ||
          verificationStep === "awardVerifications" ||
          verificationStep === "courseVerifications"
        ) {
          hashArray.push(metaDataHash as string);
          console.log("verification data : ",verificationData)
          // Retrieve existing hashArray from localStorage
          let data = localStorage.getItem("hashArray");
        
          let updatedArray = [];
          if (data) {
            // Parse existing data if not null
            updatedArray = JSON.parse(data);
          }
        
          // Combine existing hashes with the new ones
          updatedArray = [...updatedArray, ...hashArray];
        
          // Store the updated array back in localStorage
          localStorage.setItem("hashArray", JSON.stringify(updatedArray));
        }
        
      setIpfsHash(docHash as string);
      proofArray.push(docHash as string);
      setDialogOpen(false);
      console.log("Proof Array:", proofArray); // Ensure proofArray is correct
      }

    try {
    
      // for updating ui to proof uploaded updating verifications object using its setter;
      setterVerificationObject((prev: any) => ({
        ...prev,
        [field]: {
          ...prev[field],
          proof: proofArray,
        },
      }));

      setIsUploading(false);
      setDialogOpen(false); //closing dialog after upload;
      // Ensure setValue is called after all uploads are complete
      setValue(`${verificationStep}[${field}].proof`, proofArray, {
        shouldValidate: true, // Optionally trigger validation
        shouldDirty: true, // Optionally mark the field as dirty
      });
      // setting value for the verification validations
      setValue(`${validationStep}[${field}].proof`, proofArray, {
        shouldValidate: true, // Optionally trigger validation
        shouldDirty: true, // Optionally mark the field as dirty
      });

      console.log("Form after setting value:", getValues()); // Debug to see the updated form values
    } catch (error) {
      console.error("Error uploading files:", error);
      setIsUploading(false);
    }
  };

  // TODO: uploadProof button onClick handler;
  const uploadProofOnclickHandler = () => {
    //console.log("onclick called for upload button");
    // you can have files in files[] before upload it to the database;
    // <<---------------------------------------->>

    // write your code here; try console.log(files);

    // <<------------------------------------------>>
    uploadImageToDB().then(() => {
      setFiles([]);
    });
  };

  // TODO: handle files and setting files;
  const handleUploadProof = (files: File[]) => {
    console.log(files);
    setFiles((prev) => [...prev, ...files]);
  };
  setValue(`${verificationStep}[${field}].mailStatus`, "pending");
  // handle mail to issuer;
  const handleMailToIssuer = () => {
    // TODO: handling mail to issuer;
    //e.preventDefault();
    if(!ipfsHash)
    {
      return toast.error("proof document is not uploaded");
    }
    sendEmail(ipfsHash,verificationStep,field,mailId);
  };
  return (
    <div
      className={cn(
        "relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg border bg-background md:p-10 md:shadow-md",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-w-2xl flex-row items-stretch justify-between gap-8 sm:gap-10">
        <div className="flex flex-col justify-center">
          <div className="w-24 sm:w-48 z-50">
            {/* first button */}
            <div
              ref={div7Ref}
              className={twMerge(
                "px-2 sm:px-4 py-4 text-white  rounded-lg  bg-[rgb(0,102,102)] hover:bg-[rgb(0,102,102)] flex items-center text-xs sm:text-base font-semibold w-full  sm:w-fit text-center  sm:line-clamp-3",
                buttonClass
              )}
            >
              {firstButtonText}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center translate-x-0 sm:translate-x-0 z-10">
          <Circle ref={div6Ref} className="size-16">
            <img
              src="/edubuk-crop.jpg"
              alt="edubuk"
              className="h-10 w-10 object-cover"
            />
          </Circle>
        </div>
        <div className="flex flex-col justify-center  gap-2 -translate-x-1 sm:translate-x-0 z-30">
          {/* <Circle ref={div1Ref}>
            <Icons.googleDrive />
          </Circle> */}
          {/* self attest button */}
          <div ref={div2Ref} className="z-50">
            <SelfAttestButton
              className="text-xs sm:text-base"
              onClick={() => handleSelfAttest(field)}
              // isAttested={verificationObject[field].isSelfAttested}
              // isAttested={verificationData.isSelfAttested}
              isAttested={verificationData?.isSelfAttested}
            />
          </div>
          <div ref={div3Ref} className="z-50 mt-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger>
                {/* triggering dialogue */}
              {!ipfsHash&&
                <UploadProofButton
                  col
                  className="-ml-7 text-xs sm:text-base sm:ml-0"
                  ipfsHash={ipfsHash}
                />
              }
              </DialogTrigger>
              {ipfsHash&&
              <UploadProofButton
                  col
                  className="-ml-7 text-xs sm:text-base sm:ml-0 -mt-3"
                  ipfsHash={ipfsHash}
                />
              }
              <DialogContent className="max-w-80 sm:max-w-2xl">
                <FileUpload
                  onChange={handleUploadProof}
                  uploadButtonOnClick={uploadProofOnclickHandler}
                  isLoading={isUploading}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div ref={div4Ref} className="z-50">
            {!openMailDialog&&<IssuerButton
              text="Mail to issuer"
              onClick={()=>setOpenMailDialog(true)}
              className="-ml-2  text-xs sm:text-base sm:ml-0"
            />}
            {
              openMailDialog&&
            <div className="flex flex-col items-center justify-center gap-1 w-40">
                  <Input
                    type="string"
                    placeholder="Enter Institute MailId"
                    value={mailId}
                    onChange={(e)=>setMailId(e.target.value)}
                  />
                  <div className="flex items-center justify-center gap-2">
                  <Button type="button" onClick={handleMailToIssuer}>send</Button>
                  <Button type="button" onClick={()=>setOpenMailDialog(false)}>close</Button>
                  </div>
                  </div>
}
          </div>
        </div>
      </div>

      {/* AnimatedBeams */}
      {/* <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div6Ref}
        duration={3}
      /> */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div7Ref}
        duration={3}
      />
    </div>
  );
}
