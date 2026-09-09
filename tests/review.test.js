(() => {
  const rows=[
    {chinese:'白色',pinyin:'bái sè'},
    {chinese:'百分之',pinyin:'bǎi fēn zhī'},
    {chinese:'爸爸',pinyin:'bà ba'},
    {chinese:'白',pinyin:'bái'},
    {chinese:'北京',pinyin:'Běijīng'},
    {chinese:'白色',pinyin:'bái sè'}
  ].map(row=>({...row,english:'Example meaning',priority:'1'}));
  const index=ToneEngine.buildReviewIndex(ToneEngine.prepare(rows).words);
  assert(index.get('bai').get('2').has('白'),'Extract character from compound');
  assert(index.get('bai').get('3').has('百'),'Group another tone');
  assert(index.get('bai').get('2').get('白').sources.length===2,'Deduplicate sources while preserving single-character entry');
  assert(index.get('ba').get('4').has('爸') && index.get('ba').get('5').has('爸'),'Preserve contextual neutral reading');
  assert(index.get('jing').get('1').has('京'),'Joined pinyin alignment');
  const beijing=index.get('jing').get('1').get('京').sources[0];
  assert(beijing.syllables.map(ToneEngine.accentedSyllable).join(' ')==='běi jīng','Render aligned accented syllables for joined pinyin');
  assert(ToneEngine.accentedSyllable({base:'lü',tone:'4'})==='lǜ','Preserve umlaut with tone mark');
  assert(ToneEngine.accentedSyllable({base:'shui',tone:'3'})==='shuǐ','Mark final vowel in ui');
  assert(ToneEngine.accentedSyllable({base:'ba',tone:'5'})==='ba','Neutral syllable stays unmarked');
  const unsafe=ToneEngine.buildReviewIndex([{chinese:'白A',syllables:[{base:'bai',tone:'2'}]}]);
  assert(unsafe.size===0,'Exclude unaligned mixed-script words');
  const full=ToneEngine.buildReviewIndex(ToneEngine.prepare(ToneEngine.parseCSV(database)).words);
  for(const tones of full.values())for(const characters of tones.values())for(const entry of characters.values()){
    assert(Array.from(entry.character).length===1,'Only individual characters');
    assert(entry.sources.every(source=>source.chinese.includes(entry.character)),'Keep source evidence');
  }
  return `Review checks passed (${full.size} pinyin syllables)`;
})();
