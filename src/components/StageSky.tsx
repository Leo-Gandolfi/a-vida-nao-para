import { useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';

/** O céu inteiro por trás do rolo vive a história como um dia de verdade:
 *
 *  - noite estrelada na abertura → o sol NASCE no prólogo ("Outras, a VIDA escreve primeiro");
 *  - dia claro com o casal e a chegada dos gêmeos;
 *  - o sol SE PÕE no nascimento (27/06/2015), em vermelho, e a noite chega com a ruptura;
 *  - lua e estrelas no silêncio; uma estrela cadente quando "Mallu ficou.";
 *  - o segundo NASCER DO SOL, o mais forte, na volta da luz (Mallu na UTI / continuar);
 *  - dia aberto na travessia do tempo, na canção e no cinema;
 *  - o último PÔR DO SOL acontece em Marília (a foto da tela é um entardecer), e a cartela
 *    final fica no crepúsculo, com as primeiras estrelas e lanternas subindo.
 *
 * Tudo é derivado do progresso do scroll (nunca do relógio), exceto o "respirar" contínuo
 * — nuvens à deriva, raios girando, estrelas cintilando — que dá vida mesmo parado. */

// Linha do horizonte, em % da altura do palco. Os morros cobrem abaixo dela.
const HORIZON = 77;

// Cores do céu: zênite (alto) e horizonte (brilho perto da linha dos morros).
const SKY_P =       [0,        .03,      .055,     .075,     .10,      .15,      .185,     .215,     .245,     .28,      .44,      .465,     .49,      .52,      .60,      .82,      .88,      .94,      .965,     1];
const ZENITH =      ['#05060d','#0b0f22','#1d2448','#2c3d6a','#2f5079','#2a4c72','#2c3e5c','#2a2a48','#1a1530','#070a16','#04060e','#241c40','#3a3f6e','#33598a','#2d5680','#2b4e74','#2e3c5e','#2c2448','#1b1534','#0a0b1c'];
const HORIZON_C =   ['#0f1020','#2a1c34','#a04a4a','#f08a5a','#e09a5c','#c89566','#d98a4c','#e0663e','#8c3048','#141529','#0a0f1c','#c0503e','#ff9a52','#e6a866','#d4a472','#c99666','#eb9a4c','#e8683a','#9a3a46','#3a1f36'];

// Altura do sol (-1 bem abaixo do horizonte, 0 tocando a linha, 1 a pino).
const SUN_P =   [0,   .03, .062, .10, .16, .19, .232, .27, .44, .452, .478, .52, .70, .86, .93, .962, .99, 1];
const SUN_ALT = [-.4,-.35, 0,    .45, .78, .55, .02, -.35,-.4, -.3,   0,   .48, .86, .62, .24, .01, -.3, -.4];

const clamp = (n:number) => Math.max(0,Math.min(1,n));

function Sun({p}:{p:MotionValue<number>}) {
  const alt = useTransform(p,SUN_P,SUN_ALT);
  const left = useTransform(p,[0,.27,.45,1],['16%','84%','14%','86%']);
  const top = useTransform(alt,a=>`${HORIZON - a*60}%`);
  const opacity = useTransform(alt,a=>clamp((a+.22)/.18));
  // Perto do horizonte o sol cresce, avermelha e ganha raios: é o nascer/pôr.
  const low = useTransform(alt,a=>1-clamp(a/.55));
  const scale = useTransform(low,l=>1+l*.45);
  const glowOpacity = useTransform(low,l=>.25+l*.75);
  const raysOpacity = useTransform(low,l=>.15+l*.85);
  return <motion.div className="sky-sun" style={{left,top,opacity,scale}}>
    <motion.span className="sky-sun__glow" style={{opacity:glowOpacity}}/>
    <motion.span className="sky-sun__rays" style={{opacity:raysOpacity}}/>
    <span className="sky-sun__disc"/>
  </motion.div>;
}

function Moon({p}:{p:MotionValue<number>}) {
  const alt = useTransform(p,[.24,.29,.36,.43,.46],[-.3,.25,.62,.3,-.3]);
  const left = useTransform(p,[.24,.46],['80%','24%']);
  const top = useTransform(alt,a=>`${HORIZON - a*60}%`);
  const opacity = useTransform(alt,a=>clamp((a+.2)/.2));
  return <motion.div className="sky-moon" style={{left,top,opacity}}/>;
}

function Stars({p}:{p:MotionValue<number>}) {
  const opacity = useTransform(p,[0,.045,.075,.235,.285,.44,.475,.955,.985,1],[.95,.7,0,0,.9,.9,0,0,.55,.7]);
  return <motion.div className="sky-stars" aria-hidden="true" style={{opacity}}>
    {Array.from({length:40}).map((_,i)=><span key={i} style={{
      top:`${(i*37)%72}%`, left:`${(i*53+7)%100}%`,
      animationDelay:`${-(i%7)*.7}s`, animationDuration:`${2.4+(i%5)*.8}s`,
      width:i%6===0?3:2, height:i%6===0?3:2,
    }}/>)}
  </motion.div>;
}

/** Nuvens que derivam sozinhas e pegam a cor do céu: rosadas no amanhecer, brancas de
 * dia, em brasa no pôr do sol, quase invisíveis à noite. */
function Clouds({p}:{p:MotionValue<number>}) {
  const color = useTransform(p,
    [0,        .06,      .10,      .19,      .235,     .28,      .44,      .48,      .52,      .88,      .94,      .97,      1],
    ['#1a1c2c','#c47a7a','#f5ddc8','#f2c49a','#e8806a','#24233a','#161a28','#ff9e7a','#f6e6d4','#f2c49a','#ee8a66','#6a3a52','#2a2238']);
  const opacity = useTransform(p,[0,.06,.10,.25,.29,.44,.48,.95,1],[.12,.4,.5,.45,.14,.14,.5,.5,.25]);
  const drift = useTransform(p,[0,1],['0vw','-60vw']);
  return <motion.div className="sky-clouds" style={{opacity,x:drift}}>
    {[0,1,2,3,4].map(i=><motion.span key={i} className={`sky-cloud sky-cloud--${i}`} style={{backgroundColor:color}}/>)}
  </motion.div>;
}

/** Monta um elemento só enquanto o progresso está numa janela — para que animações
 * contínuas (CSS) não rodem invisíveis o tempo todo. */
function useInWindow(p:MotionValue<number>,from:number,to:number) {
  const [inside,setInside]=useState(()=>{const v=p.get();return v>=from&&v<=to;});
  useMotionValueEvent(p,'change',v=>{const i=v>=from&&v<=to;setInside(old=>old===i?old:i);});
  return inside;
}

/** "Mallu ficou.": no meio da noite, estrelas cadentes riscam o céu — a esperança que
 * ainda não tem nome. */
function ShootingStars({p}:{p:MotionValue<number>}) {
  const on = useInWindow(p,.418,.452);
  if(!on) return null;
  return <div className="shooting-stars" aria-hidden="true"><span/><span/><span/></div>;
}

/** Cartela final, no crepúsculo: lanternas de papel sobem devagar, sem parar — o
 * próximo capítulo subindo para o céu. */
function Lanterns({p}:{p:MotionValue<number>}) {
  const on = useInWindow(p,.955,1);
  const opacity = useTransform(p,[.955,.98,1],[0,1,1]);
  if(!on) return null;
  return <motion.div className="lanterns" aria-hidden="true" style={{opacity}}>
    {Array.from({length:9}).map((_,i)=><span key={i} style={{
      left:`${6+((i*29)%88)}%`, animationDelay:`${-i*2.3}s`, animationDuration:`${16+(i%4)*4}s`,
      scale:String(.6+(i%3)*.25),
    }}/>)}
  </motion.div>;
}

export default function StageSky({p,reduced}:{p:MotionValue<number>;reduced:boolean}) {
  const zenith = useTransform(p,SKY_P,ZENITH);
  const horizon = useTransform(p,SKY_P,HORIZON_C);
  // Os morros andam devagar com a fita (paralaxe), em duas distâncias.
  const hillsFar = useTransform(p,[0,1],['0px','-900px']);
  const hillsNear = useTransform(p,[0,1],['0px','-2200px']);
  return <div className="sky" aria-hidden="true">
    <motion.div className="stage-wash" style={{backgroundColor:zenith}}/>
    <motion.div className="sky-horizon" style={{backgroundColor:horizon}}/>
    {!reduced && <>
      <Stars p={p}/>
      <Moon p={p}/>
      <Sun p={p}/>
      <Clouds p={p}/>
      <ShootingStars p={p}/>
    </>}
    <motion.div className="sky-hills sky-hills--far" style={{backgroundPositionX:hillsFar}}/>
    <motion.div className="sky-hills sky-hills--near" style={{backgroundPositionX:hillsNear}}/>
    {!reduced && <Lanterns p={p}/>}
  </div>;
}
