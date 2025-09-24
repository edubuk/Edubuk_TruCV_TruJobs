import { twMerge } from "tailwind-merge";
import { Button } from "../ui/button";
import { ComponentPropsWithoutRef } from "react";
import { Mail } from "lucide-react";

const IssuerButton = (
  props: ComponentPropsWithoutRef<"button"> & { text?: string }
) => {
  const { className, text, onClick } = props;
  return (
    <Button
      type="button"
      onClick={onClick}
      className={twMerge(
        "mt-2 bg-white border border-[#FB980E] text-[#FB980E] hover:bg-white hover:text-[#FB980E] h-8 shadow-md",
        className
      )}
    >
      <Mail size={26} className="size-5 mr-3 flex-none" />
      {(text && text) || "Send an email to issuer for verification"}
    </Button>
  );
};

export default IssuerButton;
