#version 300 es
#define PI 3.1415927

precision lowp float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 color;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy * 2.0 - 1.0;
  uv.y /= u_resolution.x / u_resolution.y;

  float spiral = mod(log2(length(uv)) - u_time*PI - atan(uv.x, uv.y), 2.0*PI) < PI ? 1.0 : 0.0;
  color = vec4(spiral, spiral, spiral, 1.0);
}
