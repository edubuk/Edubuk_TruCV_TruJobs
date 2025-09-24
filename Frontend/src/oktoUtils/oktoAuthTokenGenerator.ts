//import { useOkto } from "@okto_web3/react-sdk";
import { SessionKey } from './sessionKey';
import {getTreasuryWalletAuthorizationToken} from './getTreasuryWalletAuthorizationToken';

export const oktoAuthTokenGenerator = async () => {
  
  const treasuryWalletSWA = `${import.meta.env.VITE_OKTO_TSWA}`; 
  const treasuryAPIkey = `${import.meta.env.VITE_OKTO_Treasury_API_KEY}`; 

  // Construct the session object using the private key above
  const session = SessionKey.fromPrivateKey(treasuryAPIkey);

  //construct session config using the session object and userSWA
  const sessionConfig = {
    sessionPrivKey: session.privateKeyHexWith0x,
    sessionPubKey: session.uncompressedPublicKeyHexWith0x,
    treasuryWalletSWA,
  };

  // Get the authorization token using the sessionConfig object
  const authToken = await getTreasuryWalletAuthorizationToken(sessionConfig);
  console.log("Okto session authToken: ", authToken);
 
  return authToken;
};
