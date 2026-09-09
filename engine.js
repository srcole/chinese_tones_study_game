/* Pure parsing and grading functions, shared by the app and tests. */
globalThis.ToneEngine = (() => {
  const toneMarks = {'\u0304':'1','\u0301':'2','\u030c':'3','\u0300':'4'};
  const syllables = new Set(('a ai an ang ao ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu ca cai can cang cao ce cen ceng cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo ci cong cou cu cuan cui cun cuo da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo e ei en eng er fa fan fang fei fen feng fo fou fu ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun ka kai kan kang kao ke ken keng kong kou ku kua kuai kuan kuang kui kun kuo la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu lo long lou lu luan lun luo lü lüe ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nuo nü nüe o ou pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun ran rang rao re ren reng ri rong rou ru ruan rui run ruo sa sai san sang sao se sen seng sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo si song sou su suan sui sun suo ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo wa wai wan wang wei wen weng wo wu xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun ya yan yang yao ye yi yin ying yo yong you yu yuan yue yun za zai zan zang zao ze zei zen zeng zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo zi zong zou zu zuan zui zun zuo m n ng hm hng').split(' '));
  const clean = s => s.normalize('NFC').toLowerCase().replace(/[\u200b-\u200d\ufeff]/g,'').replace(/u:|v/g,'ü');
  function letters(s) {
    const out=[];
    for(const ch of clean(s).normalize('NFD')) {
      if(ch==='\u0308' && out.length) out[out.length-1].base='ü';
      else if(toneMarks[ch] && out.length) out[out.length-1].tone=toneMarks[ch];
      else out.push({base:ch,tone:''});
    }
    return out;
  }
  function parsePinyin(s, count) {
    const chars=letters(s); const memo=new Map();
    function walk(at,left) {
      while(at<chars.length && /[\s'’·-]/.test(chars[at].base)) at++;
      if(at===chars.length) return left===0 ? [] : null;
      if(left<=0) return null;
      const key=at+':'+left;if(memo.has(key)) return memo.get(key);
      for(let end=Math.min(at+6,chars.length);end>at;end--) {
        const part=chars.slice(at,end),base=part.map(c=>c.base).join('');
        if(!syllables.has(base)) continue;
        const marks=part.filter(c=>c.tone);if(marks.length>1) continue;
        let tone=marks[0]?.tone || '5',next=end;
        if(next<chars.length && /^[0-5]$/.test(chars[next].base)) {
          const numbered=chars[next].base==='0'?'5':chars[next].base;
          if(marks.length && numbered!==tone) continue;
          tone=numbered;next++;
        }
        const rest=walk(next,left-1);
        if(rest!==null){const result=[{base,tone},...rest];memo.set(key,result);return result;}
      }
      memo.set(key,null);return null;
    }
    return walk(0,count);
  }
  function grade(answer,word) {
    const normalized=clean(answer).trim();
    if(/^[0-5\s]+$/.test(normalized)) return normalized.replace(/\s/g,'').replace(/0/g,'5')===word.tones;
    const parsed=parsePinyin(normalized,word.syllables.length);
    return !!parsed && parsed.every((s,i)=>s.base===word.syllables[i].base && s.tone===word.syllables[i].tone);
  }
  function parseCSV(text) {
    const rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(c==='"'){if(quoted && text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
      else if(c===',' && !quoted){row.push(field);field='';}
      else if((c==='\n'||c==='\r') && !quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';}
      else field+=c;
    }
    if(quoted)throw new Error('The CSV contains an unclosed quoted field.');
    row.push(field);if(row.some(Boolean))rows.push(row);
    const headers=rows.shift()?.map(h=>h.replace(/^\ufeff/,'').trim()) || [];
    for(const key of ['chinese','pinyin','english','priority'])if(!headers.includes(key))throw new Error('Missing CSV column: '+key);
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
  }
  function prepare(rows) {
    const words=[];let skipped=0;
    for(const row of rows){
      const chinese=row.chinese.trim(),pinyin=row.pinyin.trim();
      const count=Array.from(chinese).filter(c=>/\p{Script=Han}/u.test(c)).length;
      const parsed=parsePinyin(pinyin,count),priority=Number(row.priority);
      if(!count || !parsed || !row.english.trim() || !row.priority.trim() || !Number.isFinite(priority)){skipped++;continue;}
      words.push({...row,chinese,pinyin,priority,syllables:parsed,tones:parsed.map(s=>s.tone).join('')});
    }
    return {words,skipped};
  }
  function shuffle(words){const deck=[...words];for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
  function buildReviewIndex(words){
    const index=new Map();
    for(const word of words){
      const characters=Array.from(word.chinese);
      // Only align words made entirely of Han characters, one per syllable.
      if(characters.length!==word.syllables.length || !characters.every(c=>/\p{Script=Han}/u.test(c)))continue;
      characters.forEach((character,i)=>{
        const {base,tone}=word.syllables[i];
        if(!index.has(base))index.set(base,new Map());
        const tones=index.get(base);
        if(!tones.has(tone))tones.set(tone,new Map());
        const group=tones.get(tone);
        if(!group.has(character))group.set(character,{character,sources:[]});
        const sources=group.get(character).sources;
        if(!sources.some(s=>s.chinese===word.chinese && s.pinyin===word.pinyin))sources.push({chinese:word.chinese,pinyin:word.pinyin,english:word.english,syllables:word.syllables});
      });
    }
    return index;
  }
  function accentedSyllable({base,tone}){
    if(tone==='5')return base;
    const marks={'1':'\u0304','2':'\u0301','3':'\u030c','4':'\u0300'};
    let position=base.indexOf('a');
    if(position<0)position=base.indexOf('e');
    if(position<0 && base.includes('ou'))position=base.indexOf('o');
    if(position<0)for(let i=0;i<base.length;i++)if(/[aeiouü]/.test(base[i]))position=i;
    if(position<0)position=base.indexOf('m')>=0?base.indexOf('m'):base.indexOf('n');
    if(position<0)return base;
    return (base.slice(0,position+1)+marks[tone]+base.slice(position+1)).normalize('NFC');
  }
  return {parseCSV,parsePinyin,prepare,grade,shuffle,buildReviewIndex,accentedSyllable};
})();
