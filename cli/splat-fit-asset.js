const RowAssets = require('./render-row-assets.js');
const Curve = require('../src/curve-splat.js');
const Optical = require('../src/optical-materials.js');

const format='ink-studio/splat-fit';
const compiled=new WeakMap();

function eligible(world, i) {
  const rest=world.rest ?? world.data, q=i*16, flags=Math.round(rest[q+11]), kind=flags&15;
  return rest[q+3]>=1 && (kind===0 || kind===12) && !(flags&(16|32|64|128|256|512|1024|2048|32768)) &&
    !Curve.isRow(rest,q) && !world.opticalSplats?.[i*Optical.STRIDE+3] && !world.anim?.geometryOwned?.[i] && !world.anim?.physicsOwned?.[i] && !world.anim?.rig?.bid?.[i];
}

function prepare(world, asset) {
  if (asset===undefined || asset===false) return null;
  RowAssets.validate(world,asset,format);
  if (compiled.has(asset)) return compiled.get(asset);
  if (!Array.isArray(asset.edits) || asset.edits.length>world.count) throw new TypeError('Splat fit needs row edits');
  const scales=new Float32Array(world.count).fill(1), seen=new Set();
  for (const [i, scale] of asset.edits) {
    if (!Number.isSafeInteger(i) || i<0 || i>=world.count || seen.has(i) ||
        !Number.isFinite(scale) || scale!==0 && (scale<.4 || scale>2) || !eligible(world,i))
      throw new RangeError('Invalid or duplicate splat fit row edit');
    seen.add(i);
    scales[i]=scale;
  }
  compiled.set(asset,scales);
  return scales;
}

module.exports={format,prepare,eligible};
