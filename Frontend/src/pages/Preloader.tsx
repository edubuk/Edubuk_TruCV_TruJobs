import React, { useEffect, useState } from 'react';
import logo from '../assets/edubuklogo.svg'; 

const Preloader: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const logoTimer = setTimeout(() => setShowText(true), 1500);
    const finishTimer = setTimeout(() => onFinish(), 4000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <img
        src={logo}
        alt="Logo"
        className="w-36 animate-zoomOut"
      />
      {showText && (
        <h1 className="mt-4 text-3xl font-bold text-gray-800 animate-typewriter overflow-hidden whitespace-nowrap border-r-2 border-gray-800">
          EDUBUK
        </h1>
      )}
    </div>
  );
};

export default Preloader;
