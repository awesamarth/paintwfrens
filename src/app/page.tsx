"use client";

import { FC, useEffect, useState } from "react";
import { useDraw } from "../hooks/useDraw";
import { ChromePicker } from "react-color";
import { socket } from "@/socket";
import { io } from "socket.io-client";
import { drawLine } from "@/utils/drawLine";
import { createBrushCursor } from "@/utils/cursor";
import { HexColorPicker } from "react-colorful";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Caveat, Pangolin } from "next/font/google";
import Image from "next/image";

const pangolin = Pangolin({
  subsets: ["latin"],
  weight: ["400", "400"],
  display: "block",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "400"],
  style: ["normal"],
  display: "block",
});

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
  return (
    <main className="flex items-center justify-center min-h-screen ">
      <Image
        src="/background.png"
        layout="fill"
        objectFit="cover"
        quality={100}
        className=" bg-cover contrast-125 brightness-[0.87] blur-[7px] "
        alt="Crypto Roulette rules background"
      />
      <Navbar />

      <div className="text-center z-10 w-full h-screen flex flex-col justify-center items-center   ">
        <div className=" bg-blue-100 w-[35rem] rounded-3xl p-10 drop-shadow-xl shadow-xl border-blue-400 border ">
          <h1
            className={`${pangolin.className} text-6xl font-bold mb-4 text-gray-800 hand-drawn`}
          >
            <span className="text-red-500">paint</span>
            <span className="text-green-500">w</span>
            <span className="text-blue-600 ">frens</span>
          </h1>
          <h2
            className={`${caveat.className} font-bold italic text-4xl mb-6 text-gray-600 hand-drawn`}
          >
            da Vinci who?
          </h2>
          <p
            className={`${pangolin.className} text-2xl mb-8 font-bold -mt-1 text-gray-700 max-w-2xl mx-auto hand-drawn`}
          >
            Gather friends and let your imagination flourish on the canvas. Get
            NFTs while you're at it.
          </p>
          <a href="mode-select" className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-7 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105 hand-drawn">
            <button>Start</button>
          </a>
        </div>
      </div>
    </main>
  );
};

export default page;
