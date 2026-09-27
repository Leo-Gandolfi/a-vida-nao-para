"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { acts, beats, beatAt } from '../timeline';
import { useAudioController } from '../hooks/useAudioController';
import FilmFrame from './FilmFrame';
import ProjectDialog from './ProjectDialog';

/** Distância (em vw) entre o início de um quadro e o início do próximo.
 * Mantida em sincronia com a largura de ".frame-slot" + o "gap" de ".filmstrip-track"
 * em styles.css (72vw + 4vw = 76vw), para que a rolagem horizontal calculada aqui
 * corresponda exatamente ao que é desenhado em CSS. */
const SLOT_VW = 76;

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

/** ROLO DE FILME
 * A rolagem é horizontal: arraste ou deslize para o lado (mouse, trackpad, toque ou
 * teclado) para puxar a fita de quadros por uma janela de projeção. Cada quadro entra
 * pela direita, cruza o centro (onde fica nítido) e sai pela esquerda. A roda vertical
 * do mouse também funciona — é convertida em deslocamento lateral automaticamente.
 */
export default function Cinema() {
  const container=useRef<HTMLElement>(null);
  const {scrollXProgress:p}=useScroll({container});
  const reduced=Boolean(useReducedMotion());
  const audio=useAudioController(p);
  const [act,setAct]=useState(0);
  const [movement,setMovement]=useState(1);
  const [final,setFinal]=useState(false);
  const [quiet,setQuiet]=useState(false);
  const [dialog,setDialog]=useState(false);
  const [shareMessage,setShareMessage]=useState('');
  const [shareFallback,setShareFallback]=useState(false);
  const [reading,setReading]=useState(false);
  const chromeOpacity=useTransform(p,[0,.33,.34,.445,.45,1],[1,1,0,0,1,1]);
  const finalOpacity=useTransform(p,[.975,.986,1],[0,1,1]);

  const mids=useMemo(()=>beats.map(b=>(b.start+b.end)/2),[]);
  const trackX=useTransform(
    p,
    [0,...mids,1],
    [0,...beats.map((_,i)=>-i*SLOT_VW),-(beats.length-1)*SLOT_VW],
  );
  const trackXvw=useTransform(trackX,v=>`${v}vw`);

  useMotionValueEvent(p,'change',v=>{
    const next=acts.reduce((index,a,i)=>v>=a.at?i:index,0);
    setAct(old=>old===next?old:next);
    const m=beatAt(v)?.movement??5;setMovement(old=>old===m?old:m);
    const f=v>=.983;setFinal(old=>old===f?old:f);
    const q=v>=.34&&v<.45;setQuiet(old=>old===q?old:q);
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
  useEffect(()=>{
    const el=container.current;if(!el||reading)return;
    function onWheel(e:WheelEvent) {
      const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      el!.scrollLeft+=delta;
      e.preventDefault();
    }
    function onKeydown(e:KeyboardEvent) {
      const step=el!.clientWidth*.9;
      if(e.key==='ArrowUp'||e.key==='PageUp'){el!.scrollLeft-=step;e.preventDefault();}
      else if(e.key==='ArrowDown'||e.key==='PageDown'||e.key===' '){el!.scrollLeft+=step;e.preventDefault();}
    }
    el.addEventListener('wheel',onWheel,{passive:false});
    el.addEventListener('keydown',onKeydown);
    return ()=>{el.removeEventListener('wheel',onWheel);el.removeEventListener('keydown',onKeydown);};
  },[reading]);
  // Ao parar de arrastar/rolar (mouse, toque ou teclado), a fita desliza — devagar, num
  // gesto lento e deliberado — até o ponto onde o texto do quadro mais próximo fica
  // totalmente legível, em vez de poder parar em qualquer posição intermediária borrada.
  // Um novo gesto do visitante (roda do mouse, toque ou teclado) cancela o deslize na hora.
  useEffect(()=>{
    const el=container.current;if(!el||reading)return;
    // 65% da duração do quadro: ponto em que a última palavra de qualquer legenda já
    // terminou de aparecer (mesmo em frases longas), mas antes de o texto começar a sumir.
    const mids2=beats.map(b=>b.start+(b.end-b.start)*.65);
    let cancelAnim:(()=>void)|null=null,timer=0;
    function onScroll() {
      if(cancelAnim)return; // é o próprio deslize automático rolando a fita; ignorar
      window.clearTimeout(timer);
      timer=window.setTimeout(()=>{
        const current=p.get();
        if(current<=.001||current>=.999)return;
        let nearest=mids2[0],best=Infinity;
        for(const m of mids2){const d=Math.abs(current-m);if(d<best){best=d;nearest=m;}}
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
  },[reading,reduced,p]);
  // O áudio exige um gesto do usuário reconhecido pelo navegador para começar (rolar a
  // roda do mouse NÃO conta como gesto válido para essa política — só clique, toque e
  // tecla contam). Por isso a primeira dessas interações em qualquer lugar da página já
  // liga o som sozinha, deixando a experiência "com som desde o início". O próprio botão
  // de som fica de fora dessa escuta para não ligar e desligar em seguida quando a pessoa
  // clicar nele diretamente.
  useEffect(()=>{
    if(!audio.available||audio.enabled)return;
    function onFirstGesture(e:Event) {
      if(e.target instanceof Element && e.target.closest('.sound-button'))return;
      if(!audio.enabled)void audio.toggle();
      window.removeEventListener('pointerdown',onFirstGesture);
      window.removeEventListener('keydown',onFirstGesture);
    }
    window.addEventListener('pointerdown',onFirstGesture,{once:true});
    window.addEventListener('keydown',onFirstGesture,{once:true});
    return ()=>{
      window.removeEventListener('pointerdown',onFirstGesture);
      window.removeEventListener('keydown',onFirstGesture);
    };
  },[audio.available,audio.enabled,audio.toggle]);
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
  const controls=<><button className="button button--primary" onClick={()=>setDialog(true)}>Quero conhecer o projeto <span aria-hidden="true">↗</span></button><button className="button button--ghost" onClick={share}>Compartilhar esta história</button></>;
  return <>
    <a className="skip-link" href="#convite" onClick={e=>{e.preventDefault();jump(1);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('#convite button')?.focus());}}>Ir para o convite</a>
    <main ref={container} tabIndex={0} aria-label="A Vida Não Para — narrativa cinematográfica, em formato de rolo de filme. Arraste ou role para o lado." className={`scroll-viewport ${reading?'is-reading':''}`}>
      <div className="scroll-track">
      <div className="stage">
        <div className="stage-rail" aria-hidden="true"/>
        <motion.div className="filmstrip-track" style={{x:trackXvw}}>
          {beats.map((beat,i)=>{
            const prevMid=i>0?mids[i-1]:mids[0]-(mids[1]-mids[0]);
            const nextMid=i<beats.length-1?mids[i+1]:mids[mids.length-1]+(mids[mids.length-1]-mids[mids.length-2]);
            return <FilmFrame key={beat.id} beat={beat} index={i} total={beats.length} p={p} mid={mids[i]} prevMid={prevMid} nextMid={nextMid} reduced={reduced}/>;
          })}
        </motion.div>
        {!reduced && <div className="dust" aria-hidden="true"><span/><span/><span/></div>}
        {!reduced && <div className="film-grain" aria-hidden="true"/>}
        <div className="vignette" aria-hidden="true"/>
        <motion.header className="stage-header" style={{opacity:chromeOpacity,pointerEvents:quiet?'none':'auto'}} inert={quiet}>
          <a href="#" className="wordmark" onClick={e=>{e.preventDefault();jump(0);}}>A VIDA NÃO PARA<span>O FILME</span></a>
          <div className="header-actions"><button className="text-button" onClick={()=>setReading(true)}>Ler a história</button><button className="sound-button" aria-pressed={audio.enabled} disabled={!audio.available} onClick={audio.toggle} title={audio.available?'Ativar ou silenciar trilha':'As trilhas ainda não foram adicionadas'}><span aria-hidden="true">{audio.enabled?'◖))':'◖'}</span>{audio.enabled?'Som ligado':'Sem som'}</button></div>
        </motion.header>
        <motion.div className="final-actions" id="convite" style={{opacity:finalOpacity}} inert={!final}><p className="final-lede">O próximo capítulo pode começar com uma conversa.</p>{controls}<p role="status">{shareMessage}</p>{shareFallback&&<input aria-label="Endereço para compartilhar" readOnly value={window.location.href} onFocus={e=>e.target.select()}/>}</motion.div>
        <motion.footer className="stage-footer" style={{opacity:chromeOpacity,pointerEvents:quiet?'none':'auto'}} inert={quiet}>
          <div className="reel-label"><span>{acts[act].roman}</span><p>{acts[act].label}</p></div>
          <nav className="reel-scrubber" aria-label="Atos da história">{acts.map((a,i)=><button key={a.at} aria-label={`Ato ${a.roman}: ${a.label}`} aria-current={i===act?'step':undefined} onClick={()=>jump(a.at+.007)}><span/></button>)}</nav>
          <span className="frame-counter">{final?'Uma história que continua':`Quadro ${String(movement).padStart(2,'0')} / 14`}</span>
        </motion.footer>
        <motion.div className="progress-track" style={{opacity:chromeOpacity}}><motion.div style={{scaleX:p}}/></motion.div>
        <p className="sr-only" role="status">{audio.error}</p>
      </div>
      </div>
    </main>
    {reading&&<div className="reading-view"><button className="text-button" onClick={()=>setReading(false)}>Voltar à experiência ↗</button><p className="eyebrow">A vida não para · O filme</p>{beats.filter(b=>b.text).map(b=><section key={b.id}><p>{b.eyebrow}</p><h2>{b.text}</h2></section>)}<div className="reading-actions">{controls}</div><p role="status">{shareMessage}</p>{shareFallback&&<input aria-label="Endereço para compartilhar" readOnly value={window.location.href} onFocus={e=>e.target.select()}/>}</div>}
    <ProjectDialog open={dialog} onClose={()=>setDialog(false)}/>
  </>;
}
