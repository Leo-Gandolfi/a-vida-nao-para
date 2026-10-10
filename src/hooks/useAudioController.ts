import { useCallback, useEffect, useRef, useState } from 'react';
import { type MotionValue } from 'framer-motion';
import { media } from '../config';
import { audioMix, audioTone, MUSIC_IN } from '../timeline';

/** Uma faixa. No modo 'webaudio' passa por ganho + filtro (o som "abafado" da ruptura);
 * no modo 'element' é um <audio> comum com volume — o plano B, que funciona em qualquer
 * navegador, só sem o filtro. */
type Track = { element: HTMLAudioElement; gain: GainNode | null; source: MediaElementAudioSourceNode | null; analyser: AnalyserNode | null };
type Mode = 'webaudio' | 'element';
type Engine = {
  mode: Mode; ctx: AudioContext | null; tone: BiquadFilterNode | null; tracks: (Track | null)[];
  enabled: boolean; disposed: boolean; unlock: HTMLAudioElement | null;
};
export type AudioDebug = Record<string, string | number | boolean | null>;

/** iPhone: o Web Audio obedece à chave de modo silencioso (categoria "ambiente") — com o
 * iPhone no silencioso, o site "tocava" sem sair som nenhum. No iOS 17+ basta declarar a
 * sessão como "playback" (como um player de música). Em versões anteriores, o truque
 * conhecido: manter um <audio> HTML comum tocando (um segundo de silêncio em loop), o que
 * muda a sessão de áudio da página para "playback". Chamado dentro do gesto. */
function startPlaybackSession(): HTMLAudioElement | null {
  try { const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession; if (s) s.type = 'playback'; } catch { /* sem suporte */ }
  try {
    const a = new Audio('/media/silencio.mp3'); a.loop = true; a.setAttribute('playsinline','');
    void a.play().catch(() => {});
    return a;
  } catch { return null; }
}

/** `play()` interrompido por um `pause()` quase simultâneo rejeita com AbortError — não é
 * o navegador recusando a reprodução, é só concorrência interna. */
function isBenignPlayInterruption(err:unknown) {
  return err instanceof DOMException && err.name==='AbortError';
}

const SOURCES = [media.openingTrack, media.finalTrack];
function newElement(src:string) {
  const el = new Audio(src); el.loop = true; el.preload = 'auto'; el.setAttribute('playsinline','');
  return el;
}

/** Scroll controla a mixagem; a música avança em tempo real, sem seek a cada pixel.
 * Ao recuar, as faixas pausam/retomam na posição em que estavam.
 * O silêncio é aplicado sem rampa: nenhuma cauda musical atravessa o ato II.
 *
 * Robustez (alguns celulares ficavam sem som — ex.: um de dois Galaxy S25 iguais):
 * 1. tenta o Web Audio (necessário para o filtro e para o iPhone no silencioso);
 * 2. se o contexto não "acorda", ou acorda mas o sinal não chega (defeito conhecido de
 *    alguns navegadores com MediaElementSource), troca sozinho para <audio> comum;
 * 3. se nada toca, `blocked` vira true e a interface avisa em vez de ficar muda.
 * Diagnóstico: abra o site com ?som na URL (ver Cinema.tsx). */
export function useAudioController(progress: MotionValue<number>) {
  const engine = useRef<Engine | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const pending = useRef<Promise<void> | null>(null);
  const userMuted = useRef(false);
  const [mutedByUser, setMutedByUser] = useState(false);
  const lastError = useRef('');
  const health = useRef('');
  const available = Boolean(media.openingTrack || media.finalTrack);

  const note = (msg:string) => { lastError.current = msg; };

  const sync = useCallback((p:number) => {
    const e = engine.current;
    if (!e || e.disposed) return;
    const mix = audioMix(p);
    const levels = [mix.opening, mix.finale];
    if (e.mode==='webaudio' && e.ctx && e.tone) e.tone.frequency.setTargetAtTime(audioTone(p), e.ctx.currentTime, .05);
    e.tracks.forEach((t,i) => {
      if (!t) return;
      const target = e.enabled && !document.hidden ? levels[i] : 0;
      if (e.mode==='webaudio' && e.ctx && t.gain) {
        const now = e.ctx.currentTime;
        t.gain.gain.cancelScheduledValues(now);
        if (target && !mix.silence) t.gain.gain.setTargetAtTime(target,now,.09); else t.gain.gain.setValueAtTime(0,now);
      } else {
        // <audio> comum: volume direto (a escala 0–1 do mix já serve). O iPhone ignora o
        // volume de <audio>, mas no iPhone o modo usado é o Web Audio.
        try { t.element.volume = Math.max(0, Math.min(1, target ? target*1.6 : 0)); } catch { /* somente leitura */ }
      }
      if (!target || mix.silence) {
        t.element.pause();
        // A canção sempre começa do início ao chegar ao encontro com Gustavo Mioto.
        if (i===1 && p < MUSIC_IN-.02 && t.element.currentTime>0) t.element.currentTime=0;
      } else if (t.element.paused) {
        void t.element.play().catch(err => {
          if (isBenignPlayInterruption(err)) return;
          note(`play: ${err instanceof Error ? err.name+' '+err.message : String(err)}`);
          if (!e.enabled || e.disposed) return;
          e.enabled = false; setEnabled(false); setBlocked(true);
          e.tracks.forEach(tr => tr?.element.pause());
        });
      }
    });
  },[]);

  /** Troca para o plano B: <audio> comum, sem Web Audio. */
  const switchToElements = useCallback((reason:string) => {
    const e = engine.current; if (!e) return;
    health.current = `plano B: ${reason}`;
    e.tracks.forEach(t => { if (t) { t.element.pause(); t.source?.disconnect(); t.gain?.disconnect(); t.analyser?.disconnect(); } });
    void e.ctx?.close().catch(() => {});
    e.ctx = null; e.tone = null; e.mode = 'element';
    e.tracks = SOURCES.map(src => src ? {element:newElement(src),gain:null,source:null,analyser:null} : null);
    sync(progress.get());
  },[progress,sync]);

  /** Depois de ligar no Web Audio, confere se o som está saindo de fato: se a faixa está
   * tocando (o tempo avança) mas o sinal no analisador é zero, o navegador está "mudo" no
   * Web Audio — troca para o plano B. */
  const checkHealth = useCallback(() => {
    const e = engine.current;
    if (!e || e.mode!=='webaudio' || !e.enabled) return;
    const t = e.tracks.find(tr => tr && !tr.element.paused && tr.element.currentTime>.3);
    if (!t || !t.analyser) { health.current = 'aguardando faixa tocar'; return; }
    const buf = new Float32Array(t.analyser.fftSize);
    t.analyser.getFloatTimeDomainData(buf);
    let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v));
    if (peak < 1e-5) switchToElements('Web Audio sem sinal');
    else health.current = `Web Audio ok (pico ${peak.toFixed(3)})`;
  },[switchToElements]);

  /** Liga o som. Idempotente. Precisa ser chamada de dentro de um gesto aceito pelo
   * navegador (clique, toque concluído, tecla): resume() e play() rodam de forma síncrona,
   * antes do primeiro await. `auto` = escuta automática do primeiro gesto, que respeita
   * quem desligou o som de propósito. */
  const enable = useCallback((auto=false):Promise<void> => {
    if (!available || (auto && userMuted.current)) return Promise.resolve();
    if (engine.current?.enabled && !pending.current) return Promise.resolve();
    if (pending.current) return pending.current;
    setError('');
    const run = (async () => {
    try {
      let e = engine.current;
      if (!e) {
        const unlock = startPlaybackSession();
        let ctx:AudioContext | null = null;
        try { ctx = new AudioContext(); } catch (err) { note(`AudioContext: ${String(err)}`); }
        if (ctx) {
          const tone = ctx.createBiquadFilter();
          tone.type='lowpass'; tone.frequency.value=audioTone(progress.get()); tone.Q.value=.7;
          tone.connect(ctx.destination);
          e = {mode:'webaudio', ctx, tone, tracks:[], enabled:true, disposed:false, unlock};
          const c = ctx;
          e.tracks = SOURCES.map(src => {
            if (!src) return null;
            const element = newElement(src);
            const source = c.createMediaElementSource(element); const gain = c.createGain(); const analyser = c.createAnalyser();
            // O analisador fica NO caminho do som (fonte → analisador → ganho → filtro): um
            // analisador pendurado fora do caminho pode nunca ser processado no Safari, o que
            // faria a verificação concluir, errado, que não há sinal.
            gain.gain.value = 0; source.connect(analyser).connect(gain).connect(tone);
            return {element,source,gain,analyser};
          });
        } else {
          e = {mode:'element', ctx:null, tone:null, enabled:true, disposed:false, unlock,
            tracks:SOURCES.map(src => src ? {element:newElement(src),gain:null,source:null,analyser:null} : null)};
        }
        engine.current = e;
      } else {
        e.enabled = true;
        if (e.unlock) void e.unlock.play().catch(() => {}); else e.unlock = startPlaybackSession();
      }
      // Ainda dentro do gesto: acorda o contexto e dá play nas faixas audíveis agora.
      const resume = e.ctx ? e.ctx.resume() : Promise.resolve();
      e.enabled = true;
      sync(progress.get());
      e.tracks.forEach(t => { if (t && t.element.paused) void t.element.play().then(()=>{ if(!audible(progress.get(),e!.tracks.indexOf(t))) t.element.pause(); }).catch(err => { if(!isBenignPlayInterruption(err)) note(`play: ${err?.name ?? err}`); }); });
      await Promise.race([resume, new Promise(r => setTimeout(r, 1500))]);
      if (e.mode==='webaudio' && e.ctx?.state !== 'running') {
        note(`AudioContext ficou "${e.ctx?.state}"`);
        switchToElements(`contexto ${e.ctx?.state}`);
      }
      e.enabled = true; userMuted.current = false; setMutedByUser(false); setBlocked(false); setEnabled(true);
      sync(progress.get());
      if (e.mode==='webaudio') { window.setTimeout(checkHealth, 2500); window.setTimeout(checkHealth, 6000); }
    } catch (err) {
      note(`enable: ${err instanceof Error ? err.name+' '+err.message : String(err)}`);
      const e=engine.current;
      if (e) { e.enabled=false; e.unlock?.pause(); sync(progress.get()); }
      setEnabled(false); setBlocked(true);
    } finally {
      pending.current = null;
    }
    })();
    pending.current = run;
    return run;
  },[available,progress,sync,switchToElements,checkHealth]);

  /** Botão "Som ligado / Ativar som". */
  const toggle = useCallback(async () => {
    const e = engine.current;
    if (e?.enabled && !pending.current) {
      userMuted.current = true; setMutedByUser(true); e.unlock?.pause();
      e.enabled = false; setEnabled(false); sync(progress.get());
      return;
    }
    userMuted.current = false;
    await enable();
    if (!engine.current?.enabled) setError('O áudio não está disponível. A história continua sem som.');
  },[enable,progress,sync]);

  /** Estado atual, para o painel de diagnóstico (?som na URL). */
  const debug = useCallback(():AudioDebug => {
    const e = engine.current;
    const info:AudioDebug = {
      navegador: navigator.userAgent,
      modo: e?.mode ?? 'não iniciado',
      contexto: e?.ctx?.state ?? '-',
      ligado: e?.enabled ?? false,
      bloqueado: blocked,
      silenciadoPeloUsuario: userMuted.current,
      sessaoAudioIOS: 'audioSession' in navigator,
      saude: health.current || '-',
      ultimoErro: lastError.current || '-',
    };
    e?.tracks.forEach((t,i) => {
      if (!t) return;
      const el = t.element;
      info[`faixa${i+1}`] = `${el.paused?'pausada':'tocando'} t=${el.currentTime.toFixed(1)}s ready=${el.readyState} net=${el.networkState} vol=${el.volume.toFixed(2)}${t.gain?` ganho=${t.gain.gain.value.toFixed(2)}`:''}${el.error?` ERRO=${el.error.code}`:''}`;
    });
    return info;
  },[blocked]);

  useEffect(() => {
    const unsub=progress.on('change',sync);
    const visibility=()=>sync(progress.get());
    document.addEventListener('visibilitychange',visibility);
    return () => {
      unsub(); document.removeEventListener('visibilitychange',visibility);
      const e=engine.current;
      if(e) { e.disposed=true; e.tracks.forEach(t=>{if(t){t.element.pause();t.element.removeAttribute('src');t.element.load();t.source?.disconnect();t.gain?.disconnect();t.analyser?.disconnect();}});e.tone?.disconnect();e.unlock?.pause();void e.ctx?.close().catch(()=>{});engine.current=null; }
    };
  },[progress,sync]);
  return {enabled,available,toggle,enable,error,mutedByUser,blocked,debug};
}

/** A faixa i deve estar tocando nesta posição do scroll? */
function audible(p:number,i:number) {
  const m = audioMix(p);
  return !m.silence && (i===0 ? m.opening : m.finale) > 0;
}
