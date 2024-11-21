let targetCanvas: OffscreenCanvas
let context: OffscreenCanvasRenderingContext2D

/**
 * Set a canvas and return the video duration.
 * @param canvas The canvas to make frames
 * @returns The duration microseconds
 */
export function setup(canvas: OffscreenCanvas) {
  targetCanvas = canvas
  context = canvas.getContext('2d') || (() => { throw new TypeError('Canvas2D is not supported') })()
  return BigInt('5') * BigInt('1000000') // duration (microseconds)
}

function reset() {
  if (!targetCanvas) throw new TypeError('Please setup the canvas')
  context.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
  context.reset()
}

/**
 * Draw a frame to setted canvas.
 * @param timestamp A timestamp microseconds
 */
export function drawFrame(timestamp: number) {
  reset()
  context.fillStyle = 'white'
  context.fillRect(0, 0, targetCanvas.width, targetCanvas.height)
}
