import React from 'react'

interface ThreeDotLoaderProps {
  w: number;
  h: number;
  yPos: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
}

const ThreeDotLoader:React.FC<ThreeDotLoaderProps> = ({w,h,yPos}) => {
    
  return (
    <div className={`flex justify-center items-${yPos} space-x-2 p-2 h-10`}>
      <span className={`w-${w} h-${h} p-1 rounded-full bg-[#03257e] animate-bounceDot [animation-delay:0s]`}></span>
      <span className={`w-${w} h-${h} p-1 rounded-full bg-[#006666] animate-bounceDot [animation-delay:0.2s]`}></span>
      <span className={`w-${w} h-${h} p-1 rounded-full bg-[#f14419] animate-bounceDot [animation-delay:0.4s]`}></span>
    </div>
  )
}

export default ThreeDotLoader
