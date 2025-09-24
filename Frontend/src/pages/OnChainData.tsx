import React from "react";

interface OnChainDataProps {
  docData: string[]; // Expecting an array of strings as docData
}

const OnChainData: React.FC<OnChainDataProps> = ({ docData }) => {
  return (
    <div className="flex flex-wrap justify-center items-center gap-4 p-4">
      {docData?.map((doc, i) => (
        <div
          key={i}
          className="flex flex-col border border-slate-400 py-4 px-6 sm:px-10 rounded gap-3 transform transition-transform duration-300 hover:translate-y-1 w-full sm:w-auto"
        >
          <h1 className="text-center text-lg font-semibold">
            Doc <strong>{i + 1}</strong>
          </h1>
          <a
            href={`https://purple-odd-toad-540.mypinata.cloud/ipfs/${doc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-slate-400 text-[#006666] py-2 px-4 rounded-md hover:text-yellow-700 text-center"
          >
            View Document
          </a>
        </div>
      ))}
    </div>
  );
};

export default OnChainData;
