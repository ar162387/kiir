import test from 'node:test';
import assert from 'node:assert/strict';
import {localePath,withoutLocale} from '../lib/locale-path.ts';
import {safePublicLink,validateSettings,activeAnnouncements} from '../lib/cms/settings-types.ts';
test('language paths preserve queries and never localize API, staff, files or external links',()=>{
 assert.equal(localePath('/publications?kind=research-papers','ur'),'/ur/publications?kind=research-papers');
 assert.equal(localePath('/ur/articles/example','en'),'/articles/example');assert.equal(withoutLocale('/ur'),'/');
 for(const path of ['/api/documents/123','/admin/content','/rss.xml','https://example.com','//example.com'])assert.equal(localePath(path,'ur'),path);
});
test('public links reject script, protocol-relative, staff, API and encoded bypass destinations',()=>{
 for(const link of ['javascript:alert(1)','//evil.example','/admin/users','/api/media/sign','/\\evil.example','/%2f%2fevil.example','https://example.com/\n'])assert.equal(safePublicLink(link),false,link);
 for(const link of ['/','/articles/example?source=ticker','https://example.com/report'])assert.equal(safePublicLink(link),true,link);
});
test('cleared optional settings stay valid and only active announcements reach the public strip',()=>{
 assert.equal(validateSettings('contact',{address:'',phone:'',email:''}),null);assert.equal(validateSettings('social',{facebook:'',instagram:'',x:'',linkedin:''}),null);
 const active={id:'one',is_active:true,segments:[{text:'Read '},{text:'the paper',href:'/publications'}],segments_ur:[]};
 assert.equal(validateSettings('ticker',[active]),null);assert.equal(activeAnnouncements([active,{...active,id:'two',is_active:false}]).length,1);
 assert.ok(validateSettings('ticker',[{...active,segments:[{text:'Unsafe',href:'javascript:alert(1)'}]}]));
});
