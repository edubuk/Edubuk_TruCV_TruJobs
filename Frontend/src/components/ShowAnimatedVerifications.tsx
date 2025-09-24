import React, { forwardRef, useRef } from "react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "./ui/animated-beam";
// import SelfAttestButton from "../Buttons/SelfAttest";
// import UploadProofButton from "../Buttons/UploadProofButton";
// import IssuerButton from "../Buttons/IssuerButton";
// import { twMerge } from "tailwind-merge";
import ShowVerifications from "./ShowVerifications";
// import { useFormContext } from "react-hook-form";
// import { Dialog, DialogContent, DialogTrigger } from "./dialog";

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

export function ShowAnimatedVerifications({
  className,
  firstButtonText,
  isSelfAttested,
  mailStatus,
  hash
}: // buttonClass,
{
  className?: string;
  firstButtonText: string;
  buttonClass?: string;
  isSelfAttested: boolean;
  mailStatus?:string;
  hash?:string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  // const div3Ref = useRef<HTMLDivElement>(null);
  // const div4Ref = useRef<HTMLDivElement>(null);
  // const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  // states;

  return (
    <div
      className={cn(
        "relative flex  w-full items-center justify-center overflow-hidden rounded-lg bg-background ",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full flex-row  justify-between gap-8 sm:gap-10 ">
        <div className="flex flex-col justify-center">
          <div className="w-48 sm:w-48 z-50">
            {/* first button */}
            {/* <div
              ref={div7Ref}
              className={twMerge(
                "px-2 sm:px-4 py-4 text-white  rounded-lg  bg-[rgb(0,102,102)] hover:bg-[rgb(0,102,102)] flex items-center text-xs sm:text-base font-semibold w-fit text-center sm:line-clamp-1",
                buttonClass
              )}
            >
              {firstButtonText}
            </div> */}
            <div
              ref={div7Ref}
              className="flex justify-center items-center gap-2 px-2 py-1 text-xs lg:text-sm tracking-wide font-semibold rounded-sm bg-[#006666] text-white w-fit"
            >
              {firstButtonText }
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center translate-x-0 sm:-translate-x-0 z-10">
          <Circle ref={div6Ref} className="size-12 lg:size-14">
            <img
              src="/edubuk-crop.jpg"
              alt="edubuk"
              className="size-6 lg:size-9 object-cover"
              draggable={false}
            />
          </Circle>
        </div>
        <div className="flex flex-col justify-center  gap-2 -translate-x-1 sm:translate-x-0 z-30">
          {/* <Circle ref={div1Ref}>
            <Icons.googleDrive />
          </Circle> */}
          {/* self attest button */}
          <div ref={div2Ref} className="z-50 bg-white  w-96">
            <ShowVerifications isAttested={isSelfAttested} mailStatus={mailStatus} hash={hash}/>
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
      {/* <AnimatedBeam
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
       */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div7Ref}
        duration={3}
      />
    </div> 
  );
}
