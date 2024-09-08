// hooks/useWallet.ts
import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";
import {
    COREKIT_STATUS,
    JWTLoginParams,
    parseToken,
    WEB3AUTH_NETWORK,
    Web3AuthMPCCoreKit,
  } from "@web3auth/mpc-core-kit";
 // Create this config file
 import { CHAIN_NAMESPACES } from "@web3auth/base";
 import { tssLib } from "@toruslabs/tss-dkls-lib";



let coreKitInstance: Web3AuthMPCCoreKit;

const firebaseConfig = {
    //got this straight from the nextjs example repo. if you don't want me to use it, hide it lmaooooo
    apiKey: "AIzaSyB0nd9YsPLu-tpdCrsXn8wgsWVAiYEpQ_E",
    authDomain: "web3auth-oauth-logins.firebaseapp.com",
    projectId: "web3auth-oauth-logins",
    storageBucket: "web3auth-oauth-logins.appspot.com",
    messagingSenderId: "461819774167",
    appId: "1:461819774167:web:e74addfb6cc88f3b5b9c92",
  };

  const web3AuthClientId =
  "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io
// IMP END - Dashboard Registration

// IMP START - Verifier Creation
const verifier = "w3a-firebase-demo";
// IMP END - Verifier Creation
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xafa",
  rpcTarget: "https://rpc-quicknode-holesky.morphl2.io",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Morph Holesky Testnet",
  blockExplorerUrl: "https://explorer-holesky.morphl2.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
  // logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};


export function useWallet() {
    const [coreKitInstance, setCoreKitInstance] = useState<Web3AuthMPCCoreKit | null>(null);
    const [coreKitStatus, setCoreKitStatus] = useState<COREKIT_STATUS>(COREKIT_STATUS.NOT_INITIALIZED);
    const app = initializeApp(firebaseConfig);
  
    useEffect(() => {
      const init = async () => {
        if (typeof window !== "undefined") {
          const instance = new Web3AuthMPCCoreKit({
            web3AuthClientId,
            web3AuthNetwork: WEB3AUTH_NETWORK.MAINNET,
            storage: window.localStorage,
            manualSync: true,
            tssLib
          });
          await instance.init();
          setCoreKitInstance(instance);
          setCoreKitStatus(instance.status);
        }
      };
      init();
    }, []);
  
    const signInWithGoogle = async (): Promise<UserCredential> => {
      try {
        const auth = getAuth(app);
        const googleProvider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, googleProvider);
        console.log(res);
        return res;
      } catch (err) {
        console.error(err);
        throw err;
      }
    };
  
    const login = async () => {
      try {
        if (!coreKitInstance) {
          throw new Error("CoreKit not initialized");
        }
        const loginRes = await signInWithGoogle();
        const idToken = await loginRes.user.getIdToken(true);
        const parsedToken = parseToken(idToken);
  
        const idTokenLoginParams = {
          verifier,
          verifierId: parsedToken.sub,
          idToken,
        } as JWTLoginParams;
  
        await coreKitInstance.loginWithJWT(idTokenLoginParams);
        if (coreKitInstance.status === COREKIT_STATUS.LOGGED_IN) {
          await coreKitInstance.commitChanges();
        }
  
        setCoreKitStatus(coreKitInstance.status);
      } catch (err) {
        console.error(err);
      }
    };
  
    const logout = async () => {
      if (coreKitInstance) {
        await coreKitInstance.logout();
        setCoreKitStatus(coreKitInstance.status);
        console.log("logged out");
      }
    };
  
    return { coreKitInstance, coreKitStatus, login, logout };
  }