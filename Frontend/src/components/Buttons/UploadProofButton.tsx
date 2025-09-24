import { Paperclip } from "lucide-react";
import { Button } from "../ui/button";
import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

const UploadProofButton = (
  props: ComponentPropsWithoutRef<"button"> & {
    col?: boolean;
    ipfsHash?:string
  }
) => {
  const { className, col, ipfsHash } = props;
  return (
    <div className={twMerge("flex items-center gap-1", col && "flex-col")}>
      <Button
        type="button"
        className={twMerge(
          "mt-2 bg-white border border-[#FB980E] text-[#FB980E] hover:bg-white hover:text-[#FB980E] h-8 shadow-md ",
          ipfsHash &&
            "border-[#006666] text-[#006666] hover:border-[#006666] hover:text-[#006666]",
          className
        )}
      >
        <Paperclip size={26} className="size-5 mr-3" />{" "}
        {ipfsHash ? <a href={`${import.meta.env.VITE_AzureGATWAY}/${ipfsHash}`} target="_blank" >View Proof</a> : "Upload proof"}
      </Button>
      <span className={"text-[#006666] font-semibold text-xs text-nowrap"}>
        (png/jpeg/pdf) accepted
      </span>
    </div>
  );
};

export default UploadProofButton;
