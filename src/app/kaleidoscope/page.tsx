"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useDraw } from "@/hooks/useDraw";
import { socket } from "@/socket";
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
  const [lineWidth, setLineWidth] = useState<number>(7);
  const [cursor, setCursor] = useState<string>("crosshair");
  const [roomJoined, setRoomJoined] = useState(false);
  const [roomId, setRoomId] = useState<string>("");
  const [userId, setUserId] = useState("");
  const [roomData, setRoomData] = useState({} as any);
  const [startingCounter, setStartingCounter] = useState<number | undefined>(3);
  // const [timerValue, setTimerValue] = useState(90);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<any>();
  const [playerPosition, setPlayerPosition] = useState<string>("TL");

  const NUM_PLAYERS = 4;

  const TLCanvas = useDraw({ onDraw: createLine, currentTool, color });
  const TRCanvas = useDraw({ onDraw: createLine, currentTool, color });
  const BLCanvas = useDraw({ onDraw: createLine, currentTool, color });
  const BRCanvas = useDraw({ onDraw: createLine, currentTool, color });

  const canvasRefs = useMemo(
    () => ({
      TL: TLCanvas,
      TR: TRCanvas,
      BL: BLCanvas,
      BR: BRCanvas,
    }),
    [TLCanvas, TRCanvas, BLCanvas, BRCanvas]
  );

  useEffect(() => {
    const newCursor = createBrushCursor(lineWidth, eraseMode ? "white" : color);
    setCursor(newCursor);
  }, [lineWidth, color, eraseMode]);

  useEffect(()=>{
    //@ts-ignore
    console.log("canvas refs are, ", canvasRefs[playerPosition])
    Object.values(canvasRefs).forEach(({ canvasRef }) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasRef.current?.width ?? 0, canvasRef.current?.height ?? 0);
      }
    });
    
  },[roomData])

  useEffect(() => {


    const gameStarted = (data: any) => {
      console.log("game started");
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
      // setTimerValue(data);
    };

    const endGame = (data: any) => {
      console.log(data);
      setRoomData(data);
      const canvas =
        canvasRefs[playerPosition as keyof typeof canvasRefs].canvasRef.current;
      if (canvas) {
        setImagePreviewUrl(canvas.toDataURL());
        socket.emit("end-result", {
          state: canvas.toDataURL(),
          roomId,
          playerPosition
        });
      }
    };

    socket.on("get-canvas-state", () => {
      if (
        playerPosition &&
        canvasRefs[playerPosition as keyof typeof canvasRefs]
      ) {
        const canvas =
          canvasRefs[playerPosition as keyof typeof canvasRefs].canvasRef
            .current;
        if (canvas) {
          console.log("sending canvas state");
          socket.emit("canvas-state", {
            state: canvas.toDataURL(),
            roomId,
          });
        }
      }
    });

    socket.on("update-partial-canvas", ({ state, position }) => {
      if (position !== playerPosition) {
        const canvas =
          canvasRefs[position as keyof typeof canvasRefs].canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.onload = () =>
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          img.src = state;
        }
      }
    });

    socket.on("canvas-state-from-server", (state: string) => {
      console.log("I received the state");
      const canvas =
        canvasRefs[playerPosition as keyof typeof canvasRefs].canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => ctx?.drawImage(img, 0, 0);
        img.src = state;
      }
    });

    socket.on(
      "draw-line",
      ({ prevPoint, currentPoint, color, lineWidth }: DrawLineProps) => {
        const canvas =
          canvasRefs[playerPosition as keyof typeof canvasRefs].canvasRef
            .current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            drawLine({ prevPoint, currentPoint, ctx, color, lineWidth });
          }
        }
      }
    );

    socket.on("player-joined", playerJoined);
    socket.on("start-game", gameStarted);
    socket.on("start-countdown", startCountdown);
    socket.on("counting-down", countdown);
    socket.on("timer-running", timer);
    socket.on("end-game", endGame);
    socket.on("assign-position", (position: string) => {
      setPlayerPosition(position);
    });

    socket.on("clear", () => {
      Object.values(canvasRefs).forEach(({ clear }) => clear());
    });

    return () => {
      socket.off("player-joined");
      socket.off("draw-line");
      socket.off("get-canvas-state");
      socket.off("canvas-state-from-server");
      socket.off("clear");
      socket.off("start-game");
      socket.off("start-countdown");
      socket.off("counting-down");
      socket.off("timer-running");
      socket.off("end-game");
      socket.off("assign-position");
    };
  }, [canvasRefs, playerPosition, roomId]);

  function toggleEraseMode() {
    setEraseMode((prev) => !prev);
  }

  const joinRoom = async () => {
    if (roomId) {
      try {
        console.log("got here");
        socket.emit("join-room", {
          userId,
          roomId,
          numberOfPlayers: NUM_PLAYERS,
        });
        setRoomJoined(true);
        console.log("got here too");
      } catch (error) {
        console.log(error);
      }
    }
  };
  type Position = "TL" | "TR" | "BL" | "BR";
  type ViewportSize = { width: number; height: number };

  type LayoutMap = {
    [key in Position]: {
      [subKey in Exclude<Position, key>]: string;
    };
  };
  const getViewportOffset = (
    viewerPosition: Position,
    canvasPosition: Position
  ): { x: number; y: number } => {
    if (viewerPosition === canvasPosition) {
      return { x: 0, y: 0 }; // No offset for the player's own canvas
    }

    const offsetMap: Record<
      Position,
      Record<Position, { x: number; y: number }>
    > = {
      TL: {
        TL: { x: 0, y: 0 },
        TR: { x: 0, y: 0 },
        BL: { x: 0, y: 0 },
        BR: { x: 0, y: 0 },
      },
      TR: {
        TL: { x: 400, y: 0 },
        TR: { x: 0, y: 0 },
        BL: { x: 0, y: 350 },
        BR: { x: 0, y: 350 },
      },
      BL: {
        TL: { x: 0, y: 350 },
        TR: { x: 0, y: 0 },
        BL: { x: 0, y: 0 },
        BR: { x: 0, y: 0 },
      },
      BR: {
        TL: { x: 400, y: 350 },
        TR: { x: 0, y: 350 },
        BL: { x: 400, y: 0 },
        BR: { x: 0, y: 0 },
      },
    };

    return offsetMap[viewerPosition][canvasPosition];
  };

  const getViewportSize = (
    viewerPosition: Position,
    canvasPosition: Position
  ): ViewportSize => {
    if (viewerPosition === canvasPosition) {
      return { width: 600, height: 500 }; // Full size for the player's own canvas
    }

    const sizeMap: Record<Position, Record<Position, ViewportSize>> = {
      TL: {
        TL: { width: 600, height: 500 },
        TR: { width: 200, height: 500 },
        BL: { width: 600, height: 150 },
        BR: { width: 200, height: 150 },
      },
      TR: {
        TL: { width: 200, height: 500 },
        TR: { width: 600, height: 500 },
        BL: { width: 200, height: 150 },
        BR: { width: 600, height: 150 },
      },
      BL: {
        TL: { width: 600, height: 150 },
        TR: { width: 200, height: 150 },
        BL: { width: 600, height: 500 },
        BR: { width: 200, height: 500 },
      },
      BR: {
        TL: { width: 200, height: 150 },
        TR: { width: 600, height: 150 },
        BL: { width: 200, height: 500 },
        BR: { width: 600, height: 500 },
      },
    };
    return sizeMap[viewerPosition][canvasPosition];
  };

  const getPositionClasses = (
    position: Position,
    playerPosition: Position
  ): string => {
    if (position === playerPosition) {
      return "col-span-3 row-span-3";
    }

    const layoutMap = {
      TL: {
        TR: "col-start-4 row-span-3",
        BL: "col-span-3 row-start-4",
        BR: "col-start-4 row-start-4",
      },
      TR: {
        TL: "col-span-1 row-span-3",
        BL: "col-start-1 row-start-4",
        BR: "col-span-3 row-start-4",
      },
      BL: {
        TL: "col-span-3 row-start-1",
        TR: "col-start-4 row-start-1",
        BR: "col-start-4 row-span-3",
      },
      BR: {
        TL: "col-start-1 row-start-1",
        TR: "col-span-3 row-start-1",
        BL: "col-start-1 row-span-3",
      },
    };

    return (
      layoutMap[playerPosition][
        position as keyof (typeof layoutMap)[typeof playerPosition]
      ] || ""
    );
  };
  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    const drawColor = eraseMode ? "white" : color;
    drawLine({ prevPoint, currentPoint, ctx, color: drawColor, lineWidth });
    if (playerPosition) {
      const canvas =
        canvasRefs[playerPosition as keyof typeof canvasRefs].canvasRef.current;
      if (canvas) {
        socket.emit("kaleidoscope-canvas-state", {
          state: canvas.toDataURL(),
          roomId,
          position: playerPosition,
        });
      }
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
            {/* <span className="text-3xl">{timerValue}</span> */}
            <div className="grid grid-cols-4 grid-rows-4 gap-1 w-screen h-screen p-1">
              {Object.entries(canvasRefs).map(
                ([position, { canvasRef, onMouseDown }]) => {
                  const viewportSize = getViewportSize(
                    playerPosition as Position,
                    position as Position
                  );
                  const viewportOffset = getViewportOffset(
                    playerPosition as Position,
                    position as Position
                  );
                  return (
                    <div
                      key={position}
                      className={`${getPositionClasses(
                        position as Position,
                        playerPosition as Position
                      )} relative overflow-hidden`}
                      style={{
                        width: `${viewportSize.width}px`,
                        height: `${viewportSize.height}px`,
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        onMouseDown={
                          position === playerPosition ? onMouseDown : undefined
                        }
                        width={600}
                        height={500}
                        className="border  border-black rounded-md absolute"
                        style={{
                          cursor:
                            position === playerPosition ? cursor : "default",
                          left: `${-viewportOffset.x}px`,
                          top: `${-viewportOffset.y}px`,
                        }}
                      />
                    </div>
                  );
                }
              )}
            </div>

            {roomData.gameStatus !== "waiting" && (
              <div className="flex flex-col gap-10 pr-10">
                <HexColorPicker color={color} onChange={setColor} />
                <button
                  type="button"
                  className="p-2 rounded-md border border-white"
                  onClick={() => socket.emit("clear")}
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
                  onChange={(e) => setLineWidth(Number(e.target.value))}
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
            <img src={imagePreviewUrl} />
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
