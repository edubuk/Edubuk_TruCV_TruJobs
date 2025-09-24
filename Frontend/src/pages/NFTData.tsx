import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";


interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  hash:string;
}

interface NFTGalleryProps {
  contractAddress: string;
  abi: ethers.ContractInterface;
  account:string;
}

const NFTGallery: React.FC<NFTGalleryProps> = ({ contractAddress, abi,account }) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNFTs = async () => {
    const id=toast.loading("Fetching NFTs")
    try {
      setLoading(true);

      // Connect to Ethereum using MetaMask           
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      //await provider.send("eth_requestAccounts", []);
      //console.log("account",account[0]);
      const signer = provider.getSigner();
      // Connect to the smart contract
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // Fetch all token IDs from the contract
      const tokenIds = (await contract.getTokenIds(account)).map((id: ethers.BigNumber) =>
        id.toString()
      );
      console.log("tokenIds",tokenIds);
      // Fetch metadata for each token ID
      const nftPromises = tokenIds.map(async (tokenId: string) => {
        const tokenUri: string = await contract.tokenURI(tokenId);
        console.log("tokenUri",tokenUri);
        const metadataUrl = `${import.meta.env.VITE_AzureGATWAY}/${tokenUri}`;
        console.log("metadataUrl",metadataUrl);
        const response:any = await fetch(metadataUrl);
        const metadata = await response.json();

        return {
          id: tokenId,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          hash:metadata.hash,
        };
      });
    
      const fetchedNFTs = await Promise.all(nftPromises);
      setNfts(fetchedNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
        toast.dismiss(id);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, []);

  return (
     <div className="p-4 w-full">
      <h1 className="text-[#006666] text-3xl font-bold text-center mb-6">
        NFT Gallery
      </h1>
      {loading ? (
        <p className="text-center text-lg">Loading NFTs...</p>
      ) : nfts.length === 0 ? (
        <p className="text-red-500 text-center text-lg">No NFTs found.</p>
      ) : (
        <div className="flex flex-wrap justify-center items-center gap-4">
          {nfts.map((nft) => (
            <div
              key={nft.id}
              className="rounded-lg p-[1px] bg-gradient-to-r from-[#03257e] via-[#006666] to-[#f14419] shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
            >
              <div className="flex flex-col justify-center bg-white items-center border border-gray-300 rounded-lg overflow-hidden ">
                <div className="flex justify-center items-cente w-full">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="max-w-max h-24 object-contain"
                  />
                </div>
                <div className="p-2 w-[280px] text-center">
                  <h2 className="font-semibold font-sans text-[#03257e]">
                    {nft.name}
                  </h2>
                  <p className="text-sm text-[#006666] font-sans ">{nft.description}</p>
                  <p className="text-sm text-gray-800 font-semibold mt-2">
                    Token ID: {nft.id}
                  </p>
                  {nft?.hash && (
                    <a
                      className="inline-block mt-4 text-sm text-white bg-[#ff7300] px-4 py-2 rounded-full hover:bg-[#006666] transition-all"
                      href={`${import.meta.env.VITE_AzureGATWAY}/${nft.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Certificate
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
