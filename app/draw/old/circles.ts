let draw: (timestamp: number) => void

/**
 * Set a canvas and return the video duration.
 * @param canvas The canvas to make frames
 * @returns The duration microseconds
 */
export async function setup(canvas: OffscreenCanvas) {
  const context = canvas.getContext('2d') || (() => { throw new TypeError('Canvas2D is not supported') })()
  const duration = 5 * 1_000_000

  function arc(x: number, y: number, r: number) {
    context.beginPath()
    context.arc(x, y, r, 0, Math.PI*2)
    context.fill()
  }

  draw = (timestamp: number) => {
    context.reset()
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate((timestamp * 360 / 5_000_000) * Math.PI / 180)
    const scale = 1 + (0 - 1) / Math.exp(30 / 10 * (timestamp > 2_500_000 ? 5_000_000 - timestamp : timestamp) / 1_000_000)
    context.scale(scale, scale)
    for (let i = 0; i < 7; i++) {
      context.fillStyle = `hsl(${i * 360 / 7}deg 100% 50%)`
      arc(0, -300, 50)
      context.rotate(Math.PI * 2 / 7)
    }
  }
  return duration
}

/**
 * Draw a frame to setted canvas.
 * @param timestamp A timestamp microseconds
 */
export function drawFrame(timestamp: number) {
  if (!draw) throw new TypeError('Please setup the canvas')
  draw(timestamp)
}
