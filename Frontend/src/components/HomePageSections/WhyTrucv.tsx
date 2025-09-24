import whytrucvImg from '../../assets/whytrucv.png';
import keyIcon1 from '../../assets/keyIcon/keyIcon1.png';
import keyIcon2 from '../../assets/keyIcon/keyIcon2.png';
import keyIcon3 from '../../assets/keyIcon/keyIcon3.png';
import keyIcon4 from '../../assets/keyIcon/keyIcon4.png';
import keyIcon5 from '../../assets/keyIcon/keyIcon5.png';
import keyIcon6 from '../../assets/keyIcon/keyIcon6.png';   
import keyIcon7 from '../../assets/keyIcon/keyIcon7.png';

const WhyTrucv = () => {

    const keyData =[
        {
            title: "Eliminates Credential Fraud",
            description: "All academic and work records are blockchain-secured.",
            icon:keyIcon1,
            iconBg:"#03257E"

        },
        {
            title: "Boosts Trust & Transparency",
            description: "Employers and institutions can verify your CV in seconds.",
            icon:keyIcon2,
            iconBg:"#006666"
        },
        {
            title: "Global Recognition",
            description: "Your profile is trusted across borders and industries.",
            icon:keyIcon3,
            iconBg:"#f14419"
        },
        {
            title: "Speeds Up Hiring & Admissions",
            description: "No need for background checks or paperwork delays.",
            icon:keyIcon4,
            iconBg:"#FFAA04"
        },
        {
            title: "One CV for Life",
            description: "Your verified achievements stay securely accessible, forever.",
            icon:keyIcon5,
            iconBg:"#3ec8d4"
        },
        {
            title: "Higher Shortlisting Rates",
            description: "Verified CVs stand out to recruiters and automated systems.",
            icon:keyIcon6,
            iconBg:"#1860ca"
        },
        {
            title: "Improves Employer Confidence",
            description: "Increases chances of interviews, internships, and international roles.",
            icon:keyIcon7,
            iconBg:"#03257E80"
        }
    ]
  return (
    <div className="flex flex-col justify-center items-center gap-8">
        <p className="text-[#03257E] text-[25px] sm:text-[40px] md:text-[50px] font-bold uppercase text-center">
          Why TruCV?
        </p>
        <div className='flex justify-center items-center md:gap-8 lg:gap-10 lg:px-20'>
            <div className='flex flex-col justify-center items-center gap-4 px-4'>
                <p className='text-[#03257e] text-[20px] sm:text-[25px] md:text-[30px] w-max-[700px] text-center font-bold'>Why a Completely Verifiable CV is Essential?</p>
                <p className='text-black max-w-[800px] text-center sm:text-left'>
                    In today’s competitive and global job market, trust and authenticity are everything. Employers, universities, and immigration authorities increasingly demand verified proof of education, experience, and skills. A traditional CV can be easily faked—but with TruCV by Edubuk, every credential you list is completely verifiable and tamper-proof, secured using blockchain technology. <br></br><br></br>
                    This not only builds instant credibility but also opens doors to global opportunities by removing doubt, fraud, and manual verification delays.
                </p>

            </div>
            <div className='hidden sm:flex' data-aos="zoom-in">
                <img src={whytrucvImg} className='w-fit h-auto'></img>
            </div>
        </div> 
        <div className='flex flex-col justify-center items-center w-full'>
            <p className='text-[#03257e] text-[20px] sm:text-[25px] md:text-[30px] text-center font-bold px-4'>Key Reasons Why You Need a Verifiable CV?</p>
            <div className='flex flex-wrap justify-center items-center' data-aos="fade-up">
                {keyData.map((item, index) => (
                    <div key={index} className={`flex flex-col justify-center items-center gap-2 m-4  rounded-[20px] shadow-lg w-[300px]`} style={{backgroundColor:`${item.iconBg}`}}>
                        <img src={item.icon} alt={item.title} className={`w-16 h-16 my-4`} data-aos="zoom-in"/>
                        <div className='flex flex-col justify-center items-center px-4 py-5 rounded-[20px] bg-[white]' data-aos="zoom-in">
                        <p className='text-[#03257e] text-[18px] font-semibold'>{item.title}</p>
                        <p className='text-black text-center'>{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>   
      </div>
  );
}

export default WhyTrucv;