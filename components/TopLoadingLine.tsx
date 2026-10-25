export default function TopLoadingLine({isUr=false}:{isUr?:boolean}){
 return <div className="kiir-navigation-feedback" role="status" lang={isUr?'ur':'en'}>
  <div className="kiir-navigation-bar" aria-hidden="true"><span/></div>
  <span className="sr-only">{isUr?'صفحہ کھل رہا ہے':'Loading page'}</span>
 </div>;
}
