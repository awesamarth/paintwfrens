
type Draw = {
    ctx: CanvasRenderingContext2D
    currentPoint: Point
    prevPoint: Point | null
  }
  
  type Point = { x: number; y: number }
  
  enum Tool {
    Brush = "brush",
    Eraser = "eraser",
    FillBucket = "fillBucket"
  }