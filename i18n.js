import i18next from 'https://cdn.jsdelivr.net/npm/i18next@26.4.3/dist/esm/i18next.js';
import ko from './locales/ko.js';
import en from './locales/en.js';

const storageKey='bounko-language-v1';
export const languages=['ko','en'];
const normalized=value=>typeof value==='string'?value.toLowerCase().split('-')[0]:null;
let saved;
try{saved=localStorage.getItem(storageKey);}catch{}
const initial=languages.includes(saved)?saved:(navigator.languages||[navigator.language]).map(normalized).find(code=>languages.includes(code))||'en';
await i18next.init({lng:initial,supportedLngs:languages,load:'languageOnly',fallbackLng:'en',
  keySeparator:false,resources:{ko:{translation:ko},en:{translation:en}},interpolation:{escapeValue:false}});
i18next.services.formatter.addCached('gameNumber',lng=>{const formatter=new Intl.NumberFormat(lng);return value=>typeof value==='number'?formatter.format(value):value;});
export const t=(key,values)=>i18next.t(key,values);
export const language=()=>i18next.resolvedLanguage;
export async function setLanguage(code){if(!languages.includes(code))return;try{localStorage.setItem(storageKey,code);}catch{}await i18next.changeLanguage(code);}
export const onLanguageChanged=listener=>i18next.on('languageChanged',listener);
const numberFormats=new Map();
export function number(value,options={}){const key=language()+JSON.stringify(options);if(!numberFormats.has(key))numberFormats.set(key,new Intl.NumberFormat(language(),options));return numberFormats.get(key).format(value);}
export const percent=(value,digits=0)=>number(value,{style:'percent',maximumFractionDigits:digits});
// Getter-backed presentation lists keep definitions live without changing saved IDs.
export function localizedList(items){for(let i=0;i<items.length;i++)if(typeof items[i]==='function'){const read=items[i];Object.defineProperty(items,i,{get:read,enumerable:true});}return items;}
// A message is retained as a key and data while a toast/notice is alive.
export const message=(key,values)=>({key,values});
export const messageText=value=>value&&typeof value==='object'&&value.key?t(value.key,value.values):String(value??'');
export function translateDocument(root=document){
  document.documentElement.lang=language();
  for(const el of root.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
  // Only authored static markup uses HTML resources; runtime variables use textContent.
  for(const el of root.querySelectorAll('[data-i18n-html]'))el.innerHTML=t(el.dataset.i18nHtml);
  for(const attr of ['aria-label','title','placeholder','wiki-title'])for(const el of root.querySelectorAll('[data-i18n-'+attr+']'))el.setAttribute(attr==='wiki-title'?'data-wiki-title':attr,t(el.getAttribute('data-i18n-'+attr)));
}
