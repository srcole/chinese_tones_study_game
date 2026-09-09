(() => {
  const $=id=>document.getElementById(id),E=ToneEngine;
  let words=[],deck=[],index=0,correct=0,revealed=false;
  let reviewIndex=new Map();
  const speech=new WordSpeech(message=>{$('speech-status').textContent=message;});
  try{$('sound').checked=localStorage.getItem('tone-garden-sound')!=='off';}catch{}
  speech.setEnabled($('sound').checked);$('sound').disabled=!speech.supported;
  $('sound').addEventListener('change',()=>{
    speech.setEnabled($('sound').checked);$('replay').disabled=!speech.enabled||!speech.supported;
    document.querySelectorAll('.review-audio').forEach(button=>{button.disabled=!speech.enabled||!speech.supported;});
    try{localStorage.setItem('tone-garden-sound',speech.enabled?'on':'off');}catch{}
  });
  $('replay').addEventListener('click',()=>{if(revealed && !$('game').hidden)speech.speak(deck[index].chinese);});
  window.addEventListener('pagehide',()=>speech.stop());
  function show(id){for(const section of ['setup','game','complete','review'])$(section).hidden=section!==id;}
  function renderReview(){
    speech.stop();
    const base=$('review-pinyin').value,tones=reviewIndex.get(base);
    $('review-groups').replaceChildren();const unique=new Set();
    for(const tone of ['1','2','3','4','5']){
      const section=document.createElement('section');section.className='review-tone';
      const heading=document.createElement('h2');heading.textContent=tone==='5'?`${base}5 · Neutral tone (0 or 5)`:`${base}${tone} · Tone ${tone}`;section.append(heading);
      const entries=Array.from(tones?.get(tone)?.values() || []).sort((a,b)=>a.character.localeCompare(b.character,'zh'));
      if(!entries.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='No characters found in the word collection.';section.append(empty);}
      const cards=document.createElement('div');cards.className='review-characters';
      for(const entry of entries){
        unique.add(entry.character);
        const audioButton=(text,label,texts,cls='')=>{
          const button=document.createElement('button');button.type='button';button.className='review-audio '+cls;button.textContent=text;button.setAttribute('aria-label',label);button.title=label;
          button.disabled=!speech.enabled||!speech.supported;button.addEventListener('click',()=>speech.speakList(texts));return button;
        };
        const card=document.createElement('article');
        const character=tone==='5'?document.createElement('p'):audioButton(entry.character,`Listen to ${entry.character}`,[entry.character],'review-hanzi');
        if(tone==='5'){character.className='review-hanzi';character.textContent=entry.character;}
        card.className='review-character';character.lang='zh-Hans';card.append(character);
        card.append(audioButton('Listen to all words',`Listen to all source words for ${entry.character}`,entry.sources.map(source=>source.chinese),'text-button'));
        const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`Source words (${entry.sources.length})`;details.append(summary);
        const list=document.createElement('ul');
        for(const source of entry.sources){
          const item=document.createElement('li');
          const wordButton=audioButton('',`Listen to ${source.chinese}`,[source.chinese],'text-button');wordButton.lang='zh-Hans';item.append(wordButton);
          const pinyin=document.createElement('span');pinyin.lang='zh-Latn';
          const appendPart=(parent,text,matched)=>{
            if(!matched){parent.append(document.createTextNode(text));return;}
            const highlight=document.createElement('u');highlight.className='matching-character';highlight.textContent=text;parent.append(highlight);
          };
          Array.from(source.chinese).forEach((character,i)=>{
            const matched=character===entry.character;
            appendPart(wordButton,character,matched);
            if(i)pinyin.append(document.createTextNode(' '));
            appendPart(pinyin,E.accentedSyllable(source.syllables[i]),matched);
          });
          item.append(pinyin);
          const english=document.createElement('span');english.textContent=source.english;english.lang='en';item.append(english);
          list.append(item);
        }
        details.append(list);card.append(details);cards.append(card);
      }
      section.append(cards);$('review-groups').append(section);
    }
    $('review-count').textContent=base?`${unique.size} distinct characters for “${base}”.`:'No characters found at this priority. Try a higher maximum.';
  }
  function updateReviewFilter(){
    const previous=$('review-pinyin').value;
    reviewIndex=E.buildReviewIndex(words.filter(word=>word.priority<=Number($('review-priority').value)));
    $('review-pinyin').replaceChildren();
    for(const base of Array.from(reviewIndex.keys()).sort((a,b)=>a.localeCompare(b))){const option=document.createElement('option');option.value=base;option.textContent=base;$('review-pinyin').append(option);}
    if(reviewIndex.has(previous))$('review-pinyin').value=previous;
    else if(reviewIndex.has('ba'))$('review-pinyin').value='ba';
    $('review-pinyin').disabled=reviewIndex.size===0;
    renderReview();
  }
  $('open-review').addEventListener('click',()=>{speech.stop();show('review');renderReview();$('review-pinyin').focus();});
  $('review-home').addEventListener('click',()=>{speech.stop();show('setup');$('open-review').focus();});
  $('review-pinyin').addEventListener('change',renderReview);
  $('review-priority').addEventListener('change',updateReviewFilter);
  function updateCount(){const n=words.filter(w=>w.priority<=Number($('priority').value)).length;$('word-count').textContent=`${n.toLocaleString()} words ready to practice. Shuffled each session.`;$('start').disabled=!n;}
  function nextWord(){
    speech.stop();$('replay').hidden=true;
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
    $('replay').hidden=false;$('replay').disabled=!speech.enabled||!speech.supported;speech.speak(word.chinese);
  }
  $('priority').addEventListener('change',updateCount);
  $('start-form').addEventListener('submit',event=>{event.preventDefault();deck=E.shuffle(words.filter(w=>w.priority<=Number($('priority').value)));if(!deck.length)return;index=0;correct=0;show('game');nextWord();});
  $('answer-form').addEventListener('submit',event=>{event.preventDefault();if($('answer').value.trim())reveal();});
  $('skip').addEventListener('click',()=>reveal(true));
  $('next').addEventListener('click',()=>{index++;nextWord();});
  for(const id of ['settings','again'])$(id).addEventListener('click',()=>{speech.stop();show('setup');$('priority').focus();});
  fetch('./chinese_word_database_20260909.csv').then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.text();}).then(text=>{
    const prepared=E.prepare(E.parseCSV(text));words=prepared.words;
    const priorities=[...new Set([2,5,...words.map(w=>w.priority)])].sort((a,b)=>a-b);
    for(const id of ['priority','review-priority'])$(id).replaceChildren();
    for(const p of priorities)for(const id of ['priority','review-priority']){const option=document.createElement('option');option.value=p;option.textContent=p;$(id).append(option);}
    $('review-priority').value='5';$('review-priority').disabled=false;updateReviewFilter();$('open-review').disabled=words.length===0;
    $('priority').value='2';$('priority').disabled=false;updateCount();
    if(prepared.skipped)$('data-note').textContent=`${prepared.skipped} entries excluded because their pronunciation or required fields could not be parsed reliably.`;
  }).catch(error=>{$('word-count').textContent='Could not load the word collection. Serve this folder with a local web server, then reload.';$('data-note').textContent=error.message;});
})();
