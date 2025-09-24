import { useCvFromContext } from "@/context/CvForm.context";
import { IoMdCheckmark } from "react-icons/io";
import { twMerge } from "tailwind-merge";

const Stepper = () => {
  const { step } = useCvFromContext();

  return (
    <div className="border  h-20 md:h-[600px] md:pb-10 w-full overflow-hidden md:w-80 flex items-center px-2 sm:px-12 rounded-md shadow-lg">
      <div className="flex rounded-lg md:gap-16">
        {/* counter */}
        <div className="relative  -rotate-90 md:rotate-0 md:h-[500px]">
          {/* red vertical line  */}
          <div className="absolute inset-0  top-1/2 left-1/2 border border-dashed border-red-500 -translate-x-1/2 -translate-y-0 md:-translate-y-1/2 h-[300px] sm:h-[475px] md:h-[450px]"></div>

          {/* circles for count step */}
          <div
            className={`absolute rotate-90 md:rotate-0 inset-0 top-0 md:top-6 left-1/2 -translate-x-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full ${
              step === 1 ? "bg-[#FB980E]" : "bg-[rgb(0,102,102)]"
            }  flex items-center justify-center text-white text-xl`}
          >
            01
          </div>
          <div
            className={`absolute inset-0 rotate-90 md:rotate-0 top-14 sm:top-24 left-1/2 -translate-x-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full ${
              step === 2 ? "bg-[#FB980E]" : "bg-[rgb(0,102,102)]"
            }  flex items-center justify-center text-white text-xl shadow-lg`}
          >
            02
          </div>
          <div
            className={`absolute inset-0 rotate-90 md:rotate-0 top-28 sm:top-48 md:top-[200px] left-1/2 -translate-x-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full ${
              step === 3 ? "bg-[#FB980E]" : "bg-[rgb(0,102,102)]"
            } flex items-center justify-center text-white text-xl shadow-lg`}
          >
            03
          </div>
          <div
            className={`absolute inset-0 rotate-90 md:rotate-0 top-44 sm:top-72 left-1/2 -translate-x-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full ${
              step === 4 ? "bg-[#FB980E]" : "bg-[rgb(0,102,102)]"
            } flex items-center justify-center text-white text-xl shadow-lg`}
          >
            04
          </div>
          <div
            className={`absolute inset-0 rotate-90 md:rotate-0 top-60 sm:top-96 left-1/2 -translate-x-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full ${
              step === 5 ? "bg-[#FB980E]" : "bg-[rgb(0,102,102)]"
            } flex items-center justify-center text-white text-xl shadow-lg`}
          >
            05
          </div>
          <div
            className={`absolute inset-0 rotate-90 md:rotate-0 top-[299px] sm:top-[477px] left-1/2 -translate-x-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full ${
              step === 6 ? "bg-[#FB980E]" : "bg-[rgb(0,102,102)]"
            } flex items-center justify-center text-white text-xl shadow-lg`}
          >
            06
          </div>
        </div>
        {/* step indicator */}
        <div
          className={twMerge(
            "hidden lg:flex flex-col mt-5",
            step === 1 && "gap-11 mt-7",
            step === 2 && "gap-11",
            step === 3 && "gap-9",
            step === 4 && "gap-9",
            step === 5 && "gap-8",
            step === 6 && "gap-7"
          )}
        >
          {/* step label and status */}
          {/* step1 */}
          <div
            className={`flex flex-col ${
              step === 1 ? "opacity-100" : "opacity-30"
            }`}
          >
            <h2 className="text-gray-500 text-sm uppercase font-semibold">
              Step 01
            </h2>
            <p className="text-base font-semibold tracking-tight text-nowrap capitalize">
              Personal details
            </p>
            {step >= 2 && (
              <p className="text-green-500 text-xs font-semibold flex items-center gap-.5">
                Completed <IoMdCheckmark fontSize={14} />
              </p>
            )}
          </div>
          {/* step 2 */}

          <div
            className={`flex flex-col  ${
              step === 2 ? "opacity-100" : "opacity-30"
            }`}
          >
            <h2 className="text-gray-500 text-sm uppercase font-semibold">
              Step 02
            </h2>
            <p className="text-base font-semibold tracking-tight text-nowrap capitalize">
              Education
            </p>
            {step >= 3 && (
              <p className="text-green-500 text-xs font-semibold flex items-center gap-.5">
                Completed <IoMdCheckmark fontSize={16} className="" />
              </p>
            )}
          </div>

          {/* step 3 */}
          <div
            className={`flex flex-col  ${
              step === 3 ? "opacity-100" : "opacity-30"
            }`}
          >
            <h2 className="text-gray-500 text-sm uppercase font-semibold">
              Step 03
            </h2>
            <p className="text-base font-semibold tracking-tight text-nowrap capitalize">
              Work experience
            </p>
            {step >= 4 && (
              <p className="text-green-500 text-xs font-semibold flex items-center gap-.5">
                Completed <IoMdCheckmark fontSize={16} className="" />
              </p>
            )}
          </div>
          {/* step 4 */}
          <div
            className={`flex flex-col  ${
              step === 4 ? "opacity-100" : "opacity-30"
            }`}
          >
            <h2 className="text-gray-500 text-sm uppercase font-semibold">
              Step 04
            </h2>
            <p className="text-base font-semibold tracking-tight text-nowrap capitalize">
              Skills
            </p>

            {step >= 5 && (
              <p className="text-green-500 text-xs font-semibold flex items-center gap-.5">
                Completed <IoMdCheckmark fontSize={16} className="" />
              </p>
            )}
          </div>

          {/* step 5 */}
          <div
            className={`flex flex-col  ${
              step === 5 ? "opacity-100" : "opacity-30"
            }`}
          >
            <h2 className="text-gray-500 text-sm uppercase font-semibold">
              Step 05
            </h2>
            <p className="text-base font-semibold tracking-tight text-nowrap capitalize">
              Achievements
            </p>

            {step >= 6 && (
              <p className="text-green-500 text-xs font-semibold flex items-center gap-.5">
                Completed <IoMdCheckmark fontSize={16} className="" />
              </p>
            )}
          </div>

          {/* step 6 */}
          <div
            // className={`flex flex-col  ${
            //   step === 6 ? "opacity-100" : "opacity-30"
            // }`}
            className={twMerge(
              "flex flex-col",
              step === 6 ? "opacity-100 mt-2" : "opacity-30",
              step === 3 && "mt-4"
            )}
          >
            <h2 className="text-gray-500 text-sm uppercase font-semibold">
              Step 06
            </h2>
            <p className="text-base font-semibold tracking-tight text-nowrap capitalize">
              Profile summary
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stepper;
