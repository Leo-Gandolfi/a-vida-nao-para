import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { acts, type Beat } from '../timeline';
import { media, project } from '../config';

function Video({src,poster,active}:{src:string|null;poster?:string;active:boolean}) {
  const ref=useRef<HTMLVideoElement>(null);
  useEffect(()=>{
    const video=ref.current;if(!video)return;
    const update=()=>{if(active && !document.hidden)void video.play().catch(()=>{});else video.pause();};
    update();document.addEventListener('visibilitychange',update);
    return ()=>{video.pause();document.removeEventListener('visibilitychange',update);};
  },[active,src]);
  return src ? <video ref={ref} src={src} poster={poster} muted playsInline loop preload="metadata" aria-hidden="true"/> : poster ? <img src={poster} alt=""/> : null;
}
function Photograph({src,className=''}:{src:string|null;className?:string}) {return src ? <img className={className} src={src} alt="" loading="eager" decoding="async"/> : null;}

/** Uma palavra que voa de uma direção alternada até o lugar de leitura, com atraso
 * escalonado por índice: o texto "chega" na tela em vez de simplesmente aparecer. */
function Word({children,index,total,p,start,end,reduced}:{children:string;index:number;total:number;p:MotionValue<number>;start:number;end:number;reduced:boolean}) {
  const span=end-start;
  const perWordDelay=(span*.5)/Math.max(total,1);
  const inStart=start+index*perWordDelay;
  const inEnd=inStart+span*.16;
  const outStart=end-span*.16;
  const outEnd=end;
  const even=index%2===0;
  const opacityW=useTransform(p,[inStart,inEnd,outStart,outEnd],[0,1,1,0]);
  const yW=useTransform(p,[inStart,inEnd],reduced?[0,0]:[even?20:-16,0]);
  const blurPx=useTransform(p,[inStart,inEnd],reduced?[0,0]:[7,0]);
  const blurW=useTransform(blurPx,v=>`blur(${v}px)`);
  return <motion.span className="word" style={{opacity:opacityW,y:yW,filter:blurW}}>{children}</motion.span>;
}

function RevealText({text,as,className,p,start,end,reduced}:{text:string;as:'h1'|'h2';className?:string;p:MotionValue<number>;start:number;end:number;reduced:boolean}) {
  const lines=text.split('\n');
  const totalWords=lines.join(' ').trim().split(/\s+/).filter(Boolean).length;
  let cursor=0;
  const Tag=as;
  return <Tag className={className}>
    {lines.map((line,li)=>{
      const words=line.split(/\s+/).filter(Boolean);
      return <span className="reveal-line" key={li}>
        {words.map((w,wi)=>{
          const idx=cursor++;
          return <span key={wi}><Word index={idx} total={totalWords} p={p} start={start} end={end} reduced={reduced}>{w}</Word>{wi<words.length-1?' ':''}</span>;
        })}
      </span>;
    })}
  </Tag>;
}

function EqualizerBars() {
  return <div className="equalizer" aria-hidden="true">{Array.from({length:7}).map((_,i)=><span key={i} style={{animationDelay:`${i*.12}s`}}/>)}</div>;
}

function actRoman(startP:number) {
  const idx=acts.reduce((best,a,i)=>startP>=a.at?i:best,0);
  return acts[idx].roman;
}

/** Um quadro do rolo de filme: entra pela lateral, e só fica nítido quando
 * centralizado — como um filme físico passando pela janela de projeção. */
export default function FilmFrame({beat,index,total,p,mid,prevMid,nextMid,reduced}:{
  beat:Beat;index:number;total:number;p:MotionValue<number>;mid:number;prevMid:number;nextMid:number;reduced:boolean;
}) {
  const [active,setActive]=useState(p.get()>=beat.start && p.get()<=beat.end);
  useMotionValueEvent(p,'change',v=>{const a=v>=beat.start && v<=beat.end;setActive(old=>old===a?old:a);});

  // O foco é um platô (nítido durante toda a duração natural do quadro), não um pico
  // instantâneo — em toque/rolagem rápida (celular), um pico seria quase sempre
  // "pulado", deixando a tela borrada na maior parte do tempo. Nos extremos do rolo,
  // o foco permanece total (não decai) para que a abertura e o convite final fiquem
  // sempre nítidos, mesmo sem um quadro seguinte/anterior real.
  const focusPoints=index===0?[beat.start,beat.end,nextMid]:index===total-1?[prevMid,beat.start,beat.end]:[prevMid,beat.start,beat.end,nextMid];
  const focusOutputs=index===0?[1,1,0]:index===total-1?[0,1,1]:[0,1,1,0];
  const focus=useTransform(p,focusPoints,focusOutputs);
  const opacity=useTransform(focus,v=>.26+.74*v);
  const scale=useTransform(focus,v=>reduced?1:.9+.1*v);
  const filter=useTransform(focus,v=>reduced?'none':`blur(${(1-v)*5}px) saturate(${.55+.45*v})`);

  const cross=useTransform(p,[.793,.827],[0,1]);
  const span=beat.end-beat.start;
  const eyebrowPoints=[beat.start,beat.start+span*.10,beat.end-span*.30,beat.end];
  const eyebrowOpacity=useTransform(p,eyebrowPoints,[0,1,1,0]);

  const t=beat.treatment;
  const hasMedia=t==='couple'||t==='arrival'||t==='cold'||t==='warm'||t==='cast'||t==='social'||(t==='music' && Boolean(media.mioto));
  const isPress=t==='press';
  const isLeader=!hasMedia && !isPress;
  const roman=actRoman(beat.start);

  return <motion.div className="frame-slot" inert={!active}>
    <motion.article className={`frame-card frame-card--${t} ${isLeader?'frame-card--leader':''}`} style={{opacity,scale,filter}} aria-hidden={!active}>
      <div className="sprocket sprocket--top" aria-hidden="true"/>
      <div className="frame-window">
        {t==='couple' && <Photograph src={media.couple}/>}
        {/* INSERIR VÍDEO DO ULTRASSOM AQUI: definir media.ultrasound em config.ts */}
        {t==='arrival' && <div className="memory-frame"><Video src={media.ultrasound} poster={media.arrival} active={active && !reduced}/></div>}
        {t==='cold' && <Photograph src={media.neonatal}/>}
        {t==='warm' && <Video src={beat.id==='care'?media.school:media.care} poster={beat.id==='care'?media.familyCare:media.family} active={active && !reduced}/>}
        {t==='music' && (media.mioto ? <Photograph src={media.mioto}/> : <EqualizerBars/>)}
        {t==='social' && <Photograph src={media.social || media.family}/>}
        {/* INSERIR FOTO GLEDSON/SIDNEY AQUI: crossfade com caixas e object-position idênticos. */}
        {t==='cast' && <div className="cast-frame"><Photograph src={media.gledsonPortrait || media.family}/><motion.div className="cast-overlay" style={{opacity:cross}}><Photograph src={media.sidneyPortrait}/></motion.div></div>}
        {isPress && <div className="press-mini">
          <div className="press-card"><span>2015</span>{media.news2015?<Photograph src={media.news2015}/>:<p>Uma história que mobilizou o Brasil.</p>}<small>Fantástico</small></div>
          <div className="press-card"><span>2026</span>{media.news2026?<Photograph src={media.news2026}/>:<p>A vida continuou. A história também.</p>}<small>Fantástico</small></div>
        </div>}
        {isLeader && beat.text && <div className="leader-ring" aria-hidden="true"/>}
        {/* O último quadro não tem um próximo quadro para "receber" o texto — ele fica
            estático (sem a coreografia de palavras por scroll) para nunca desvanecer
            ao chegar no fim absoluto da rolagem. */}
        {isLeader && beat.text && t==='final' && <h1 className="film-title">{beat.text}</h1>}
        {isLeader && beat.text && t!=='final' && <RevealText
          as={t==='title'?'h1':'h2'}
          className={t==='title'?'film-title':`leader-title ${beat.small?'leader-title--small':''}`}
          text={beat.text} p={p} start={beat.start} end={beat.end} reduced={reduced}/>}
      </div>
      <div className="sprocket sprocket--bottom" aria-hidden="true"/>
      <div className="frame-tag"><span>{roman}</span><span>{String(index+1).padStart(2,'0')}/{total}</span></div>
    </motion.article>

    {!isLeader && <div className="frame-caption">
      {beat.eyebrow && <motion.p className="eyebrow" style={{opacity:eyebrowOpacity}}>{beat.eyebrow}</motion.p>}
      {beat.text && <RevealText as="h2" text={beat.text} p={p} start={beat.start} end={beat.end} reduced={reduced}/>}
      {t==='cast' && <p className="cast-credit">{project.actorLine}</p>}
    </div>}
    {/* No quadro final o convite (final-actions, em Cinema.tsx) já assume o rodapé da
        narrativa — evita-se aqui duplicar texto que colidiria com os botões. */}
    {isLeader && beat.eyebrow && t!=='final' && <div className="frame-caption frame-caption--leader">
      <motion.p className="eyebrow" style={{opacity:eyebrowOpacity}}>{beat.eyebrow}</motion.p>
    </div>}
  </motion.div>;
}
