export function floodFill(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const targetColor = getPixelColor(imageData, x, y);
  
    console.log("Target color:", targetColor);
  
    if (!targetColor || colorMatch(targetColor, hexToRgb(fillColor))) return;
  
    const pixelsToCheck = [{x, y}];
  
    while (pixelsToCheck.length > 0) {
      const pixel = pixelsToCheck.pop()!;
      const currentColor = getPixelColor(imageData, pixel.x, pixel.y);
      console.log("Current color:", currentColor, "at", pixel.x, pixel.y);
  
      if (currentColor && colorMatch(currentColor, targetColor)) {
        setPixelColor(imageData, pixel.x, pixel.y, hexToRgb(fillColor));
  
        pixelsToCheck.push({x: pixel.x + 1, y: pixel.y});
        pixelsToCheck.push({x: pixel.x - 1, y: pixel.y});
        pixelsToCheck.push({x: pixel.x, y: pixel.y + 1});
        pixelsToCheck.push({x: pixel.x, y: pixel.y - 1});
      }
    }
  
    ctx.putImageData(imageData, 0, 0);
  }
  
  function getPixelColor(imageData: ImageData, x: number, y: number) {
    if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
      console.log('Out of bounds:', x, y);
      return null;
    }
    const index = (y * imageData.width + x) * 4;
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3]
    };
  }
  
  function setPixelColor(imageData: ImageData, x: number, y: number, color: {r: number, g: number, b: number}) {
    const index = (y * imageData.width + x) * 4;
    imageData.data[index] = color.r;
    imageData.data[index + 1] = color.g;
    imageData.data[index + 2] = color.b;
    imageData.data[index + 3] = 255;
  }
  
  function colorMatch(color1: {r: number, g: number, b: number, a: number}, color2: {r: number, g: number, b: number}, tolerance = 10) {
    return Math.abs(color1.r - color2.r) <= tolerance &&
           Math.abs(color1.g - color2.g) <= tolerance &&
           Math.abs(color1.b - color2.b) <= tolerance;
  }
  
  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  }