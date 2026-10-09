# A VIDA NÃO PARA — scrollytelling cinematográfico

Projeto React + TypeScript + Framer Motion. Entrega de código base local, sem publicação. 

## Executar

Node.js 22+.

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Direção criativa

Um rolo de filme sobre uma mesa de edição, não uma sequência de seções nem um palco central. A navegação é **horizontal**: arraste ou role para o lado (mouse, trackpad, toque ou teclado) para puxar uma fita de quadros por uma janela de projeção. Cada momento da história entra pela direita, cruza o centro — onde fica nítido — e sai pela esquerda, sempre com o quadro vizinho borrado ao fundo (profundidade de campo). Cada quadro tem bordas de filme com furos de sprocket, numeração de quadro e ato no canto, e uma legenda abaixo (para fotos) ou dentro de um anel de contagem regressiva (para os momentos sem imagem). O convite final é o único quadro que permanece sempre nítido, mesmo no fim absoluto da rolagem.

O visitante controla a duração. `.scroll-viewport` é a própria janela que rola (a roda vertical do mouse é convertida em deslocamento lateral automaticamente, assim como as setas ↑/↓ e Page Up/Down, para quem está acostumado com a convenção vertical); setas ←/→ funcionam nativamente. `.scroll-track` é a fita larga interna (`1800svw`, cerca de 17 telas de percurso) que dá a ela algo para rolar; ajuste sua largura para editar a cadência. Não há bloqueio de toque nem rolagem automática — só a conversão de eixo do wheel. `sticky` mantém o palco (`.stage`) grudado à esquerda em `100vw`×`100dvh` enquanto a fita passa por baixo. Textos maiores que o espaço disponível podem ser consultados em “Ler a história”.

### A cortina de abertura

A primeira coisa que o visitante vê é preto absoluto — nenhuma imagem, nenhum quadro, nenhum som — com um único convite: "Role a tela →". Só no primeiro gesto de scroll (por menor que seja) a cortina desaparece suavemente (`gateOpacity`, em `Cinema.tsx`) e a história começa a aparecer aos poucos, junto com a trilha sonora, que liga sozinha nesse mesmo instante — sem exigir um clique separado no botão de som (ver "Som automático" abaixo).

### Camadas de dramaturgia

Além do rolo, várias camadas acompanham a história e são todas dirigidas pelo mesmo progresso de scroll:

1. **O céu inteiro** (`StageSky.tsx`): sol, lua e estrelas percorrem um arco pelo fundo da tela, sincronizados com a temperatura de cada ato — o sol nasce na promessa, se põe na ruptura (quando a lua e as estrelas assumem) e nasce de novo com Mallu, ficando a pino até o entardecer do convite final. A cor de fundo (`.stage-wash`) acompanha o mesmo ciclo.
2. **Objetos simbólicos** (`FloatingElements.tsx`): pétalas e partículas de luz no primeiro ato, uma pulseirinha de maternidade atravessando devagar na ruptura, papéis/livro/folhas na retomada, uma claquete e uma câmera voando quando a história vira filme, uma nota musical na canção, corações no propósito social, um envelope no convite final. Cada um tem uma *profundidade*; o plano focal é o próprio rolo, então quem está mais longe **ou mais perto** que ele sai de foco — os mais próximos passam na frente do rolo (desfocados, como primeiro plano), e os que estão exatamente na mesma profundidade do rolo passam *atrás* do quadro ao cruzá-lo, como um objeto real na mesma distância seria ocluído por ele.
3. **Timbre do som** (`audioTone` em `timeline.ts`): antes de o volume sumir, o som **afunda** — um passa-baixa fecha de 20 kHz até 180 Hz entre 20% e 30%, como ouvir debaixo d'água. Reabre entre 45% e 52%, quando a luz volta.
4. **Luz que invade** (`.light-sweep`): em "A vida não parou", uma faixa quente cruza a tela da esquerda para a direita.
5. **A fita de sprockets ambiente** (`.reel-ribbon`): corre pelo alto e pela base da tela inteira, sempre — não só ao redor de cada quadro —, avançando em passo com o scroll (não com o relógio), para que a experiência inteira pareça acontecer dentro de um rolo de filme físico.

O intervalo 39,5%–45% é **deliberadamente vazio em todas as camadas**: nenhum objeto é agendado ali, o som está em silêncio e a interface se apaga. Depois que Samuel parte, nada atravessa a tela até "Mallu ficou". Se for acrescentar elementos flutuantes, respeite essa janela.

Os astros/estrelas e os objetos simbólicos são desligados sob `prefers-reduced-motion: reduce`; o céu (cor de fundo) permanece, só sem o movimento.

### Quadro estável sempre centralizado

O ponto em que a fita "descansa" depois de parar de rolar é o mesmo centro geométrico usado para posicionar cada quadro (`mids`, em `Cinema.tsx`) — por isso o quadro legível sempre fica exatamente no meio da tela, nunca deslocado para um dos lados. Isso só funciona porque a revelação de texto palavra por palavra (`Word`, em `FilmFrame.tsx`) termina bem antes da metade do quadro, mesmo na legenda mais longa do roteiro (10 palavras) — se for reescrever falas muito mais longas que isso, verifique se a última palavra ainda termina de aparecer com folga antes de 50% do trecho, ou o quadro vai "descansar" com o texto ainda incompleto.

### Som automático

Ligar áudio exige um gesto reconhecido pelo navegador — rolar a *roda* do mouse sozinha não conta para essa política (só clique, toque e tecla contam), então o primeiro desses gestos em qualquer lugar da página já liga o som sozinho (ver o efeito `onFirstGesture` em `Cinema.tsx`). Quem usa só a roda do mouse ou o trackpad sem nunca clicar/tocar/apertar uma tecla não vai conseguir ligar o som automaticamente — é uma restrição do navegador, sem contorno possível; o botão de som manual continua funcionando normalmente para esse caso.

`useAudioController.ts` tolera colisões entre `play()` e `pause()` que acontecem quando o scroll muda a mixagem no exato instante em que o áudio é ligado (isso rejeita com `AbortError`, não com uma recusa real do navegador) — só uma recusa genuína de autoplay (`NotAllowedError`) desliga o áudio e avisa o visitante.

## Onde editar

- `src/components/Cinema.tsx`: componente principal, progresso horizontal global (via `scrollXProgress`), conversão de wheel/teclado, cortina de abertura, luz que invade, fita de sprockets ambiente, som automático, compartilhamento e CTA.
- `src/components/StageSky.tsx`: o céu como um dia de verdade — noite → amanhecer no prólogo, pôr do sol vermelho no nascimento, lua/estrelas e estrelas cadentes em "Mallu ficou.", segundo amanhecer na volta da luz, pôr do sol em Marília e lanternas subindo no crepúsculo final. Vaga-lumes acendem na noite do luto (some antes do vazio de 39,5%), a silhueta de prédios de Marília aparece só na tela da cidade, e as nuvens correm em duas camadas de profundidade. Cores (zênite/horizonte) e altura do sol são tabelas de keyframes por progresso; morros em silhueta escondem o sol abaixo do horizonte.
- Pássaros (amanheceres e Marília) e borboletas (volta da luz e piscina) ficam em `FloatingElements.tsx`; todos os objetos oscilam continuamente, mesmo com a fita parada.
- `src/components/FilmFrame.tsx`: cada quadro do rolo — foco/desfoque por proximidade do centro, revelação de texto palavra por palavra, tremor na ruptura, mídia por ato e a metamorfose Gledson → Sidney.
- `src/components/FloatingElements.tsx`: os objetos simbólicos, suas profundidades e janelas de scroll.
- `src/timeline.ts`: as 28 telas do roteiro da página de captação (texto, foto, proporção da janela, destaques em laranja com `*palavra*`), a mixagem (`audioMix`) e o timbre (`audioTone`), todos com intervalos de 0 a 1.
- `src/hooks/useAudioController.ts`: controlador funcional via Web Audio (ganho por faixa + um passa-baixa compartilhado), não apenas pseudocódigo.
- `src/config.ts`: único lugar para injetar fotos, vídeos, música e canal de contato.
- `src/styles.css`: direção de arte e adaptações de tela.

`SLOT_VW` (em `Cinema.tsx`) precisa ficar sincronizado com a largura de `.frame-slot` somada ao `gap` de `.filmstrip-track` em `styles.css` — os dois números descrevem a mesma distância (um em JavaScript, o outro em CSS) e precisam concordar para o deslocamento horizontal corresponder exatamente ao que é desenhado. O mesmo vale para a largura de `.scroll-track` (`2200svw`) em relação ao número de quadros.

Layout dos quadros: cada vaga tem 86vw (+4vw = `SLOT_VW` 90). Em tela larga (computador, celular deitado) a legenda fica ao lado da foto; em tela em pé ela fica embaixo, com o quadro usando quase toda a largura. A altura disponível para a foto é a variável CSS `--h`, e a proporção de cada foto vem de `ar` em `timeline.ts`.

Rolagem: a roda do mouse e o teclado alimentam um alvo que a fita persegue com inércia (deslize suave, em vez de saltos); qualquer outro movimento da fita (toque, encaixe, link para o convite) interrompe o deslize. Ao parar, a fita encaixa no centro do quadro mais próximo.

`.stage` precisa manter `width:100vw` explícito em `styles.css` — sem isso, ao herdar a largura da fita larga (`2200svw`) que o envolve, o cabeçalho/rodapé "fixos" passam a rolar junto com o conteúdo em vez de ficar pinados na tela.

React JSX usa `{/* INSERIR ... AQUI */}`; os demais marcadores usam comentários TypeScript.

## Desempenho no celular (importante)

O Safari do iPhone encerra a página ("Um problema ocorreu repetidamente") quando a memória de vídeo passa do limite. Por isso:

- Só os quadros a até ~2 passos da janela de projeção têm conteúdo montado (`FilmFrame`, estado `near`); os demais são vagas vazias da mesma largura.
- Objetos voadores, sol, lua, estrelas, vaga-lumes, estrelas cadentes, lanternas e a luz que invade só existem dentro da própria janela de scroll (`src/hooks/useInWindow.ts`).
- Nada de `will-change` permanente: cada elemento com ele vira uma camada de GPU sempre viva (as palavras animadas sozinhas chegavam a ~400 camadas).
- Em telas de toque (`isTouch`) não há desfoque animado (quadros, palavras, objetos) nem grão de filme em tela cheia.

Resultado medido (iPhone 13 emulado): de ~420 para ~100 camadas, e percurso completo sem travar no WebKit.

## Atos

| Progresso | Telas | Linguagem |
|---|---|---|
| 0–20% | 1–5 | Prólogo sem fotos (VIDA e Marília em laranja), o casal, a chegada |
| 20–45% | 6–10 | O nascimento (foto de Gledson com os gêmeos, a pedido dele), frio, Samuel, silêncio e "Mallu ficou." |
| 45–71,5% | 11–19 | Mallu na UTI, continuar, Fantástico 2015, a passagem do tempo, o livro, a canção, o encontro com Gustavo Mioto |
| 71,5–100% | 20–28 | Sala de cinema, título, elenco, propósito, Amor de Criança, convite, Marília e cartela final |

A ordem e os textos seguem o documento "PÁGINA_CAPTÇÃO" (numeração das telas). As artes do Fantástico 2015 e da canção de 2026 (terceira versão da página de captação) não trazem texto impresso: a frase vai na legenda ao lado. A tela do elenco usa a foto de Gledson com Sidney Sampaio (`gledson-sidney.jpg`); o crossfade entre retratos só é usado se não houver essa foto.

O intervalo 39,5–41,5% é vazio intencional. O ato final permanece visível a 100%. Não há mais navegação por marcadores de ato no rodapé (removida a pedido — o nome do ato em texto continua lá, só os pontinhos clicáveis saíram); o link "Ir para o convite" (accessible skip-link) e `jump()` seguem disponíveis para navegação direta. Toque, teclado e scroll nativo funcionam sem interceptação.

## Assets reais já incluídos

As fotos da página de captação estão em `public/media/` com nomes descritivos (`gledson-gemeos.jpg`, `samuel-sorriso.jpg`, `mallu-uti.jpg`, `continuar.jpg`, `fantastico-2015-v2.jpg`, `dias-meses.jpg`, `meses-anos.jpg`, `piscina.jpg`, `cancao-2026-v2.jpg`, `encontro-mioto.jpg`, `sala-cinema.jpg`, `silhueta-pai-filha.jpg`, `tela-cinema.jpg`, `amor-de-crianca.jpg`, `marilia.jpg`). Ainda pendentes: a foto dos sapatinhos rosa e azul (Tela 05 — hoje segue a foto das plaquinhas `a-espera.jpg`), o retrato de Sidney Sampaio O botão "Quero conversar sobre o projeto" abre o WhatsApp de Gledson (`project.contactUrl`).

### Histórico

Extraídos exclusivamente da apresentação enviada: foto de Gledson e Keila, preparativos dos gêmeos e registro dos irmãos. A fotografia dos irmãos está disponível no pacote, mas não foi usada como se fosse da UTI. O pôster da apresentação não foi usado como fotografia documental do elenco.

A foto real de Gledson com Mallu foi removida: `media.family` e `media.familyCare` agora apontam para ilustrações fictícias (`family-illustration.svg`, `care-illustration.svg`), usadas apenas como placeholder visual nos momentos "warm"/cuidado até que vídeos ou fotos reais e autorizadas sejam fornecidos.

Ainda faltam: ultrassom; UTI; vídeos de cuidado/escola; recortes das reportagens; encontro com Gustavo Mioto; retratos equivalentes de Gledson e Sidney; fotos de ações sociais e trilhas.

Enquanto faltam, a base usa as fotos fornecidas onde cabem, preto na UTI e tipografia editorial na repercussão. Não simula vídeo médico, recorte jornalístico ou retrato do ator. Crossfade já implementado, mas só poderá ser avaliado com os dois retratos reais. Ajuste `object-position` para alinhar os olhos. As legendas das reportagens são texto editorial baseado no roteiro, não manchetes citadas.

Use imagens WebP/AVIF em torno de 1600–2000 px para produção. Vídeos MP4 H.264 curtos e sem áudio, com `poster`, `muted`, `playsInline`, `loop`. As cenas só montam perto de sua janela; vídeos pausam quando saem ou quando a aba fica oculta. Falha de autoplay mantém o poster.

## Ativação do som

Navegadores só deixam tocar áudio depois de um gesto aceito como "ativação do usuário": clique (inclui o toque simples), toque concluído e tecla. Início de toque e rolagem não contam. A cortina de abertura liga o som no toque; além dela, uma escuta global (`click`, `touchend`, `pointerup`, `keydown`) tenta de novo a cada gesto até o som ligar de fato. `enable()` em `useAudioController` é idempotente, para que duas tentativas no mesmo toque não se anulem, e respeita quem desligou o som pelo botão. Os quadros não exibem mais marcador de página (pedido do Gledson); o rodapé mantém "Quadro NN / 28".

## Dramaturgia sonora

1. `openingTrack` e `finalTrack` apontam para `/media/tema-1.wav` ("A Vida Não Para — Tema 1"), fornecido junto ao projeto; "Impressionando os Anjos" ainda não foi recebida/autorizada, então o tema principal também não estava disponível; agora `finalTrack` é "Impressionando os Anjos" (`impressionando-os-anjos.mp3`), que entra no encontro com Gustavo Mioto (`MUSIC_IN` = 67,2%) e recomeça do início se o visitante voltar para antes dele para a história não ficar em silêncio.
2. Caminhos de mídia ainda não fornecidos permanecem `null`, sem requisições inválidas.
3. O usuário precisa ativar o som por clique; a narrativa funciona integralmente sem ele.
4. Instrumental em 0–20%, saída em 20–30%, silêncio absoluto em 30–45%.
5. Retorno instrumental em 45–64%; “Impressionando os Anjos” entra em 64% e diminui em 70%.
6. Scroll determina qual faixa toca e seu ganho, não a posição temporal da canção. Ao recuar, a faixa retoma do ponto anterior; ajuste isso se a edição exigir um trecho fixo.
7. Silenciar e ocultar aba zeram o ganho e pausam tudo. Desmontagem libera áudio e assinaturas.

"Impressionando os Anjos" (gravação comercial) não está distribuída neste pacote. Testes de mixagem verificam o silêncio e os limites; reprodução real depende do teste nos navegadores/dispositivos de destino.

## CTA real

“Quero conhecer o projeto” abre um resumo com as 20 ações previstas e os realizadores. Configure `project.contactUrl` com o contato oficial para habilitar “Vamos conversar”. Não foi inventado e-mail ou WhatsApp. Compartilhamento usa o recurso nativo, clipboard ou um campo selecionável como fallback; em desenvolvimento compartilha o endereço local. Publique antes de distribuir o link.

## Revisão editorial antes da divulgação

- O roteiro solicitado afirma “Sidney Sampaio será Gledson”; os ofícios dizem “convidamos”. O texto segue o pedido, centralizado em `actorLine` para validação.
- Os detalhes de 27/06/2015, seis horas e onze meses seguem o roteiro fornecido. A apresentação traz a cronologia geral, sem todos esses detalhes.
- O ofício Unimed datado de setembro de 2026 menciona estreia em janeiro de 2026. Essa previsão conflitante não foi utilizada.
- As 20 ações são compromissos previstos, não resultados já realizados.
- As contrapartidas do site seguem a apresentação resumida: exibição e diálogo. Não se mistura isso com outros trechos dos ofícios sobre doação de sangue/medula.

## Acessibilidade e integração

Foco visível, link para pular ao convite, diálogo nativo com Escape e foco retido, cenas inativas fora da árvore acessível, modo de leitura linear, preferência por movimento reduzido e som opt-in. Prefers-reduced-motion remove escala, deslocamento e blur; o visitante pode selecionar leitura linear para dispensar a timeline. Os fallbacks serif/sans funcionam sem Google Fonts.

Para Next.js, copie `src/components`, `src/hooks`, `src/config.ts`, `src/timeline.ts` e `public/media` e importe o CSS no layout. Use o componente cliente `Cinema` em uma página. Remova usos diretos de `window.location` do render se o framework executar renderização no servidor (o projeto entregue é uma SPA Vite).

Referências de implementação: https://motion.dev/docs/react-use-scroll e https://motion.dev/docs/react-use-transform.

## Verificação desta entrega

Compilação TypeScript/Vite concluída e três testes de timeline/mixagem aprovados. Inspeção visual automatizada concluída na build de produção (`vite preview`) via navegador headless, cobrindo todo o percurso (0–100%), viewport mobile e `prefers-reduced-motion: reduce`, sem erros de console. Ainda assim, faça a revisão final em desktop e celular reais, especialmente após inserir retratos, vídeos e áudios definitivos.
