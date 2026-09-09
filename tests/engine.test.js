function assert(condition,message){if(!condition)throw new Error(message);}
function word(chinese,pinyin){const result=ToneEngine.prepare([{chinese,pinyin,english:'test',priority:'1'}]);assert(result.words.length===1,'Could not parse '+pinyin);return result.words[0];}
const cases=[['床','chuáng',['chuáng','2','chuang2'],['1','chuang','chuan2']],['白色','bái sè',['bái sè','báisè','bai2 se4','bai2se4','24','2 4'],['23','bai se','bai2si4']],['百分之','bǎi fēn zhī',['bǎi fēn zhī','311','bai3fen1zhi1'],['31','3111']],['爸爸','bà ba',['45','40','ba4ba0','ba4 ba5','bàba'],['44','ba4ba4']],['北京','Běijīng',['běijīng','31','bei3jing1'],['bei3jin1']],['女儿','nǚ ér',['32','nv3er2','nü3 er2','nu:3er2','nǚér'],['nu3er2']],['包括','bāo \u200bkuò',['14','bao1kuo4'],['bao1kuo3']]];
for(const [chinese,pinyin,yes,no] of cases){const w=word(chinese,pinyin);for(const a of yes)assert(ToneEngine.grade(a,w),`Rejected ${a} for ${chinese}`);for(const a of no)assert(!ToneEngine.grade(a,w),`Accepted ${a} for ${chinese}`);assert(ToneEngine.grade(yes[0].normalize('NFD'),w),'Unicode normalization');}
const csv='\ufeffchinese,pinyin,english,priority\r\n床,chuáng,"bed, couch",1\r\n白色,bái sè,"a ""white""\ncolor",2';
const rows=ToneEngine.parseCSV(csv);assert(rows.length===2,'CSV rows');assert(rows[0].english==='bed, couch','CSV commas');assert(rows[1].english==='a "white"\ncolor','CSV quotes and newlines');
const shuffled=ToneEngine.shuffle([1,2,3,4]);assert(shuffled.length===4&&new Set(shuffled).size===4,'Shuffle preserves words');
const data=ToneEngine.prepare(ToneEngine.parseCSV(database));
assert(data.words.length>6000,'Unexpectedly many exclusions');
for(const w of data.words){assert(ToneEngine.grade(w.pinyin,w),'Source pinyin rejected: '+w.chinese);assert(ToneEngine.grade(w.tones,w),'Source tones rejected');assert(ToneEngine.grade(w.syllables.map(s=>s.base+s.tone).join(''),w),'Numbered pinyin rejected: '+w.chinese);}
JSON.stringify({passed:true,total:data.words.length,defaultWords:data.words.filter(w=>w.priority<=2).length,skipped:data.skipped});
