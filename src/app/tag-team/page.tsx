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
import {ABI, MORPH_HOLESKY_CONTRACT_ADDRESS} from "@/constants"

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
import { chainConfig } from "../web3auth-testing/page";

interface pageProps {}

type DrawLineProps = {
  prevPoint: Point | null;
  currentPoint: Point;
  color: string;
  lineWidth: number;
};
enum Tool {
  Brush = "brush",
  Eraser = "eraser",
  FillBucket = "fillBucket",
}
let evmProvider;
let publicClient:any;
let walletClient:any;

const page: FC<pageProps> = ({}) => {
  const [color, setColor] = useState<string>("#000");
  const [currentTool, setCurrentTool] = useState<Tool>(Tool.Brush);
  const [eraseMode, setEraseMode] = useState(false);
  const [lineWidth, setlineWidth] = useState<number>(7);
  const [cursor, setCursor] = useState<string>("crosshair");
  const [roomJoined, setRoomJoined] = useState(false);
  const [roomId, setRoomId] = useState<string>("");
  const [userId, setUserId] = useState<any>("");
  const [roomData, setRoomData] = useState({} as any);
  const [startingCounter, setStartingCounter] = useState<number | undefined>(3);
  const [timerValue, setTimerValue] = useState(90);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<any>();
  const [voted, setVoted] = useState(false);
  const [result, setResult] = useState("arbitrary")
  const [tokenId, setTokenId] = useState<number | undefined>()

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

  useEffect(()=>{
    console.log("result changed to: ")
    console.log(result) 
  },[result])   

  useEffect(() => {
    if (coreKitStatus === COREKIT_STATUS.LOGGED_IN) {
      getWallet();
    } else {
    }
  }, [coreKitStatus, coreKitInstance]);

  const NUM_PLAYERS = 2;

  const { canvasRef, onMouseDown, clear } = useDraw({
    onDraw: createLine,
    currentTool,
    color,
  });

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (canvasRef.current) {
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    const gameStarted = (data: any) => {
      console.log(data);
      setRoomData(data);
    };

    const playerJoined = (data: any) => {
      console.log(data);
      setRoomData(data);
    };

    const startCountdown = (data: any) => {
      console.log(data);
      setRoomData(data);
    };

    const countdown = (data: any) => {
      console.log(data);
      setStartingCounter(data);
    };

    const timer = (data: any) => {
      console.log(data);
      setTimerValue(data);
    };

    const voting = (data: any) => {
      setRoomData(data);
      
      if (userId === data.voteStarter) {
        console.log(userId)
        socket.emit("vote-receive", { playerId: userId, vote: true, roomId });
        setVoted(true);
      }
    };

    const finalRender = async (data: string[]): Promise<void> => {
      console.log("final render data", data);

      if (data.length !== 2) {
        console.error("Expected 2 image URLs, got", data.length);
        return;
      }

      try {
        const [img1, img2] = await Promise.all(
          data.map((src) => loadImage(src))
        );

        const canvas = document.createElement("canvas");
        canvas.width = img1.width + img2.width;
        canvas.height = Math.max(img1.height, img2.height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Unable to get 2D context");
        }

        ctx.drawImage(img1, 0, 0);
        ctx.drawImage(img2, img1.width, 0);
        let combinedImage = canvas.toDataURL()
        setImagePreviewUrl(combinedImage)
        console.log("room id here is: ", roomId)
        if(roomId&&combinedImage){
          socket.emit("combined-image", {combinedImage, roomId})
        }
      } catch (error) {
        console.error("Error rendering images:", error);
        // Handle error (e.g., set an error state or display a message to the user)
      }
    };

    // Helper function to load an image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const endGame = (data: any) => {
      console.log(data);
      setRoomData(data);
      if (!canvasRef.current?.toDataURL()) return console.log("returned here");
      //  setImagePreviewUrl(canvasRef.current.toDataURL())
      socket.emit("end-result", {
        state: canvasRef.current.toDataURL(),
        roomId,
      });
    };

    const voteResult = (data:any)=>{
      console.log(data)
      setResult(data.vote)
    }

    const createNft  = async(data:any)=>{
      console.log("creating an nft")
      console.log(data)

      //@ts-ignore
      if(data.voteStarter===userId){
        console.log("user id is: ", userId)
        const hash = await walletClient.writeContract({
          account:userId as `0x${string}`,
          address: MORPH_HOLESKY_CONTRACT_ADDRESS,
          abi:ABI,
          functionName:"createNFT",
          args:[data.playersArray]
        })

        console.log(hash)
        //@ts-ignore
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
        console.log(receipt)

        const idOfToken = await publicClient.readContract({
          address:MORPH_HOLESKY_CONTRACT_ADDRESS,
          abi: ABI,
          functionName:"idCounter"
        })

        console.log("reached id of token")
        console.log(Number(idOfToken))
        setTokenId(Number(idOfToken))

        socket.emit("create-metadata", {roomId, idOfToken:Number(idOfToken)})

      }


      
    }

    socket.on("get-canvas-state", () => {
      if (!canvasRef.current?.toDataURL()) return;
      console.log("sending canvas state");
      socket.emit("canvas-state", {
        state: canvasRef.current.toDataURL(),
        roomId,
      });
    });

    socket.on("swap-canvases", () => {
      if (!canvasRef.current) return;
      const currentState = canvasRef.current.toDataURL();
      socket.emit("swap-canvas-state", { state: currentState, roomId });

      // Clear the current canvas
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    });

    socket.on("receive-swapped-canvas", (state: string) => {
      const img = new Image();
      img.src = state;
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
    });

    socket.on("canvas-state-from-server", (state: string) => {
      console.log("I received the state");
      const img = new Image();
      img.src = state;
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
      };
    });

    socket.on(
      "draw-line",
      ({ prevPoint, currentPoint, color, lineWidth }: DrawLineProps) => {
        if (!ctx) return console.log("no ctx here");
        drawLine({ prevPoint, currentPoint, ctx, color, lineWidth });
      }
    );

    socket.on("player-joined", playerJoined);
    socket.on("start-game", gameStarted);
    socket.on("start-countdown", startCountdown);
    socket.on("counting-down", countdown);
    socket.on("timer-running", timer);
    socket.on("end-game", endGame);
    socket.on("final-render", finalRender);
    socket.on("voting", voting);
    socket.on("vote-result", voteResult)
    socket.on("create-nft", createNft)
    socket.on("clear", clear);

    return () => {
      socket.off("player-joined");
      socket.off("draw-line");
      socket.off("get-canvas-state");
      socket.off("canvas-state-from-server");
      socket.off("clear");
      socket.off("player-joined");
      socket.off("countdown-started");
      socket.off("counting-down");
      socket.off("timer-running");
      socket.off("end-game");
      socket.off("received-swap-canvas");
      socket.off("swap-canvases");
      socket.off("voting");
      socket.off("vote-result")
      socket.off("create-nft")
      socket.off("create-metadata")
    };
  }, [canvasRef, roomJoined, roomData]);

  useEffect(() => {
    const newCursor = createBrushCursor(lineWidth, eraseMode ? "white" : color);
    setCursor(newCursor);
  }, [lineWidth, color, eraseMode]);

  function toggleEraseMode() {
    setEraseMode((prev) => !prev);
    const newCursor = createBrushCursor(
      lineWidth,
      !eraseMode ? "white" : color
    );
    setCursor(newCursor);
  }

  const joinRoom = async () => {
    if (roomId) {
      try {
        console.log("got here");
        socket.emit("join-room", { userId, roomId, numberOfPlayers: 2 });
        setRoomJoined(true);
        console.log("got here too");
      } catch (error) {
        console.log(error);
      }
    }
  };
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (currentTool === "fillBucket") {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
    }
    onMouseDown(e);
  }
  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    if (eraseMode) {
      const color = "white";
      drawLine({ prevPoint, currentPoint, ctx, color, lineWidth });
    } else {
      drawLine({ prevPoint, currentPoint, ctx, color, lineWidth });
    }
  }
  return (
    <>
      <NextImage
        src="/background.png"
        layout="fill"
        objectFit="cover"
        quality={100}
        className=" bg-cover -z-10 contrast-125 brightness-[0.87] blur-[7px] "
        alt="Crypto Roulette rules background"
      />
      <Navbar />

      {roomJoined ? (
        roomData.gameStatus === "waiting" ? (
          <div className="border-2 h-screen w-full justify-center items-center flex flex-col">
            <div>
              You will get 90 seconds to paint the canvas with a friend. Mint
              your collective as an NFT.
            </div>
            <div>
              Waiting for {NUM_PLAYERS - roomData.playersArray.length} player
              {NUM_PLAYERS - roomData.playersArray.length > 1 ? "s" : ""}
            </div>
          </div>
        ) : roomData.gameStatus === "counting-down" ? (
          <div className="border-2 h-screen w-full justify-center items-center flex flex-col">
            <div>
              You will get 90 seconds to paint the canvas with a friend. Mint
              your collective as an NFT.
            </div>
            <div className="text-3xl">{startingCounter}</div>
          </div>
        ) : roomData.gameStatus === "started" ? (
          <div className="w-screen h-screen gap-10  flex justify-center items-center">
            <span className="text-3xl">{timerValue}</span>
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasClick}
              width={750}
              height={700}
              color={"white"}
              className="border z-30 border-black  rounded-md"
              style={{ cursor }}
            />
            {roomData.gameStatus !== "waiting" && (
              <div className="flex flex-col gap-10 pr-10">
                <HexColorPicker color={color} onChange={setColor} />
                <button
                  type="button"
                  className="p-2 rounded-md border border-white"
                >
                  Clear canvas
                </button>
                <button
                  type="button"
                  className={`p-2 rounded-md border border-white`}
                  onClick={toggleEraseMode}
                >
                  {eraseMode ? "erasing" : "erase"}
                </button>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={lineWidth}
                  onChange={(e) => setlineWidth(Number(e.target.value))}
                  className="slider"
                />
                <span>{lineWidth}</span>
                <button onClick={() => setCurrentTool(Tool.Brush)}>
                  Brush
                </button>
                <button onClick={() => setCurrentTool(Tool.Eraser)}>
                  Eraser
                </button>
                <button onClick={() => setCurrentTool(Tool.FillBucket)}>
                  Fill Bucket
                </button>
              </div>
            )}
          </div>
        ) : roomData.gameStatus === "ended" ? (
          <div className="border-2 h-screen w-full justify-center items-center flex flex-col">
            <div></div>
            <div className="text-3xl">Game ended</div>
            <img
              className="w-[30rem] h-[30rem] object-contain"
              src={imagePreviewUrl}
            />
            {tokenId?
            (<div>
              Congratulations! Your NFT has been created successfully! <br />
              Your token ID is {tokenId}. Copy it, follow this link and mint it!<br/>
              <a href="/mint">NFT Minting page</a>
            </div>):
            roomData.voteStarter ? (
              <div>
                <div>voting in progress</div>
                {result==="declined"?
                (<div>Vote declined. Too bad!</div>): 
                result==="accepted"?
                (<div>Creating NFT</div>):
                
                voted ? (
                  <div>Waiting for others...</div>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        socket.emit("vote-receive", {
                          playerId: userId,
                          vote: true,
                          roomId,
                        });
                        setVoted(true);
                      }}
                    >
                      {" "}
                      Yes
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("vote-receive", {
                          playerId: userId,
                          vote: false,
                          roomId,
                        });
                        setVoted(true);
                      }}
                    >
                      {" "}
                      No
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div>Do you want to make this an NFT?</div>
                <button
                  onClick={() => {
                    socket.emit("vote-start", { playerId: userId, roomId });
                  }}
                >
                  Sure!
                </button>
              </div>
            )}
          </div>
        ) : (
          ""
        )
      ) : (
        // not even joined at this point
        <div className="w-screen h-screen gap-10  flex justify-between flex-col items-center">
          <div>
            <div className="pt-12 text-3xl text-black border-2">Tag Team</div>
          </div>
          <div className="flex flex-col gap-8">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="text-black"
            />
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="text-black"
            />
            <button onClick={joinRoom}>Join room</button>
          </div>
          <div></div>
        </div>
      )}
    </>
  );
};

export default page;
