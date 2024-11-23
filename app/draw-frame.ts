import * as util from './webgl_utils'

let draw: (timestamp: number) => void

/**
 * Set a canvas and return the video duration.
 * @param canvas The canvas to make frames
 * @returns The duration microseconds
 */
export async function setup(canvas: OffscreenCanvas) {
  const gl = canvas.getContext('webgl2') || (() => { throw new TypeError('WebGL is not supported') })()
  const duration = 5 * 1_000_000

  const vertices: GLfloat[] = [
    0.0, 0.0, 1.0,
    1.0, 0.0, 1.0,
    0.0, 1.0, 1.0,
  ]
  const normals: GLfloat[] = [
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
  ]
  const coords: GLfloat[] = [
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
  ]
  const params = {
    triangleLength: vertices.length,
  }
  const program = util.createProgram(gl, ...await Promise.all([
    fetch('/main.vs').then(v => v.text()).then(v => util.createShader(gl, gl.VERTEX_SHADER, v)),
    fetch('/main.fs').then(v => v.text()).then(v => v.replaceAll(/\${(.+)}/g, name => String(params[(name.match(/(?<=\${)([^}]+)(?=})/) || [''])[0] as keyof typeof params]))).then(v => util.createShader(gl, gl.FRAGMENT_SHADER, v)),
  ] as const))
  const posAttribLocation = gl.getAttribLocation(program, 'a_position')
  const resolutionUniform = gl.getUniformLocation(program, 'u_resolution')
  const matrixUniform     = gl.getUniformLocation(program, 'u_matrix')
  const alphaUniform      = gl.getUniformLocation(program, 'u_alpha')
  const fovUniform        = gl.getUniformLocation(program, 'u_fov')
  const posBuffer = util.createBuffer(gl, new Float32Array([
    -1.0, -1.0,
     3.0, -1.0,
    -1.0,  3.0,
  ]))
  const matrix = new util.Matrix4
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  const data = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, vertices.length / 3, 3, 0, gl.RGB, gl.FLOAT, new Float32Array([
    ...vertices,
    ...normals,
    ...coords,
  ]))
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, texture)

  draw = timestamp => {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(program)
    util.bindAttribute(gl, posAttribLocation, posBuffer, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
    gl.uniform1f(fovUniform, 60 * Math.PI / 180)
    gl.uniformMatrix4fv(matrixUniform, false, new Float32Array(matrix.matrix))
    for (let a = 1; a > 0.5 ** 5; a *= 0.5) {
      gl.uniform1f(alphaUniform, a)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
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
