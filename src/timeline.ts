export type Treatment = 'intro' | 'couple' | 'arrival' | 'cold' | 'void' | 'warm' | 'press' | 'music' | 'title' | 'cast' | 'social' | 'invite' | 'final';
export type Beat = { id: string; movement: number; start: number; end: number; text: string; eyebrow?: string; treatment: Treatment; small?: boolean; };
export const beats: Beat[] = [
  {id:'opening',movement:1,start:0,end:.036,text:'Algumas histórias são escritas.',eyebrow:'Uma história real · Marília, São Paulo',treatment:'intro'},
  {id:'life',movement:1,start:.036,end:.070,text:'Outras, a vida escreve primeiro.',treatment:'intro'},
  {id:'real',movement:1,start:.070,end:.090,text:'Esta aconteceu de verdade.',treatment:'intro',small:true},
  {id:'couple',movement:2,start:.090,end:.145,text:'Uma vida comum.\nUm casal.\nO desejo de formar uma família.',eyebrow:'Gledson & Keila',treatment:'couple'},
  {id:'arrival',movement:3,start:.145,end:.200,text:'E a vida respondeu em dobro.',eyebrow:'Samuel e Mallu estavam chegando.',treatment:'arrival'},
  {id:'birth',movement:4,start:.200,end:.242,text:'O nascimento.',eyebrow:'27 de junho de 2015',treatment:'cold'},
  {id:'hours',movement:4,start:.242,end:.280,text:'E seis horas depois…',treatment:'cold'},
  {id:'keila',movement:4,start:.280,end:.340,text:'A despedida de Keila.',treatment:'cold'},
  {id:'samuel',movement:5,start:.340,end:.395,text:'Onze meses depois,\nSamuel também partiu.',treatment:'void',small:true},
  // .395–.415: intervalo intencional. Nenhuma imagem, palavra ou som.
  {id:'mallu',movement:5,start:.415,end:.450,text:'Mallu ficou.',treatment:'void'},
  {id:'continues',movement:6,start:.450,end:.515,text:'A vida não parou.',treatment:'warm'},
  {id:'care',movement:6,start:.515,end:.560,text:'',treatment:'warm'},
  {id:'news2015',movement:7,start:.560,end:.600,text:'Em 2015, o Brasil conheceu uma história.',treatment:'press'},
  {id:'news2026',movement:7,start:.600,end:.640,text:'Onze anos depois, descobriu que ela não havia terminado.',treatment:'press'},
  {id:'song',movement:8,start:.640,end:.700,text:'Impressionando os Anjos',eyebrow:'Gustavo Mioto · Uma história que também se tornou canção',treatment:'music'},
  {id:'turn',movement:9,start:.700,end:.735,text:'Mas essa história ainda não terminou.',treatment:'intro'},
  {id:'film',movement:9,start:.735,end:.780,text:'A VIDA\nNÃO PARA',eyebrow:'O filme',treatment:'title'},
  {id:'cast',movement:10,start:.780,end:.840,text:'Uma história vivida agora começa a ganhar vida no cinema.',treatment:'cast'},
  {id:'why',movement:11,start:.840,end:.870,text:'Por que esse filme precisa existir?',treatment:'social'},
  {id:'purpose',movement:12,start:.870,end:.910,text:'Não queremos apenas transformar uma história em filme.',treatment:'social'},
  {id:'impact',movement:12,start:.910,end:.945,text:'Queremos transformar um filme em histórias que continuam.',eyebrow:'20 ações gratuitas de exibição e diálogo previstas no projeto',treatment:'social'},
  {id:'invitation',movement:13,start:.945,end:.975,text:'Nenhuma história como esta chega longe sozinha.',eyebrow:'Talvez você possa fazer parte do próximo capítulo.',treatment:'invite'},
  {id:'final',movement:14,start:.975,end:1,text:'A VIDA\nNÃO PARA',eyebrow:'O filme · Inspirado em uma história real',treatment:'final'},
];
export const acts = [
  {at:0,label:'O amor e a promessa',roman:'I'},
  {at:.2,label:'A ruptura e o silêncio',roman:'II'},
  {at:.45,label:'A luz e o recomeço',roman:'III'},
  {at:.7,label:'O propósito e o convite',roman:'IV'},
];
export const clamp = (n:number) => Math.max(0,Math.min(1,n));
export function audioMix(p:number) {
  const opening = p < .20 ? .30 : p < .30 ? .30 * (1-(p-.2)/.10) : p >= .45 && p < .64 ? .24 * clamp((p-.45)/.025) * clamp((.64-p)/.025) : 0;
  const finale = p >= .64 ? .46 * clamp((p-.64)/.025) * (p >= .70 ? .56 : 1) : 0;
  return { opening, finale, silence: p >= .30 && p < .45 };
}
export function beatAt(p:number) { return beats.find(b => p >= b.start && (p < b.end || b.end === 1 && p === 1)); }
