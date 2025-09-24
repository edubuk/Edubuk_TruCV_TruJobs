import fakeImg from '../../assets/fake.png';
import fact1 from '@/assets/Facts/fact1.png';
import fact2 from '@/assets/Facts/fact2.png';
import fact3 from '@/assets/Facts/fact3.png';
const Facts = () => {
  return (
    <div className='flex justify-center items-center flex-col gap-4'>
      <p className="text-[#03257E] text-[25px] sm:text-[40px] md:text-[50px] font-bold uppercase text-center" data-aos="fade-right">
        Facts and challenges for employers
      </p>
<div className="grid grid-cols-2">
    <div className="relative -ml-56" data-aos="fade-right">
      <img
        src={fakeImg}
        alt="fakeImg"
        className="sm:w-[70%] h-auto border-8 border-[#03257e] rounded-full py-24 sm:py-32 pl-52 pr-8"
      />
      {/* Circle 1 */}
      <p className="absolute top-1/4 right-[3%] sm:right-[33%] p-2 bg-white border-4 border-[#03257e] rounded-full w-3 h-3"></p>
      {/* Circle 2 */}
      <p className="absolute top-1/2 right-[-2%] sm:right-[29%] p-2 bg-white border-4 border-[#03257e] rounded-full w-3 h-3"></p>
      {/* Circle 3 */}
      <p className="absolute top-3/4 right-[6%] sm:right-[35%] p-2 bg-white border-4 border-[#03257e] rounded-full w-3 h-3"></p>
    </div>
    <div className='relative'>
      <div className='absolute flex top-[15%] -ml-[-2%] sm:-ml-[30%] justify-center items-center gap-6' data-aos="fade-left">
      <div className='flex justify-center items-start flex-col'>
        <p className=' text-[#03257e] font-bold text-2xl sm:text-3xl md:text-4xl'>100 MILLION</p>
        <p className=' text-black'>Fake IDs and Credentials Sold Per Year</p>      
        </div>
        <img src={fact1} alt='fact-1' className='hidden sm:flex w-24 h-24'></img>
      </div>
      <div className='absolute flex top-[41%] -ml-[-5%]  sm:-ml-[30%] justify-center items-center gap-6' data-aos="fade-left">
      <div className='flex justify-center items-start flex-col'>
        <p className=' text-[#03257e] text-2xl sm:text-3xl md:text-4xl font-bold'>$200 BILLION</p>
        <p className=' text-black'>Fake IDs & Credentials Market Globally as&nbsp;per&nbsp;UNESCO</p>
      </div>
        <img src={fact2} alt='fact-2' className='hidden sm:flex w-24 h-24'></img>
      </div>
      <div className='absolute top-[74%] -ml-[-4%] sm:-ml-[30%] flex justify-center items-center gap-6' data-aos="fade-left">
      <div className='flex justify-center items-start flex-col'>
        <p className=' text-[#03257e] text-2xl sm:text-3xl md:text-4xl font-bold'>$20 BILLION</p>
        <p className=' text-black'>Academic & Professional Market Share&nbsp;(10%)</p>
      </div>
        <img src={fact3} alt='fact-3' className='hidden sm:flex w-24 h-24'></img>
        </div>
    </div>
</div>
<p className='p-4 sm:w-[70%] text-xl sm:text-2xl text-black text-center' data-aos="fade-up">Professional networking platforms are already contending with the issue of falsified credentials and with the advent of Generative AI, it is set to amplify further.</p>
    </div>
  )
}

export default Facts
