import { CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

const SelfAttestButton = (
  props: ComponentPropsWithoutRef<"button"> & { isAttested?: boolean ,required?:boolean}
) => {
  const { className, onClick, isAttested = false ,required=false} = props;
  return (
    <Button
      onClick={onClick}
      type="button"
      className={twMerge(
        "mt-2 bg-white border border-[#FB980E] text-[#FB980E] hover:bg-white hover:text-[#FB980E] h-8 shadow-md w-fit",
        isAttested &&
          "border-[#006666] text-[#006666] hover:border-[#006666] hover:text-[#006666]",
        className
      )}
    >
      <CheckCircle size={26} className="size-5 mr-3" />{" "}
      {isAttested ? "Self attested" : (required ? "Self attest*" : "Self attest")}
    </Button>
  );
};

export default SelfAttestButton;
