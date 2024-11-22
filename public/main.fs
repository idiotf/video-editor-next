precision highp float;
uniform vec2 u_resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution * 2.0 - 1.0;
  uv.y /= u_resolution.x / u_resolution.y;
  gl_FragColor = vec4(uv, 0.0, 1.0) * 0.1;
}
