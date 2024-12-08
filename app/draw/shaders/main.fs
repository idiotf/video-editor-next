#version 300 es

precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_alpha;
out vec4 color;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  color = texture(u_texture, uv) * u_alpha;
}
