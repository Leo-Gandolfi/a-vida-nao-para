/** Todos os caminhos são locais. null = mídia ainda não fornecida, sem requisições 404.
 * Não use música comercial até receber o arquivo autorizado para esta utilização.
 */
export const media = {
  couple: '/media/gledson-keila.png',
  arrival: '/media/a-espera.jpg',
  // Ilustração fictícia (não é uma fotografia real de Gledson e Mallu). INSERIR FOTO REAL EQUIVALENTE QUANDO DISPONÍVEL.
  family: '/media/family-illustration.svg',
  // Segunda ilustração fictícia, usada apenas no submomento "care" para não repetir a imagem de "family".
  familyCare: '/media/care-illustration.svg',
  twins: '/media/samuel-mallu.jpg',
  ultrasound: null as string | null, // INSERIR VÍDEO DO ULTRASSOM AQUI
  neonatal: null as string | null, // INSERIR FOTO DA UTI NEONATAL AQUI
  care: null as string | null, // INSERIR VÍDEO GLEDSON FAZENDO MASSAGEM EM MALLU AQUI
  school: null as string | null, // INSERIR VÍDEO MALLU NA ESCOLA AQUI
  news2015: null as string | null, // INSERIR RECORTE REAL FANTÁSTICO 2015 AQUI
  news2026: null as string | null, // INSERIR RECORTE REAL FANTÁSTICO 2026 AQUI
  mioto: null as string | null, // INSERIR FOTO DO ENCONTRO REAL COM GUSTAVO MIOTO AQUI
  gledsonPortrait: null as string | null, // INSERIR FOTO GLEDSON AQUI, mesmo enquadramento de Sidney
  sidneyPortrait: null as string | null, // INSERIR FOTO SIDNEY AQUI, alinhar olhos antes do crossfade
  social: null as string | null, // INSERIR FOTO DE CRIANÇAS E FAMÍLIAS AQUI
  // Tema instrumental do projeto, fornecido localmente ("A Vida Não Para - Tema 1").
  openingTrack: '/media/tema-1.wav',
  // "Impressionando os Anjos" ainda não foi fornecida/autorizada; o tema principal
  // também cobre o clímax (64–100%) para não deixar a história em silêncio.
  finalTrack: '/media/tema-1.wav',
};
export const project = {
  contactUrl: null as string | null, // INSERIR URL REAL: https://wa.me/55... ou mailto:...
  actorLine: 'Sidney Sampaio será Gledson.', // Roteiro do solicitante; ofícios dizem “convidamos”. Validar antes de publicar.
  title: 'A VIDA NÃO PARA',
};
