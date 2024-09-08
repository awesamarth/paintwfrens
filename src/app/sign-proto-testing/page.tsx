"use client";
import { SignProtocolClient, SpMode, EvmChains } from "@ethsign/sp-sdk";
import { useEffect, useState } from "react";
import axios from "axios";
import { decodeAbiParameters } from "viem";
import { useAccount } from "wagmi";


/*

{
    "attestationId": "0x1a3",
    "txHash": "0x222967a888d5d56e60feedb07b3715a51171f1cb5655b701a70881e6f8849e42",
    "indexingValue": "0xcdf770392f1e5e61725cc9522c80070134d50ec7"
}

*/

export default function Testing() {
  let client: any;
  let address:any

  const [list, setList] = useState<any>()
  useEffect(() => {
    client = new SignProtocolClient(SpMode.OnChain, {
      chain: EvmChains.sepolia,
      

    });
    getAccount()

  }, []);

  async function getAccount(){
    //@ts-ignore
    if (typeof window.ethereum !== 'undefined') {
      // connects to MetaMask
      //@ts-ignore
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

    } else {
      // tell the user to install an `ethereum` provider extension
    }
  }

  async function createSchema() {
    const res = await client.createSchema({
      name: "SDK Test",
      data: [
        { name: "message", type: "string" },
        { name: "signer", type: "address" },
      ],
      
    });

    console.log(res);
  }

  async function createAttestation(
    signer: string
  ) {
    console.log("reaching here");
    console.log(client);
    console.log(address)
    const res = await client.createAttestation({
      schemaId: "0x1cb",
      data: {
        addresses:["ok", "does this work"],
        signer:address,
      },
      indexingValue: signer.toLowerCase(),
    });
    console.log(res);
  }

  async function makeAttestationRequest(endpoint: string, options: any) {
    const url = `https://testnet-rpc.sign.global/api/${endpoint}`;
    const res = await axios.request({
      url,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      ...options,
    });
    // Throw API errors
    if (res.status !== 200) {
      throw new Error(JSON.stringify(res));
    }
    // Return original response
    return res.data;
  }

  async function queryAttestations() {
    const response = await makeAttestationRequest("index/attestations", {
      method: "GET",
      params: {
        mode: "onchain", // Data storage location
        schemaId: "onchain_evm_11155111_0x1cb", // Your full schema's ID
        attester: "0xCDF770392F1E5E61725Cc9522c80070134D50eC7", // Alice's address
        indexingValue:
          "0xCDF770392F1E5E61725Cc9522c80070134D50eC7".toLowerCase(), // Bob's address
      },
    });

    console.log(response);

    // Make sure the request was successfully processed.
    if (!response.success) {
      return {
        success: false,
        message: response?.message ?? "Attestation query failed.",
      };
    }

    // Return a message if no attestations are found.
    if (response.data?.total === 0) {
      return {
        success: false,
        message: "No attestation for this address found.",
      };
    }

    // Return all attestations that match our query.
    setList(response.data.rows)
    return {
      success: true,
      attestations: response.data.rows,
    };
  }

  function findAttestation(message: string, attestations: any[]) {
    // Iterate through the list of attestations
    console.log("reaching here")
    for (const att of attestations) {
      console.log(att)
      if (!att.data) continue;

      let parsedData: any = {};

      // Parse the data.
      if (att.mode == "onchain") {
        // Looking for nested items in the on-chain schema
        try {
          const data = decodeAbiParameters(
            [
              att.dataLocation === "onchain"
                ? { components: att.schema.data, type: "tuple" }
                : { type: "string" },
            ],
            att.data
          );
          parsedData = data[0];
          console.log(parsedData)
        } catch (error) {
          // Looking for a regular schema format if the nested parse fails
          try {
            const data = decodeAbiParameters(
              att.dataLocation == "onchain"
                ? att.schema.data
                : [{ type: "string" }],
              att.data
            );
            const obj: any = {};
            data.forEach((item: any, i: number) => {
              obj[att.schema.data[i].name] = item;
            });
            parsedData = obj;
          } catch (error) {
            continue;
          }
        }
      } else {
        // Try parsing as a string (off-chain attestation)
        try {
          parsedData = JSON.parse(att.data);
        } catch (error) {
          console.log(error);
          continue;
        }
      }

      // Return the correct attestation and its parsed data.
      if (parsedData?.contractDetails === message) {
        return { parsedData, attestation: att };
      }
    }

    // Did not find the attestation we are looking for.
    return undefined;
  }

  return (
    <main className="h-screen flex flex-col justify-center items-center">
      <button onClick={createSchema}>create schema</button>
      <button
        onClick={() =>
          createAttestation(
            "i am signing",
            
          )
        }
      >
        {" "}
        create attestation
      </button>
      <button onClick={queryAttestations}>Query Attestations</button>
      <button onClick={()=>findAttestation("ok", list )}>Find Attestation</button>
    </main>
  );
}
