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

const page: FC<pageProps> = ({}) => {
  const [color, setColor] = useState<string>("#000");
  const [currentTool, setCurrentTool] = useState<Tool>(Tool.Brush);
  const [eraseMode, setEraseMode] = useState(false);
  const [lineWidth, setlineWidth] = useState<number>(7);
  const [cursor, setCursor] = useState<string>("crosshair");
  const [roomJoined, setRoomJoined] = useState(false);
  const [roomId, setRoomId] = useState<string>("");
  const [userId, setUserId] = useState("");
  const [roomData, setRoomData] = useState({} as any);
  const [startingCounter, setStartingCounter] = useState<number | undefined>(3);
  const [timerValue, setTimerValue] = useState(90);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<any>();
  const [voted, setVoted] = useState(false);

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

        setImagePreviewUrl(canvas.toDataURL());
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
            {roomData.voteStarter ? (
              <div>
                <div>voting in progress</div>
                {voted ? (
                  <div>Waiting for others...</div>
                ) : (
                  <div>
                    <button
                      onClick={() =>
                      {
                        socket.emit("vote-receive", {
                          playerId: userId,
                          vote: true,
                          roomId,
                        })
                        setVoted(true)
                      }
                      }
                    >
                      {" "}
                      Yes
                    </button>
                    <button
                      onClick={() =>
                      {
                        socket.emit("vote-receive", {
                          playerId: userId,
                          vote: false,
                          roomId,
                        })
                        setVoted(true)
                      }
                      }
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
            <div className="pt-12 text-3xl  border-2">Co-Paint</div>
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
