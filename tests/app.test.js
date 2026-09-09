/* Exercise the real app entry point with a small DOM/fetch adapter. */
(() => {
  class Element {
    constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.disabled=false;this.hidden=false;this._value='';this._text='';}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=[...children];this._value='';this._text='';}
    set textContent(text){this._text=String(text);this.children=[];}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
    set value(value){this._value=String(value);}
    get value(){return this.tagName==='select' ? (this.children.find(c=>c.value===this._value)||this.children[0])?.value || '' : this._value;}
    setAttribute(name,value){this[name]=value;}
    addEventListener(name,callback){this.listeners[name]=callback;}
    focus(){}
    get childElementCount(){return this.children.length;}
    fire(name){assert(!this.disabled,'Cannot interact with disabled control');this.listeners[name]({preventDefault(){}});}
  }
  const elements={};
  for(const match of htmlSource.matchAll(/<([a-z]+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)){
    const element=new Element(match[1]);element.disabled=/\bdisabled\b/.test(match[2]);element.hidden=/\bhidden\b/.test(match[2]);element.checked=/\bchecked\b/.test(match[2]);elements[match[3]]=element;
  }
  const initial=new Element('option');initial.value='5';elements['review-priority'].append(initial);
  const document={getElementById:id=>elements[id],createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text}),querySelectorAll:()=>[]};
  const window={addEventListener(){}};
  const storage={getItem:()=>null,setItem(){}};
  const chain=value=>({then(fn){try{return chain(fn(value));}catch(error){return {catch(fn){fn(error);}};}},catch(){return this;}});
  const fetch=()=>chain({ok:true,text:()=>database});
  const Speech=class {constructor(){this.supported=true;this.enabled=true;}setEnabled(value){this.enabled=value;}stop(){}speak(){}speakList(){}};
  new Function('document','window','localStorage','fetch','WordSpeech','ToneEngine',appSource)(document,window,storage,fetch,Speech,ToneEngine);
  const priority=elements['review-priority'];
  assert(!elements['open-review'].disabled,'App initialization failed: '+elements['data-note'].textContent);
  assert(!priority.disabled && priority.value==='5','Review priority enabled with default 5');
  assert(priority.children.map(o=>o.value).join(',')==='1,2,3,4,5,6,7,8','All priority choices populated without duplicates');
  elements['open-review'].fire('click');
  assert(!elements.review.hidden,'Review opens');
  const words=ToneEngine.prepare(ToneEngine.parseCSV(database)).words;
  for(const maximum of [1,8,2]){
    priority.value=maximum;priority.fire('change');
    const expected=ToneEngine.buildReviewIndex(words.filter(w=>w.priority<=maximum));
    assert(elements['review-pinyin'].children.length===expected.size,'Pinyin options follow changed priority '+maximum);
    const base=elements['review-pinyin'].value;
    const expectedCharacters=[...expected.get(base).values()].flatMap(group=>[...group.keys()]);
    const actualCharacters=[];
    function walk(node){if(node.className?.split(' ').includes('review-hanzi'))actualCharacters.push(node.textContent);for(const child of node.children||[])walk(child);}
    walk(elements['review-groups']);
    assert(actualCharacters.sort().join('')===expectedCharacters.sort().join(''),'Rendered characters follow changed priority '+maximum);
  }
  assert(elements.priority.value==='2','Review changes leave game priority independent');
  for(const asset of ['engine.js','speech.js','app.js'])assert(htmlSource.includes(asset+'?v='),'Versioned asset '+asset);
  return 'App initialization and review priority interaction checks passed';
})();
