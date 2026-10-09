import { useCallback, useEffect, useRef, useState } from 'react';
import { type MotionValue } from 'framer-motion';
import { media } from '../config';
import { audioMix, audioTone, MUSIC_IN } from '../timeline';

type Track = { element: HTMLAudioElement; gain: GainNode; source: MediaElementAudioSourceNode };
type Engine = { ctx: AudioContext; tracks: (Track | null)[]; tone: BiquadFilterNode; enabled: boolean; disposed: boolean };

/** `play()` interrompido por um `pause()` quase simultâneo (ex.: o scroll muda de
 * mixagem no exato instante em que o áudio é ligado) rejeita com AbortError — não é o
 * navegador recusando a reprodução, é só a própria concorrência interna. Só uma recusa
 * de verdade (NotAllowedError, política de autoplay) deve desligar o áudio e avisar. */
function isBenignPlayInterruption(err:unknown) {
  return err instanceof DOMException && err.name==='AbortError';
}

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
  // Uma ativação em andamento: chamadas simultâneas (toque na cortina + escuta global
  // do primeiro gesto) reaproveitam a mesma, em vez de uma desligar o que a outra ligou.
  const pending = useRef<Promise<void> | null>(null);
  // A pessoa desligou o som pelo botão: nenhum gesto posterior religa sozinho.
  const userMuted = useRef(false);
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
        // A canção sempre começa do início ao chegar ao encontro com Gustavo Mioto:
        // quem volta para antes dele e avança de novo ouve "Impressionando os Anjos" do começo.
        if (i===1 && p < MUSIC_IN-.02 && t.element.currentTime>0) t.element.currentTime=0;
      } else {
        t.gain.gain.setTargetAtTime(target,now,.09);
        if (t.element.paused) void t.element.play().catch(err => {
          if (isBenignPlayInterruption(err)) return; // um pause() concorrente, nada de errado
          if (!e.enabled || e.disposed) return;
          e.enabled = false;
          e.tracks.forEach(track => { if (track) { track.gain.gain.cancelScheduledValues(e.ctx.currentTime); track.gain.gain.setValueAtTime(0,e.ctx.currentTime); track.element.pause(); } });
          setEnabled(false); setError('Não foi possível reproduzir a trilha. Você pode continuar sem som.');
        });
      }
    });
  },[]);

  /** Liga o som. Idempotente: se já está ligado ou ligando, não faz nada de novo.
   * Precisa ser chamada de dentro de um gesto aceito pelo navegador (clique, toque
   * concluído, tecla): o resume() e os play() abaixo rodam de forma síncrona, ainda
   * dentro do gesto, antes do primeiro await. `auto` = chamada pela escuta automática
   * do primeiro gesto, que respeita quem desligou o som de propósito. */
  const enable = useCallback((auto=false):Promise<void> => {
    if (!available || (auto && userMuted.current)) return Promise.resolve();
    if (engine.current?.enabled && !pending.current) return Promise.resolve();
    if (pending.current) return pending.current;
    setError('');
    const run = (async () => {
    try {
      if (!engine.current) {
        const ctx = new AudioContext();
        const tone = ctx.createBiquadFilter();
        tone.type='lowpass'; tone.frequency.value=audioTone(progress.get()); tone.Q.value=.7;
        tone.connect(ctx.destination);
        // enabled já começa true: se o scroll disparar um sync() concorrente enquanto o
        // play() inicial ainda está em voo (linhas abaixo), ele calcula o ganho real da
        // mixagem em vez de forçar silêncio — o que evitaria uma corrida play()/pause().
        const e:Engine = {ctx, tracks:[], tone, enabled:true, disposed:false};
        engine.current = e;
        e.tracks = [media.openingTrack,media.finalTrack].map(src => {
          if (!src) return null;
          const element = new Audio(src); element.loop=true; element.preload='metadata';
          const source=ctx.createMediaElementSource(element); const gain=ctx.createGain();
          gain.gain.value=0; source.connect(gain).connect(tone);
          return {element,source,gain};
        });
        // Chamadas play/resume originam-se no gesto do usuário, inclusive no Safari.
        // Uma rejeição isolada por AbortError (ver isBenignPlayInterruption) não derruba
        // a ativação inteira — só uma recusa real de autoplay deve fazer isso.
        const resume = ctx.resume();
        const plays = e.tracks.map(t => t?.element.play().catch(err => {
          if (isBenignPlayInterruption(err)) return;
          throw err;
        }));
        await Promise.all([resume,...plays]);
      } else {
        const e = engine.current;
        e.enabled = true;
        const resume = e.ctx.resume();
        sync(progress.get()); // play() das faixas audíveis, ainda dentro do gesto
        await resume;
      }
      const e = engine.current!;
      if (e.ctx.state !== 'running') throw new Error('suspended');
      e.enabled = true; userMuted.current = false; setEnabled(true);
      sync(progress.get());
    } catch {
      const e=engine.current;
      if (e) { e.enabled=false; sync(progress.get()); }
      // Sem mensagem de erro: o próximo toque tenta de novo (ver Cinema.tsx).
      setEnabled(false);
    } finally {
      pending.current = null;
    }
    })();
    pending.current = run;
    return run;
  },[available,progress,sync]);

  /** Botão "Som ligado / Sem som". */
  const toggle = useCallback(async () => {
    const e = engine.current;
    if (e?.enabled && !pending.current) {
      userMuted.current = true;
      e.enabled = false; setEnabled(false); sync(progress.get());
      return;
    }
    userMuted.current = false;
    await enable();
    if (!engine.current?.enabled) setError('O áudio não está disponível. A história continua sem som.');
  },[enable,progress,sync]);

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
  return {enabled,available,toggle,enable,error};
}
