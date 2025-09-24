const VideoSection = () => {
  return (
    <div className="flex justify-center items-center flex-col w-full" data-aos="zoom-in">
      <div className="flex flex-col justify-center items-center" id="olympiad">
        <p className=" text-[#03257E] text-[25px] sm:text-[40px] md:text-[50px] font-bold text-center">
          Watch How It Works
        </p>
        {/* <p className=" text-[#000000] my-4 text-[23px] sm:text-[38px] md:text-[48px] text-center">No-Code Skilling in Emerging Technologies</p> */}
      </div>
      <div className="flex justify-center items-center gap-4 p-4 w-full">
        {/* Left Rectangular Box (Hidden on mobile) */}
        {/* <div className="hidden sm:block w-32 h-[350px] bg-gray-300 rounded-md shadow-md"></div> */}

        {/* Video with Fixed Height and 16:9 Aspect Ratio */}
        <div className="relative w-full max-w-[800px] aspect-video rounded-xl overflow-hidden border-4 border-gray-300 shadow-lg">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/vVYQXffnI-8?autoplay=1&mute=1"
            title="Edubuk Presents: AI and Emerging Technologies Hackathon for College Student"
            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>

        {/* Right Rectangular Box (Hidden on mobile) */}
        {/* <div className="hidden sm:block w-32 h-[350px] bg-gray-300 rounded-md shadow-md"></div> */}
      </div>
    </div>
  );
};

export default VideoSection;
