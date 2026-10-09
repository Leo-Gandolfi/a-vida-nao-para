import type { media } from './config';

export type Treatment = 'intro' | 'couple' | 'arrival' | 'photo' | 'cold' | 'void' | 'press' | 'music' | 'title' | 'cast' | 'social' | 'invite' | 'final';
export type Beat = {
  id: string; start: number; end: number;
  /** Texto principal. Palavras entre *asteriscos* ganham o laranja da identidade (VIDA, Marília). */
  text: string;
  eyebrow?: string;
  /** Linhas menores abaixo do texto principal, dentro do quadro (cada linha nunca quebra). */
  note?: string;
  treatment: Treatment;
  small?: boolean;
  /** Fotografia do quadro (chave de `media` em config.ts). */
  photo?: keyof typeof media;
  /** Proporção da janela do quadro (largura/altura). Padrão 4/3. */
  ar?: number;
  /** A arte já traz o texto impresso: a legenda fica só para leitores de tela. */
  composed?: boolean;
  /** Identificação discreta, quase documental, abaixo da legenda. */
  credit?: string;
  /** Vídeo curto, mudo e em loop no lugar da foto (a foto vira o pôster). */
  video?: keyof typeof media;
  /** Imagem pequena sobreposta no canto da foto (ex.: a capa do livro). */
  inset?: keyof typeof media;
};

// Proporções iguais às das fotos enviadas: nada de rosto cortado nas bordas.
const SQUARE = 1;

export const beats: Beat[] = [
  // Ato I — o amor e a promessa
  {id:'opening',start:0,end:.030,text:'Algumas histórias são escritas.',treatment:'intro'},
  {id:'life',start:.030,end:.062,text:'Outras, a\n*VIDA* escreve\nprimeiro.',treatment:'intro'},
  {id:'real',start:.062,end:.094,text:'Esta aconteceu de verdade.',note:'Uma história real.\n*Marília, São Paulo.*',treatment:'intro'},
  {id:'couple',start:.094,end:.132,text:'Uma vida comum.\nUm casal.\nO sonho de formar uma família.',eyebrow:'Gledson & Keila',treatment:'couple'},
  {id:'ultrasound',start:.132,end:.166,text:'',treatment:'photo',video:'ultrasoundClip',photo:'ultrasoundPoster',ar:520/390},
  {id:'arrival',start:.166,end:.200,text:'E a vida respondeu em dobro.',eyebrow:'Samuel e Mallu estavam chegando.',treatment:'arrival',photo:'arrival',ar:854/1280},
  // Ato II — a ruptura e o silêncio
  {id:'birth',start:.200,end:.236,text:'O nascimento.',eyebrow:'27 de junho de 2015',treatment:'cold',photo:'birthCrib',ar:1280/720},
  {id:'hours',start:.236,end:.268,text:'E seis horas depois…',treatment:'cold'},
  {id:'keila',start:.268,end:.305,text:'A despedida de Keila.',treatment:'cold'},
  // Gledson com Samuel e Mallu, sem texto: os dois juntos, antes de "Onze meses depois".
  {id:'twins',start:.305,end:.345,text:'',treatment:'photo',photo:'twins2',ar:976/952},
  {id:'samuel',start:.345,end:.395,text:'Samuel também partiu.',eyebrow:'Onze meses depois.',treatment:'photo',photo:'samuel',ar:622/805},
  // .395–.415: intervalo intencional. Nenhuma imagem, palavra ou som.
  {id:'mallu',start:.415,end:.450,text:'Mallu ficou.',treatment:'void'},
  // Ato III — a luz e o recomeço
  {id:'malluUti',start:.450,end:.478,text:'',treatment:'photo',photo:'malluUti',ar:SQUARE},
  {id:'continues',start:.478,end:.506,text:'E eu precisava continuar.',treatment:'photo',photo:'continues',ar:SQUARE},
  {id:'news2015',start:.506,end:.533,text:'No meu primeiro Dia dos Pais, o Fantástico levou minha história ao Brasil.',treatment:'press',photo:'news2015',ar:1111/829},
  {id:'days',start:.533,end:.560,text:'Os dias viraram meses.',treatment:'photo',photo:'days',ar:372/493},
  {id:'years',start:.560,end:.587,text:'Os meses, anos.',treatment:'photo',photo:'years',ar:SQUARE},
  {id:'relearn',start:.587,end:.614,text:'E nós fomos aprendendo a viver de novo.',treatment:'photo',photo:'relearn',ar:SQUARE},
  // Tela 16 — O Livro (acrescentada na segunda versão da página de captação).
  {id:'book',start:.614,end:.641,text:'Dessa travessia nasceu um livro.',treatment:'photo',photo:'book',inset:'bookCover',ar:414/523},
  {id:'song',start:.641,end:.672,text:'Onze anos depois, o Brasil descobriu que essa história também havia se tornado canção.',treatment:'press',photo:'song2026',ar:1108/820},
  {id:'encounter',start:.672,end:.715,text:'Até que a vida me levou ao encontro de quem transformou essa história em canção.',treatment:'music',photo:'mioto',ar:411/505,credit:'Gledson Fonseca + Gustavo Mioto · FACILPA, Lençóis Paulista'},
  // Ato IV — o propósito e o convite
  {id:'destiny',start:.715,end:.745,text:'E talvez essa história ainda tivesse mais um destino.',treatment:'photo',photo:'cinemaRoom',ar:SQUARE},
  {id:'film',start:.745,end:.778,text:'A VIDA\nNÃO PARA',eyebrow:'O filme',treatment:'title'},
  {id:'cast',start:.778,end:.830,text:'Uma história vivida agora começa a ganhar vida no cinema.',treatment:'cast',photo:'castPhoto',ar:1035/907},
  {id:'why',start:.830,end:.860,text:'Por que esse filme precisa existir?',treatment:'social',photo:'social'},
  {id:'purpose',start:.860,end:.890,text:'Não queremos apenas transformar uma história em filme.',treatment:'social',photo:'screen'},
  {id:'impact',start:.890,end:.920,text:'Parte da renda do filme poderá apoiar projetos como o Amor de Criança.',treatment:'social',photo:'impact',ar:721/844},
  {id:'invitation',start:.920,end:.948,text:'Nenhuma história como esta chega longe sozinha.',eyebrow:'Talvez você possa fazer parte do próximo capítulo.',treatment:'invite'},
  {id:'marilia',start:.948,end:.978,text:'Foi em *Marília* que esta história começou.\nFoi daqui que ela alcançou o Brasil.\nE é daqui que queremos levar o próximo capítulo ainda mais longe.',treatment:'photo',photo:'marilia'},
  {id:'final',start:.978,end:1,text:'A VIDA\nNÃO PARA',eyebrow:'O filme · Inspirado em uma história real',treatment:'final'},
];
export const acts = [
  {at:0,label:'O amor e a promessa',roman:'I'},
  {at:.2,label:'A ruptura e o silêncio',roman:'II'},
  {at:.45,label:'A luz e o recomeço',roman:'III'},
  {at:.715,label:'O propósito e o convite',roman:'IV'},
];
/** Remove a marcação de destaque (*palavra*) — para leitura corrida e textos alternativos. */
export const plain = (text:string) => text.replace(/\*/g,'');
export const clamp = (n:number) => Math.max(0,Math.min(1,n));

/** A canção entra no encontro com Gustavo Mioto ("Até que a vida me levou…"): o tema de
 * abertura se despede durante a tela de 2026 e a trilha final assume a partir daqui. */
export const MUSIC_IN = .672;
export function audioMix(p:number) {
  const opening = p < .20 ? .30 : p < .30 ? .30 * (1-(p-.2)/.10) : p >= .45 && p < MUSIC_IN ? .24 * clamp((p-.45)/.025) * clamp((MUSIC_IN-p)/.025) : 0;
  // Depois do encontro, a trilha baixa um pouco (sem degrau) para deixar o propósito respirar.
  const finale = p >= MUSIC_IN ? .46 * clamp((p-MUSIC_IN)/.02) * (1 - .44*clamp((p-.715)/.03)) : 0;
  return { opening, finale, silence: p >= .30 && p < .45 };
}

/** Corte do filtro passa-baixa, em Hz. O volume some na ruptura, mas antes disso o som
 * "afunda": entre 20% e 30% o timbre fecha até ficar abafado, como ouvir debaixo d'água
 * — a perda chegando antes do silêncio. Reabre entre 45% e 52%, quando a luz volta.
 * A interpolação é exponencial porque a audição é logarítmica: uma varredura linear em
 * Hz soaria como se quase nada acontecesse até o fim do trecho. */
export const TONE_OPEN = 20000, TONE_MUFFLED = 180;
export function audioTone(p:number) {
  const sweep = (k:number) => TONE_OPEN * Math.pow(TONE_MUFFLED/TONE_OPEN, clamp(k));
  if (p < .20) return TONE_OPEN;
  if (p < .30) return sweep((p-.20)/.10);
  if (p < .45) return TONE_MUFFLED;
  if (p < .52) return sweep(1-(p-.45)/.07);
  return TONE_OPEN;
}
export function beatAt(p:number) { return beats.find(b => p >= b.start && (p < b.end || b.end === 1 && p === 1)); }
