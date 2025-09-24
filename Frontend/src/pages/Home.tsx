import Facts from "@/components/HomePageSections/Facts";
import heroImg from "../assets/hero.png";
import ImageSlider from "../components/HomePageSections/ImageSlider";
import OurAdvisor from "../components/HomePageSections/OurAdvisor";
import OurExecutives from "../components/HomePageSections/OurExecutives";
import ThreeDot from "../components/HomePageSections/ThreeDot";
import VideoSection from "../components/HomePageSections/VideoSection";
import Footer from "./Footer";
import StepToCreateCV from "../components/HomePageSections/StepToCreateCV";
import WhyTrucv from "../components/HomePageSections/WhyTrucv";
import { useState} from "react";
import ProfilePopup from "@/components/ui/Profile";
import { Link } from "react-router-dom";


const Home:React.FC<{handlerLogout:()=>void}> = ({handlerLogout}) => {
  const [openProfile, setOpenProfile] = useState(false);

  return (
    <div className="flex justify-center items-center flex-col gap-8 overflow-hidden">
     <div className="relative w-full flex flex-col">
     <div className="relative flex justify-end items-center w-full h-[20px] mt-2 p-6">
      {/* {localStorage.getItem("userImage")? <img src={localStorage.getItem("userImage") as string} referrerPolicy="no-referrer" className="w-12 h-12 text-[#03257e] rounded-full cursor-pointer" onClick={()=>setOpenProfile(!openProfile)}/>:localStorage.getItem("googleIdToken")&&<CircleUser className="w-12 h-12 text-[#03257e] rounded-full cursor-pointer" onClick={()=>setOpenProfile(!openProfile)}/> }      <div className="absolute top-0  w-12 h-12  rounded-full   bg-gradient-to-r from-[#03257e] via-[#006666] to-[#f14419] -z-10"></div> */}
      {localStorage.getItem("googleIdToken")&&<div className='flex justify-center items-center bg-[#03257e] rounded-full w-12 h-12 cursor-pointer flex-shrink-0' onClick={()=>setOpenProfile(!openProfile)}>
          <p className="text-center text-white font-bold cursor-pointer text-center md:text-2xl text-xl">{localStorage.getItem('userProfileName')?.slice(0,1)?.toUpperCase()}</p>
      </div>}
     <ProfilePopup openProfile={openProfile} setOpenProfile={setOpenProfile}/></div>
      <div className="flex justify-around items-center flex-wrap-reverse gap-10 md:gap-20 border-b-4 border-amber-300 md:h-[80vh]">
        <div className="flex justify-center items-center flex-col gap-4 pb-4" data-aos="fade-up">
          <div className="flex justify-center items-center gap-2">
          <p className="text-white bg-[#006666] px-6 py-4 font-bold rounded-lg text-2xl sm:text-3xl md:text-4xl" data-aos="fade-right">
            TruCV
          </p>
          {localStorage.getItem("googleIdToken")?<div className="flex lg:hidden relative rounded-lg p-[2px] bg-gradient-to-r from-[#03257e] via-[#006666] to-[#f14419]" data-aos="fade-left">
              <button
              onClick={handlerLogout}
                className="w-full bg-white text-[20px] px-6 py-4 font-bold text-center rounded-lg text-[#03257e] hover:text-[#f14419]"
                
              >
                Logout
              </button>
            </div>:<div className="flex lg:hidden relative rounded-lg p-[2px] bg-gradient-to-r from-[#03257e] via-[#006666] to-[#f14419]" data-aos="fade-left">
              <Link
              to="/login"
                className="w-full bg-white text-[20px] px-6 py-4 font-bold text-center rounded-lg text-[#03257e] hover:text-[#f14419]"
                
              >
                Login
              </Link>
            </div>}
          </div>
          <p className="text-[#03257E] text-center text-2xl sm:text-3xl md:text-5xl font-bold" data-aos="fade-up">
            Your Verifiable CV<br></br> on Blockchain
          </p>
          <p className="text-[#f14419] text-center font-bold text-xl sm:text-2xl" data-aos="fade-up">
            [ Academic & Professional Credentials ]
          </p>
        </div>
        <div className="relative w-fit ">
          <img
            src={heroImg}
            alt="hero-img"
            className="h-[50vh] sm:h-[50vh] md:w-68 md:h-68 lg:w-68 lg:h-68 rounded-b-full object-cover"
            data-aos="zoom-in"
          /> 
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] lg:w-[350px] lg:h-[350px] bg-[#03257e] rounded-full -z-10"></div>
        </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#03257e] via-[#006666] to-[#f14419]">
        </div>
      </div>

      <ImageSlider />
      <ThreeDot />
      <Facts />
      <ThreeDot />
      <WhyTrucv />
      <ThreeDot />
      <StepToCreateCV />
      <ThreeDot />
      <VideoSection />
      <ThreeDot />
      {/* <Collaborators />
      <ThreeDot /> */}
      <OurExecutives />
      <ThreeDot />
      <OurAdvisor />
      <Footer />
      {/* <div><DownloadButton/></div> */}
    </div>
  );
};

export default Home;
