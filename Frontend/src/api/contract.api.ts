import {ethers} from 'ethers';
import toast from 'react-hot-toast';
import { abi } from '@/contract/contract.Data';
import { contractAddress } from '@/contract/contract.Data';
import { contractNFTAddress,abiNFT } from '@/contract/nft.contractData';
declare global{
    interface Window{
        ethereum?:any;
    }
}

const {ethereum} = window;

export const connectWallet = async():Promise<string | undefined>=>{
    try {
    if(!ethereum)
    {
        return toast.error("Please add metamask extension in your browser");
    }
    const requestedAccounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

    const firstAcc = requestedAccounts[0];
    console.log("first acc",firstAcc);
    return firstAcc;
    } catch (error) {
      console.log("error while connecting wallet",error);
      toast.error("went something wrong. please try again")
    }
}



export const getContract =async():Promise<ethers.Contract | undefined>=>{
    try {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer =await provider.getSigner();
    const contract = await new ethers.Contract(contractAddress,abi,signer);;
    return contract;
   } catch (error) {
        console.log("error while fetching contract",error);
        toast.error("went something wrong");
   }
}
export const getNFTContract =async():Promise<ethers.Contract | undefined>=>{
    try {
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        // Connect to the smart contract
        const contractNFT = new ethers.Contract(contractNFTAddress, abiNFT, signer);
    return contractNFT;
   } catch (error) {
        console.log("error while fetching contract",error);
        toast.error("went something wrong");
   }
}