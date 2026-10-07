import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { acts, plain, type Beat } from '../timeline';
import { media, project } from '../config';
import { isTouch } from '../hooks/useInWindow';

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
function Photograph({src,alt='',className=''}:{src:string|null;alt?:string;className?:string}) {return src ? <img className={className} src={src} alt={alt} loading="eager" decoding="async"/> : null;}

/** Trechos entre *asteriscos* recebem o laranja da identidade — usado com parcimônia:
 * só VIDA e Marília, as duas âncoras que voltam a se encontrar no fim. */
function Accented({text}:{text:string}) {
  return <>{text.split(/(\*[^*]+\*)/).filter(Boolean).map((part,i)=>part.startsWith('*')?<span key={i} className="accent">{part.slice(1,-1)}</span>:part)}</>;
}

/** Uma palavra que voa de uma direção alternada até o lugar de leitura, com atraso
 * escalonado por índice: o texto "chega" na tela em vez de simplesmente aparecer.
 * Mesmo na frase mais longa do roteiro, a última termina de aparecer bem antes da
 * metade do quadro — para que o ponto de leitura estável coincida com o centro
 * geométrico da tela (ver `mids` em Cinema.tsx), e não fique deslocado à esquerda.
 * `soft` (prólogo): só um fade cinematográfico, sem deslocamento. Palavras em destaque
 * chegam uma fração depois do resto da frase, de leve. */
function Word({children,index,total,p,start,end,reduced,soft,accent}:{children:string;index:number;total:number;p:MotionValue<number>;start:number;end:number;reduced:boolean;soft:boolean;accent:boolean}) {
  const span=end-start;
  const perWordDelay=(span*.30)/Math.max(total,1);
  const inStart=start+index*perWordDelay+(accent?span*.07:0);
  const inEnd=inStart+span*(soft?.16:.12);
  const outStart=end-span*.16;
  const outEnd=end;
  const even=index%2===0;
  const opacityW=useTransform(p,[inStart,inEnd,outStart,outEnd],[0,1,1,0]);
  const yW=useTransform(p,[inStart,inEnd],reduced||soft?[0,0]:[even?20:-16,0]);
  const blurPx=useTransform(p,[inStart,inEnd],reduced||isTouch?[0,0]:[soft?3:7,0]);
  // Sem desfoque (já assentada, ou em tela de toque): 'none', para não manter uma camada de filtro viva.
  const blurW=useTransform(blurPx,v=>v>.05?`blur(${v}px)`:'none');
  return <motion.span className={`word ${accent?'accent':''}`} style={{opacity:opacityW,y:yW,filter:blurW}}>{children}</motion.span>;
}

function RevealText({text,as,className,p,start,end,reduced,soft=false}:{text:string;as:'h1'|'h2';className?:string;p:MotionValue<number>;start:number;end:number;reduced:boolean;soft?:boolean}) {
  const lines=text.split('\n');
  const totalWords=lines.join(' ').trim().split(/\s+/).filter(Boolean).length;
  let cursor=0;
  const Tag=as;
  return <Tag className={className} aria-label={plain(text).replace(/\n/g,' ')}>
    {lines.map((line,li)=>{
      const words=line.split(/\s+/).filter(Boolean);
      return <span className="reveal-line" key={li} aria-hidden="true">
        {words.map((w,wi)=>{
          const idx=cursor++;
          const accent=/^\*.+\*$/.test(w);
          return <span key={wi}><Word index={idx} total={totalWords} p={p} start={start} end={end} reduced={reduced} soft={soft} accent={accent}>{accent?w.slice(1,-1):w}</Word>{wi<words.length-1?' ':''}</span>;
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
  // Só os quadros a até ~dois passos da janela de projeção têm conteúdo montado (fotos,
  // palavras animadas, filtros). Os distantes viram uma vaga vazia da mesma largura —
  // é isso que mantém a memória baixa no celular do começo ao fim do rolo.
  const nearFrom=prevMid-(mid-prevMid), nearTo=nextMid+(nextMid-mid);
  const isNear=(v:number)=>v>=nearFrom && v<=nearTo;
  const [near,setNear]=useState(()=>isNear(p.get()));
  useMotionValueEvent(p,'change',v=>{
    const a=v>=beat.start && v<=beat.end;setActive(old=>old===a?old:a);
    const n=isNear(v);setNear(old=>old===n?old:n);
  });

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
  const filter=useTransform(focus,v=>reduced||v>.995?'none':isTouch?`saturate(${.55+.45*v})`:`blur(${(1-v)*5}px) saturate(${.55+.45*v})`);

  // Na ruptura o quadro perde firmeza: um tremor mínimo, preso ao scroll (não ao relógio),
  // para que a imagem pareça vacilar na mão de quem a segura, sem virar efeito decorativo.
  const trembles=beat.treatment==='cold' && !reduced;
  const tremorX=useTransform(p,v=>trembles?Math.sin(v*640)*1.7:0);
  const tremorY=useTransform(p,v=>trembles?Math.cos(v*530)*1.1:0);

  const span=beat.end-beat.start;
  // Fotografias respiram com um zoom-in muito lento, quase imperceptível, preso ao scroll.
  // (pontos sempre dentro de [0,1]: o framer quebra com offsets fora dessa faixa)
  const zoom=useTransform(p,[Math.max(0,prevMid),Math.min(1,nextMid)],reduced?[1,1]:[1,1.06]);

  // Metamorfose Gledson → Sidney: no meio da travessia os dois rostos ficam levemente
  // fora de foco e maiores, para o corte ler como transformação e não como dissolução.
  const cross=useTransform(p,[beat.start+span*.24,beat.end-span*.24],[0,1]);
  const morphK=useTransform(cross,v=>reduced?0:1-Math.abs(v*2-1));
  const morphFilter=useTransform(morphK,k=>k>.01?`blur(${(k*3.2).toFixed(2)}px)`:'none');
  const morphScale=useTransform(morphK,k=>1+k*.035);
  const eyebrowPoints=[beat.start,beat.start+span*.10,beat.end-span*.30,beat.end];
  const eyebrowOpacity=useTransform(p,eyebrowPoints,[0,1,1,0]);
  // Linhas de apoio (Tela 03) entram depois da frase principal, sem pressa.
  const noteOpacity=useTransform(p,[beat.start+span*.22,beat.start+span*.40,beat.end-span*.16,beat.end],[0,1,1,0]);

  const t=beat.treatment;
  const photo=beat.photo?media[beat.photo]:null;
  const hasMedia=Boolean(photo)||t==='couple'||t==='arrival'||t==='cold'||t==='cast'||t==='music';
  const isLeader=!hasMedia;
  const showTag=t!=='title' && t!=='final';
  const roman=actRoman(beat.start);
  const ar=beat.ar??4/3;
  const alt=beat.composed?plain(beat.text):'';

  // Legenda visível ao lado da foto (em tela larga). Composições com o texto já impresso
  // na arte não reservam esse espaço, para a imagem continuar centrada.
  const sideCaption=!isLeader && Boolean((beat.text && !beat.composed) || beat.eyebrow || beat.credit || t==='cast');
  const belowCaption=isLeader && Boolean(beat.eyebrow) && t!=='final';
  if(!near) return <div className="frame-slot frame-slot--far" aria-hidden="true"/>;
  return <motion.div className={`frame-slot ${sideCaption?'frame-slot--side':''} ${belowCaption?'frame-slot--below':''}`} inert={!active} style={{'--ar':ar} as CSSProperties}>
    <motion.article className={`frame-card frame-card--${t} frame-card--${beat.id} ${isLeader?'frame-card--leader':''}`} style={{opacity,scale,filter,x:tremorX,y:tremorY}} aria-hidden={!active}>
      <div className="sprocket sprocket--top" aria-hidden="true"/>
      <div className="frame-window">
        {photo && <motion.div className="photo-frame" style={{scale:beat.composed?1:zoom}}><Photograph src={photo} alt={alt}/></motion.div>}
        {t==='couple' && <motion.div className="photo-frame" style={{scale:zoom}}><Photograph src={media.couple}/></motion.div>}
        {/* INSERIR VÍDEO DO ULTRASSOM AQUI: definir media.ultrasound em config.ts */}
        {t==='arrival' && <div className="memory-frame"><Video src={media.ultrasound} poster={media.arrival} active={active && !reduced}/></div>}
        {t==='cold' && <Photograph src={media.neonatal}/>}
        {t==='music' && !photo && <EqualizerBars/>}
        {/* INSERIR FOTO GLEDSON/SIDNEY AQUI: crossfade com caixas e object-position idênticos. */}
        {t==='cast' && <motion.div className="cast-frame" style={{filter:morphFilter,scale:morphScale}}><Photograph src={media.gledsonPortrait || media.family}/><motion.div className="cast-overlay" style={{opacity:cross}}><Photograph src={media.sidneyPortrait}/></motion.div></motion.div>}
        {isLeader && beat.text && <div className="leader-ring" aria-hidden="true"/>}
        {/* O último quadro não tem um próximo quadro para "receber" o texto — ele fica
            estático (sem a coreografia de palavras por scroll) para nunca desvanecer
            ao chegar no fim absoluto da rolagem. */}
        {isLeader && beat.text && t==='final' && <h1 className="film-title">{beat.text}</h1>}
        {isLeader && beat.text && t!=='final' && <div className="leader-copy">
          <RevealText
            as={t==='title'?'h1':'h2'}
            className={t==='title'?'film-title':`leader-title ${beat.small?'leader-title--small':''}`}
            text={beat.text} p={p} start={beat.start} end={beat.end} reduced={reduced} soft={t==='intro'}/>
          {beat.note && <motion.p className="leader-note" style={{opacity:noteOpacity}}>
            {beat.note.split('\n').map((line,i)=><span key={i}><Accented text={line}/></span>)}
          </motion.p>}
        </div>}
      </div>
      <div className="sprocket sprocket--bottom" aria-hidden="true"/>
      {showTag && <div className="frame-tag"><span>{roman}</span><span>{String(index+1).padStart(2,'0')}/{total}</span></div>}
    </motion.article>

    {!isLeader && (beat.text || beat.eyebrow) && <div className={`frame-caption ${beat.text.length>60?'frame-caption--long':''} ${sideCaption?'':'frame-caption--sr'}`}>
      {beat.eyebrow && <motion.p className="eyebrow" style={{opacity:eyebrowOpacity}}>{beat.eyebrow}</motion.p>}
      {/* Nas composições aprovadas a frase já está impressa na arte: repeti-la embaixo
          seria duplicar o texto na tela, então a legenda fica só para leitores de tela. */}
      {beat.text && (beat.composed
        ? <h2 className="sr-only">{plain(beat.text)}</h2>
        : <RevealText as="h2" text={beat.text} p={p} start={beat.start} end={beat.end} reduced={reduced}/>)}
      {beat.credit && <motion.p className="frame-credit" style={{opacity:noteOpacity}}>{beat.credit}</motion.p>}
      {t==='cast' && <p className="cast-credit">{project.actorLine}</p>}
    </div>}
    {/* No quadro final o convite (final-actions, em Cinema.tsx) já assume o rodapé da
        narrativa — evita-se aqui duplicar texto que colidiria com os botões. */}
    {isLeader && beat.eyebrow && t!=='final' && <div className="frame-caption frame-caption--leader">
      <motion.p className="eyebrow" style={{opacity:eyebrowOpacity}}>{beat.eyebrow}</motion.p>
    </div>}
  </motion.div>;
}
