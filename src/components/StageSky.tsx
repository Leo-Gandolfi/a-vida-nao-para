import { motion, useTransform, type MotionValue } from 'framer-motion';

/** O céu inteiro por trás do rolo muda com a história: o sol nasce na promessa, se põe
 * na ruptura — quando a lua e as estrelas assumem — e nasce de novo com Mallu, ficando
 * a pino até o entardecer do convite final. Cada astro segue um arco (nasce raso, sobe
 * ao centro do céu, se põe raso) e só existe dentro da sua própria janela de scroll;
 * fora dela, opacidade zero, então não custa nada mantê-los sempre montados. */

type Window = { from:number; to:number };

function arcPercent(t:number) {
  const c = Math.max(0, Math.min(1, t));
  return { left: 8 + 84*c, top: 72 - 54*Math.sin(Math.PI*c) };
}

function Disc({p,window,kind}:{p:MotionValue<number>;window:Window;kind:'sun'|'moon'}) {
  const {from,to} = window;
  const span = to-from;
  const t = useTransform(p,[from,to],[0,1]);
  const left = useTransform(t,tt=>`${arcPercent(tt).left}%`);
  const top = useTransform(t,tt=>`${arcPercent(tt).top}%`);
  const opacity = useTransform(p,[from,from+span*.10,to-span*.10,to],[0,1,1,0]);
  return <motion.div className={`sky-disc sky-disc--${kind}`} aria-hidden="true" style={{left,top,opacity}}/>;
}

function Stars({p,window}:{p:MotionValue<number>;window:Window}) {
  const {from,to} = window;
  const span = to-from;
  const opacity = useTransform(p,[from,from+span*.22,to-span*.22,to],[0,.85,.85,0]);
  return <motion.div className="sky-stars" aria-hidden="true" style={{opacity}}>
    {Array.from({length:26}).map((_,i)=><span key={i}/>)}
  </motion.div>;
}

export default function StageSky({p,reduced}:{p:MotionValue<number>;reduced:boolean}) {
  // Dourado quente na promessa → azul gélido na ruptura → breu no silêncio → calor de
  // volta com Mallu → entardecer sóbrio no convite final.
  const wash = useTransform(
    p,
    [0,        .10,       .20,       .26,       .34,       .45,       .50,       .52,       .70,       .90,       1],
    ['#241b11','#3a2a16','#241b11','#101b26','#050a10','#050a10','#16202c','#241b11','#2a2014','#241a12','#17130f'],
  );
  return <>
    <motion.div className="stage-wash" aria-hidden="true" style={{backgroundColor:wash}}/>
    {!reduced && <>
      <Disc p={p} window={{from:0,to:.20}} kind="sun"/>
      <Stars p={p} window={{from:.20,to:.45}}/>
      <Disc p={p} window={{from:.20,to:.45}} kind="moon"/>
      <Disc p={p} window={{from:.45,to:.90}} kind="sun"/>
    </>}
  </>;
}
