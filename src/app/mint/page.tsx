"use client";

import { FC, useEffect, useState } from "react";
import { useDraw } from "@/hooks/useDraw";
import { socket } from "@/socket";
import { drawLine } from "@/utils/drawLine";
import { createBrushCursor } from "@/utils/cursor";
import { HexColorPicker } from "react-colorful";
import Navbar from "@/components/Navbar";
import { default as NextImage } from "next/image";
import { useWalletContext } from "@/contexts/WalletContext";
import { ABI, MORPH_HOLESKY_CONTRACT_ADDRESS } from "@/constants";

import { EthereumSigningProvider } from "@web3auth/ethereum-mpc-provider";

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

import {
  Account,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
} from "viem";
import { mainnet, morphHolesky } from "viem/chains";
import { chainConfig } from "@/constants";

let evmProvider;
let publicClient: any;
let walletClient: any;

export default function Mint() {
  const [userId, setUserId] = useState<any>("");
  const [tokenId, setTokenId] = useState<string>("")

  const { coreKitStatus, login, logout, coreKitInstance } = useWalletContext();

  const getWallet = async () => {
    if (coreKitInstance && coreKitStatus === COREKIT_STATUS.LOGGED_IN) {
      try {
        evmProvider = new EthereumSigningProvider({ config: { chainConfig } });
        evmProvider.setupProvider(makeEthereumSigner(coreKitInstance));
        const user = coreKitInstance.getUserInfo();
        console.log("User Info:", user);

        publicClient = createPublicClient({
          chain: morphHolesky,
          transport: custom(evmProvider),
        });

        walletClient = createWalletClient({
          chain: morphHolesky,
          transport: custom(evmProvider),
        });

        const addresses = await walletClient.getAddresses();
        if (addresses) {
          setUserId(addresses[0]);
        }
        console.log(addresses[0]);
      } catch (error) {
        console.error("Failed to get user info:", error);
      }
    } else {
    }
  };

  useEffect(() => {
    if (coreKitStatus === COREKIT_STATUS.LOGGED_IN) {
      getWallet();
    } else {
    }
  }, [coreKitStatus, coreKitInstance]);

  async function mintNft(){
        const hash = await walletClient.writeContract({
          account:userId as `0x${string}`,
          address: MORPH_HOLESKY_CONTRACT_ADDRESS,
          abi:ABI,
          functionName:"mintNFT",
          args:[tokenId]
        })
        //@ts-ignore
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
        console.log(receipt)  
    }

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center gap-2 ">
      <input className="text-black" value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
      <button onClick={mintNft} disabled={!userId}>
        {" "}
        Mint NFT
      </button>
    </div>
  );
}
