/**
 * Create a shader.
 * @param gl The WebGL context.
 * @param type The type of the shader.
 * @param source The source of the shader.
 */
function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new TypeError('Shader create failed.')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (success) return shader
  const error = gl.getShaderInfoLog(shader)
  gl.deleteShader(shader)
  throw error
}

/**
 * Create a program.
 * 
 * @example
 *  const [vertexShader, fragmentShader] = await getShaderById(gl, 'example')
 *  const program = createProgram(gl, vertexShader, fragmentShader)
 * @param gl The WebGL context.
 * @param vertexShader The vertex shader.
 * @param fragmentShader The fragment shader.
 */
function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram()
  if (!program) throw new TypeError('Program create failed.')
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  const success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (success) return program
  const error = gl.getProgramInfoLog(program)
  gl.deleteProgram(program)
  throw error
}

/**
 * Create a buffer.
 * @param gl The WebGL context.
 * @param data The typed array.
 */
function createBuffer(gl: WebGLRenderingContext, data: AllowSharedBufferSource | null) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    data,
    gl.STATIC_DRAW,
  )
  return buffer
}

/**
 * Create a texture.
 * @param gl The WebGL context.
 * @param image The image.
 * @param mipmap 
 */
function createTexture(gl: WebGLRenderingContext, image: TexImageSource, mipmap?: boolean, minFilter?: GLint, magFilter?: GLint) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  if (mipmap) {
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter || gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter || gl.LINEAR)
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter || gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter || gl.LINEAR)
  }
  return texture
}

/**
 * Bind the attribute.
 * @param gl The WebGL context.
 * @param location The location of the attribute.
 * @param buffer The buffer.
 * @param size The size of vertex.
 * @param type The type of the buffer.
 * @param normalized Whether to normalize the data.
 * @param stride 
 * @param offset 
 */
function bindAttribute(gl: WebGLRenderingContext, location: number, buffer: WebGLBuffer | null, size: number, type: number, normalized: boolean, stride: number, offset: number) {
  gl.enableVertexAttribArray(location)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.vertexAttribPointer(location, size, type, normalized, stride, offset)
}

/**
 * Load uniforms.
 * @param gl The WebGL context.
 * @param program The program.
 * @param list Uniforms list.
 */
function loadUniformLocations(gl: WebGLRenderingContext, program: WebGLProgram, [...list]: string[]) {
   return Object.fromEntries(list.map((name, i) => [list[i], gl.getUniformLocation(program, name)]))
}

class Matrix4 {
  matrix
  constructor(matrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]) {
    this.matrix = matrix
  }

  applyUniform(gl: WebGLRenderingContext, location: WebGLUniformLocation | null) {
    gl.uniformMatrix4fv(location, false, this.matrix)
  }

  multiply(matrix: Matrix4) {
    const a = this.matrix
    const b = matrix.matrix
    const b00 = b[0 * 4 + 0]
    const b01 = b[0 * 4 + 1]
    const b02 = b[0 * 4 + 2]
    const b03 = b[0 * 4 + 3]
    const b10 = b[1 * 4 + 0]
    const b11 = b[1 * 4 + 1]
    const b12 = b[1 * 4 + 2]
    const b13 = b[1 * 4 + 3]
    const b20 = b[2 * 4 + 0]
    const b21 = b[2 * 4 + 1]
    const b22 = b[2 * 4 + 2]
    const b23 = b[2 * 4 + 3]
    const b30 = b[3 * 4 + 0]
    const b31 = b[3 * 4 + 1]
    const b32 = b[3 * 4 + 2]
    const b33 = b[3 * 4 + 3]
    const a00 = a[0 * 4 + 0]
    const a01 = a[0 * 4 + 1]
    const a02 = a[0 * 4 + 2]
    const a03 = a[0 * 4 + 3]
    const a10 = a[1 * 4 + 0]
    const a11 = a[1 * 4 + 1]
    const a12 = a[1 * 4 + 2]
    const a13 = a[1 * 4 + 3]
    const a20 = a[2 * 4 + 0]
    const a21 = a[2 * 4 + 1]
    const a22 = a[2 * 4 + 2]
    const a23 = a[2 * 4 + 3]
    const a30 = a[3 * 4 + 0]
    const a31 = a[3 * 4 + 1]
    const a32 = a[3 * 4 + 2]
    const a33 = a[3 * 4 + 3]
    return new Matrix4([
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ])
  }

  multiplyPoint(point: [number, number, number, number]): [number, number, number, number] {
    const a = this.matrix
    const [p0, p1, p2, p3] = point
    const a00 = a[0 * 4 + 0]
    const a01 = a[0 * 4 + 1]
    const a02 = a[0 * 4 + 2]
    const a03 = a[0 * 4 + 3]
    const a10 = a[1 * 4 + 0]
    const a11 = a[1 * 4 + 1]
    const a12 = a[1 * 4 + 2]
    const a13 = a[1 * 4 + 3]
    const a20 = a[2 * 4 + 0]
    const a21 = a[2 * 4 + 1]
    const a22 = a[2 * 4 + 2]
    const a23 = a[2 * 4 + 3]
    const a30 = a[3 * 4 + 0]
    const a31 = a[3 * 4 + 1]
    const a32 = a[3 * 4 + 2]
    const a33 = a[3 * 4 + 3]
    return [
      p0 * a00 + p1 * a10 + p2 * a20 + p3 * a30,
      p0 * a01 + p1 * a11 + p2 * a21 + p3 * a31,
      p0 * a02 + p1 * a12 + p2 * a22 + p3 * a32,
      p0 * a03 + p1 * a13 + p2 * a23 + p3 * a33,
    ]
  }

  inverse() {
    const m = this.matrix
    const m00 = m[0 * 4 + 0]
    const m01 = m[0 * 4 + 1]
    const m02 = m[0 * 4 + 2]
    const m03 = m[0 * 4 + 3]
    const m10 = m[1 * 4 + 0]
    const m11 = m[1 * 4 + 1]
    const m12 = m[1 * 4 + 2]
    const m13 = m[1 * 4 + 3]
    const m20 = m[2 * 4 + 0]
    const m21 = m[2 * 4 + 1]
    const m22 = m[2 * 4 + 2]
    const m23 = m[2 * 4 + 3]
    const m30 = m[3 * 4 + 0]
    const m31 = m[3 * 4 + 1]
    const m32 = m[3 * 4 + 2]
    const m33 = m[3 * 4 + 3]
    const tmp_0  = m22 * m33
    const tmp_1  = m32 * m23
    const tmp_2  = m12 * m33
    const tmp_3  = m32 * m13
    const tmp_4  = m12 * m23
    const tmp_5  = m22 * m13
    const tmp_6  = m02 * m33
    const tmp_7  = m32 * m03
    const tmp_8  = m02 * m23
    const tmp_9  = m22 * m03
    const tmp_10 = m02 * m13
    const tmp_11 = m12 * m03
    const tmp_12 = m20 * m31
    const tmp_13 = m30 * m21
    const tmp_14 = m10 * m31
    const tmp_15 = m30 * m11
    const tmp_16 = m10 * m21
    const tmp_17 = m20 * m11
    const tmp_18 = m00 * m31
    const tmp_19 = m30 * m01
    const tmp_20 = m00 * m21
    const tmp_21 = m20 * m01
    const tmp_22 = m00 * m11
    const tmp_23 = m10 * m01
  
    const t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31)
    const t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31)
    const t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31)
    const t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21)
  
    const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3)
  
    return new Matrix4([
      d * t0,
      d * t1,
      d * t2,
      d * t3,
      d * ((tmp_1  * m10 + tmp_2  * m20 + tmp_5  * m30) - (tmp_0  * m10 + tmp_3  * m20 + tmp_4  * m30)),
      d * ((tmp_0  * m00 + tmp_7  * m20 + tmp_8  * m30) - (tmp_1  * m00 + tmp_6  * m20 + tmp_9  * m30)),
      d * ((tmp_3  * m00 + tmp_6  * m10 + tmp_11 * m30) - (tmp_2  * m00 + tmp_7  * m10 + tmp_10 * m30)),
      d * ((tmp_4  * m00 + tmp_9  * m10 + tmp_10 * m20) - (tmp_5  * m00 + tmp_8  * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
    ])
  }

  translate(x: number, y: number, z: number) {
    return this.multiply(new Matrix4([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1,
    ]))
  }

  rotateX(rad: number) {
    const c = Math.cos(rad), s = Math.sin(rad)
    return this.multiply(new Matrix4([
      1, 0, 0, 0,
      0, c, s, 0,
      0,-s, c, 0,
      0, 0, 0, 1,
    ]))
  }

  rotateY(rad: number) {
    const c = Math.cos(rad), s = Math.sin(rad)
    return this.multiply(new Matrix4([
      c, 0,-s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ]))
  }

  rotateZ(rad: number) {
    const c = Math.cos(rad), s = Math.sin(rad)
    return this.multiply(new Matrix4([
      c, s, 0, 0,
       -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]))
  }

  scale(x: number, y: number, z: number) {
    return this.multiply(new Matrix4([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1,
    ]))
  }

  static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number) {
    return new this([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, 2 / (near - far), 0,
      (left + right) / (left - right), (bottom + top) / (bottom - top), (near + far) / (near - far), 1,
    ])
  }

  static perspective(fov: number, aspect: number, near: number, far: number) {
    const f = Math.tan((Math.PI - fov) / 2)
    const rangeInv = 1 / (near - far)
    return new this([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0,
    ])
  }

  static frustum(left: number, right: number, bottom: number, top: number, near: number, far: number) {
    const dx = right - left, dy = top - bottom, dz = far - near
    return new this([
      2 * near / dx, 0, 0, 0,
      0, 2 * near / dy, 0, 0,
      (left + right) / dx, (top + bottom) / dy, -(far + near) / dz, -1,
      0, 0, -2 * near * far / dz, 0,
    ])
  }

  static divideByW(point: [number, number, number, number]): [number, number, number] {
    return [
      point[0] / point[3],
      point[1] / point[3],
      point[2] / point[3],
    ]
  }
}

export { createShader, createProgram, createBuffer, createTexture, bindAttribute, loadUniformLocations, Matrix4 }
