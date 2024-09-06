type DrawLineProps = Draw & {
  color: string
  lineWidth: number
}

export const drawLine = ({ prevPoint, currentPoint, ctx, color, lineWidth }: DrawLineProps) => {
  const { x: currX, y: currY } = currentPoint
  const lineColor = color

  ctx.strokeStyle = lineColor
  ctx.fillStyle = lineColor
  ctx.lineWidth = lineWidth

  ctx.beginPath()
  ctx.arc(currX, currY, lineWidth / 2, 0, Math.PI * 2)
  ctx.fill()

  if (prevPoint) {
    // Draw line
    ctx.beginPath()
    ctx.moveTo(prevPoint.x, prevPoint.y)
    ctx.lineTo(currX, currY)
    ctx.stroke()

    // Fill in gaps with circles
    const distance = Math.sqrt(Math.pow(currX - prevPoint.x, 2) + Math.pow(currY - prevPoint.y, 2))
    const steps = Math.max(Math.floor(distance / (lineWidth / 4)), 1)
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const x = prevPoint.x + (currX - prevPoint.x) * t
      const y = prevPoint.y + (currY - prevPoint.y) * t
      ctx.beginPath()
      ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}