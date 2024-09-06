import dotenv from "dotenv";
dotenv.config();
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

// Define the type for room data
interface RoomData {
  gameStatus: string;
  playersArray: string[];
  finalImages:string[]
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT) || undefined;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const allRoomsMap: Record<string, RoomData> = {};

  type Point = { x: number; y: number };

  type DrawLine = {
    prevPoint: Point | null;
    currentPoint: Point;
    color: string;
    lineWidth: number;
  };

  function startInitialCountdown(roomId: string) {
    let count = 2;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        io.to(roomId).emit('counting-down', count);
        count--;
      } else {
        clearInterval(countdownInterval);
        allRoomsMap[roomId].gameStatus="started"
        io.to(roomId).emit('start-game', allRoomsMap[roomId]);
        startGameCountdown(roomId)
        // Here you can add logic to start the game
      }
    }, 1000);
  }

  function startGameCountdown(roomId: string) {
    let count = 9;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        io.to(roomId).emit('timer-running', count);
        count--;
      } else {
        clearInterval(countdownInterval);
        allRoomsMap[roomId].gameStatus="ended"
        endGame(roomId)
        // Here you can add logic to start the game
      }
    }, 1000);
  }

  function endGame(roomId:string){

    io.to(roomId).emit('end-game', allRoomsMap[roomId]);
    if (allRoomsMap[roomId].playersArray.length===4){
      
    }

  }

  io.on("connection", (socket) => {
    console.log("connection established");

    socket.on("join-room", ({ userId, roomId, numberOfPlayers }) => {
      console.log("room id is: ", roomId);
      socket.to(roomId).emit("get-canvas-state");
      console.log(userId, " is trying to join");
      let clientsInRoom = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      console.log("clients in room rn are: ", clientsInRoom);
      if (clientsInRoom === numberOfPlayers) {
        return console.log("max capacity reached");
      } else {
        socket.join(roomId);
        socket.data.roomId = roomId;
        let roomData = allRoomsMap[roomId];
        if (!roomData) {
          roomData = {
            gameStatus: "waiting",
            playersArray: [],
            finalImages:[]
            
          };
        }
        roomData.playersArray.push(userId);
        allRoomsMap[roomId] = roomData;

        const positions = ['TL', 'TR', 'BL', 'BR'];
        const playerPosition = positions[roomData.playersArray.length - 1];
        socket.emit("assign-position", playerPosition);
        console.log(roomData);
        console.log("allrooms: ", allRoomsMap);
        io.in(roomId).emit("player-joined", roomData);

        clientsInRoom = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        if (clientsInRoom == numberOfPlayers) {
          allRoomsMap[roomId].gameStatus="counting-down";
          io.in(roomId).emit("start-countdown", allRoomsMap[roomId]);
          console.log("room data is: ", roomData)
          startInitialCountdown(roomId);


        }
      }
    });

    socket.on("canvas-state", ({ state, roomId }) => {
      console.log("received canvas state");
      socket.to(roomId).emit("canvas-state-from-server", state);
    });

    socket.on("kaleidoscope-canvas-state", ({state, roomId, position}) => {
      socket.to(roomId).emit("update-partial-canvas", {state, position});
    });

    socket.on("end-result", ({state, roomId, playerPosition})=>{
      console.log(playerPosition)
      allRoomsMap[roomId].finalImages.push(state)
      socket.emit("final-render", allRoomsMap[roomId].finalImages)



    })


    socket.on(
      "draw-line",
      ({
        prevPoint,
        currentPoint,
        color,
        lineWidth,
        roomId,
      }: DrawLine & { roomId: string }) => {
        console.log("reaching here too")
        console.log(roomId)
        socket.to(roomId).emit("draw-line", {
          prevPoint,
          currentPoint,
          color,
          lineWidth,
        });
      }
    );

    socket.on("clear", () => io.emit("clear"));

    socket.on("disconnect", (reason) => {
      console.log("someone disconnected");
      const clientsInRoom =
        io.sockets.adapter.rooms.get(socket.data.roomId)?.size || 0;
      if (clientsInRoom === 0) {
        console.log("all players have left the room");
        delete allRoomsMap[socket.data.roomId];
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
