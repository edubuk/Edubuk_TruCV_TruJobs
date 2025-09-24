import {instLogos,govLogos,blcLogos,accLogos,mediaLogos,foreignLogos,finLogos } from "../../utils";


const ImageSlider = () => {
  return (
    <div className="flex justify-center flex-col items-center w-full overflow-hidden">
  <p className="text-[#03257E] text-[25px] sm:text-[40px] md:text-[50px] font-bold uppercase text-center" data-aos="fade-left">
    Awards & Recognitions
  </p>

  <div className="flex justify-start items-center p-2 border-b-2 border-gray-300">
    <p className="absolute left-0 bg-gray-100 hidden border-b-4 w-[160px] border-[#03257e] sm:flex sm:ml-0 rounded py-2 px-4 text-[#03257e] text-center font-bold text-[10px] sm:text-[15px] md:text-[20px] uppercase leading-none animate-slide-in-right shadow-gray-800 z-20">
            Education institutes
          </p>
      <div className="overflow-hidden sm:py-4">
        <div
          key={1} 
          className="flex animate-slide whitespace-nowrap"
        >
          {instLogos.concat(instLogos).map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`logo-${index}`}
              className="h-9 sm:h-6 w-auto sm:w-auto mx-4 sm:mx-8"
            />
            ))}
        </div>
      </div>
  </div>
  <div className="flex justify-start items-center p-2 border-b-2 border-gray-300">
      <div className="overflow-hidden sm:py-4">
        <div
          key={2} 
          className="flex animate-slideOpposite whitespace-nowrap"
        >
          {govLogos.concat(govLogos).map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`logo-${index}`}
              className="h-9 sm:h-6 w-auto sm:w-auto mx-4 sm:mx-8"
            />
          ))}
        </div>
      </div>
      <p className="absolute right-0 bg-gray-100 hidden border-b-4 border-[#03257e] sm:flex rounded w-[200px] p-2 text-[#03257e] text-center font-bold text-[10px] sm:text-[15px] md:text-[20px] uppercase leading-none animate-slide-in-right shadow-gray-800 z-20">
            Governments & Regulators
          </p>
  </div>
  <div className="flex justify-start items-center p-2 border-b-2 border-gray-300">
    <p className="absolute left-0 bg-gray-100 hidden border-b-4 p-2 border-[#03257e] sm:flex rounded w-[250px] text-[#03257e] text-center font-bold text-[10px] sm:text-[15px] md:text-[20px] uppercase leading-none animate-slide-in-right shadow-gray-800 z-20">
            Grants & awards by blockchains
          </p>
      <div className="overflow-hidden sm:py-4">
        <div
          key={3} 
          className="flex animate-slide whitespace-nowrap"
        >
          {blcLogos.concat(blcLogos).map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`logo-${index}`}           
              className="h-9 sm:h-6 w-auto sm:w-auto mx-4 sm:mx-8"
               />
            ))}
        </div>
      </div>
  </div>
  <div className="flex justify-start items-center p-2 border-b-2 border-gray-300">
      <div className="overflow-hidden sm:py-4">
        <div
          key={4} 
          className="flex animate-slideOpposite whitespace-nowrap"
        >
          {accLogos.concat(accLogos).map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`logo-${index}`}
              className="h-9 sm:h-6 w-auto sm:w-auto mx-4 sm:mx-8"
            />
          ))}
        </div>
      </div>
      <p className="absolute right-0 bg-gray-100 hidden border-b-4 border-[#03257e] sm:flex rounded w-[200px] p-2 text-[#03257e] text-center font-bold text-[10px] sm:text-[15px] md:text-[20px] uppercase leading-none animate-slide-in-right shadow-gray-800 z-20">
            cloud credits & accelerators
          </p>
  </div>
  <div className="flex justify-start items-center p-2 border-b-2 border-gray-300">
    <p className="absolute left-0 bg-gray-100 hidden border-b-4 border-[#03257e] sm:flex sm:ml-0 rounded w-[100px] p-2 text-[#03257e] text-center font-bold text-[10px] sm:text-[15px] md:text-[20px] uppercase leading-none animate-slide-in-right shadow-gray-800 z-20">
            media houses
          </p>
      <div className="overflow-hidden sm:py-4">
        <div
          key={5} 
          className="flex animate-slide whitespace-nowrap"
        >
          {mediaLogos.concat(mediaLogos).map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`logo-${index}`}
               className="h-9 sm:h-6 w-auto sm:w-auto mx-4 sm:mx-8"  
                         />
            ))}
        </div>
      </div>
  </div>
  <div className="flex justify-start items-center p-2 border-b-2 border-gray-300">
      <div className="overflow-hidden sm:py-4">
        <div
          key={6} 
          className="flex animate-slideOpposite whitespace-nowrap"
        >
          {foreignLogos.concat(foreignLogos).map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`logo-${index}`}
              className="h-9 sm:h-12 w-auto sm:w-auto mx-4 sm:mx-8"
            />
          ))}
        </div>
      </div>
      <p className="absolute right-0 bg-gray-100 hidden border-b-4 border-[#03257e] sm:flex rounded w-[180px] p-2 text-[#03257e] text-center font-bold text-[10px] sm:text-[15px] md:text-[20px] uppercase leading-none animate-slide-in-right shadow-gray-800 z-20">
            international bodies
          </p>
  </div>
  <div className="flex justify-start items-center p-2 border-b-2 border-gray-300">
    <p className="absolute left-0 bg-gray-100 hidden border-b-4 border-[#03257e] sm:flex sm:ml-0 rounded w-[130px] p-2 text-[#03257e] text-center font-bold text-[10px] sm:text-[15px] md:text-[20px] uppercase leading-none animate-slide-in-right shadow-gray-800 z-20">
            fintech & banking
          </p>
      <div className="overflow-hidden sm:py-4">
        <div
          key={7} 
          className="flex animate-slide whitespace-nowrap"
        >
          {finLogos.concat(finLogos).map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`logo-${index}`}
              className="h-9 sm:h-6 w-auto sm:w-auto mx-4 sm:mx-8"
            />
            ))}
        </div>
      </div>
  </div>
</div>
  )
}

export default ImageSlider
