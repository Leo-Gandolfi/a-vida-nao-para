import { useState } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';

/** Verdadeiro só enquanto o progresso está dentro de [from, to]. Usado para MONTAR
 * elementos apenas perto do momento em que aparecem: no iPhone, cada camada animada
 * mantida viva (mesmo invisível) consome memória de vídeo, e o Safari encerra a página
 * ("Um problema ocorreu repetidamente") quando o total passa do limite. */
export function useInWindow(p:MotionValue<number>,from:number,to:number) {
  const [inside,setInside]=useState(()=>{const v=p.get();return v>=from&&v<=to;});
  useMotionValueEvent(p,'change',v=>{const i=v>=from&&v<=to;setInside(old=>old===i?old:i);});
  return inside;
}

/** Telas de toque (celulares e tablets): sem filtros de desfoque animados nem grão em
 * tela cheia — são os efeitos mais caros em memória e GPU, e quase imperceptíveis ali. */
export const isTouch = typeof window!=='undefined' && window.matchMedia('(pointer:coarse)').matches;
