// Entry for make.fun's "Sum up 18 November's world news in one image".
// The picture is drawn ahead of time by build.mjs (from stories.json) and kept in the
// repository as entry.png; at grading time this program, with no network, writes those
// exact bytes to the output folder, so every run gives the same file.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const picture = readFileSync(new URL('./entry.png', import.meta.url));

// Refuse to hand the gate a file it would reject: a PNG, at most 1 MiB, at most 1024x1024.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!picture.subarray(0, 8).equals(PNG_MAGIC)) throw new Error('entry.png is not a PNG');
if (picture.length > 1024 * 1024) throw new Error(`entry.png is ${picture.length} bytes, over 1 MiB`);
const width = picture.readUInt32BE(16), height = picture.readUInt32BE(20);
if (width > 1024 || height > 1024) throw new Error(`entry.png is ${width}x${height}, over 1024x1024`);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), picture);
