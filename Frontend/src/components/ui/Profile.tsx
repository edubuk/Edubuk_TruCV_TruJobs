
//import { Link } from 'react-router-dom';
import { useUserData } from '@/context/AuthContext';
import { MdClose } from 'react-icons/md';

export default function ProfilePopup({openProfile,setOpenProfile}: {openProfile: boolean,setOpenProfile: (openProfile: boolean)=>void}) {
const {userEmail,subscriptionPlan} = useUserData();
console.log("userData",userEmail,subscriptionPlan)
  return (
    <div className={`absolute right-4 top-16 w-72 rounded-lg shadow-lg border border-gray-200 bg-white p-4 z-50 ${openProfile ? 'block' : 'hidden'}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className='flex justify-center items-center bg-[#03257e] rounded-full w-12 h-12 flex-shrink-0'>
          <p className="text-center text-white font-bold cursor-pointer text-center md:text-2xl text-xl">{localStorage.getItem('userProfileName')?.slice(0,1)?.toUpperCase()}</p>
        </div>
        <div>
          <p className="text-[#03257e] font-semibold">{localStorage.getItem('userProfileName') as string}</p>
          <p className="text-gray-600 text-sm">{localStorage.getItem('email') as string}</p>
        </div>
        <MdClose className="cursor-pointer size-6 mb-2" onClick={()=>setOpenProfile(false)}/>
      </div>

      {/* <div className="border-t pt-3">
        <p className="text-sm text-[#006666] mb-1">
          <span className="font-semibold">Current Plan:</span>{' '}
          <span className={`font-semibold ${subscriptionPlan === 'Pro' ? 'text-[#03257e]' : 'text-[#f14419]'}`}>
            {subscriptionPlan}
          </span>
        </p>

        {subscriptionPlan === 'Free' && (
          <button
        
            className="mt-3 w-full bg-[#f14419] text-white text-sm font-semibold py-2 px-4 rounded hover:bg-[#d93e18] transition"
          >
            <Link to="/subscription"> 🔓 Upgrade to Pro</Link>
          </button>
        )}

        {subscriptionPlan === 'Pro' && (
          <p className="text-xs text-[#03257e] mt-2">✅ You’re on the Pro plan</p>
        )}
      </div> */}
    </div>
  );
}
