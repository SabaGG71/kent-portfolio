// Builds public/hero/kent-head-mask.png, the mask that puts Kent's head in front of the hero title.
// The photo's red grading puts colour in everything, so the key is brightness: hair is dark, the wall
// (even in shadow) is not. A hand-drawn outline keeps the key on his head, and a solid face shape
// covers the lit skin. Only the crown matters, the title never reaches below his brow.
//
// New photo? Redraw HEAD and FACE (pixel coordinates in the source photo), update PHOTO and HEAD in
// src/components/hero/frame.ts, then run:  node scripts/head-mask.cjs <photo> public/hero/kent-head-mask.png
const sharp = require("sharp");

const HEAD = "668,345 666,284 688,248 742,224 800,216 864,224 916,250 954,292 980,345 974,425 952,488 902,540 840,566 760,566 700,526 672,452";
const FACE = "724,314 766,298 832,296 878,314 900,352 894,430 872,486 828,516 774,516 734,482 718,404";
const CROWN = [370, 430];

const [src, out] = process.argv.slice(2);
if (!src || !out) {
  console.error("usage: node scripts/head-mask.cjs <photo> <out.png>");
  process.exit(1);
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** one channel, whatever sharp hands back */
const channel = async (img) => {
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  if (info.channels === 1) return data;
  const px = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < px.length; i++) px[i] = data[i * info.channels];
  return px;
};

(async () => {
  const { width: W, height: H } = await sharp(src).metadata();
  const rgb = await sharp(src).removeAlpha().raw().toBuffer();
  const shape = (points, blur) =>
    channel(
      sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><polygon points="${points}" fill="#fff"/></svg>`))
        .flatten({ background: "#000" })
        .greyscale()
        .blur(blur),
    );
  const head = await shape(HEAD, 5);
  const face = await shape(FACE, 9);

  const key = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) {
    const value = Math.max(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]) / 255;
    const hair = 1 - smooth(0.34, 0.48, value);
    const crown = 1 - smooth(CROWN[0], CROWN[1], Math.floor(i / W));
    key[i] = Math.round(Math.max(hair, face[i] / 255) * (head[i] / 255) * crown * 255);
  }
  // knock out wall speckle, then a hair-fine feather
  const matte = await channel(sharp(key, { raw: { width: W, height: H, channels: 1 } }).median(3).blur(0.7));

  // the mask is the inverse: opaque everywhere the title may show, clear where his head is
  const rgba = Buffer.alloc(W * H * 4, 255);
  for (let i = 0; i < W * H; i++) rgba[i * 4 + 3] = 255 - matte[i];
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(out);
  console.log(`wrote ${out} (${W}x${H})`);
})();
