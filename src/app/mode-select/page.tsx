"use client";

import { FC, useEffect, useState } from "react";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Caveat, Pangolin } from "next/font/google";
import Image from "next/image";
import Column from "@/components/Column";

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
      <div className="flex-grow flex items-center justify-center z-10">
        <div className="flex w-full justify-center">
          <a href="/co-paint">
          <Column
            title="Copaint"
            description="Two players drawing on a single canvas"
            imageSrc="/co-paint.png"
            color="text-red-500"
          />
          </a>
          <a href="/tag-team">
          <Column
            title="Tag-team"
            description="Draw for 30 seconds and switch canvases"
            imageSrc="/tag-team.png"
            color="text-green-500"
          />
          </a>
          <a href="kaleidoscope">
          <Column
            title="Kaleidoscope"
            description="Four canvases, four players, (almost) no peeking"
            imageSrc="/kaleidoscope.png"
            color="text-blue-600"
          />
          </a>
        </div>
        </div>


      
    </main>
  );
};

export default page;
