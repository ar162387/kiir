import type {EditorNode} from './content-types.ts';
import {safeLink,validateDocument} from './content-types.ts';
export const escapeHtml=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const integer=(value:unknown,fallback=1,max=50)=>Number.isInteger(Number(value))?Math.min(max,Math.max(1,Number(value))):fallback;
// This small allowlisted renderer is shared by draft preview and public delivery.
// Stored HTML and browser-generated HTML are never trusted as publication output.
export function renderDocument(doc:EditorNode,assets:Record<string,string>={}):string {
 validateDocument(doc);
 let section=0;
 function render(n:EditorNode):string {
  const children=(n.content??[]).map(render).join(''),a=n.attrs??{};
  const align=a.textAlign?` style="text-align:${escapeHtml(a.textAlign)}"`:'';
  switch(n.type){
   case 'doc':return children;
   case 'text':return (n.marks??[]).reduce((s,m)=>{const tags:Record<string,string>={bold:'strong',italic:'em',underline:'u',strike:'s',superscript:'sup',subscript:'sub'};if(m.type==='link')return safeLink(String(m.attrs?.href))?`<a href="${escapeHtml(m.attrs?.href)}" rel="noopener noreferrer">${s}</a>`:s;const t=tags[m.type];return t?`<${t}>${s}</${t}>`:s;},escapeHtml(n.text));
   case 'paragraph':return `<p${align}>${children||'<br>'}</p>`;
   case 'heading':return `<h${Number(a.level)} id="section-${++section}"${align}>${children}</h${Number(a.level)}>`;
   case 'blockquote':return `<blockquote>${children}</blockquote>`;
   case 'bulletList':return `<ul>${children}</ul>`;
   case 'orderedList':return `<ol start="${integer(a.start,1,9999)}">${children}</ol>`;
   case 'listItem':return `<li>${children}</li>`;
   case 'hardBreak':return '<br>';
   case 'horizontalRule':return '<hr>';
   case 'table':{let total=0,fixed=true;const cols=(n.content?.[0]?.content??[]).flatMap(cell=>Array.from({length:integer(cell.attrs?.colspan,1,1000)},(_,i)=>{const raw=Array.isArray(cell.attrs?.colwidth)?cell.attrs.colwidth[i]:null;const width=raw?integer(raw,70,10000):70;total+=width;if(!raw)fixed=false;return `<col style="${raw?'width':'min-width'}:${width}px">`;})).join('');return `<div class="editor-table-scroll"><table aria-label="Article table" style="${fixed?'width':'min-width'}:${total}px"><colgroup>${cols}</colgroup><tbody>${children}</tbody></table></div>`;}
   case 'tableRow':return `<tr>${children}</tr>`;
   case 'tableCell':case 'tableHeader':{const tag=n.type==='tableHeader'?'th':'td';const width=Array.isArray(a.colwidth)?a.colwidth.reduce((sum,v)=>sum+integer(v,70,10000),0):0;return `<${tag}${tag==='th'?' scope="col"':''} colspan="${integer(a.colspan,1,1000)}" rowspan="${integer(a.rowspan,1,65534)}"${width?` style="min-width:${width}px"`:''}>${children}</${tag}>`;}
   case 'managedImage':{const url=assets[String(a.assetId)];if(!url)throw Error('A publication image is unavailable. Restore the managed file before publishing.');return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(a.alt)}" loading="lazy">${a.caption?`<figcaption>${escapeHtml(a.caption)}</figcaption>`:''}</figure>`;}
   default:return '';
  }
 }
 return render(doc);
}

export function documentHeadings(doc:EditorNode):{id:string;text:string}[]{let index=0;const out:{id:string;text:string}[]=[];function walk(n:EditorNode){if(n.type==='heading'){const text=(node:EditorNode):string=>node.text??(node.content??[]).map(text).join('');out.push({id:`section-${++index}`,text:text(n)});}for(const c of n.content??[])walk(c);}walk(doc);return out;}
