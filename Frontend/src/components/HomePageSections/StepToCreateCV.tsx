import step1 from "../../assets/Steps/step1.png";
import step2 from "../../assets/Steps/step2.png";
import step3 from "../../assets/Steps/step3.png";
import step4 from "../../assets/Steps/step4.png";
import step5 from "../../assets/Steps/step5.png";
import { RiArrowLeftWideLine } from "react-icons/ri";
import { RiArrowRightWideLine } from "react-icons/ri";

const StepToCreateCV = () => {
  return (
    <div className="flex justify-center items-center flex-col gap-6">
      <p className="text-black text-[25px] sm:text-[40px] md:text-[50px] font-bold uppercase text-center" data-aos="fade-up">
        Steps to Create Your <span className="text-[#f14419]">TruCV</span>
      </p>

      <div className="grid grid-cols-1 items-center gap-10 sm:gap-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="flex justify-center items-center order-2 sm:order-0">
            <p className="text-black text-center text-lg sm:text-lg md:text-2xl p-2 sm:p-4" data-aos="fade-right">
              Fill a simple form with your details
            </p>
          </div>
          <div className="w-full flex justify-center items-center sm:-ml-4 order-1 sm:order-2 -rotate-90 sm:rotate-0">
            <RiArrowLeftWideLine className="w-8 h-8  text-[#f14419]"/>
            <div className="relative p-2 flex justify-center items-center w-28 h-28 sm:w-36 sm:h-36 shadow shadow-gray-200 rounded-full border-r-gray-300 border-t-white -rotate-45 border-b-gray-300 border-l-white border-[11px] sm:border-[14px]">
              <p className="text-[#03257e] text-2xl sm:text-3xl font-bold text-center rotate-[135deg] sm:rotate-45">
                STEP 1
              </p>
              {/* <div className="absolute top-0  w-32 h-32 border-t-gray-300 border-16 rounded-full"></div> */}
            </div>
          </div>
          <div className="flex justify-center items-center order-3 sm:order-0" data-aos="zoom-in">
            <img src={step1} alt="step1-img" className="w-16 h-16 sm:w-24 sm:h-24"></img>
          </div>
        </div>
        <div className="grid items-center grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0">
          <div className="flex justify-center items-center order-3 sm:order-1" data-aos="zoom-in">
            <img src={step2} alt="step1-img" className="w-16 h-16 sm:w-24 sm:h-24"></img>
          </div>
          <div className="w-full flex justify-center items-center sm:ml-4 order-1 sm:order-2 rotate-90 sm:rotate-0">
            <div className="relative p-2 flex justify-center items-center w-28 h-28 sm:w-36 sm:h-36 shadow shadow-gray-200 rounded-full border-r-white border-l-gray-300 border-t-white rotate-45 border-b-gray-300 border-[11px] sm:border-[14px]">
              <p className="text-[#03257e] text-2xl sm:text-3xl font-bold text-center -rotate-[135deg] sm:-rotate-45">
                STEP 2
              </p>
              {/* <div className="absolute top-0  w-32 h-32 border-t-gray-300 border-16 rounded-full"></div> */}
            </div>
            <RiArrowRightWideLine className="w-8 h-8  text-[#f14419]"/>
          </div>
          <div className="flex justify-center items-center order-2 sm:order-3">
            <p className="w-[250px] sm:w-auto text-black text-center text-lg sm:text-xl lg:text-2xl p-2 sm:p-4" data-aos="fade-left">
              Upload your Education and Work Experience Certificates in JPG,
              PNG, PDF format
            </p>
          </div>
        </div>
         <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 sm:gap-0">
          <div className="flex justify-center items-center order-2 sm:order-1">
            <p className="w-[250px] sm:w-auto text-black text-center text-lg sm:text-xl lg:text-2xl p-2 sm:p-4" data-aos="fade-right">
              Our Team will verify them from the Issuer of each Certificate & Credential
            </p>
          </div>
          <div className="w-full flex justify-center items-center sm:-ml-4 order-1 sm:order-2 -rotate-90 sm:rotate-0" >
            <RiArrowLeftWideLine className="w-8 h-8  text-[#f14419]"/>
            <div className="relative p-2 flex justify-center items-center w-28 h-28 sm:w-36 sm:h-36 shadow shadow-gray-200 rounded-full border-r-gray-300 border-l-white border-t-white -rotate-45 border-b-gray-300 border-[11px] sm:border-[14px]">
              <p className="text-[#03257e] text-2xl sm:text-3xl font-bold text-center rotate-[135deg] sm:rotate-45">
                STEP 3
              </p>
              {/* <div className="absolute top-0  w-32 h-32 border-t-gray-300 border-16 rounded-full"></div> */}
            </div>
          </div>
          <div className="flex justify-center items-center order-3 sm:order-3" data-aos="zoom-in">
            <img src={step3} alt="step1-img" className="w-16 h-16 sm:w-24 sm:h-24" ></img>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="flex justify-center items-center order-3 sm:order-1" data-aos="zoom-in">
            <img src={step4} alt="step1-img" className="w-16 h-16 sm:w-24 sm:h-24"></img>
          </div>
          <div className="w-full flex justify-center items-center sm:ml-4 order-1 sm:order-2 rotate-90 sm:rotate-0" >
            <div className="relative p-2 flex justify-center items-center w-28 h-28 sm:w-36 sm:h-36 shadow shadow-gray-200 rounded-full border-l-gray-300 border-r-white border-t-white rotate-45 border-b-gray-300 border-[11px] sm:border-[14px]">
              <p className="text-[#03257e] text-2xl sm:text-3xl font-bold text-center -rotate-[135deg] sm:-rotate-45">
                STEP 4
              </p>
              {/* <div className="absolute top-0  w-32 h-32 border-t-gray-300 border-16 rounded-full"></div> */}
            </div>
            <RiArrowRightWideLine className="w-8 h-8  text-[#f14419]"/>
          </div>
          <div className="flex justify-center items-center order-2 sm:order-3" data-aos="fade-left">
            <p className="w-[250px] sm:w-auto text-black text-center text-lg sm:text-xl lg:text-2xl p-2 sm:p-4">
              Your Verifiable CV is created with each of your Certificate
              recorded securely on the Blockchain
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="flex justify-center items-center order-2 sm:order-1" data-aos="fade-right">
            <p className="w-[250px] sm:w-auto text-black text-center text-lg sm:text-xl lg:text-2xl p-2 sm:p-4">
              You can now share your digital verifiable CV with recruiters and get hired globally!
            </p>
          </div>
          <div className="w-full flex justify-center items-center sm:-ml-4 order-1 sm:order-2 -rotate-90 sm:rotate-0">
            <RiArrowLeftWideLine className="w-8 h-8  text-[#f14419]"/>
            <div className="relative p-2 flex justify-center items-center w-28 h-28 sm:w-36 sm:h-36 shadow shadow-gray-200 rounded-full border-r-gray-300 border-t-white -rotate-45 border-b-gray-300 border-l-white border-[11px] sm:border-[14px]">
              <p className="text-[#03257e] text-2xl sm:text-3xl font-bold text-center rotate-[135deg] sm:rotate-45">
                STEP 5
              </p>
              {/* <div className="absolute top-0  w-32 h-32 border-t-gray-300 border-16 rounded-full"></div> */}
            </div>
          </div>
          <div className="flex justify-center items-center order-3 sm:order-3" data-aos="zoom-in">
            <img src={step5} alt="step1-img" className="w-16 h-16 sm:w-24 sm:h-24"></img>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepToCreateCV;
