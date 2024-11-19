let targetCanvas: OffscreenCanvas
let context: OffscreenCanvasRenderingContext2D

export function setup(canvas: OffscreenCanvas) {
  targetCanvas = canvas
  context = canvas.getContext('2d') || (() => { throw new TypeError('Canvas2D is not supported') })()
}

function reset() {
  if (!targetCanvas) throw new TypeError('Please setup the canvas')
  context.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
  context.reset()
}

export function drawFrame(timestamp: number) {
  reset()
  context.fillStyle = 'red'
  const size = timestamp / 10 / 1000000
  context.fillRect(size * targetCanvas.width, size * targetCanvas.height, size * targetCanvas.width, size * targetCanvas.height)
}
