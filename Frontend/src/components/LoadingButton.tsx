import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { twMerge } from "tailwind-merge";

type Props = {
  widthFull?: boolean;
  className?: string;
  buttonText?: string;
};

const LoadingButton = ({ widthFull = false, className, buttonText }: Props) => {
  return (
    <Button
      type="button"
      className={twMerge(
        "",
        widthFull && "w-full cursor-not-allowed",
        className
      )}
    >
      <Loader2 className={`mr-2 h-4 w-4 animate-spin`} />
      {buttonText || "Loading..."}
    </Button>
  );
};

export default LoadingButton;
