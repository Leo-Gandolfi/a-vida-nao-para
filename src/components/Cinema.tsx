"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { acts, beats, beatAt, plain } from '../timeline';
import { useAudioController } from '../hooks/useAudioController';
import FilmFrame from './FilmFrame';
import { isTouch, useInWindow } from '../hooks/useInWindow';
import FloatingElements from './FloatingElements';
import StageSky from './StageSky';
import ProjectDialog from './ProjectDialog';

/** Distância (em vw) entre o início de um quadro e o início do próximo.
 * Mantida em sincronia com a largura de ".frame-slot" + o "gap" de ".filmstrip-track"
 * em styles.css (86vw + 4vw = 90vw), para que a rolagem horizontal calculada aqui
 * corresponda exatamente ao que é desenhado em CSS. */
const SLOT_VW = 90;

/** Rola suavemente até `left` num ritmo lento e previsível (o "smooth" nativo do
 * navegador é rápido e não permite controlar a duração). Retorna uma função para
 * cancelar a animação a qualquer momento — usada quando o visitante retoma o controle. */
function slowScrollTo(el:HTMLElement,left:number,duration:number,onDone:()=>void) {
  if(duration<=0){el.scrollTo({left,behavior:'instant'});onDone();return ()=>{};}
  const startX=el.scrollLeft,delta=left-startX,startTime=performance.now();
  let cancelled=false;
  const ease=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function step(now:number) {
    if(cancelled)return;
    const t=Math.min(1,(now-startTime)/duration);
    el.scrollTo(startX+delta*ease(t),0);
    if(t<1)requestAnimationFrame(step);else onDone();
  }
  requestAnimationFrame(step);
  return ()=>{cancelled=true;};
}

/** Alto-falante: com ondas (som ligado) ou cortado (sem som). */
function SpeakerIcon({on}:{on:boolean}) {
  return <svg className="speaker-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/>
    {on ? <><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></> : <><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/></>}
  </svg>;
}

/** Diagnóstico de som: abra o site com ?som na URL (ex.: avidanaopara.com.br/?som) e mande
 * um print deste painel — mostra navegador, modo de áudio, estado de cada faixa e o último erro. */
const debugAudio = typeof location!=='undefined' && new URLSearchParams(location.search).has('som');
function AudioDebugPanel({read,onTry}:{read:()=>Record<string,unknown>;onTry:()=>void}) {
  const [info,setInfo]=useState<Record<string,unknown>>(()=>read());
  useEffect(()=>{const id=window.setInterval(()=>setInfo(read()),500);return ()=>window.clearInterval(id);},[read]);
  return <div className="audio-debug">
    <strong>Diagnóstico de som</strong>
    {Object.entries(info).map(([k,v])=><div key={k}><b>{k}:</b> {String(v)}</div>)}
    <button type="button" onClick={onTry}>Tentar ligar o som</button>
  </div>;
}

/** ROLO DE FILME
 * A rolagem é horizontal: arraste ou deslize para o lado (mouse, trackpad, toque ou
 * teclado) para puxar a fita de quadros por uma janela de projeção. Cada quadro entra
 * pela direita, cruza o centro (onde fica nítido) e sai pela esquerda. A roda vertical
 * do mouse também funciona — é convertida em deslocamento lateral automaticamente.
 */
export default function Cinema() {
  const container=useRef<HTMLElement>(null);
  const {scrollXProgress:raw}=useScroll({container});
  const reduced=Boolean(useReducedMotion());
  const p=raw;
  const audio=useAudioController(p);
  const [act,setAct]=useState(0);
  const [frame,setFrame]=useState(1);
  const [final,setFinal]=useState(false);
  const [quiet,setQuiet]=useState(false);
  const [dialog,setDialog]=useState(false);
  const [shareMessage,setShareMessage]=useState('');
  const [shareFallback,setShareFallback]=useState(false);
  const [reading,setReading]=useState(false);
  const chromeOpacity=useTransform(p,[0,.33,.34,.445,.45,1],[1,1,0,0,1,1]);
  const finalOpacity=useTransform(p,[.979,.987,1],[0,1,1]);
  // Na cartela final o rodapé sai de cena: nada disputa atenção com o convite.
  const footerOpacity=useTransform(p,[0,.33,.34,.445,.45,.975,.984,1],[1,1,0,0,1,1,0,0]);

  const mids=useMemo(()=>beats.map(b=>(b.start+b.end)/2),[]);
  const trackX=useTransform(
    p,
    [0,...mids,1],
    [0,...beats.map((_,i)=>-i*SLOT_VW),-(beats.length-1)*SLOT_VW],
  );
  const trackXvw=useTransform(trackX,v=>`${v}vw`);

  // Em "A vida não parou", uma luz quente atravessa a tela da esquerda para a direita.
  const sweepX=useTransform(p,[.450,.515],['-120%','120%']);
  const sweepOpacity=useTransform(p,[.450,.470,.500,.515],[0,.85,.85,0]);
  const sweepOn=useInWindow(p,.448,.517);

  // A fita de sprockets que corre pelo alto e pela base da tela inteira, sempre —
  // não só ao redor de cada quadro — para que a experiência inteira pareça acontecer
  // dentro de um rolo de filme físico. Avança em passo com o scroll, não com o relógio.
  const ribbonX=useTransform(p,[0,1],['0px','-4200px']);

  // Cortina de abertura: nada na tela além do convite a rolar — a história só começa a
  // aparecer no primeiro gesto. Passa a p=0,006 (bem no início do percurso); o quadro
  // só é desmontado depois de o fade terminar (0,008), para não sumir de repente.
  const gateOpacity=useTransform(p,[0,.006],[1,0]);
  const [started,setStarted]=useState(p.get()>.008);
  // Rolar a roda do mouse sozinha não é um "gesto do usuário" reconhecido pelo navegador
  // para liberar áudio — só clique, toque e tecla contam (ver o efeito de som mais
  // abaixo). Por isso a cortina de abertura é ela mesma um botão: tocar/clicar nela liga
  // o som direto (gesto garantido) e dá um empurrãozinho na fita, como apertar "play".
  // A cortina fica POR CIMA da fita, então rolar sobre ela não chegaria até a fita.
  // Roda do mouse/trackpad: repassada para a fita (mesmo deslize com inércia de sempre).
  // Deslize de dedo: conta como "começar" — e o fim do deslize (touchend) é um gesto
  // aceito pelo navegador, então também liga o som, como o toque.
  const gateTouch=useRef<{x:number;y:number}|null>(null);
  function onGateWheel(e:React.WheelEvent) {
    container.current?.dispatchEvent(new WheelEvent('wheel',{deltaX:e.deltaX,deltaY:e.deltaY,deltaMode:e.deltaMode,bubbles:true,cancelable:true}));
  }
  function onGateTouchStart(e:React.TouchEvent) {const t=e.touches[0];gateTouch.current={x:t.clientX,y:t.clientY};}
  function onGateTouchEnd(e:React.TouchEvent) {
    const start=gateTouch.current,t=e.changedTouches[0];gateTouch.current=null;
    if(!start||!t)return;
    const dx=t.clientX-start.x,dy=t.clientY-start.y;
    if(Math.hypot(dx,dy)<18)return; // toque simples: o onClick cuida
    activateIntro(Math.abs(dx)>Math.abs(dy)?-dx:-dy);
  }
  function activateIntro(swipe=0) {
    void audio.enable();
    setStarted(true); // some já, não depende de cruzar o limiar de scroll do fade
    const el=container.current;if(!el)return;
    // Deslize para a frente leva direto ao segundo quadro; toque ou deslize curto dá só
    // o empurrãozinho inicial (o encaixe centraliza o primeiro quadro).
    if(swipe>60){el.dispatchEvent(new WheelEvent('wheel',{deltaY:el.clientWidth*.9,bubbles:true,cancelable:true}));return;}
    if(el.scrollLeft<24)el.scrollTo({left:24,behavior:'smooth'});
  }

  useMotionValueEvent(p,'change',v=>{
    const next=acts.reduce((index,a,i)=>v>=a.at?i:index,0);
    setAct(old=>old===next?old:next);
    const b=beatAt(v);if(b){const n=beats.indexOf(b)+1;setFrame(old=>old===n?old:n);}
    const f=v>=.984;setFinal(old=>old===f?old:f);
    const q=v>=.34&&v<.45;setQuiet(old=>old===q?old:q);
    const s=v>.008;setStarted(old=>old||s);
  });
  function leftFor(value:number) {
    const el=container.current;if(!el)return null;
    return (el.scrollWidth-el.clientWidth)*value;
  }
  function jump(value:number) {
    const el=container.current;const left=leftFor(value);if(el===null||left===null)return;
    el.scrollTo({left,behavior:'instant'});
  }
  // A roda vertical do mouse não rola um contêiner horizontal por padrão — é convertida
  // aqui em deslocamento lateral, para que "rolar" continue funcionando sem exigir shift
  // ou um trackpad. Setas para cima/baixo e Page Up/Down também avançam de lado, para
  // quem está acostumado com a convenção vertical.
  // Em vez de saltar a cada "clique" da roda, a fita persegue um alvo com inércia
  // (cada quadro de animação percorre uma fração do que falta), como um rolo pesado.
  useEffect(()=>{
    const el=container.current;if(!el||reading)return;
    let target=el.scrollLeft,raf=0,last=-1;
    function glide() {
      const cur=el!.scrollLeft;
      // Algo além do deslize moveu a fita (toque, link "Ir para o convite", encaixe):
      // ele cede o controle em vez de puxar de volta para um alvo velho.
      if(last>=0 && Math.abs(cur-last)>2){raf=0;last=-1;return;}
      const d=target-cur;
      if(Math.abs(d)<1){el!.scrollLeft=target;raf=0;last=-1;return;}
      el!.scrollLeft=cur+Math.sign(d)*Math.max(Math.abs(d)*(reduced?1:.14),1);
      last=el!.scrollLeft;
      raf=requestAnimationFrame(glide);
    }
    function push(delta:number) {
      if(!delta)return;
      if(!raf)target=el!.scrollLeft;
      target=Math.max(0,Math.min(el!.scrollWidth-el!.clientWidth,target+delta));
      if(!raf)raf=requestAnimationFrame(glide);
    }
    function stop() {if(raf){cancelAnimationFrame(raf);raf=0;last=-1;}}
    function onWheel(e:WheelEvent) {
      const unit=e.deltaMode===1?16:e.deltaMode===2?el!.clientWidth:1;
      const delta=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*unit;
      push(delta);
      e.preventDefault();
    }
    function onKeydown(e:KeyboardEvent) {
      const step=el!.clientWidth*.9;
      if(e.key==='ArrowUp'||e.key==='PageUp'||e.key==='ArrowLeft'){push(-step);e.preventDefault();}
      else if(e.key==='ArrowDown'||e.key==='PageDown'||e.key===' '||e.key==='ArrowRight'){push(step);e.preventDefault();}
    }
    el.addEventListener('wheel',onWheel,{passive:false});
    el.addEventListener('keydown',onKeydown);
    el.addEventListener('touchstart',stop,{passive:true});
    return ()=>{stop();el.removeEventListener('wheel',onWheel);el.removeEventListener('keydown',onKeydown);el.removeEventListener('touchstart',stop);};
  },[reading,reduced]);
  // Ao parar de arrastar/rolar (mouse, toque ou teclado), a fita desliza — devagar, num
  // gesto lento e deliberado — até o ponto onde o texto do quadro mais próximo fica
  // totalmente legível, em vez de poder parar em qualquer posição intermediária borrada.
  // Um novo gesto do visitante (roda do mouse, toque ou teclado) cancela o deslize na hora.
  useEffect(()=>{
    const el=container.current;if(!el||reading)return;
    let cancelAnim:(()=>void)|null=null,timer=0;
    function onScroll() {
      if(cancelAnim)return; // é o próprio deslize automático rolando a fita; ignorar
      window.clearTimeout(timer);
      timer=window.setTimeout(()=>{
        const current=raw.get();
        if(current<=.001||current>=.999)return;
        // O centro geométrico de cada quadro (mesmo ponto usado para deslocar a fita
        // horizontalmente) — a legenda já está inteira antes disso, então parar aqui
        // deixa o quadro estável exatamente no meio da tela, nunca deslocado à esquerda.
        let nearest=mids[0],best=Infinity;
        for(const m of mids){const d=Math.abs(current-m);if(d<best){best=d;nearest=m;}}
        if(Math.abs(current-nearest)<.002)return;
        const left=leftFor(nearest);if(left===null)return;
        cancelAnim=slowScrollTo(el!,left,reduced?0:1400,()=>{cancelAnim=null;});
      },220);
    }
    function onUserIntent() {if(cancelAnim){cancelAnim();cancelAnim=null;}}
    el.addEventListener('scroll',onScroll,{passive:true});
    el.addEventListener('wheel',onUserIntent,{passive:true});
    el.addEventListener('touchstart',onUserIntent,{passive:true});
    el.addEventListener('keydown',onUserIntent);
    return ()=>{
      el.removeEventListener('scroll',onScroll);
      el.removeEventListener('wheel',onUserIntent);
      el.removeEventListener('touchstart',onUserIntent);
      el.removeEventListener('keydown',onUserIntent);
      window.clearTimeout(timer);cancelAnim?.();
    };
  },[reading,reduced,raw,mids]);
  // O áudio exige um gesto que o navegador aceite como "ativação do usuário": clique
  // (inclui o toque simples), toque concluído (touchend/pointerup) e tecla. Início de
  // toque (touchstart/pointerdown no celular) e rolagem NÃO contam — no Android, ouvir
  // esses eventos fazia a primeira tentativa falhar e disputar com o toque na cortina,
  // e alguns aparelhos ficavam sem som. A escuta continua até o som ligar de fato
  // (falhou? o próximo toque tenta de novo) e para de vez se a pessoa desligar o som
  // pelo botão. O próprio botão de som fica de fora para não ligar e desligar seguido.
  useEffect(()=>{
    if(!audio.available||audio.enabled)return;
    const events=['click','touchend','pointerup','keydown'] as const;
    function onGesture(e:Event) {
      if(e.target instanceof Element && e.target.closest('.sound-button'))return;
      void audio.enable(true);
    }
    events.forEach(n=>window.addEventListener(n,onGesture,{capture:true,passive:true}));
    return ()=>events.forEach(n=>window.removeEventListener(n,onGesture,{capture:true}));
  },[audio.available,audio.enabled,audio.enable]);
  async function share() {
    const url=window.location.href.split('#')[0];
    try {
      if(navigator.share){await navigator.share({title:'A Vida Não Para — O Filme',text:'Algumas histórias, a vida escreve primeiro. Conheça esta.',url});return;}
      await navigator.clipboard.writeText(url);setShareMessage('Link copiado. Obrigado por levar esta história adiante.');
    } catch(e) {
      if(e instanceof DOMException && e.name==='AbortError')return;
      setShareFallback(true);setShareMessage('Copie o endereço abaixo para compartilhar.');
    }
  }
  const controls=<><button className="button button--primary" onClick={()=>setDialog(true)}>Quero conhecer o projeto <span className="button-arrow" aria-hidden="true">→</span></button><button className="button button--ghost" onClick={share}>Compartilhar esta história</button></>;
  return <>
    <a className="skip-link" href="#convite" onClick={e=>{e.preventDefault();jump(1);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('#convite button')?.focus());}}>Ir para o convite</a>
    {!started && <motion.button type="button" className="intro-gate" style={{opacity:gateOpacity}} onClick={()=>activateIntro()} onWheel={onGateWheel} onTouchStart={onGateTouchStart} onTouchEnd={onGateTouchEnd}>
      <span className="intro-gate__prompt"><span>{isTouch?'Deslize ou toque para começar':'Role ou clique para começar'}</span><span className="intro-gate__arrow" aria-hidden="true">→</span></span>
    </motion.button>}
    <main ref={container} tabIndex={0} aria-label="A Vida Não Para — narrativa cinematográfica, em formato de rolo de filme. Arraste ou role para o lado." className={`scroll-viewport ${reading?'is-reading':''}`}>
      <div className="scroll-track">
      <div className="stage">
        <StageSky p={p} reduced={reduced}/>
        <div className="stage-rail" aria-hidden="true"/>
        <FloatingElements p={p} reduced={reduced}/>
        {!reduced && sweepOn && <motion.div className="light-sweep" aria-hidden="true" style={{x:sweepX,opacity:sweepOpacity}}/>}
        <motion.div className="reel-ribbon reel-ribbon--top" aria-hidden="true" style={{backgroundPositionX:ribbonX}}/>
        <motion.div className="reel-ribbon reel-ribbon--bottom" aria-hidden="true" style={{backgroundPositionX:ribbonX}}/>
        <motion.div className="filmstrip-track" style={{x:trackXvw}}>
          {beats.map((beat,i)=>{
            const prevMid=i>0?mids[i-1]:mids[0]-(mids[1]-mids[0]);
            const nextMid=i<beats.length-1?mids[i+1]:mids[mids.length-1]+(mids[mids.length-1]-mids[mids.length-2]);
            return <FilmFrame key={beat.id} beat={beat} index={i} total={beats.length} p={p} mid={mids[i]} prevMid={prevMid} nextMid={nextMid} reduced={reduced}/>;
          })}
        </motion.div>
        {!reduced && <div className="dust" aria-hidden="true">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div>}
        {!reduced && !isTouch && <div className="film-grain" aria-hidden="true"/>}
        <div className="vignette" aria-hidden="true"/>
        <motion.header className="stage-header" style={{opacity:chromeOpacity,pointerEvents:quiet?'none':'auto'}} inert={quiet}>
          <a href="#" className="wordmark" onClick={e=>{e.preventDefault();jump(0);}}>A VIDA NÃO PARA<span>O FILME</span></a>
          <div className="header-actions"><button className="text-button" onClick={()=>setReading(true)}>Ler a história</button><button className="sound-button" aria-pressed={audio.enabled} disabled={!audio.available} onClick={audio.toggle} title={audio.available?'Ativar ou silenciar trilha':'As trilhas ainda não foram adicionadas'}><SpeakerIcon on={audio.enabled}/>{audio.enabled?'Som ligado':'Ativar som'}</button></div>
        </motion.header>
        {/* Se o primeiro toque não ligou o som (iPhone no silencioso antigo, navegador do
            WhatsApp, economia de bateria…), um convite claro no rodapé, até ligar. Some se a
            pessoa desligou o som de propósito, no silêncio da ruptura e na cartela final. */}
        {started && audio.available && !audio.enabled && !audio.mutedByUser && !quiet && !final &&
          <button type="button" className="sound-hint" onClick={()=>void audio.enable()}>
            <SpeakerIcon on={false}/>
            {audio.blocked
              ? <span className="sound-hint__text">O navegador bloqueou o som · {isTouch?'toque':'clique'} para tentar de novo<small>Confira também o volume de mídia do aparelho</small></span>
              : (isTouch?'Toque para ativar o som':'Clique para ativar o som')}
          </button>}
        <motion.div className="final-actions" id="convite" style={{opacity:finalOpacity}} inert={!final}><p className="final-lede">O próximo capítulo pode começar com uma conversa.</p>{controls}<p role="status">{shareMessage}</p>{shareFallback&&<input aria-label="Endereço para compartilhar" readOnly value={window.location.href} onFocus={e=>e.target.select()}/>}</motion.div>
        <motion.footer className="stage-footer" style={{opacity:footerOpacity,pointerEvents:quiet||final?'none':'auto'}} inert={quiet||final}>
          <div className="reel-label"><span>{acts[act].roman}</span><p>{acts[act].label}</p></div>
          <span className="frame-counter">{`Quadro ${String(frame).padStart(2,'0')} / ${beats.length}`}</span>
        </motion.footer>
        <motion.div className="progress-track" style={{opacity:chromeOpacity}}><motion.div style={{scaleX:p}}/></motion.div>
        <p className="sr-only" role="status">{audio.error}</p>
        {debugAudio && <AudioDebugPanel read={audio.debug} onTry={()=>void audio.enable()}/>}
      </div>
      </div>
    </main>
    {reading&&<div className="reading-view"><button className="text-button" onClick={()=>setReading(false)}>Voltar à experiência ↗</button><p className="eyebrow">A vida não para · O filme</p>{beats.filter(b=>b.text).map(b=><section key={b.id}><p>{b.eyebrow}</p><h2>{plain(b.text)}</h2>{b.note&&<p>{plain(b.note)}</p>}</section>)}<div className="reading-actions">{controls}</div><p role="status">{shareMessage}</p>{shareFallback&&<input aria-label="Endereço para compartilhar" readOnly value={window.location.href} onFocus={e=>e.target.select()}/>}</div>}
    <ProjectDialog open={dialog} onClose={()=>setDialog(false)} onShare={share} shareMessage={shareMessage}/>
  </>;
}
