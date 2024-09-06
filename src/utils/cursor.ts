export function createBrushCursor(size: number, color: string): string {
    const cursorCanvas = document.createElement('canvas');
    // Make the canvas larger for better resolution
    const scale = 1.5;
    cursorCanvas.width = Math.max(size * scale, 2); // Ensure minimum size of 2
    cursorCanvas.height = Math.max(size * scale, 2);
    const ctx = cursorCanvas.getContext('2d');
    if (!ctx) return 'crosshair'; // fallback cursor

    // Scale everything up
    ctx.scale(scale, scale);

    // Calculate radius, ensuring it's at least 0.5
    const radius = Math.max(size / 2 - 0.5, 0.5);

    // Draw the circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Optional: add a subtle stroke for better visibility
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.5 / scale; // Thin line
    ctx.stroke();

    return `url(${cursorCanvas.toDataURL()}) ${cursorCanvas.width / 2} ${cursorCanvas.height / 2}, auto`;
}