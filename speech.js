/* Select Mandarin explicitly; never fall back to a different language. */
globalThis.WordSpeech = class {
  constructor(onStatus) {
    this.synth=globalThis.speechSynthesis;
    this.supported=!!this.synth && typeof globalThis.SpeechSynthesisUtterance==='function';
    this.enabled=true;this.voice=null;this.utterance=null;this.onStatus=onStatus;
    if(this.supported)this.synth.addEventListener('voiceschanged',()=>this.refreshVoices());
    this.refreshVoices();
  }
  refreshVoices() {
    const rank=voice=>{
      const lang=voice.lang.toLowerCase().replace(/_/g,'-');
      if(lang==='zh-cn'||lang==='cmn-cn'||lang==='cmn-hans-cn')return 0;
      if(/^cmn(-|$)/.test(lang))return 1;
      if(/^zh-(tw|sg)(-|$)/.test(lang)||lang==='zh')return 2;
      return 99;
    };
    this.voice=this.supported ? this.synth.getVoices().filter(v=>rank(v)<99).sort((a,b)=>rank(a)-rank(b))[0] || null : null;
    this.onStatus(!this.supported?'Speech playback is not supported in this browser.':!this.voice?'No Mandarin voice is available. Enable a Mandarin voice in your device’s speech settings, then reload.':'');
  }
  stop() {this.utterance=null;if(this.supported)this.synth.cancel();}
  setEnabled(enabled){this.enabled=enabled;if(!enabled)this.stop();}
  speak(text) {this.speakList([text]);}
  speakList(texts) {
    this.stop();if(!this.enabled)return;
    this.refreshVoices();if(!this.voice)return;
    const remaining=texts.filter(text=>text.trim());
    const playNext=()=>{
    const text=remaining.shift();if(!text)return;
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.voice=this.voice;utterance.lang=this.voice.lang;utterance.rate=0.85;
    this.utterance=utterance;
    utterance.onend=()=>{if(this.utterance===utterance){this.utterance=null;playNext();}};
    utterance.onerror=event=>{
      if(this.utterance!==utterance)return;
      this.utterance=null;
      if(event.error!=='canceled' && event.error!=='interrupted')this.onStatus('Could not play pronunciation. Try Replay pronunciation, or check your device’s speech settings.');
    };
    try{this.synth.speak(utterance);}catch{this.utterance=null;this.onStatus('Could not play pronunciation. Try Replay pronunciation.');}
    };
    playNext();
  }
};
