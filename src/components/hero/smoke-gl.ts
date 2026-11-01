/**
 * The hero photograph rendered through smoke: it condenses out of a dark red haze on load, then only
 * breathes. Plain WebGL 1: one oversized triangle and one fragment shader, no libraries.
 */

const VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  // y runs down, like the image and the page
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const PHOTO_FRAG = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;

uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uPos;
uniform float uZoom;
uniform float uDrop;
uniform vec4 uHead;
uniform float uTime;
uniform float uReveal;
uniform float uLoaded;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// object-fit: cover at uZoom, dropped uDrop of the frame, the same crop as coverRect() in frame.ts. The strip
// the drop opens above the photo reads it mirrored, so there's no seam.
vec2 cover(vec2 uv) {
  float sr = uRes.x / uRes.y;
  float ir = uImg.x / uImg.y;
  vec2 s = (sr > ir ? vec2(1.0, ir / sr) : vec2(sr / ir, 1.0)) / uZoom;
  vec2 iuv = uPos + (uv - vec2(0.0, uDrop) - uPos) * s;
  return vec2(iuv.x, abs(iuv.y));
}

void main() {
  vec2 uv = vUv;
  float t = uTime;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.2;

  // the field rises: as time passes we read it from further down
  vec2 rise = vec2(0.0, t * 0.04);
  vec2 q = vec2(fbm(p + rise), fbm(p + rise + vec2(5.2, 1.3)));
  vec2 r = vec2(
    fbm(p + 3.0 * q + vec2(1.7, 9.2) + rise * 1.6),
    fbm(p + 3.0 * q + vec2(8.3, 2.8) + rise * 1.6)
  );
  float dens = fbm(p * 1.3 + 2.6 * r + rise * 2.2);

  vec2 iuv = cover(uv);
  // his head holds perfectly still once settled, so the title can sit behind it
  float head = 1.0 - smoothstep(0.85, 1.3, length((iuv - uHead.xy) / uHead.zw));

  // shadows, the lower frame and the far edges give way to smoke
  vec3 src = texture2D(uTex, iuv).rgb;
  float shadow = 1.0 - smoothstep(0.06, 0.3, luma(src));
  float low = smoothstep(0.55, 1.0, uv.y);
  float side = smoothstep(0.32, 0.5, abs(uv.x - 0.5));
  float zone = clamp(0.12 + shadow * 0.55 + low * 0.45 + side * 0.25, 0.0, 1.0);

  // before the reveal everything is smoke. Settled, it only breathes, and his head holds dead still
  // so the title stays cut around it.
  float stir = 6.0 * pow(1.0 - uReveal, 2.0);
  float hold = 1.0 - head * (1.0 - smoothstep(0.0, 0.25, stir));
  float amt = (0.0004 + 0.006 * zone + (0.002 + 0.022 * zone) * stir) * hold;
  vec2 off = (r - 0.5) * 2.0 * amt;
  float smear = (0.008 + 0.022 * stir) * zone * hold;

  // long exposure: colour trails upward out of the shadows
  vec3 col = vec3(0.0);
  float ws = 0.0;
  for (int i = 0; i < 6; i++) {
    float k = float(i) / 5.0;
    float w = 1.0 - k * 0.62;
    vec2 o = off * (0.35 + 0.65 * k) + vec2(0.0, smear * k);
    col += texture2D(uTex, iuv + o).rgb * w;
    ws += w;
  }
  col /= ws;

  // a touch of lens fringing toward the corners
  vec2 d = uv - 0.5;
  float ca = (0.0012 + 0.005 * (1.0 - uReveal)) * dot(d, d) * 3.0;
  col.r = mix(col.r, texture2D(uTex, iuv + off * 0.6 - d * ca).r, 0.5);
  col.b = mix(col.b, texture2D(uTex, iuv + off * 0.6 + d * ca).b, 0.5);

  // halation: the brightest skin and the vest bleed a warm glow, like film
  float imgAspect = uImg.x / uImg.y;
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0472 + 0.5;
    vec2 o = vec2(cos(a) / imgAspect, sin(a)) * 0.014;
    vec3 s = texture2D(uTex, iuv + off + o).rgb;
    glow += s * smoothstep(0.55, 0.95, luma(s));
  }
  col += (glow / 6.0) * vec3(1.0, 0.42, 0.18) * 0.3;

  // grade: the wall faded from loud to soft, like an old print. Colour out, blacks lifted to a matte,
  // a gentle film curve, and a warm paper cast over everything. Toward the right the red comes back,
  // deeper below the top band, which keeps its faded tone.
  float l = luma(col);
  float warm = smoothstep(0.42, 1.0, uv.x) * mix(0.35, 1.0, smoothstep(0.05, 0.4, uv.y));
  col = mix(vec3(l), col, mix(0.62, 0.92, warm));
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.2);
  col = mix(vec3(0.075, 0.05, 0.048), vec3(0.93, 0.88, 0.84), col);
  col *= mix(vec3(1.0, 0.97, 0.95), vec3(1.04, 0.86, 0.82), warm);

  // ember smoke laid over the frame
  vec3 tint = mix(vec3(1.0, 0.45, 0.2), vec3(1.0, 0.86, 0.72), smoothstep(0.62, 0.9, dens));
  float wisp = smoothstep(0.52, 0.86, dens) * (0.25 + zone * 0.75) * (1.0 - head * 0.7);
  float wispAmt = mix(0.06, 0.18, 1.0 - uReveal);
  col = 1.0 - (1.0 - col) * (1.0 - tint * wisp * wispAmt);

  // condense out of smoke, the face first
  float n = fbm(vec2(uv.x * aspect, uv.y) * 3.0 + vec2(7.1, 3.3) + r * 1.4);
  float th = uReveal * 1.45 - 0.22 + head * 0.3 - low * 0.18;
  float vis = smoothstep(n - 0.12, n + 0.12, th) * uLoaded;

  // the smoke before the reveal: a deep oxblood haze, red but quiet
  vec3 coal = vec3(0.075, 0.018, 0.014);
  vec3 ember = mix(vec3(0.42, 0.07, 0.05), vec3(0.62, 0.2, 0.13), smoothstep(0.55, 0.95, dens));
  vec3 ash = coal + ember * smoothstep(0.28, 0.92, dens) * 0.55;
  col = mix(ash, col, vis);

  // the faintest fall-off in the corners
  float vig = smoothstep(1.3, 0.35, length(d * vec2(1.0, 1.2)));
  col *= mix(0.84, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}`;

export type Stage = {
  gl: WebGLRenderingContext;
  uniform: (name: string) => WebGLUniformLocation | null;
  draw: () => void;
  dispose: () => void;
};

export function createStage(canvas: HTMLCanvasElement, frag: string, attrs: WebGLContextAttributes): Stage | null {
  const gl = canvas.getContext("webgl", attrs) as WebGLRenderingContext | null;
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  // one triangle that overshoots the viewport covers it with no seam
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const locations = new Map<string, WebGLUniformLocation | null>();
  const uniform = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    return locations.get(name) ?? null;
  };

  return {
    gl,
    uniform,
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
    // the context itself stays: a remount (React dev runs effects twice) asks this canvas for it again
    dispose: () => {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

export function uploadTexture(gl: WebGLRenderingContext, source: TexImageSource) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
  return texture;
}
