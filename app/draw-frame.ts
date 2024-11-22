import * as util from './webgl_utils'

let draw: (timestamp: number) => void

/**
 * Set a canvas and return the video duration.
 * @param canvas The canvas to make frames
 * @returns The duration microseconds
 */
export async function setup(canvas: OffscreenCanvas) {
  const gl = canvas.getContext('webgl') || (() => { throw new TypeError('WebGL is not supported') })()
  const duration = 5 * 1_000_000

  const program = util.createProgram(gl, ...await Promise.all([
    fetch('/main.vs').then(v => v.text()).then(v => util.createShader(gl, gl.VERTEX_SHADER, v)),
    fetch('/main.fs').then(v => v.text()).then(v => util.createShader(gl, gl.FRAGMENT_SHADER, v)),
  ] as const))
  const posAttribLocation = gl.getAttribLocation(program, 'a_position')
  const resolutionUniform = gl.getUniformLocation(program, 'u_resolution')
  const posBuffer = util.createBuffer(gl, new Float32Array([
    -1.0, -1.0,
     3.0, -1.0,
    -1.0,  3.0,
  ]))
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)

  draw = timestamp => {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(program)
    util.bindAttribute(gl, posAttribLocation, posBuffer, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
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
