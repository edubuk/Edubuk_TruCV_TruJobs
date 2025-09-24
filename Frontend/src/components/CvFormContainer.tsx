import CvForm from "@/forms/CvForm";
import Stepper from "./Stepper";
import { useEffect } from "react";
import { useCvFromContext } from "@/context/CvForm.context";

const CvFormContainer = () => {
  const { setStep } = useCvFromContext();
  useEffect(() => {
    const storageStep = localStorage.getItem("currentStep");
    if (storageStep) {
      setStep(Number(storageStep));
    }
  }, []);
  return (
    <div className="border flex flex-col md:flex-row justify-center py-4  w-full px-2 md:px-12 gap-4">
      <Stepper />
      <div className="border rounded-lg shadow-lg max-w-4xl w-full">
        <CvForm />
      </div>
    </div>
  );
};

export default CvFormContainer;
