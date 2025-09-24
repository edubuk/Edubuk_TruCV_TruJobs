import { uploadFile } from "@/uploadFile";
import toast from "react-hot-toast";

interface UploadResponse {
  data: {
    success: boolean;
    fileHashWithTimeStampExt: string;
    error?: string;
  };
  response?: {
    data: {
      success: boolean;
      error: string;
    };
  };
}

export const uploadToIpfs = async (
  inputFile: File | null,
  setIsUploading: (value: React.SetStateAction<boolean>) => void,
  userData:string
): Promise<{metaDataHash:string,docHash:string}> => {
  setIsUploading(true); 
      
  try {
    
    if (!inputFile) {
      toast.error("No file selected for upload.");
      return {metaDataHash:"",docHash:""};
    }

    const formData = new FormData();
    formData.append("file", inputFile);
    const fileUploadResponse = await uploadFile(formData) as UploadResponse;

    if (!fileUploadResponse?.data?.success) {
      const errorMsg = fileUploadResponse?.response?.data?.error || "Unknown error while uploading document.";
      toast.error(`Document upload failed: ${errorMsg}`);
      return {metaDataHash:"",docHash:""};
    }

    const docHash = fileUploadResponse.data.fileHashWithTimeStampExt;
    const jsonMetadata = {
      name:`NFT of certificate for ${userData}`,
      description: "Each NFT in this collection showcases your academic and professional achievement individually registered as unique certificate on the Blockchain using Edubuk's dApp.",
      image: "https://gateway.pinata.cloud/ipfs/bafkreigkk42tyiax3niit6qvk3v5ks5lxv2d3kyn7fsyl3fjmixnynjgza",
      hash:docHash,
      date: new Date().toISOString(),
      collectionDescription: "The Edubuk Blockchain Verified Certification NFT Collection represents a groundbreaking leap in educational credentialing. Each NFT in this collection is a digital certification of educational achievements, securely stored and verified on the blockchain. These NFTs not only authenticate academic and professional accomplishments but also provide a tamper-proof, transparent, and permanent record of a learner's journey. This collection is designed for students, professionals, and educational institutions seeking to showcase verified qualifications in a modern, digital format. By leveraging blockchain technology, Edubuk ensures that each certificate is uniquely identifiable, easily shareable, and immune to forgery..."
    };

    const jsonBlob = new Blob([JSON.stringify(jsonMetadata)], {
      type: "application/json"
    });

    const newFormData = new FormData();
    newFormData.append("file", jsonBlob, "metadata.json");
    const jsonUploadResponse = await uploadFile(newFormData) as UploadResponse;

    if (!jsonUploadResponse?.data?.success) {
      const errorMsg = jsonUploadResponse?.response?.data?.error || "Unknown error while uploading metadata.";
      toast.error(`Metadata upload failed: ${errorMsg}`);
      return { metaDataHash: "", docHash: "" };
    }

    const metaDataHash = jsonUploadResponse.data.fileHashWithTimeStampExt;

    toast.success("File uploaded successfully!");
    return {metaDataHash,docHash} ;

  } catch (error: any) {
    console.error("Unexpected error uploading to IPFS:", error);
    toast.error("Unexpected error during upload. Please try again.");
    return {metaDataHash:"",docHash:""};

  } finally {
    setIsUploading(false);
  }
};



// export const uploadToIpfs = async (
//   inputFile: File | null,
//   setIsUploading: (value: React.SetStateAction<boolean>) => void
// ): Promise<{ metaDataHash: string | null; docHash: string | null }> => {
//   try {
//     if (!inputFile) {
//       console.warn("No file provided");
//       return {metaDataHash:null,docHash:null};
//     }

//     setIsUploading(true);

//     // Upload file to IPFS
//     const formData = new FormData();
//     formData.append("file", inputFile);

//     const fileUploadResponse = await fetch(
//       "https://api.pinata.cloud/pinning/pinFileToIPFS",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${import.meta.env.VITE_PINATAJWT}`,
//         },
//         body: formData,
//       }
//     );

//     const fileUploadResult = await fileUploadResponse.json();

//     if (fileUploadResult?.IpfsHash) {
//       // Construct metadata JSON
//       const jsonMetadata = {
//         name: "Edubuk Certificate NFT",
//         description:
//           "This NFT represents a unique and verifiable certification of educational achievement in the education domain.",
//         image:
//           "https://gateway.pinata.cloud/ipfs/bafkreigkk42tyiax3niit6qvk3v5ks5lxv2d3kyn7fsyl3fjmixnynjgza",
//         hash: fileUploadResult.IpfsHash,
//         date: new Date().toISOString(),
//       };

//       // Upload JSON metadata to IPFS
//       const jsonUploadResponse = await fetch(
//         "https://api.pinata.cloud/pinning/pinJSONToIPFS",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${import.meta.env.VITE_PINATAJWT}`,
//           },
//           body: JSON.stringify(jsonMetadata),
//         }
//       );

//       const jsonUploadResult = await jsonUploadResponse.json();

//       if (jsonUploadResult?.IpfsHash) {
//         console.log("Metadata uploaded successfully:", jsonUploadResult.IpfsHash);
//        return {metaDataHash:jsonUploadResult.IpfsHash, docHash:fileUploadResult.IpfsHash};
//       } else {
//         console.error("Failed to upload JSON metadata:", jsonUploadResult);
//       }
//     } else {
//       console.error("Failed to upload file:", fileUploadResult);
//     }
//   } catch (error) {
//     console.error("Error uploading to IPFS:", error);
//   } finally {
//     setIsUploading(false);
//   }

//   return {metaDataHash:null,docHash:null}; // Return null if upload fails
// };



  