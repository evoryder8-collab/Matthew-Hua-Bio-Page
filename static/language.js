export const supportedLocales = ['en','gsw','de','es','pt','fr','it','zh','vi','ja'];
export function resolveLocale(browserLanguages=[],explicit=null,saved=null){
  if(supportedLocales.includes(explicit))return explicit;
  if(supportedLocales.includes(saved))return saved;
  for(const raw of browserLanguages){
    const tag=String(raw).toLowerCase().replaceAll('_','-');
    if(tag==='gsw'||tag.startsWith('gsw-')||tag==='de-ch'||tag.startsWith('de-ch-'))return 'gsw';
    const code=tag.split('-')[0];
    if(supportedLocales.includes(code))return code;
  }
  return 'en';
}
export function interpolate(text,values){return String(text).replace(/\{(\w+)\}/g,(token,key)=>values[key]??token);}
