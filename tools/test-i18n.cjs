const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={navigator:{languages:['en-US']},localStorage:{getItem:()=>null,setItem(){}},document:{body:{nodeType:9},documentElement:{dataset:{},style:{setProperty(){}}},createTreeWalker:()=>({nextNode:()=>null}),getElementById:()=>null,addEventListener(){}},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},CustomEvent:function(){}};
ctx.window=ctx;ctx.addEventListener=()=>{};ctx.dispatchEvent=()=>{};vm.createContext(ctx);
for(const f of ['js/i18n-locales.js','js/i18n.js','js/data.js','js/notes.js','js/i18n-content.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const I=ctx.I18N;assert.equal(I.preference,'system');I.refresh();assert.equal(I.t('설정 닫기'),'Close settings');
for(const [tag,expected] of [['ko-KR','ko'],['ja-JP','ja'],['zh-CN','zh-Hans'],['zh-SG','zh-Hans'],['zh-TW','zh-Hant'],['zh-HK','zh-Hant'],['zh-Hant','zh-Hant'],['pt-BR','pt'],['ru-RU','ru'],['es-MX','es'],['en-GB','en']])assert.equal(I.match(tag),expected);
assert.equal(I.systemLanguage(['fr-FR','ja-JP']),'ja');assert.equal(I.systemLanguage(['fr-FR']),'en');
const canonical=JSON.stringify(ctx.DATA);
for(const lang of I.supported){I.setLanguage(lang);assert.equal(I.locale,lang);assert.ok(I.t('설정'));if(lang!=='ko'){
 const texts=[];function collect(o){if(typeof o==='string'&&/[가-힣]/.test(o))texts.push(o);else if(o&&typeof o==='object')Object.values(o).forEach(collect)}collect(ctx.DATA);collect(ctx.NOTES);
 for(const m of ctx.DATA.META)for(let l=0;l<=m.max;l++)texts.push(m.desc(l));
 for(const text of texts)assert.ok(!/[가-힣]/.test(I.t(text)),lang+' missing: '+text);
 assert.ok(!/[가-힣]/.test(I.t('Lv.3 — 강화 모듈 최대치: 체력 +25 · 궁극기 +25%')));
 assert.ok(I.t('M-134 회전포').includes('134'));assert.ok(!I.t('M-134 회전포').includes('times'));
 }}
assert.equal(JSON.stringify(ctx.DATA),canonical,'localization must not mutate game data');
I.setLanguage('system');assert.equal(I.preference,'system');assert.equal(I.locale,'en');assert.equal(I.setLanguage('bad-language'),false);
console.log('All 8 locales: detection, content coverage, stat units, preference switching and canonical data preservation passed.');
