import { Caveat, Pangolin } from "next/font/google";
import Image from "next/image"
import { FC } from "react";

interface ColumnProps {
    title: string;
    description: string;
    imageSrc: string;
    color:string;
}

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
  

export default function Column({ title, description, imageSrc, color }: ColumnProps): JSX.Element {
    return (
        <div className="flex-1 flex justify-center  items-center p-4">
            <div className="text-center max-w-sm bg-blue-100 w-[35rem] hover:cursor-pointer hover:scale-105 transition-all rounded-3xl p-10 drop-shadow-xl shadow-xl border-blue-400 border">
                
                <div className="h-60 flex items-center justify-center">
                    <Image
                    src={imageSrc}
                    width={300}
                    height={200}
                    alt={title}
                    className={`${imageSrc==="/kaleidoscope.png"?"object-contain":"object-cover"} ${imageSrc==="/co-paint.png"&&"h-64 object-scale-down"} h-48 grayscale  rounded-lg`}
                />
                </div>
                <h2 className={`mt-4 text-4xl font-bold ${color} ${pangolin.className}  `}>{title}</h2>
                <p className={`mt-2 text-xl text-black `}>{description}</p>
            </div>
        </div>
    );
}