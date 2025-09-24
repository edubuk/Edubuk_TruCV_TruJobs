import { FaLinkedinIn } from "react-icons/fa";
import team1 from '../../assets/Team/team1.png';
import team2 from '../../assets/Team/team2.png';
import team3 from '../../assets/Team/team3.png';
import team4 from '../../assets/Team/team4.png';

const OurExecutives = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-8">
    <p className="text-[#03257E] text-[25px] sm:text-[40px] md:text-[50px] font-bold uppercase text-center" data-aos="fade-up">Meet Our executives</p>
    <div className=" flex justify-center items-center flex-wrap gap-3">
      <div className="w-full max-w-xs min-h-[450px] p-4 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transition duration-300 flex flex-col justify-between items-center text-center">
  <div className="w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-br from-[#03257e] via-[#006666] to-[#F14419]">
    <img
      src={team1}
      alt="team1"
      className="w-full h-full rounded-full object-cover"
      data-aos="zoom-in"
    />
  </div>
  <div className="flex flex-col items-center flex-grow" data-aos="zoom-in">
    <p className="text-lg font-bold text-gray-800 mb-1">Apoorva Bajaj</p>
    <p className="bg-gradient-to-r from-[#03257e] via-[#006666] to-[#F14419] text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
      Co-Founder & CEO
    </p>

    <a
      href="https://www.linkedin.com/in/apoorva-bajaj-iit-iim-cfa-edubuk/"
      target="_blank"
      rel="noreferrer"
      className="mb-4"
    >
      <FaLinkedinIn className="text-[#0077B5] w-7 h-7" />
    </a>

    <p className="text-sm text-gray-600 leading-relaxed">
      10+ years experience <br />
      ex-Goldman Sachs, JP Morgan, DE Shaw Engineer, IIT, IIM Gold-medalist, CFA Charterholder
    </p>
  </div>
</div>
      <div className="w-full max-w-xs min-h-[450px] p-4 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transition duration-300 flex flex-col justify-between items-center text-center">
  {/* Image */}
  <div className="w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-br from-[#03257e] via-[#006666] to-[#F14419]">
    <img
      src={team2}
      alt="team2"
      className="w-full h-full rounded-full object-cover"
      data-aos="zoom-in"
    />
  </div>

  {/* Content */}
  <div className="flex flex-col items-center flex-grow" data-aos="zoom-in">
    <p className="text-lg font-bold text-gray-800 mb-1">Shivaani Mehrotra</p>
    <p className="bg-gradient-to-r from-[#03257e] via-[#006666] to-[#F14419] text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
      Co-Founder & COO
    </p>

    <a
      href="https://www.linkedin.com/in/shivani-mehrotra-edubuk/"
      target="_blank"
      rel="noreferrer"
      className="mb-4"
    >
      <FaLinkedinIn className="text-[#0077B5] w-7 h-7" />
    </a>

    <p className="text-sm text-gray-600 leading-relaxed">
      10+ years experience in <br></br>Education Sector as University Professor MBA + University Topper, Women in AI APAC Finalist
    </p>
  </div>
</div>
      <div className="w-full max-w-xs min-h-[450px] p-4 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transition duration-300 flex flex-col justify-between items-center text-center">
  {/* Image */}
  <div className="w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-br from-[#03257e] via-[#006666] to-[#F14419]">
    <img
      src={team3}
      alt="team3"
      className="w-full h-full rounded-full object-cover"
      data-aos="zoom-in"
    />
  </div>

  {/* Content */}
  <div className="flex flex-col items-center flex-grow" data-aos="zoom-in">
    <p className="text-lg font-bold text-gray-800 mb-1">Amit Srivastava</p>
    <p className="bg-gradient-to-r from-[#03257e] via-[#006666] to-[#F14419] text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
      Chief Marketing Officer
    </p>

    <a
      href="https://www.linkedin.com/in/amit-srivastava-62969352/"
      target="_blank"
      rel="noreferrer"
      className="mb-4"
    >
      <FaLinkedinIn className="text-[#0077B5] w-7 h-7" />
    </a>

    <p className="text-sm text-gray-600 leading-relaxed">
      20+ years experience in <br /> marketing and sales in Education & Finance sector. MBA in International Business.
    </p>
  </div>
</div>
      <div className="w-full max-w-xs min-h-[450px] p-4 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transition duration-300 flex flex-col justify-between items-center text-center">
  {/* Image */}
  <div className="w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-br from-[#03257e] via-[#006666] to-[#F14419]">
    <img
      src={team4}
      alt="Apoorva Bajaj"
      className="w-full h-full rounded-full object-cover"
      data-aos="zoom-in"
    />
  </div>

  {/* Content */}
  <div className="flex flex-col items-center flex-grow" data-aos="zoom-in">
    <p className="text-lg font-bold text-gray-800 mb-1">Ajeet Ram Verma</p>
    <p className="bg-gradient-to-r from-[#03257e] via-[#006666] to-[#F14419] text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
      Tech Lead Developer
    </p>

    <a
      href="https://www.linkedin.com/in/ajeet-ram-verma-953605244/"
      target="_blank"
      rel="noreferrer"
      className="mb-4"
    >
      <FaLinkedinIn className="text-[#0077B5] w-7 h-7" />
    </a>

    <p className="text-sm text-gray-600 leading-relaxed">
      5+ years of experience in Core Technology Domain <br></br>MERN Full-Stack <br></br>Python-AI & ML <br></br>Solidity & Rust
    </p>
  </div>
</div>
    </div>
    </div>
  )
}

export default OurExecutives
