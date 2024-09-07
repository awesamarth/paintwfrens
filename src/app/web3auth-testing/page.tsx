"use client";

import { tssLib } from "@toruslabs/tss-dkls-lib";
import { BN } from "bn.js";

/* eslint-disable @typescript-eslint/no-use-before-define */

import { CHAIN_NAMESPACES } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { EthereumSigningProvider } from "@web3auth/ethereum-mpc-provider";
// IMP START - Quick Start
import {
  COREKIT_STATUS,
  generateFactorKey,
  JWTLoginParams,
  keyToMnemonic,
  makeEthereumSigner,
  mnemonicToKey,
  parseToken,
  TssShareType,
  WEB3AUTH_NETWORK,
  Web3AuthMPCCoreKit,
} from "@web3auth/mpc-core-kit";
// Optional, only for social second factor recovery
import Web3AuthSingleFactorAuth from "@web3auth/single-factor-auth";
// Firebase libraries for custom authentication
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { useEffect, useState } from "react";
// IMP END - Quick Start
import { core, Web3 } from "web3";
import { Account, createPublicClient, createWalletClient, custom, http, parseEther } from "viem";
import { mainnet, morphHolesky } from "viem/chains";

// IMP START - SDK Initialization
// IMP START - Dashboard Registration
// straight from the docs lol
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

let coreKitInstance: Web3AuthMPCCoreKit;
let evmProvider: EthereumSigningProvider;

if (typeof window !== "undefined") {
  coreKitInstance = new Web3AuthMPCCoreKit({
    web3AuthClientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.MAINNET,
    storage: window.localStorage,
    manualSync: true, // This is the recommended approach
    tssLib
    
  });

  // Setup provider for EVM Chain
  evmProvider = new EthereumSigningProvider({ config: { chainConfig } });
  evmProvider.setupProvider(makeEthereumSigner(coreKitInstance));
}
// IMP END - SDK Initialization

// IMP START - Auth Provider Login
// Your web app's Firebase configuration
const firebaseConfig = {
  //got this straight from the nextjs example repo. if you don't want me to use it, hide it lmaooooo
  apiKey: "AIzaSyB0nd9YsPLu-tpdCrsXn8wgsWVAiYEpQ_E",
  authDomain: "web3auth-oauth-logins.firebaseapp.com",
  projectId: "web3auth-oauth-logins",
  storageBucket: "web3auth-oauth-logins.appspot.com",
  messagingSenderId: "461819774167",
  appId: "1:461819774167:web:e74addfb6cc88f3b5b9c92",
};
// IMP END - Auth Provider Login



function App(this: any) {
  const [coreKitStatus, setCoreKitStatus] = useState<COREKIT_STATUS>(
    COREKIT_STATUS.NOT_INITIALIZED
  );
  const [backupFactorKey, setBackupFactorKey] = useState<string>("");
  const [mnemonicFactor, setMnemonicFactor] = useState<string>("");
  console.log(this)
  
  
  const publicClient = createPublicClient({
    chain: morphHolesky, // for mainnet
    transport: custom(evmProvider),
  });
  
  const walletClient = createWalletClient({
    chain: morphHolesky,
    transport: custom(evmProvider),
  });

  async function sendTransaction() {
    const destination = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const amount = parseEther("0.0001");

    const address = await walletClient.getAddresses();
    console.log(address)

    // Prepare transaction
    console.log(evmProvider)
    const request = await walletClient.sendTransaction({
      account: address[0],
      to: destination as `0x${string}`,
      value: amount,
    });

    // Sign transaction
    console.log(request)
    // Submit transaction to the blockchain
  }

  // Firebase Initialisation
  const app = initializeApp(firebaseConfig);

  useEffect(() => {
    const init = async () => {
      // IMP START - SDK Initialization
      await coreKitInstance.init();
      // IMP END - SDK Initialization

      setCoreKitStatus(coreKitInstance.status);
    };
    init();
  }, []);

  // IMP START - Auth Provider Login
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
  // IMP END - Auth Provider Login

  const login = async () => {
    try {
      if (!coreKitInstance) {
        throw new Error("initiated to login");
      }
      // IMP START - Auth Provider Login
      const loginRes = await signInWithGoogle();
      const idToken = await loginRes.user.getIdToken(true);
      const parsedToken = parseToken(idToken);
      // IMP END - Auth Provider Login

      // IMP START - Login
      const idTokenLoginParams = {
        verifier,
        verifierId: parsedToken.sub,
        idToken,
      } as JWTLoginParams;

      await coreKitInstance.loginWithJWT(idTokenLoginParams);
      if (coreKitInstance.status === COREKIT_STATUS.LOGGED_IN) {
        await coreKitInstance.commitChanges(); // Needed for new accounts
      }
      // IMP END - Login

      // IMP START - Recover MFA Enabled Account
      if (coreKitInstance.status === COREKIT_STATUS.REQUIRED_SHARE) {
        uiConsole(
          "required more shares, please enter your backup/ device factor key, or reset account [unrecoverable once reset, please use it with caution]"
        );
      }
      // IMP END - Recover MFA Enabled Account

      setCoreKitStatus(coreKitInstance.status);
    } catch (err) {
      uiConsole(err);
    }
  };
  // IMP START - Recover MFA Enabled Account
  const inputBackupFactorKey = async () => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance not found");
    }
    if (!backupFactorKey) {
      throw new Error("backupFactorKey not found");
    }
    const factorKey = new BN(backupFactorKey, "hex");
    await coreKitInstance.inputFactorKey(factorKey);

    setCoreKitStatus(coreKitInstance.status);

    if (coreKitInstance.status === COREKIT_STATUS.REQUIRED_SHARE) {
      uiConsole(
        "required more shares even after inputing backup factor key, please enter your backup/ device factor key, or reset account [unrecoverable once reset, please use it with caution]"
      );
    }
  };
  // IMP END - Recover MFA Enabled Account

  const getUserInfo = async () => {
    // IMP START - Get User Information
    const user = coreKitInstance.getUserInfo();
    // IMP END - Get User Information
    uiConsole(user);
  };

  const logout = async () => {
    // IMP START - Logout
    await coreKitInstance.logout();
    // IMP END - Logout
    setCoreKitStatus(coreKitInstance.status);
    uiConsole("logged out");
  };

  // IMP START - Blockchain Calls

  const getBalance = async () => {
    if (!coreKitInstance) {
      uiConsole("provider not initialized yet");
      return;
    }

    // Get user's Ethereum public address

    // Get user's balance in ether

    
  };

  const signMessage = async () => {
    if (!coreKitInstance) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole("Signing Message...");
    let web3:any
    // Get user's Ethereum public address
    const fromAddress = (await web3.eth.getAccounts())[0];

    const originalMessage = "YOUR_MESSAGE";

    // Sign the message
    const signedMessage = await web3.eth.personal.sign(
      originalMessage,
      fromAddress,
      "test password!" // configure your own password here.
    );
    uiConsole(signedMessage);
  };
  // IMP END - Blockchain Calls

  const criticalResetAccount = async (): Promise<void> => {
    // This is a critical function that should only be used for testing purposes
    // Resetting your account means clearing all the metadata associated with it from the metadata server
    // The key details will be deleted from our server and you will not be able to recover your account
    if (!coreKitInstance) {
      throw new Error("coreKitInstance is not set");
    }
    // if (selectedNetwork === WEB3AUTH_NETWORK.MAINNET) {
    //   throw new Error("reset account is not recommended on mainnet");
    // }
    await coreKitInstance.tKey.storageLayer.setMetadata({
      privKey: new BN(coreKitInstance.state.postBoxKey! as string, "hex"),
      input: { message: "KEY_NOT_FOUND" },
    });
    if (coreKitInstance.status === COREKIT_STATUS.LOGGED_IN) {
      await coreKitInstance.commitChanges();
    }
    uiConsole("reset");
    logout();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function uiConsole(...args: any): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
    console.log(...args);
  }

  const loggedInView = (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={getUserInfo}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Get User Info
        </button>

        <button
          onClick={getBalance}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Get Balance
        </button>
        <button
          onClick={signMessage}
          className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Sign Message
        </button>
                <button
          onClick={sendTransaction}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
        >
          Send transaction
        </button>
        <button
          onClick={logout}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Log Out
        </button>
        <button
          onClick={criticalResetAccount}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          [CRITICAL] Reset Account
        </button>
      </div>
    </div>
  );

  const unloggedInView = (
    <div className="flex flex-col items-center space-y-4 p-6 bg-gray-100 rounded-lg shadow-md">
      <button
        onClick={login}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
      >
        Login
      </button>
      <div
        className={`${coreKitStatus === COREKIT_STATUS.REQUIRED_SHARE ? "" : "opacity-50 pointer-events-none"} space-y-4`}
      >
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Recover Using Mnemonic Factor Key:
          </label>
          <input
            value={mnemonicFactor}
            onChange={(e) => setMnemonicFactor(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-sm font-medium text-gray-700">
          Backup/ Device Factor:{" "}
          <span className="font-normal">{backupFactorKey}</span>
        </div>
        <button
          onClick={() => inputBackupFactorKey()}
          className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition duration-300"
        >
          Input Backup Factor Key
        </button>

      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        <a
          target="_blank"
          href="https://web3auth.io/docs/sdk/core-kit/mpc-core-kit/"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          Web3Auth MPC Core Kit
        </a>{" "}
        Nextjs Quick Start
      </h1>

      <div className="grid place-items-center">
        {coreKitStatus === COREKIT_STATUS.LOGGED_IN
          ? loggedInView
          : unloggedInView}
      </div>

      <div id="console" className="mt-8 p-4 bg-gray-100 text-black rounded-lg">
        <p className="whitespace-pre-line"></p>
      </div>

      <footer className="mt-8 text-center">
        <a
          href="https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/mpc-core-kit-web/quick-starts/mpc-core-kit-react-quick-start"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
