"use client";

import { FC, useEffect, useState } from "react";
import { useDraw } from "@/hooks/useDraw";
import { ChromePicker } from "react-color";
import { socket } from "@/socket";
import { io } from "socket.io-client";
import { drawLine } from "@/utils/drawLine";
import { createBrushCursor } from "@/utils/cursor";
import { HexColorPicker } from "react-colorful";
import Navbar from "@/components/Navbar";
import { default as NextImage } from "next/image";
import { useWalletContext } from "@/contexts/WalletContext";
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
// IMP END - Quick Start
import { core, Web3 } from "web3";
import {
  Account,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
} from "viem";
import { mainnet, morphHolesky } from "viem/chains";
import { chainConfig } from "../web3auth-testing/page";
export default function Testing (){
    let evmProvider;
let publicClient;
let walletClient;
    
    const { coreKitStatus, login, logout, coreKitInstance } = useWalletContext();

    const getWallet = async () => {
        if (coreKitInstance && coreKitStatus === COREKIT_STATUS.LOGGED_IN) {
          try {
            evmProvider = new EthereumSigningProvider({ config: { chainConfig } });
            evmProvider.setupProvider(makeEthereumSigner(coreKitInstance));
            const user = coreKitInstance.getUserInfo();
            console.log("User Info:", user);
    
            publicClient = createPublicClient({
              chain: morphHolesky, // for mainnet
              transport: custom(evmProvider),
            });
    
            walletClient = createWalletClient({
              chain: morphHolesky,
              transport: custom(evmProvider),
            });
    
    
            const addresses = await walletClient.getAddresses();
            if (addresses) {
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

    return(
        <div>


          {/* <button onclic */}

        </div>
    )
}