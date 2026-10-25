'use client';
import AutoGrowTextarea from './AutoGrowTextarea';
import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {TableKit} from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import {Node,mergeAttributes} from '@tiptap/core';
import type {EditorNode} from '@/lib/cms/content-types';
import {safeLink} from '@/lib/cms/content-types';
import {useState,useEffect} from 'react';
const ManagedImage=Node.create({name:'managedImage',group:'block',atom:true,
 addAttributes(){return {assetId:{default:null},src:{default:''},alt:{default:''},caption:{default:''}};},
 parseHTML(){return [{tag:'figure[data-managed-image]'}];},
 renderHTML({HTMLAttributes}){return ['figure',mergeAttributes({'data-managed-image':''},HTMLAttributes),['img',{src:HTMLAttributes.src,alt:HTMLAttributes.alt}],['figcaption',{},HTMLAttributes.caption||'']];}
});
export default function RichTextEditor({value,onChange,label,language='en',images=[],variant=null,assets={}}:{value:EditorNode;onChange:(v:EditorNode)=>void;label:string;language?:'en'|'ur';variant?:string|null;assets?:Record<string,string>;images?:{id:string;url:string;alt:string;caption:string}[]}){
 const [link,setLink]=useState('');const [linkOpen,setLinkOpen]=useState(false);const [linkError,setLinkError]=useState('');
 const hydrate=(node:EditorNode):EditorNode=>({...node,...(node.type==='managedImage'?{attrs:{...node.attrs,src:assets[String(node.attrs?.assetId)]??images.find(i=>i.id===node.attrs?.assetId)?.url??''}}:{}),...(node.content?{content:node.content.map(hydrate)}:{})});
 const editor=useEditor({extensions:[StarterKit.configure({heading:{levels:[2,3,4]},codeBlock:false,code:false,link:{openOnClick:false}}),TableKit.configure({table:{resizable:true,cellMinWidth:70}}),TextAlign.configure({types:['heading','paragraph']}),Superscript,Subscript,ManagedImage],
  content:hydrate(value),immediatelyRender:false,shouldRerenderOnTransaction:true,editorProps:{attributes:{class:`editor-prose ${variant==='research-papers'?'publication-research':variant==='short-stories'?'publication-story':variant==='newsletters'?'publication-newsletter':''}`,role:'textbox','aria-label':label,'aria-multiline':'true',lang:language,dir:language==='ur'?'rtl':'ltr'}},onUpdate:({editor})=>onChange(editor.getJSON() as EditorNode)});
 useEffect(()=>{if(!editor)return;const transaction=editor.state.tr;let changed=false;editor.state.doc.descendants((node,pos)=>{if(node.type.name==='managedImage'){const src=assets[String(node.attrs.assetId)]??images.find(i=>i.id===node.attrs.assetId)?.url??'';if(src!==node.attrs.src){transaction.setNodeMarkup(pos,undefined,{...node.attrs,src});changed=true;}}});if(changed)editor.view.dispatch(transaction);},[editor,assets,images]);
 if(!editor)return <p className="cms-help">Loading editor…</p>;
 const icon=(paths:string)=><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths}/></svg>;
 const icons:Record<string,React.ReactNode>={Bold:<strong>B</strong>,Italic:<em>I</em>,Underline:<u>U</u>,Strike:<s>S</s>,Superscript:<>x<sup>2</sup></>,Subscript:<>x<sub>2</sub></>,
 'Bullet list':icon('M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1'),
 'Numbered list':icon('M10 6h11M10 12h11M10 18h11M3 3h1v5M3 8h3M3 12c3-2 4 1 1 3l-1 1h3M3 20h3'),
 Quote:icon('M4 6h6v7H5v5H2v-6l2-6M15 6h6v7h-5v5h-3v-6l2-6'),
 'Align left':icon('M3 5h18M3 10h12M3 15h18M3 20h12'),
 'Align center':icon('M3 5h18M6 10h12M3 15h18M6 20h12'),
 'Align right':icon('M3 5h18M9 10h12M3 15h18M9 20h12'),
 'Align justify':icon('M3 5h18M3 10h18M3 15h18M3 20h18'),
 Link:icon('M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2'),
 'Scene break':icon('M3 12h18'),
 'Insert table':icon('M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18'),
 Undo:icon('M8 4 3 9l5 5M3 9h10a7 7 0 0 1 0 14'),
 Redo:icon('m16 4 5 5-5 5M21 9H11a7 7 0 0 0 0 14'),
 'Clear formatting':icon('M4 4h16M12 4l-4 14M15 15l6 6M21 15l-6 6')};
 const button=(name:string,fn:()=>void,active?:boolean)=><button key={name} type="button" aria-label={name} title={name} aria-pressed={active} onMouseDown={e=>e.preventDefault()} onClick={fn}>{icons[name]??name}</button>;
 return <div className="cms-rich-editor"><div className="cms-editor-toolbar" role="toolbar" aria-label={`${label} formatting`}>
  <select aria-label="Paragraph style" value={editor.isActive('heading')?String(editor.getAttributes('heading').level):'p'} onChange={e=>e.target.value==='p'?editor.chain().focus().setParagraph().run():editor.chain().focus().toggleHeading({level:Number(e.target.value) as 2|3|4}).run()}><option value="p">Paragraph</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option></select>
  {button('Bold',()=>{editor.chain().focus().toggleBold().run();},editor.isActive('bold'))}
  {button('Italic',()=>{editor.chain().focus().toggleItalic().run();},editor.isActive('italic'))}
  {button('Underline',()=>{editor.chain().focus().toggleUnderline().run();},editor.isActive('underline'))}
  {button('Strike',()=>{editor.chain().focus().toggleStrike().run();},editor.isActive('strike'))}
  {button('Superscript',()=>{editor.chain().focus().toggleSuperscript().run();},editor.isActive('superscript'))}
  {button('Subscript',()=>{editor.chain().focus().toggleSubscript().run();},editor.isActive('subscript'))}
  {button('Bullet list',()=>{editor.chain().focus().toggleBulletList().run();},editor.isActive('bulletList'))}
  {button('Numbered list',()=>{editor.chain().focus().toggleOrderedList().run();},editor.isActive('orderedList'))}
  {button('Quote',()=>{editor.chain().focus().toggleBlockquote().run();},editor.isActive('blockquote'))}
  {['left','center','right','justify'].map(align=>button(`Align ${align}`,()=>{editor.chain().focus().setTextAlign(align).run();},editor.isActive({textAlign:align})))}
  {button('Link',()=>{setLink(editor.getAttributes('link').href??'');setLinkOpen(!linkOpen);},editor.isActive('link'))}
  {button('Scene break',()=>{editor.chain().focus().setHorizontalRule().run();})}
  {button('Insert table',()=>{editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run();})}
  {button('Undo',()=>{editor.chain().focus().undo().run();})}{button('Redo',()=>{editor.chain().focus().redo().run();})}
  {button('Clear formatting',()=>{editor.chain().focus().unsetAllMarks().clearNodes().run();})}
 </div>
 {linkOpen&&<div className="cms-editor-insert"><label>Link URL<AutoGrowTextarea singleLine value={link} onChange={e=>setLink(e.target.value)} placeholder="https://"/></label><button type="button" onClick={()=>{if(!safeLink(link)){setLinkError('Use a valid HTTP, HTTPS, email or phone link.');return;}editor.chain().focus().extendMarkRange('link').setLink({href:link}).run();setLinkOpen(false);setLinkError('');}}>Apply link</button><button type="button" onClick={()=>{editor.chain().focus().unsetLink().run();setLinkOpen(false);}}>Remove link</button>{linkError&&<p role="alert">{linkError}</p>}</div>}
 {editor.isActive('table')&&<div className="cms-editor-toolbar" role="toolbar" aria-label="Table editing">{button('Add row',()=>{editor.chain().focus().addRowAfter().run();})}{button('Delete row',()=>{editor.chain().focus().deleteRow().run();})}{button('Add column',()=>{editor.chain().focus().addColumnAfter().run();})}{button('Delete column',()=>{editor.chain().focus().deleteColumn().run();})}{button('Merge cells',()=>{editor.chain().focus().mergeCells().run();})}{button('Split cell',()=>{editor.chain().focus().splitCell().run();})}{button('Toggle header',()=>{editor.chain().focus().toggleHeaderRow().run();})}{button('Delete table',()=>{editor.chain().focus().deleteTable().run();})}</div>}
 {images.length>0&&<label className="cms-inline-image-label">Insert a gallery image at the cursor<select aria-label="Insert gallery image" value="" onChange={e=>{const image=images.find(i=>i.id===e.target.value);if(image)editor.chain().focus().insertContent({type:'managedImage',attrs:{assetId:image.id,src:image.url,alt:image.alt,caption:image.caption}}).run();}}><option value="">Choose image</option>{images.map((i,n)=><option value={i.id} key={i.id}>{i.alt||i.caption||`Image ${n+1}`}</option>)}</select></label>}
 {editor.isActive('managedImage')&&<div className="cms-editor-insert"><label>Image caption<AutoGrowTextarea singleLine value={editor.getAttributes('managedImage').caption??''} maxLength={1000} onChange={e=>editor.chain().updateAttributes('managedImage',{caption:e.target.value}).run()}/></label><label>Image alt text<AutoGrowTextarea singleLine value={editor.getAttributes('managedImage').alt??''} maxLength={500} onChange={e=>editor.chain().updateAttributes('managedImage',{alt:e.target.value}).run()}/></label></div>}
 <EditorContent editor={editor}/><p className="cms-editor-count">{editor.getText().trim().split(/\s+/).filter(Boolean).length} words · Formatting is preserved in preview and publication.</p>
 </div>;
}
