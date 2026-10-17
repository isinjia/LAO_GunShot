/* Presentation-only localization: game data and identifiers remain canonical. */
(function () {
  'use strict';
  const KEY='lao_rogue_language', SUPPORTED=['ko','en','ja','zh-Hans','zh-Hant','es','pt','ru'];
  const NAMES={ko:'한국어',en:'English',ja:'日本語','zh-Hans':'简体中文','zh-Hant':'繁體中文',es:'Español',pt:'Português',ru:'Русский'};
  function match(tag) {
    const s=String(tag||'').replace(/_/g,'-').toLowerCase(), base=s.split('-')[0];
    if(base==='zh') return /(?:^|-)(hant|tw|hk|mo)(?:-|$)/.test(s)?'zh-Hant':'zh-Hans';
    return SUPPORTED.includes(base)?base:null;
  }
  function systemLanguage(tags) { for(const tag of tags||navigator.languages||[navigator.language]) { const lang=match(tag); if(lang)return lang; } return 'en'; }
  let preference='system';try { const s=localStorage.getItem(KEY);if(s==='system'||SUPPORTED.includes(s))preference=s; }catch(e){}
  let locale=preference==='system'?systemLanguage():preference, dict={}, pattern=null;
  const texts=new WeakMap(),attrs=new WeakMap(),cache=new Map();
  function compile() {
    dict=(window.LOCALES&&window.LOCALES[locale])||{};
    const keys=Object.keys(dict).filter(k=>!['초','회','개','층'].includes(k)).sort((a,b)=>b.length-a.length);
    pattern=keys.length?new RegExp(keys.map(s=>(s.length===1?'(?<![가-힣])':'')+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+(s.length===1?'(?![가-힣])':'')).join('|'),'g'):null;
    cache.clear();
  }
  function t(value) {
    const source=String(value==null?'':value);if(locale==='ko')return source;
    if(cache.has(source))return cache.get(source);
    let result=Object.prototype.hasOwnProperty.call(dict,source)?dict[source]:pattern?source.replace(pattern,m=>dict[m]):source;
    result=result.replace(/(\d+(?:\.\d+)?)\s*(초|회|개|층)(?![가-힣])/g,(_,n,u)=>n+' '+(dict[u]||u));
    if(cache.size>3000)cache.clear();cache.set(source,result);return result;
  }
  function ignored(node) { const el=node.nodeType===1?node:node.parentElement;return !el||!!el.closest('script,style,textarea,[translate="no"],[data-no-i18n]'); }
  function translateText(node) {
    if(ignored(node))return;
    const prev=texts.get(node), raw=prev&&node.data===prev.out?prev.raw:node.data, out=t(raw);
    texts.set(node,{raw,out});if(node.data!==out)node.data=out;
  }
  function translateAttrs(el) {
    if(ignored(el))return;
    const old=attrs.get(el)||{};
    for(const key of ['title','aria-label','placeholder','data-lock']) {
      const current=el.getAttribute(key);if(current===null)continue;
      const prev=old[key],raw=prev&&current===prev.out?prev.raw:current,out=t(raw);
      old[key]={raw,out};if(current!==out)el.setAttribute(key,out);
    }
    attrs.set(el,old);
  }
  function translate(root) {
    if(root.nodeType===3){translateText(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9)return;
    if(root.nodeType===1)translateAttrs(root);
    const walk=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    for(let n=walk.nextNode();n;n=walk.nextNode())if(n.nodeType===3)translateText(n);else translateAttrs(n);
  }
  function apply() {
    compile();document.documentElement.lang=locale;document.documentElement.dataset.language=locale;
    translate(document.body);document.title=t('오르카 던전 돌파 — LAST ORIGIN ROGUE OPERATION');
    const select=document.getElementById('languageSelect');
    if(select){select.value=preference;select.setAttribute('aria-label',t('언어'));select.options[0].textContent=t('시스템 언어')+' ('+NAMES[systemLanguage()]+')';}
    document.documentElement.style.setProperty('--tap-map-label',JSON.stringify(t('탭: 지도')));
    document.documentElement.style.setProperty('--no-reload-label',JSON.stringify(t('장전 없음')));
    if(window.GAME&&GAME.localizeTextures)GAME.localizeTextures();
    if(window.UI&&UI.refreshLanguage)UI.refreshLanguage();
    window.dispatchEvent(new CustomEvent('lao-language-changed',{detail:{locale,preference}}));
  }
  function setLanguage(value) {
    if(value!=='system'&&!SUPPORTED.includes(value))return false;
    preference=value;locale=value==='system'?systemLanguage():value;
    try{localStorage.setItem(KEY,value);}catch(e){}
    apply();return true;
  }
  function init() {
    const select=document.getElementById('languageSelect');
    if(select){select.innerHTML='<option value="system"></option>'+SUPPORTED.map(k=>'<option value="'+k+'">'+NAMES[k]+'</option>').join('');select.addEventListener('change',()=>setLanguage(select.value));}
    apply();
    new MutationObserver(records=>{
      const roots=new Set();
      for(const r of records)if(r.type==='childList')for(const n of r.addedNodes)roots.add(n);else roots.add(r.target);
      for(const root of roots)translate(root);
    }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','data-lock']});
  }
  window.I18N={t,setLanguage,systemLanguage,match,supported:SUPPORTED,get locale(){return locale;},get preference(){return preference;},refresh:apply};
  window.addEventListener('languagechange',()=>{if(preference==='system'){locale=systemLanguage();apply();}});
  document.addEventListener('DOMContentLoaded',init);
})();
