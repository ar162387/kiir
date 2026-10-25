import test from 'node:test';
import assert from 'node:assert/strict';
import { slugifyProgram,validateProgram,imageDeliveryUrl } from '../lib/cms/program-types.ts';
import { isSameOriginRequest } from '../lib/cms/request-origin.ts';
const valid={name:'Community Peace',slug:'community-peace',description:'Work with local communities.',sort_order:3};
test('program validation accepts optional Urdu and rejects unsafe URLs and oversized copy',()=>{
  assert.equal(validateProgram({...valid,name_ur:'امن'}),null);
  assert.ok(validateProgram({...valid,slug:'../admin'}));
  assert.ok(validateProgram({...valid,slug:'hello--world'}));
  assert.ok(validateProgram({...valid,name:' '}));
  assert.ok(validateProgram({...valid,description:'a'.repeat(601)}));
  assert.ok(validateProgram({...valid,sort_order:0.5}));
  assert.ok(validateProgram({...valid,image_asset_id:'not-an-asset'}));
});
test('media upload origin check accepts the browser host behind a proxy and rejects cross-site requests',()=>{
  assert.equal(isSameOriginRequest(new Request('http://127.0.0.1:3001/api/media/sign',{headers:{host:'localhost:3001',origin:'http://localhost:3001'}})),true);
  assert.equal(isSameOriginRequest(new Request('https://kiir.example/api/media/sign',{headers:{host:'kiir.example',origin:'https://evil.example'}})),false);
  assert.equal(isSameOriginRequest(new Request('https://kiir.example/api/media/sign',{headers:{host:'kiir.example'}})),false);
});
test('program URLs are generated predictably and image renditions remain bounded',()=>{
  assert.equal(slugifyProgram('  Community & Peace  '),'community-peace');
  assert.equal(slugifyProgram('Développement'),'developpement');
  assert.ok(slugifyProgram('x'.repeat(150)).length<=100);
  const url=imageDeliveryUrl({cloud_name:'example',public_id:'kiir-cms/test/id',version:5});
  assert.equal(url,'https://res.cloudinary.com/example/image/upload/f_auto,q_auto,w_640,c_limit/v5/kiir-cms/test/id');
});
