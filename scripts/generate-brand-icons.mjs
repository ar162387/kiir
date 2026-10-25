import sharp from 'sharp';
import{writeFile}from'node:fs/promises';
// Exact packaged KIIR artwork, resized for browser/OS icon formats.
const source='public/logo/kiirlogo.png';
await sharp(source).resize(96,96).png().toFile('app/icon.png');
await sharp(source).resize(180,180).png().toFile('app/apple-icon.png');
const sizes=[16,32,48,64,256],images=await Promise.all(sizes.map(size=>sharp(source).resize(size,size).png().toBuffer()));
const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
images.forEach((image,i)=>{const at=6+i*16;header[at]=sizes[i]===256?0:sizes[i];header[at+1]=header[at];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(image.length,at+8);header.writeUInt32LE(offset,at+12);offset+=image.length;});
await writeFile('app/favicon.ico',Buffer.concat([header,...images]));
const artwork=await sharp(source).resize(260,260).png().toBuffer();
const background=Buffer.from(`<svg width="1200" height="630"><rect width="1200" height="630" fill="#f5f9fa"/><rect width="1200" height="18" fill="#08b4ce"/><rect x="70" y="510" width="1060" height="2" fill="#cadce3"/><g fill="#12333f" font-family="Arial,sans-serif"><text x="395" y="235" font-size="32" font-weight="bold">KASHMIR INSTITUTE OF</text><text x="395" y="285" font-size="32" font-weight="bold">INTERNATIONAL RELATIONS</text><text x="395" y="345" font-size="28" fill="#277a8d">Peace Through Dialogue</text><text x="70" y="565" font-size="23">KIIR · Research, dialogue and peacebuilding</text></g></svg>`);
await sharp(background).composite([{input:artwork,left:80,top:150}]).png().toFile('public/kiir-social.png');
console.log('Generated KIIR favicon, PNG icon, Apple icon and default sharing image.');
