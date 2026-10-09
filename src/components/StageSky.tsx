import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useInWindow } from '../hooks/useInWindow';

/** O céu inteiro por trás do rolo vive a história como um dia de verdade:
 *
 *  - noite estrelada na abertura → o sol NASCE no prólogo ("Outras, a VIDA escreve primeiro");
 *  - dia claro com o casal e a chegada dos gêmeos;
 *  - o sol SE PÕE no nascimento (27/06/2015), em vermelho, e a noite chega com a ruptura;
 *  - as perdas acontecem sob nuvens pesadas e chuva, que para no vazio do silêncio;
 *  - em "Mallu ficou." as nuvens se abrem: lua, estrelas e estrelas cadentes;
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
const SKY_P =       [0,        .03,      .055,     .075,     .10,      .15,      .185,     .215,     .245,     .28,      .39,      .415,     .44,      .465,     .49,      .52,      .60,      .82,      .88,      .94,      .965,     1];
const ZENITH =      ['#05060d','#0b0f22','#1d2448','#2c3d6a','#2f5079','#2a4c72','#2c3e5c','#2a2a48','#1d1b2c','#10141b','#0c1016','#05070d','#04060e','#241c40','#3a3f6e','#33598a','#2d5680','#2b4e74','#2e3c5e','#2c2448','#1b1534','#0a0b1c'];
const HORIZON_C =   ['#0f1020','#2a1c34','#a04a4a','#f08a5a','#e09a5c','#c89566','#d98a4c','#e0663e','#5c2a38','#1d2229','#171b22','#0b0f1a','#0a0f1c','#c0503e','#ff9a52','#e6a866','#d4a472','#c99666','#eb9a4c','#e8683a','#9a3a46','#3a1f36'];

// Altura do sol (-1 bem abaixo do horizonte, 0 tocando a linha, 1 a pino).
const SUN_P =   [0,   .03, .062, .10, .16, .19, .232, .27, .44, .452, .478, .52, .70, .86, .93, .962, .99, 1];
const SUN_ALT = [-.4,-.35, 0,    .45, .78, .55, .02, -.35,-.4, -.3,   0,   .48, .86, .62, .24, .01, -.3, -.4];

const clamp = (n:number) => Math.max(0,Math.min(1,n));

function Sun({p}:{p:MotionValue<number>}) {
  // Noite (sol abaixo do horizonte): desmontado, sem custo.
  const night = useInWindow(p,.275,.448);
  const alt = useTransform(p,SUN_P,SUN_ALT);
  // No primeiro dia o sol anda devagar pela esquerda (atrás das fotos), para não passar por trás
  // das legendas, que ficam à direita; só no pôr do sol do nascimento ele corre para o poente.
  const left = useTransform(p,[0,.17,.27,.45,1],['14%','30%','84%','14%','86%']);
  const top = useTransform(alt,a=>`${HORIZON - a*60}%`);
  const opacity = useTransform(alt,a=>clamp((a+.22)/.18));
  // Perto do horizonte o sol cresce, avermelha e ganha raios: é o nascer/pôr.
  const low = useTransform(alt,a=>1-clamp(a/.55));
  const scale = useTransform(low,l=>1+l*.45);
  const glowOpacity = useTransform(low,l=>.25+l*.75);
  const raysOpacity = useTransform(low,l=>.15+l*.85);
  if(night) return null;
  return <motion.div className="sky-sun" style={{left,top,opacity,scale}}>
    <motion.span className="sky-sun__glow" style={{opacity:glowOpacity}}/>
    <motion.span className="sky-sun__rays" style={{opacity:raysOpacity}}/>
    <span className="sky-sun__disc"/>
  </motion.div>;
}

function Moon({p}:{p:MotionValue<number>}) {
  // Na chuva das perdas não há lua: ela só aparece quando as nuvens se abrem, em
  // "Mallu ficou." — alívio, não luto — e se põe com o amanhecer.
  const up = useInWindow(p,.405,.475);
  const alt = useTransform(p,[.405,.43,.448,.472],[-.05,.82,.82,-.3]);
  // Alta e à direita, fora do quadro "Mallu ficou.", para ser vista.
  const left = useTransform(p,[.405,.472],['86%','78%']);
  const top = useTransform(alt,a=>`${HORIZON - a*60}%`);
  const opacity = useTransform(alt,a=>clamp((a+.2)/.2));
  if(!up) return null;
  return <motion.div className="sky-moon" style={{left,top,opacity}}/>;
}

function Stars({p}:{p:MotionValue<number>}) {
  const opacity = useTransform(p,[0,.045,.075,.41,.432,.445,.475,.955,.985,1],[.95,.7,0,0,.85,.9,0,0,.55,.7]);
  // Só montadas nas noites limpas: abertura, "Mallu ficou." e crepúsculo final.
  const dawn = useInWindow(p,0,.078), night = useInWindow(p,.405,.478), dusk = useInWindow(p,.952,1);
  if(!dawn && !night && !dusk) return null;
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
// Duas camadas de nuvens em profundidades diferentes: as distantes, pequenas e lentas;
// as próximas, maiores e mais rápidas — a paralaxe dá volume ao céu enquanto a fita anda.
// [left vw, top %, largura vw, altura vh, duração da deriva s]
const FAR_CLOUDS = [[4,14,30,8,60],[44,26,22,6,48],[80,8,34,9,72],[118,20,26,7,56],[150,12,30,8,66]];
const NEAR_CLOUDS = [[10,32,46,13,52],[70,6,52,15,64],[135,38,40,12,46],[190,16,56,16,70],[250,30,44,13,58]];

function CloudLayer({p,color,opacity,clouds,travel,layer}:{p:MotionValue<number>;color:MotionValue<string>;opacity:MotionValue<number>;clouds:number[][];travel:string;layer:string}) {
  const x = useTransform(p,[0,1],['0vw',travel]);
  return <motion.div className={`sky-clouds sky-clouds--${layer}`} style={{opacity,x}}>
    {clouds.map(([l,t,w,h,d],i)=><motion.span key={i} className="sky-cloud" style={{
      backgroundColor:color, left:`${l}vw`, top:`${t}%`, width:`${w}vw`, height:`${h}vh`,
      animationDuration:`${d}s`, animationDelay:`${-i*13}s`,
    }}/>)}
  </motion.div>;
}

function Clouds({p}:{p:MotionValue<number>}) {
  const color = useTransform(p,
    [0,        .06,      .10,      .19,      .235,     .28,      .39,      .42,      .44,      .48,      .52,      .88,      .94,      .97,      1],
    ['#1a1c2c','#c47a7a','#f5ddc8','#f2c49a','#e8806a','#2a2f37','#262b33','#161a28','#161a28','#ff9e7a','#f6e6d4','#f2c49a','#ee8a66','#6a3a52','#2a2238']);
  const far = useTransform(p,[0,.06,.10,.23,.27,.39,.415,.44,.48,.95,1],[.10,.32,.4,.38,.8,.8,.35,.1,.4,.4,.2]);
  const near = useTransform(p,[0,.06,.10,.23,.27,.39,.415,.44,.48,.95,1],[.12,.42,.52,.5,.9,.9,.4,.12,.52,.52,.25]);
  return <>
    <CloudLayer p={p} color={color} opacity={far} clouds={FAR_CLOUDS} travel="-40vw" layer="far"/>
    <CloudLayer p={p} color={color} opacity={near} clouds={NEAR_CLOUDS} travel="-170vw" layer="near"/>
  </>;
}

/** "Mallu ficou.": no meio da noite, estrelas cadentes riscam o céu — a esperança que
 * ainda não tem nome. */
function ShootingStars({p}:{p:MotionValue<number>}) {
  const on = useInWindow(p,.418,.452);
  if(!on) return null;
  return <div className="shooting-stars" aria-hidden="true"><span/><span/><span/></div>;
}

/** As perdas acontecem sob chuva. O céu fecha logo depois do pôr do sol do nascimento
 * (um banco de nuvens pesadas, cinza-chumbo); a chuva começa em "A despedida de Keila",
 * engrossa em "Samuel também partiu." e para no vazio — que fica só nublado e escuro,
 * sem nada. Em "Mallu ficou." as nuvens se abrem e aparecem a lua e as estrelas. */
function Storm({p}:{p:MotionValue<number>}) {
  const on = useInWindow(p,.232,.436);
  const opacity = useTransform(p,[.232,.27,.39,.41,.432],[0,1,1,.65,0]);
  if(!on) return null;
  return <motion.div className="storm" aria-hidden="true" style={{opacity}}><span/><span/></motion.div>;
}

function Rain({p}:{p:MotionValue<number>}) {
  const on = useInWindow(p,.262,.393);
  const opacity = useTransform(p,[.262,.285,.378,.392],[0,1,1,0]);
  // No Samuel a chuva só engrossa um pouco — nada de aguaceiro.
  const heavy = useTransform(p,[.33,.355,.378,.392],[0,.45,.45,0]);
  if(!on) return null;
  return <motion.div className="rain" aria-hidden="true" style={{opacity}}>
    <span className="rain-layer rain-layer--far"/>
    <span className="rain-layer rain-layer--near"/>
    <motion.span className="rain-layer rain-layer--heavy" style={{opacity:heavy}}/>
    <span className="rain-mist"/>
  </motion.div>;
}

/** Marília no horizonte: só na tela da cidade, os prédios se erguem entre os morros e o
 * sol se põe atrás deles. Sai de cena antes da cartela final. */
function Skyline({p}:{p:MotionValue<number>}) {
  const opacity = useTransform(p,[.930,.948,.970,.979],[0,1,1,0]);
  const y = useTransform(p,[.930,.952],['18%','0%']);
  const x = useTransform(p,[.930,.979],['5vw','-5vw']);
  return <motion.div className="sky-skyline" style={{opacity,y,x}}/>;
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
      <Storm p={p}/>
      <ShootingStars p={p}/>
    </>}
    <motion.div className="sky-hills sky-hills--far" style={{backgroundPositionX:hillsFar}}/>
    <Skyline p={p}/>
    <motion.div className="sky-hills sky-hills--near" style={{backgroundPositionX:hillsNear}}/>
    {!reduced && <Rain p={p}/>}
    {!reduced && <Lanterns p={p}/>}
  </div>;
}
