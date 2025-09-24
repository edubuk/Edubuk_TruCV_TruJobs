import html2pdf from "html2pdf.js";
import { useState } from "react";
import { FaDownload } from "react-icons/fa";

const PdfDownloader = ({pdfRef,userName,CVWidth}:any) => {
    const [pdfHeight, setPdfHeight] = useState<string>("11.69");
    const [customHeight, setCustomHeight] = useState<string>("");
    const handleDownload = () => {
        if (pdfRef.current) {
          const opt = {
            margin:[0,0,0.1,0],
            filename: `${userName}_CV.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,              // Increase scale for better quality
              useCORS: true,         // Fixes image and font loading issues
              logging: true,        // Enable logging for debugging
            },
            jsPDF: {
              unit: "in",           // Use inches for better precision
              format: [Number(CVWidth),pdfHeight==="custom"?Number(customHeight):Number(pdfHeight)],
              orientation: "portrait", // Portrait orientation
              cssmedia: "print"
            },
            pagebreak: {
              mode: ["avoid-all", "css", "legacy"],
            },
          };
            html2pdf().set(opt).from(pdfRef.current).save();       
        }
      };

    return(
        <div className="w-full flex justify-end">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 m-4">
          {/* Page Size Dropdown */}
          <label className="text-[#006666] font-semibold">
            Select Page Height
          </label>
          <select
            onChange={(e) => setPdfHeight(e.target.value)}
            className="bg-[#006666] text-white px-4 py-4 rounded focus:outline-none focus:ring-2 focus:ring-[#004d4d]"
          >
            <option value="11.69">A4 (11.69 in)</option>
            <option value="14">Legal (14 in)</option>
            <option value="17">Tabloid (17 in)</option>
            <option value="custom">Custom</option>
          </select>
        
          {/* Custom Height Input */}
            {pdfHeight === "custom" && <div className="z-10 flex flex-col sm:flex-row items-center gap-2 p-2"><input
              type="number"
              placeholder="Enter custom height in inches"
              onChange={(e) => {setCustomHeight(e.target.value)}}
                    className="border-2 border-[#006666] px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d4d] text-[#004d4d] font-medium placeholder:text-gray-500"
            /></div>}
        </div>
        
                <button
                  onClick={handleDownload}
                  className="bg-[#006666] flex items-center text-white px-4 py-2 rounded m-4"
                >
                  <FaDownload className="mr-2" /> Download as PDF
                </button>
              </div>
    )
}

export default PdfDownloader;
    