#define triangleLength ${triangleLength}
#define PI 3.1415927
#define REFLECTION 16

precision highp float;
struct TriangleInfo {
  vec4 color;
  float blur;
  float refraction;
};
struct Ray {
  vec3 pos;
  vec3 vec;
};
uniform sampler2D u_texture;
uniform float u_alpha;
uniform float u_fov;
uniform vec2 u_resolution;
uniform mat4 u_matrix;
uniform vec3 u_vertices[triangleLength];
uniform vec3 u_normals[triangleLength];
uniform vec3 u_coords[triangleLength];

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

TriangleInfo color(int i) {
  vec3 v1 = u_vertices[i * 3 + 0];
  vec3 v2 = u_vertices[i * 3 + 1];
  vec3 v3 = u_vertices[i * 3 + 2];
  return {
    vec4()
  };
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
  float x1 = p1.x;
  float y1 = p1.y;
  float z1 = p1.z;
  float d = (a * dx + b * dy + c * dz);
  p.x = (v.x * (b*dy + c*dz) - (b*y + c*z + d)*v.dx)/d;
  p.y = (v.y * (c*dz + a*dx) - (c*z + a*x + d)*v.dy)/d;
  p.z = (v.z * (a*dx + b*dy) - (a*x + b*y + d)*v.dz)/d;
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

float map(float x, float imin, float imax, float omin, float omax) {
  return omin + (x - imin) * (omax - omin) / (imax - imin);
}

vec3 interpolation(vec3 v1, vec3 v2, vec3 v3, vec3 n1, vec3 n2, vec3 n3, vec3 p) {
  int l0 = inRange()
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution * 2.0 - 1.0;
  uv *= u_fov / 2.0;
  uv.y /= u_resolution.x / u_resolution.y;

  vec3 rayVector = vec3(tan(uv.x), tan(uv.y), 1.0);
  if (uv.x > PI/2.0 || uv.y > PI/2.0) {
    uv.z = -1.0;
    if (uv.x > PI/2.0) uv.x *= -1.0;
    if (uv.y > PI/2.0) uv.y *= -1.0;
  }
  Ray ray = {
    u_matrix * vec4(0.0, 0.0, 0.0, 1.0),
    u_matrix * vec4(rayVector, 1.0),
  };
  for (int i = 0; i < triangleLength; i++) {
    for (int j = 0; j < REFLECTION; j++) {
      vec3 v1 = u_vertices[i * 3 + 0];
      vec3 v2 = u_vertices[i * 3 + 1];
      vec3 v3 = u_vertices[i * 3 + 2];
      vec3 n1 = u_normals[i * 3 + 0];
      vec3 n2 = u_normals[i * 3 + 1];
      vec3 n3 = u_normals[i * 3 + 2];
      vec3 p  = hitTrianglePoint(v1, v2, v3, ray.pos, ray.vec);
      if (!isHitTriangle(v1, v2, v3, p)) break;
      TriangleInfo info = color(i);
      vec3 normal = normalize(vec3(interpolation(v1, v2, v3, n1, n2, n3, p)));

    }
  }

  gl_FragColor.rgb *= gl_FragColor.a;
}
