(() => {
  const $=id=>document.getElementById(id),E=ToneEngine;
  let words=[],deck=[],index=0,correct=0,revealed=false;
  function show(id){for(const section of ['setup','game','complete'])$(section).hidden=section!==id;}
  function updateCount(){const n=words.filter(w=>w.priority<=Number($('priority').value)).length;$('word-count').textContent=`${n.toLocaleString()} words ready to practice. Shuffled each session.`;$('start').disabled=!n;}
  function nextWord(){
    if(index===deck.length){show('complete');$('result').textContent=`You got ${correct} of ${deck.length} words correct (${Math.round(correct/deck.length*100)}%).`;$('again').focus();return;}
    revealed=false;$('word').textContent=deck[index].chinese;$('progress').textContent=`Word ${index+1} of ${deck.length}`;
    $('progress-bar').max=deck.length;$('progress-bar').value=index;
    $('answer').value='';$('answer').disabled=false;$('check').disabled=false;$('skip').disabled=false;
    $('feedback').replaceChildren();$('next').hidden=true;$('score').textContent=`${correct} correct · ${index} answered`;$('answer').focus();
  }
  function addWordDetails(feedback,word){
    const value=text=>{const trimmed=(text||'').trim();return /^[-—–]$/.test(trimmed)?'':trimmed;};
    function section(title){
      const container=document.createElement('section');container.className='answer-detail';
      const heading=document.createElement('h2');heading.textContent=title;container.append(heading);feedback.append(container);return container;
    }
    function paragraph(container,text,cls='',lang=''){
      const p=document.createElement('p');p.textContent=text;p.className=cls;if(lang)p.lang=lang;container.append(p);
    }
    const example=section('Example sentence');
    const sentenceFields=[['sentence','sentence-chinese','zh-Hans'],['sentence_pinyin','','zh-Latn'],['sentence_english','translation','en']];
    let hasSentence=false;
    for(const [field,cls,lang] of sentenceFields){const text=value(word[field]);if(text){paragraph(example,text,cls,lang);hasSentence=true;}}
    if(!hasSentence)paragraph(example,'No example sentence provided in the word collection.','muted');
    const breakdown=section('character-by-character breakdown / literal translation');
    const originalCharacters=new Set(Array.from(word.chinese));
    const list=document.createElement('dl');list.className='word-breakdown';
    for(let i=1;i<=4;i++){
      const chinese=value(word['word'+i]),english=value(word['word'+i+'_english']);
      if(!chinese)continue;
      const pair=document.createElement('div'),term=document.createElement('dt'),meaning=document.createElement('dd');
      for(const character of chinese){
        if(originalCharacters.has(character)){
          const match=document.createElement('span');match.className='matching-character';match.textContent=character;term.append(match);
        }else term.append(document.createTextNode(character));
      }
      term.lang='zh-Hans';meaning.textContent=english||'Translation not provided';meaning.lang='en';pair.append(term,meaning);list.append(pair);
    }
    if(list.childElementCount)breakdown.append(list);
    else paragraph(breakdown,'No breakdown provided in the word collection.','muted');
  }
  function reveal(skip=false){
    if(revealed)return;
    const word=deck[index],ok=!skip&&E.grade($('answer').value,word);revealed=true;if(ok)correct++;
    $('answer').disabled=true;$('check').disabled=true;$('skip').disabled=true;
    const feedback=$('feedback');feedback.className=ok?'correct':'incorrect';
    const heading=document.createElement('strong');heading.textContent=ok?'Correct!':skip?'Here’s the answer':'Not quite — keep practicing.';feedback.append(heading);
    for(const [value,cls] of [[word.chinese+' · '+word.pinyin,''],['Tones: '+word.tones,''],[word.english,'translation']]){const p=document.createElement('p');p.textContent=value;p.className=cls;feedback.append(p);}
    addWordDetails(feedback,word);
    $('score').textContent=`${correct} correct · ${index+1} answered`;$('progress-bar').value=index+1;
    $('next').textContent=index+1===deck.length?'See results →':'Next word →';$('next').hidden=false;$('next').focus();
  }
  $('priority').addEventListener('change',updateCount);
  $('start-form').addEventListener('submit',event=>{event.preventDefault();deck=E.shuffle(words.filter(w=>w.priority<=Number($('priority').value)));if(!deck.length)return;index=0;correct=0;show('game');nextWord();});
  $('answer-form').addEventListener('submit',event=>{event.preventDefault();if($('answer').value.trim())reveal();});
  $('skip').addEventListener('click',()=>reveal(true));
  $('next').addEventListener('click',()=>{index++;nextWord();});
  for(const id of ['settings','again'])$(id).addEventListener('click',()=>{show('setup');$('priority').focus();});
  fetch('./chinese_word_database_20260909.csv').then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.text();}).then(text=>{
    const prepared=E.prepare(E.parseCSV(text));words=prepared.words;
    const priorities=[...new Set([2,...words.map(w=>w.priority)])].sort((a,b)=>a-b);
    for(const p of priorities){const option=document.createElement('option');option.value=p;option.textContent=p;$('priority').append(option);}
    $('priority').value='2';$('priority').disabled=false;updateCount();
    if(prepared.skipped)$('data-note').textContent=`${prepared.skipped} entries excluded because their pronunciation or required fields could not be parsed reliably.`;
  }).catch(error=>{$('word-count').textContent='Could not load the word collection. Serve this folder with a local web server, then reload.';$('data-note').textContent=error.message;});
})();
