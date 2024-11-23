#version 300 es
#define triangleLength ${triangleLength}
#define PI 3.1415927
#define REFLECTION 16

precision highp float;
out vec4 rayCol;
struct TriangleInfo {
  vec4 color;
  float blur;
  float refraction;
  bool light;
};
struct Ray {
  vec3 pos;
  vec3 vec;
  float refractive;
};
uniform sampler2D u_texture;
uniform sampler2D u_data;
uniform float u_alpha;
uniform float u_fov;
uniform vec2 u_resolution;
uniform mat4 u_matrix;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

TriangleInfo color(const int i) {
  vec3 v1 = texelFetch(u_data, ivec2(i * 3 + 0, 0), 0).xyz;
  vec3 v2 = texelFetch(u_data, ivec2(i * 3 + 1, 0), 0).xyz;
  vec3 v3 = texelFetch(u_data, ivec2(i * 3 + 2, 0), 0).xyz;
  TriangleInfo info;
  info.color = vec4(1.0);
  info.light = true;
  return info;
}

vec3 hitTrianglePoint(vec3 v1, vec3 v2, vec3 v3, vec3 p1, vec3 p2) {
  vec3 p;
  float a = v1.y*(v2.z - v3.z) + v2.y*(v3.z - v1.z) + v3.y*(v1.z - v2.z);
  float b = v1.z*(v2.x - v3.x) + v2.z*(v3.x - v1.x) + v3.z*(v1.x - v2.x);
  float c = v1.x*(v2.y - v3.y) + v2.x*(v3.y - v1.y) + v3.x*(v1.y - v2.y);
  float d = -(v1.x * (v2.y*v3.z - v3.y*p2.z) + v2.x * (v3.y*v1.z - v1.y*v3.z) + v3.x * (v1.y*v2.z - v2.y*v1.z));
  float dx = p2.x - p1.x;
  float dy = p2.y - p1.y;
  float dz = p2.z - p1.z;
  float x = p1.x;
  float y = p1.y;
  float z = p1.z;
  float div = (a * dx + b * dy + c * dz);
  p.x = (x * (b*dy + c*dz) - (b*y + c*z + d)*dx)/div;
  p.y = (y * (c*dz + a*dx) - (c*z + a*x + d)*dy)/div;
  p.z = (z * (a*dx + b*dy) - (a*x + b*y + d)*dz)/div;
  return p;
}

bool checkHitTriangle(vec3 ab, vec3 ac, vec3 at) {
  return dot(cross(ab, at), cross(at, ac)) > 0.0;
}

bool isHitTriangle(vec3 v1, vec3 v2, vec3 v3, vec3 p) {
  if (!checkHitTriangle(v2 - v1, v3 - v1, p - v1)) return false;
  if (!checkHitTriangle(v1 - v2, v3 - v2, p - v2)) return false;
  if (!checkHitTriangle(v1 - v3, v2 - v3, p - v3)) return false;
  return true;
}

bool inRange(float x, float a, float b) {
  return a <= x && x <= b || b <= x && x <= a;
}

vec3 map(float x, float imin, float imax, vec3 omin, vec3 omax) {
  return omin + (omax - omin) * (x - imin) / (imax - imin);
}

vec3 interpolation(vec3 v1, vec3 v2, vec3 v3, vec3 n1, vec3 n2, vec3 n3, vec3 p) {
  int l1 = inRange(p.y, v1.y, v2.y)
     ? 1 : inRange(p.y, v2.y, v3.y)
     ? 2 : 3;
  int l2 = inRange(p.y, v1.y, v2.y) && l1 != 1
     ? 1 : inRange(p.y, v2.y, v3.y) && l1 != 2
     ? 2 : 3;
  vec3 l1p1 = l1 == 1
       ? v1 : l1 == 2
       ? v2 : v3;
  vec3 l1p2 = l1 == 1
       ? v2 : l1 == 2
       ? v3 : v1;
  vec3 l2p1 = l2 == 1
       ? v1 : l2 == 2
       ? v2 : v3;
  vec3 l2p2 = l2 == 1
       ? v2 : l2 == 2
       ? v3 : v1;
  vec3 l1n1 = l1 == 1
       ? n1 : l1 == 2
       ? n2 : n3;
  vec3 l1n2 = l1 == 1
       ? n2 : l1 == 2
       ? n3 : n1;
  vec3 l2n1 = l2 == 1
       ? n1 : l2 == 2
       ? n2 : n3;
  vec3 l2n2 = l2 == 1
       ? n2 : l2 == 2
       ? n3 : n1;
  vec3 l1n = map(p.y, l1p1.y, l1p2.y, l1n1, l1n2);
  vec3 l2n = map(p.y, l2p1.y, l2p2.y, l2n1, l2n2);
  vec3 l1p = map(p.y, l1p1.y, l1p2.y, l1p1, l1p2);
  vec3 l2p = map(p.y, l2p1.y, l2p2.y, l2p1, l2p2);
  float d = distance(l2p, l1p);
  float d1 = distance(l1p, p);
  float d2 = distance(l2p, p);
  return (d1 * l2n + d2 * l1n) / d;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution * 2.0 - 1.0;
  uv *= u_fov / 2.0;
  uv.y /= u_resolution.x / u_resolution.y;

  vec3 rayVector = vec3(tan(uv.x), tan(uv.y), 1.0);
  if (rayVector.x > PI/2.0 || rayVector.y > PI/2.0) {
    rayVector.z = -1.0;
    if (rayVector.x > PI/2.0) rayVector.x *= -1.0;
    if (rayVector.y > PI/2.0) rayVector.y *= -1.0;
  }
  Ray ray;
  ray.pos = vec3(u_matrix * vec4(0.0, 0.0, 0.0, 1.0));
  ray.vec = vec3(u_matrix * vec4(rayVector, 1.0));
  rayCol = vec4(1.0, 1.0, 1.0, u_alpha);
  for (int i = 0; i < triangleLength; i += 3) {
    for (int j = 0; j >= 0; j++) {
      if (j < REFLECTION) {
        rayCol.rgb = vec3(0.0);
        break;
      }
      vec3 v1 = texelFetch(u_data, ivec2(i * 3 + 0, 0), 0).xyz;
      vec3 v2 = texelFetch(u_data, ivec2(i * 3 + 1, 0), 0).xyz;
      vec3 v3 = texelFetch(u_data, ivec2(i * 3 + 2, 0), 0).xyz;
      vec3 n1 = texelFetch(u_data, ivec2(i * 3 + 0, 1), 0).xyz;
      vec3 n2 = texelFetch(u_data, ivec2(i * 3 + 1, 1), 0).xyz;
      vec3 n3 = texelFetch(u_data, ivec2(i * 3 + 2, 1), 0).xyz;
      vec3 p = hitTrianglePoint(v1, v2, v3, ray.pos, ray.vec);
      if (!isHitTriangle(v1, v2, v3, p)) {
        rayCol.rgb = vec3(0.0);
        break;
      }
      TriangleInfo info = color(i);
      rayCol.rgb *= info.color.rgb;
      if (info.light) break;
      vec3 normal = normalize(vec3(interpolation(v1, v2, v3, n1, n2, n3, p)));
      bool isRefract = rand(vec2(rand(uv), rand(p.xy))) < info.color.a;
      if (isRefract) ray.vec = refract(normalize(p - ray.pos), normal, info.refraction);
      else ray.vec = reflect(normalize(p - ray.pos), normal);
      ray.pos = p;
    }
  }

  rayCol.rgb *= rayCol.a;
}
