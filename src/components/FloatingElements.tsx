import { motion, useTransform, type MotionValue } from 'framer-motion';

/** Objetos simbólicos que atravessam a tela fora do rolo de filme, cada um numa
 * "profundidade" diferente.
 *
 * O plano focal é o próprio rolo (depth .5): quem está mais longe OU mais perto que ele
 * sai de foco, como numa lente de verdade. Os mais próximos (depth > .65) passam na
 * frente do rolo, bem desfocados — o velho truque de cinema de sujar o quadro com um
 * elemento em primeiro plano para dar volume à cena.
 *
 * O vazio entre 39,5% e 45% é intencional: nenhum objeto é agendado ali. Depois que
 * Samuel parte, nada — nem uma partícula — atravessa a tela até "Mallu ficou".
 */

type Kind = 'mote' | 'petal' | 'bracelet' | 'paper' | 'book' | 'leaf' | 'camera' | 'note' | 'heart' | 'envelope' | 'clapper';
type Tone = 'warm' | 'cold';
type Spec = {
  id: string; kind: Kind; tone: Tone;
  from: number; to: number;   // janela de scroll em que o objeto cruza a tela
  depth: number;              // 0 = fundo distante, .5 = plano do rolo, 1 = colado na lente
  top: number;                // posição vertical, em % da tela
  size: number;               // tamanho base, em px
  spin: number;               // rotação total ao longo da travessia, em graus
};

const FLOATERS: Spec[] = [
  // Ato I — a promessa: luz, pétalas, calor.
  {id:'i-mote-a',  kind:'mote',   tone:'warm', from:0,   to:.16, depth:.18, top:22, size:120, spin:0},
  {id:'i-petal-a', kind:'petal',  tone:'warm', from:.02, to:.19, depth:.72, top:66, size:58,  spin:150},
  {id:'i-mote-b',  kind:'mote',   tone:'warm', from:.06, to:.22, depth:.42, top:38, size:80,  spin:0},
  {id:'i-petal-b', kind:'petal',  tone:'warm', from:.10, to:.26, depth:.30, top:14, size:44,  spin:-120},

  // Ato II — a ruptura: a pulseirinha de maternidade atravessa devagar, quase nítida.
  {id:'ii-mote',   kind:'mote',   tone:'cold', from:.21, to:.36, depth:.22, top:26, size:96,  spin:0},
  {id:'ii-band',   kind:'bracelet',tone:'cold',from:.24, to:.385,depth:.55, top:58, size:120, spin:24},
  {id:'ii-petal',  kind:'petal',  tone:'cold', from:.26, to:.39, depth:.78, top:80, size:66,  spin:200},

  // 39,5%–45%: vazio absoluto. Nenhum objeto agendado — de propósito.

  // Ato III — a continuidade: papéis ao vento, o livro, folhas.
  {id:'iii-mote',  kind:'mote',   tone:'warm', from:.46, to:.60, depth:.20, top:34, size:110, spin:0},
  {id:'iii-paper-a',kind:'paper', tone:'warm', from:.47, to:.62, depth:.62, top:18, size:70,  spin:-90},
  {id:'iii-paper-b',kind:'paper', tone:'warm', from:.50, to:.66, depth:.36, top:46, size:52,  spin:130},
  {id:'iii-book',  kind:'book',   tone:'warm', from:.52, to:.68, depth:.80, top:64, size:104, spin:-18},
  {id:'iii-leaf',  kind:'leaf',   tone:'warm', from:.56, to:.72, depth:.46, top:82, size:48,  spin:170},

  // "Impressionando os Anjos": a canção ganha uma nota musical, leve, quase no colo do rolo.
  {id:'song-note-a',kind:'note',  tone:'warm', from:.635,to:.700, depth:.58, top:20, size:56,  spin:40},
  {id:'song-note-b',kind:'note',  tone:'warm', from:.655,to:.715, depth:.30, top:78, size:40,  spin:-30},

  // "Mas essa história ainda não terminou" / "A VIDA NÃO PARA" / elenco: a câmera do
  // set voa pela tela — é o momento em que a história vira filme de verdade.
  {id:'cast-clapper',kind:'clapper',tone:'warm',from:.700,to:.760, depth:.66, top:24, size:92, spin:-22},
  {id:'cast-camera', kind:'camera', tone:'warm',from:.760,to:.830, depth:.58, top:70, size:104,spin:14},

  // "Por que esse filme precisa existir" / "20 ações gratuitas": o cuidado ganha forma.
  {id:'impact-heart-a',kind:'heart',tone:'warm',from:.840,to:.900, depth:.34, top:26, size:60, spin:0},
  {id:'impact-heart-b',kind:'heart',tone:'warm',from:.905,to:.945, depth:.70, top:74, size:48, spin:0},

  // "Talvez você possa fazer parte do próximo capítulo": o convite chega como carta.
  {id:'invite-envelope',kind:'envelope',tone:'warm',from:.945,to:1, depth:.50, top:66, size:78, spin:-8},

  // Ato IV — o propósito: luz calma, sem ruído visual.
  {id:'iv-mote-a', kind:'mote',   tone:'warm', from:.72, to:.88, depth:.28, top:30, size:100, spin:0},
  {id:'iv-petal',  kind:'petal',  tone:'warm', from:.78, to:.94, depth:.68, top:72, size:54,  spin:140},
  {id:'iv-mote-b', kind:'mote',   tone:'warm', from:.86, to:1,   depth:.44, top:48, size:86,  spin:0},
];

function Shape({kind,tone}:{kind:Kind;tone:Tone}) {
  const ink = tone==='warm' ? '#e9cfa1' : '#9fb4c6';
  const soft = tone==='warm' ? '#c8a775' : '#6d8296';
  if (kind==='mote') return <span className={`floater-mote floater-mote--${tone}`}/>;
  if (kind==='petal') return <svg viewBox="0 0 40 56" fill="none">
    <path d="M20 1C31 13 38 27 38 37a18 18 0 0 1-36 0C2 27 9 13 20 1Z" fill={ink} opacity=".5"/>
    <path d="M20 8c0 14 0 26 0 45" stroke={soft} strokeWidth="1" opacity=".55"/>
  </svg>;
  if (kind==='bracelet') return <svg viewBox="0 0 96 48" fill="none">
    <path d="M14 24a34 12 0 1 0 68 0 34 12 0 1 0-68 0Z" stroke={ink} strokeWidth="2.4" opacity=".75"/>
    <rect x="30" y="15" width="36" height="18" rx="4" fill={ink} opacity=".28"/>
    <path d="M36 21h24M36 27h16" stroke={soft} strokeWidth="1.6" opacity=".8"/>
    <circle cx="14" cy="24" r="3.4" fill={ink} opacity=".7"/>
    <circle cx="82" cy="24" r="3.4" fill={ink} opacity=".7"/>
  </svg>;
  if (kind==='paper') return <svg viewBox="0 0 44 58" fill="none">
    <rect x="1.5" y="1.5" width="41" height="55" rx="2" fill={ink} opacity=".22" stroke={ink} strokeOpacity=".45"/>
    <path d="M9 14h26M9 22h26M9 30h18M9 38h22" stroke={soft} strokeWidth="1.6" opacity=".6"/>
  </svg>;
  if (kind==='book') return <svg viewBox="0 0 68 48" fill="none">
    <path d="M4 6h26v38H10a6 6 0 0 1-6-6V6Z" fill={ink} opacity=".3"/>
    <path d="M64 6H38v38h16a6 6 0 0 0 6-6V6Z" fill={ink} opacity=".22"/>
    <rect x="30" y="4" width="8" height="42" rx="2" fill={soft} opacity=".75"/>
    <path d="M33 12v26" stroke={ink} strokeWidth="1.2" opacity=".8"/>
  </svg>;
  if (kind==='leaf') return <svg viewBox="0 0 40 40" fill="none">
    <path d="M38 2C20 2 2 12 2 26c0 6 4 12 4 12s10-4 18-12S38 2 38 2Z" fill={ink} opacity=".34"/>
    <path d="M6 38C14 26 26 14 38 2" stroke={soft} strokeWidth="1.4" opacity=".7"/>
  </svg>;
  if (kind==='camera') return <svg viewBox="0 0 72 44" fill="none">
    <rect x="1.5" y="9.5" width="46" height="30" rx="3" fill={ink} opacity=".26" stroke={ink} strokeOpacity=".7"/>
    <path d="M47 18l22-9v26l-22-9Z" fill={ink} opacity=".22" stroke={ink} strokeOpacity=".6"/>
    <circle cx="24" cy="24.5" r="10" stroke={soft} strokeWidth="1.6" opacity=".85"/>
    <circle cx="24" cy="24.5" r="4" fill={soft} opacity=".7"/>
    <rect x="8" y="3" width="14" height="7" rx="1.5" fill={ink} opacity=".3"/>
  </svg>;
  if (kind==='clapper') return <svg viewBox="0 0 64 48" fill="none">
    <rect x="2" y="16" width="60" height="30" rx="2.5" fill={ink} opacity=".26" stroke={ink} strokeOpacity=".7"/>
    <path d="M2 16 58 4l4 10-56 12Z" fill={ink} opacity=".3" stroke={ink} strokeOpacity=".65"/>
    <path d="M13 7l4 10M27 4l4 10M41 1l4 10" stroke={soft} strokeWidth="2.4" opacity=".75"/>
    <path d="M8 30h48M8 38h34" stroke={soft} strokeWidth="1.4" opacity=".55"/>
  </svg>;
  if (kind==='note') return <svg viewBox="0 0 36 48" fill="none">
    <circle cx="8" cy="40" r="6.5" fill={ink} opacity=".55"/>
    <circle cx="26" cy="35" r="6.5" fill={ink} opacity=".55"/>
    <path d="M14.5 40V6.5L32.5 2v28.5" stroke={soft} strokeWidth="2" opacity=".8"/>
    <path d="M14.5 14 32.5 9.5" stroke={soft} strokeWidth="2" opacity=".8"/>
  </svg>;
  if (kind==='heart') return <svg viewBox="0 0 44 40" fill="none">
    <path d="M22 38C6 27 2 18 2 12a10 10 0 0 1 20-1 10 10 0 0 1 20 1c0 6-4 15-20 26Z"
      fill={ink} opacity=".4" stroke={soft} strokeOpacity=".7" strokeWidth="1.4"/>
  </svg>;
  if (kind==='envelope') return <svg viewBox="0 0 60 44" fill="none">
    <rect x="1.5" y="1.5" width="57" height="41" rx="2.5" fill={ink} opacity=".24" stroke={ink} strokeOpacity=".65"/>
    <path d="M3 4 30 26 57 4" stroke={soft} strokeWidth="1.8" opacity=".85"/>
  </svg>;
  return null;
}

function Floater({spec,p}:{spec:Spec;p:MotionValue<number>}) {
  const {from,to,depth,top,size,spin} = spec;
  // Paralaxe: quanto mais perto da lente, maior a distância percorrida na mesma janela
  // de scroll — e portanto maior a velocidade aparente.
  const travel = 58 + depth*95;
  const x = useTransform(p,[from,to],[`${travel}vw`,`${-travel}vw`]);
  const drift = useTransform(p,[from,to],[0,-30-depth*70]);
  const rotate = useTransform(p,[from,to],[0,spin]);
  const span = to-from;
  const opacity = useTransform(p,[from,from+span*.18,to-span*.22,to],[0,1,1,0]);
  // Distância ao plano focal (o rolo, em depth .5) define o desfoque, como numa lente.
  const blur = Math.abs(depth-.5)*13;
  return <motion.span
    className="floater"
    aria-hidden="true"
    style={{
      x, y:drift, rotate, opacity,
      top:`${top}%`,
      width:size, height:size,
      filter:`blur(${blur.toFixed(2)}px)`,
      zIndex: depth>.65 ? 4 : 0,
    }}
  ><Shape kind={spec.kind} tone={spec.tone}/></motion.span>;
}

export default function FloatingElements({p,reduced}:{p:MotionValue<number>;reduced:boolean}) {
  if (reduced) return null;
  return <>{FLOATERS.map(spec=><Floater key={spec.id} spec={spec} p={p}/>)}</>;
}
