import * as util from '@/app/draw/util'
import vertexShader from '@/app/draw/shaders/main.vs'
import textureShader from '@/app/draw/shaders/main.fs'
import fragmentShader from '@/app/draw/shaders/spiral.fs'

let draw: (timestamp: number) => void
function error(error: unknown): never {
  throw error
}

/**
 * Set a canvas and return the video duration.
 * @param canvas The canvas to make frames
 * @returns The duration microseconds
 */
export async function setup(canvas: OffscreenCanvas) {
  const gl = canvas.getContext('webgl2') || error(new TypeError('WebGL is not supported'))
  const duration = 2 * 1_000_000

  const shaders = [
    util.createShader(gl, gl.VERTEX_SHADER, vertexShader),
    util.createShader(gl, gl.FRAGMENT_SHADER, textureShader),
    util.createShader(gl, gl.FRAGMENT_SHADER, fragmentShader),
  ] as const
  const textureProgram = util.createProgram(gl, shaders[0], shaders[1])
  const program = util.createProgram(gl, shaders[0], shaders[2])

  const locations = {
    a_position: gl.getAttribLocation(program, 'a_position'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_time: gl.getUniformLocation(program, 'u_time'),
  }
  const textureLocations = {
    a_position: gl.getAttribLocation(textureProgram, 'a_position'),
    u_resolution: gl.getUniformLocation(textureProgram, 'u_resolution'),
    u_alpha: gl.getUniformLocation(textureProgram, 'u_alpha'),
  }
  const buffers: {
    [k in keyof typeof locations]?: WebGLBuffer | null
  } = {
    a_position: util.createBuffer(gl, new Float32Array([
      -1.0, -1.0,
       3.0, -1.0,
      -1.0,  3.0,
    ])),
  }

  const samples = Math.sqrt(4)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width * samples, canvas.height * samples, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  const frameBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  draw = (timestamp: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    gl.viewport(0, 0, canvas.width * samples, canvas.height * samples)
    gl.useProgram(program)
  
    util.bindAttribute(gl, locations.a_position, buffers.a_position || null, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(locations.u_resolution, canvas.width * samples, canvas.height * samples)
    gl.uniform1f(locations.u_time, timestamp / 1_000_000)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(textureProgram)

    util.bindAttribute(gl, textureLocations.a_position, buffers.a_position || null, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(textureLocations.u_resolution, canvas.width, canvas.height)
    gl.uniform1f(textureLocations.u_alpha, 1)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.generateMipmap(gl.TEXTURE_2D)
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
