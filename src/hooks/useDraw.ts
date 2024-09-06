import { useEffect, useRef, useState } from "react";
import { floodFill } from "@/utils/floodFill";
enum Tool {
  Brush = "brush",
  Eraser = "eraser",
  FillBucket = "fillBucket",
}

export const useDraw = ({
  onDraw,
  currentTool,
  color,
}: {
  onDraw: ({ ctx, currentPoint, prevPoint }: Draw) => void;
  currentTool: Tool;
  color: string;
}) => {

  const [mouseDown, setMouseDown] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevPoint = useRef<null | Point>(null);

  const computePointInCanvas = (
    e: MouseEvent | React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return { x, y };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentPoint = computePointInCanvas(e);
    if (!currentPoint) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (currentTool === Tool.FillBucket) {
        console.log(ctx, currentPoint)
      floodFill(ctx, currentPoint.x, currentPoint.y, color);
      // You might want to emit this event from your page component instead
      // socket.emit('fill-bucket', { x: currentPoint.x, y: currentPoint.y, color });
    } else {
      setMouseDown(true);
      onDraw({ ctx, currentPoint, prevPoint: null });
      prevPoint.current = currentPoint;
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!mouseDown || currentTool === "fillBucket") return;
      const currentPoint = computePointInCanvas(e);

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !currentPoint) return;

      onDraw({ ctx, currentPoint, prevPoint: prevPoint.current });
      prevPoint.current = currentPoint;
    };

    const mouseUpHandler = () => {
      setMouseDown(false);
      prevPoint.current = null;
    };

    // Add event listeners
    canvasRef.current?.addEventListener("mousemove", handler);
    window.addEventListener("mouseup", mouseUpHandler);

    // Remove event listeners
    return () => {
      canvasRef.current?.removeEventListener("mousemove", handler);
      window.removeEventListener("mouseup", mouseUpHandler);
    };
  }, [onDraw, mouseDown, currentTool]);

  return { canvasRef, onMouseDown, clear };
};
