import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectRaster, inspectRasterDataUrl, RASTER_LIMITS } from '../shared/raster.mjs';
import { safeImage, validateSpec } from '../shared/schema.mjs';
import { createSpec } from '../shared/content.mjs';
import { crc32 } from '../server/zip.mjs';
import { PNG_IMAGE, SECOND_PNG_IMAGE, JPEG_IMAGE, WEBP_IMAGE, LOSSLESS_WEBP_IMAGE, AVIF_IMAGE, paddedPng } from './fixtures/images.mjs';

const bytesOf = (url) => Buffer.from(url.split(',')[1], 'base64');
const dataUrl = (mime, bytes) => `data:${mime};base64,${bytes.toString('base64')}`;
const fixtures = [PNG_IMAGE, SECOND_PNG_IMAGE, JPEG_IMAGE, WEBP_IMAGE, LOSSLESS_WEBP_IMAGE, AVIF_IMAGE];
for (const image of fixtures) test(`accepts encoded 16x12 ${image.slice(5, image.indexOf(';'))} fixture`, () => {
  assert.equal(safeImage(image), image);
  assert.deepEqual(inspectRasterDataUrl(image), { mime: image.slice(5, image.indexOf(';')), width: 16, height: 12 });
});

test('image URLs reject arbitrary bytes, MIME spoofing, SVG, external URLs and noncanonical base64', () => {
  for (const image of ['data:image/png;base64,YQ==', 'data:image/png;base64,Yg==', PNG_IMAGE.replace('image/png', 'image/jpeg'), PNG_IMAGE.replace('base64,', 'base64,\n'), SECOND_PNG_IMAGE.slice(0, -2) + 'J=', SECOND_PNG_IMAGE.slice(0, -1), 'data:image/svg+xml;base64,PHN2Zz4=', 'https://example.com/image.png']) assert.throws(() => safeImage(image));
  assert.equal(safeImage(''), '');
});

test('all formats reject truncated files and appended garbage before decode', () => {
  for (const image of fixtures) {
    const mime = image.slice(5, image.indexOf(';')), bytes = bytesOf(image);
    for (const length of [0, 1, 7, 16, Math.floor(bytes.length / 2), bytes.length - 1]) assert.throws(() => inspectRaster(bytes.subarray(0, length), mime));
    assert.throws(() => inspectRaster(Buffer.concat([bytes, Buffer.from('trailing')]), mime));
  }
});

function pngSize(width, height) {
  const bytes = bytesOf(PNG_IMAGE);
  bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  bytes.writeUInt32BE(crc32(bytes.subarray(12, 29)), 29);
  return bytes;
}
test('PNG metadata bounds dimensions and total pixels and rejects CRC damage', () => {
  assert.deepEqual(inspectRaster(pngSize(6000, 4000), 'image/png'), { mime: 'image/png', width: 6000, height: 4000 });
  for (const [width, height] of [[0, 1], [8193, 1], [1, 8193], [6000, 4001], [0xffffffff, 0xffffffff]]) assert.throws(() => inspectRaster(pngSize(width, height), 'image/png'));
  const corrupt = bytesOf(PNG_IMAGE); corrupt[40] ^= 1;
  assert.throws(() => inspectRaster(corrupt, 'image/png'));
});

test('animated PNG containers and excessive chunk counts are rejected', () => {
  const bytes = bytesOf(PNG_IMAGE), animation = Buffer.alloc(20);
  animation.writeUInt32BE(8); animation.write('acTL', 4); animation.writeUInt32BE(1, 8);
  animation.writeUInt32BE(crc32(animation.subarray(4, -4)), 16);
  assert.throws(() => inspectRaster(Buffer.concat([bytes.subarray(0, 33), animation, bytes.subarray(33)]), 'image/png'));
  const chunk = Buffer.alloc(12); chunk.write('teSt', 4); chunk.writeUInt32BE(crc32(chunk.subarray(4, 8)), 8);
  assert.throws(() => inspectRaster(Buffer.concat([bytes.subarray(0, 33), ...Array(4096).fill(chunk), bytes.subarray(33)]), 'image/png'));
});

test('JPEG SOF dimensions and complete scan/end markers are required', () => {
  const bytes = bytesOf(JPEG_IMAGE), frame = bytes.indexOf(Buffer.from([255, 192]));
  for (const [width, height] of [[0, 1], [8193, 1], [6000, 4001]]) {
    const changed = Buffer.from(bytes); changed.writeUInt16BE(height, frame + 5); changed.writeUInt16BE(width, frame + 7);
    assert.throws(() => inspectRaster(changed, 'image/jpeg'));
  }
  assert.throws(() => inspectRaster(Buffer.from([255, 216, 255, 217]), 'image/jpeg'));
});

function extendedWebp(width, height, flags = 0) {
  const base = bytesOf(WEBP_IMAGE), chunk = Buffer.alloc(18);
  chunk.write('VP8X'); chunk.writeUInt32LE(10, 4); chunk[8] = flags;
  chunk.writeUIntLE(width - 1, 12, 3); chunk.writeUIntLE(height - 1, 15, 3);
  const result = Buffer.concat([base.subarray(0, 12), chunk, base.subarray(12)]);
  result.writeUInt32LE(result.length - 8, 4); return result;
}
test('WebP validates lossy, lossless and extended dimensions, RIFF bounds and static frames', () => {
  assert.equal(inspectRaster(extendedWebp(16, 12), 'image/webp').width, 16);
  for (const bytes of [extendedWebp(8193, 1), extendedWebp(6000, 4001), extendedWebp(17, 12), extendedWebp(16, 12, 2)]) assert.throws(() => inspectRaster(bytes, 'image/webp'));
  const lossy = bytesOf(WEBP_IMAGE); lossy.writeUInt16LE(8193, lossy.indexOf('VP8 ') + 14);
  assert.throws(() => inspectRaster(lossy, 'image/webp'));
  const lossless = bytesOf(LOSSLESS_WEBP_IMAGE), at = lossless.indexOf('VP8L') + 9;
  lossless.writeUInt32LE(8192, at);
  assert.throws(() => inspectRaster(lossless, 'image/webp'));
});

test('AVIF bounds ispe dimensions and requires the still-image brand, metadata and media', () => {
  const bytes = bytesOf(AVIF_IMAGE), ispe = bytes.indexOf('ispe');
  for (const [width, height] of [[0, 1], [8193, 1], [6000, 4001]]) {
    const changed = Buffer.from(bytes); changed.writeUInt32BE(width, ispe + 8); changed.writeUInt32BE(height, ispe + 12);
    assert.throws(() => inspectRaster(changed, 'image/avif'));
  }
  for (const type of ['ispe', 'meta', 'mdat']) {
    const changed = Buffer.from(bytes); changed.write('free', changed.indexOf(type));
    assert.throws(() => inspectRaster(changed, 'image/avif'));
  }
  const sequence = Buffer.from(bytes); sequence.write('avis', 8);
  assert.throws(() => inspectRaster(sequence, 'image/avif'));
  const excessiveBrands = Buffer.alloc(268); excessiveBrands.writeUInt32BE(268); excessiveBrands.write('ftypavif', 4);
  assert.throws(() => inspectRaster(Buffer.concat([excessiveBrands, bytes.subarray(32)]), 'image/avif'));
});

test('byte/data URL caps and the project boundary use the same raster checks', () => {
  assert.throws(() => inspectRaster(new Uint8Array(RASTER_LIMITS.maxBytes + 1), 'image/png'));
  assert.throws(() => safeImage(paddedPng(570000)));
  assert.equal(safeImage(paddedPng()).startsWith('data:image/png;base64,'), true);
  const spec = createSpec(); spec.sections[1].image = dataUrl('image/png', pngSize(8193, 1));
  assert.throws(() => validateSpec(spec));
});
