import { FaLinkedinIn } from 'react-icons/fa';
import advisor1 from '../../assets/Advisor/advisor1.png'
import advisor2 from '../../assets/Advisor/advisor2.png'
import advisor3 from '../../assets/Advisor/advisor3.png'
import advisor4 from '../../assets/Advisor/advisor4.png'

const OurAdvisor = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-8">
      <p className="text-[#03257E] text-[25px] sm:text-[40px] md:text-[50px] font-bold uppercase text-center" data-aos="fade-up">
        MEET OUR ADVISORS
      </p>
      <div className=" flex justify-center items-center flex-wrap gap-3">
        <div className="w-full max-w-xs min-h-[450px] p-4 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transition duration-300 flex flex-col justify-between items-center text-center">
          <div className="w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-br from-[#03257e] via-[#006666] to-[#F14419]">
            <img
              src={advisor1}
              alt="advisor1"
              className="w-full h-full rounded-full object-cover"
              data-aos="zoom-in"
            />
          </div>
          <div className="flex flex-col items-center flex-grow" data-aos="zoom-in">
            <p className="text-lg font-bold text-gray-800 mb-1">Ish Anand</p>
            <p className="bg-gradient-to-r from-[#03257e] via-[#006666] to-[#F14419] text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
              Serial Entrepreneur, Advisor in Startups, Global Citizen
            </p>

            <a
              href="https://www.linkedin.com/in/ishanand/"
              target="_blank"
              rel="noreferrer"
              className="mb-4"
            >
              <FaLinkedinIn className="text-[#0077B5] w-7 h-7" />
            </a>

            <p className="text-sm text-gray-600 leading-relaxed">
              30 years + of experience in Corporates, the Startup Ecosystem and
              as an Enterpreneur across 5 continents
            </p>
          </div>
        </div>
        <div className="w-full max-w-xs min-h-[450px] p-4 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transition duration-300 flex flex-col justify-between items-center text-center">
          {/* Image */}
          <div className="w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-br from-[#03257e] via-[#006666] to-[#F14419]">
            <img
              src={advisor2}
              alt="advisor2"
              className="w-full h-full rounded-full object-cover"
              data-aos="zoom-in"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col items-center flex-grow" data-aos="zoom-in">
            <p className="text-lg font-bold text-gray-800 mb-1">
              Dr. Narsing Rao, GS
            </p>
            <p className="bg-gradient-to-r from-[#03257e] via-[#006666] to-[#F14419] text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
              Former VC at ICFAI University
            </p>

            <a
              href="https://www.linkedin.com/in/dr-narsing-rao-gs-a318735/"
              target="_blank"
              rel="noreferrer"
              className="mb-4"
            >
              <FaLinkedinIn className="text-[#0077B5] w-7 h-7" />
            </a>

            <p className="text-sm text-gray-600 leading-relaxed">
              30 years + of experience in Education Sector as Vice Chancellor &
              Chief Mentor at Indian Universities ex-Professor
            </p>
          </div>
        </div>
        <div className="w-full max-w-xs min-h-[450px] p-4 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transition duration-300 flex flex-col justify-between items-center text-center">
          {/* Image */}
          <div className="w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-br from-[#03257e] via-[#006666] to-[#F14419]">
            <img
              src={advisor3}
              alt="advisor3"
              className="w-full h-full rounded-full object-cover"
              data-aos="zoom-in"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col items-center flex-grow" data-aos="zoom-in">
            <p className="text-lg font-bold text-gray-800 mb-1">
              Dr. Sindhu Bhaskar
            </p>
            <p className="bg-gradient-to-r from-[#03257e] via-[#006666] to-[#F14419] text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
              Co-Founder, EST Global, Forbes Council Member
            </p>

            <a
              href="https://www.linkedin.com/in/dr-sindhu-bhaskar-55a84568/"
              target="_blank"
              rel="noreferrer"
              className="mb-4"
            >
              <FaLinkedinIn className="text-[#0077B5] w-7 h-7" />
            </a>

            <p className="text-sm text-gray-600 leading-relaxed">
              Established $100M+ business in Education sector. Co-Founded
              Fintech & Blockchain Association (FAB), US.
            </p>
          </div>
        </div>
        <div className="w-full max-w-xs min-h-[450px] p-4 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-2 transition duration-300 flex flex-col justify-between items-center text-center">
          {/* Image */}
          <div className="w-28 h-28 mb-4 rounded-full p-1 bg-gradient-to-br from-[#03257e] via-[#006666] to-[#F14419]">
            <img
              src={advisor4}
              alt="advisor4"
              className="w-full h-full rounded-full object-cover"
              data-aos="zoom-in"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col items-center flex-grow" data-aos="zoom-in">
            <p className="text-lg font-bold text-gray-800 mb-1">James Wren</p>
            <p className="bg-gradient-to-r from-[#03257e] via-[#006666] to-[#F14419] text-white text-sm font-semibold px-3 py-1 rounded-full mb-3">
              Lead BD, Liquidium
            </p>

            <a
              href="https://www.linkedin.com/in/james-wren-15b8b759/"
              target="_blank"
              rel="noreferrer"
              className="mb-4"
            >
              <FaLinkedinIn className="text-[#0077B5] w-7 h-7" />
            </a>

            <p className="text-sm text-gray-600 leading-relaxed">
              7+ years experience in Web3, Blockchain Degen & influencer in the
              BTC Ecosystem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurAdvisor;
