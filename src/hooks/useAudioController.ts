import { useCallback, useEffect, useRef, useState } from 'react';
import { type MotionValue } from 'framer-motion';
import { media } from '../config';
import { audioMix, audioTone } from '../timeline';

type Track = { element: HTMLAudioElement; gain: GainNode; source: MediaElementAudioSourceNode };
type Engine = { ctx: AudioContext; tracks: (Track | null)[]; tone: BiquadFilterNode; enabled: boolean; disposed: boolean };

/** Scroll controla a mixagem; a música avança em tempo real, sem seek a cada pixel.
 * Ao recuar, as faixas pausam/retomam na posição em que estavam.
 * O silêncio é aplicado sem rampa: nenhuma cauda musical atravessa o ato II.
 * Todas as faixas passam por um mesmo filtro passa-baixa (ver audioTone), que abafa o
 * som na ruptura e o reabre quando a história recomeça.
 */
export function useAudioController(progress: MotionValue<number>) {
  const engine = useRef<Engine | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const available = Boolean(media.openingTrack || media.finalTrack);
  const sync = useCallback((p:number) => {
    const e = engine.current;
    if (!e || e.disposed) return;
    const mix = audioMix(p);
    const levels = [mix.opening, mix.finale];
    e.tone.frequency.setTargetAtTime(audioTone(p), e.ctx.currentTime, .05);
    e.tracks.forEach((t,i) => {
      if (!t) return;
      const target = e.enabled && !document.hidden ? levels[i] : 0;
      const now = e.ctx.currentTime;
      t.gain.gain.cancelScheduledValues(now);
      if (!target || mix.silence) {
        t.gain.gain.setValueAtTime(0,now);
        t.element.pause();
      } else {
        t.gain.gain.setTargetAtTime(target,now,.09);
        if (t.element.paused) void t.element.play().catch(() => {
          if (!e.enabled || e.disposed) return;
          e.enabled = false;
          e.tracks.forEach(track => { if (track) { track.gain.gain.cancelScheduledValues(e.ctx.currentTime); track.gain.gain.setValueAtTime(0,e.ctx.currentTime); track.element.pause(); } });
          setEnabled(false); setError('Não foi possível reproduzir a trilha. Você pode continuar sem som.');
        });
      }
    });
  },[]);

  const toggle = useCallback(async () => {
    if (!available) return;
    setError('');
    try {
      if (!engine.current) {
        const ctx = new AudioContext();
        const tone = ctx.createBiquadFilter();
        tone.type='lowpass'; tone.frequency.value=audioTone(progress.get()); tone.Q.value=.7;
        tone.connect(ctx.destination);
        const e:Engine = {ctx, tracks:[], tone, enabled:false, disposed:false};
        engine.current = e;
        e.tracks = [media.openingTrack,media.finalTrack].map(src => {
          if (!src) return null;
          const element = new Audio(src); element.loop=true; element.preload='metadata';
          const source=ctx.createMediaElementSource(element); const gain=ctx.createGain();
          gain.gain.value=0; source.connect(gain).connect(tone);
          return {element,source,gain};
        });
        // Chamadas play/resume originam-se no gesto do usuário, inclusive no Safari.
        const resume = ctx.resume();
        await Promise.all([resume,...e.tracks.map(t => t?.element.play())]);
      }
      const e = engine.current!;
      await e.ctx.resume(); e.enabled=!e.enabled; setEnabled(e.enabled);
      sync(progress.get());
    } catch {
      const e=engine.current;
      if (e) { e.enabled=false; sync(progress.get()); }
      setEnabled(false); setError('O áudio não está disponível. A história continua sem som.');
    }
  },[available,progress,sync]);

  useEffect(() => {
    const unsub=progress.on('change',sync);
    const visibility=()=>sync(progress.get());
    document.addEventListener('visibilitychange',visibility);
    return () => {
      unsub(); document.removeEventListener('visibilitychange',visibility);
      const e=engine.current;
      if(e) { e.disposed=true; e.tracks.forEach(t=>{if(t){t.element.pause();t.element.removeAttribute('src');t.element.load();t.source.disconnect();t.gain.disconnect();}});e.tone.disconnect();void e.ctx.close();engine.current=null; }
    };
  },[progress,sync]);
  return {enabled,available,toggle,error};
}
