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

### Camadas de dramaturgia

Além do rolo, quatro camadas acompanham a história e são todas dirigidas pelo mesmo progresso de scroll:

1. **Temperatura da tela** (`.stage-wash`): dourado quente na promessa → azul gélido na ruptura → breu no silêncio → calor de volta com Mallu → tom sóbrio no convite.
2. **Objetos simbólicos** (`FloatingElements.tsx`): pétalas e partículas de luz no primeiro ato, uma pulseirinha de maternidade atravessando devagar na ruptura, papéis/livro/folhas na retomada. Cada um tem uma *profundidade*; o plano focal é o próprio rolo, então quem está mais longe **ou mais perto** que ele sai de foco, e os mais próximos passam na frente do rolo, como um elemento de primeiro plano sujando o quadro numa filmagem real.
3. **Timbre do som** (`audioTone` em `timeline.ts`): antes de o volume sumir, o som **afunda** — um passa-baixa fecha de 20 kHz até 180 Hz entre 20% e 30%, como ouvir debaixo d'água. Reabre entre 45% e 52%, quando a luz volta.
4. **Luz que invade** (`.light-sweep`): em "A vida não parou", uma faixa quente cruza a tela da esquerda para a direita.

O intervalo 39,5%–45% é **deliberadamente vazio em todas as camadas**: nenhum objeto é agendado ali, o som está em silêncio e a interface se apaga. Depois que Samuel parte, nada atravessa a tela até "Mallu ficou". Se for acrescentar elementos flutuantes, respeite essa janela.

Tudo isso é desligado sob `prefers-reduced-motion: reduce`.

## Onde editar

- `src/components/Cinema.tsx`: componente principal, progresso horizontal global (via `scrollXProgress`), conversão de wheel/teclado, temperatura da tela, luz que invade, capítulos, compartilhamento e CTA.
- `src/components/FilmFrame.tsx`: cada quadro do rolo — foco/desfoque por proximidade do centro, revelação de texto palavra por palavra, tremor na ruptura, mídia por ato e a metamorfose Gledson → Sidney.
- `src/components/FloatingElements.tsx`: os objetos simbólicos e suas profundidades/janelas de scroll.
- `src/timeline.ts`: os 14 movimentos e seus submomentos, a mixagem (`audioMix`) e o timbre (`audioTone`), todos com intervalos de 0 a 1.
- `src/hooks/useAudioController.ts`: controlador funcional via Web Audio (ganho por faixa + um passa-baixa compartilhado), não apenas pseudocódigo.
- `src/config.ts`: único lugar para injetar fotos, vídeos, música e canal de contato.
- `src/styles.css`: direção de arte e adaptações de tela.

`SLOT_VW` (em `Cinema.tsx`) precisa ficar sincronizado com a largura de `.frame-slot` somada ao `gap` de `.filmstrip-track` em `styles.css` — os dois números descrevem a mesma distância (um em JavaScript, o outro em CSS) e precisam concordar para o deslocamento horizontal corresponder exatamente ao que é desenhado. O mesmo vale para a largura de `.scroll-track` (`1800svw`) em relação ao número de quadros.

`.stage` precisa manter `width:100vw` explícito em `styles.css` — sem isso, ao herdar a largura da fita larga (`1800svw`) que o envolve, o cabeçalho/rodapé "fixos" passam a rolar junto com o conteúdo em vez de ficar pinados na tela.

React JSX usa `{/* INSERIR ... AQUI */}`; os demais marcadores usam comentários TypeScript.

## Atos

| Progresso | Movimentos | Linguagem |
|---|---|---|
| 0–20% | 1–3 | Preto, memória quente, chegada dos gêmeos |
| 20–45% | 4–5 | Frio, ausência, silêncio e Mallu |
| 45–70% | 6–8 | Cuidado, repercussão nacional, canção |
| 70–100% | 9–14 | Filme, elenco, impacto social e convite |

O intervalo 39,5–41,5% é vazio intencional. O ato final permanece visível a 100%. Navegação por capítulos salta de forma imediata para não obrigar pessoas a atravessar transições rapidamente. Toque, teclado e scroll nativo funcionam sem interceptação.

## Assets reais já incluídos

Extraídos exclusivamente da apresentação enviada: foto de Gledson e Keila, preparativos dos gêmeos e registro dos irmãos. A fotografia dos irmãos está disponível no pacote, mas não foi usada como se fosse da UTI. O pôster da apresentação não foi usado como fotografia documental do elenco.

A foto real de Gledson com Mallu foi removida: `media.family` e `media.familyCare` agora apontam para ilustrações fictícias (`family-illustration.svg`, `care-illustration.svg`), usadas apenas como placeholder visual nos momentos "warm"/cuidado até que vídeos ou fotos reais e autorizadas sejam fornecidos.

Ainda faltam: ultrassom; UTI; vídeos de cuidado/escola; recortes das reportagens; encontro com Gustavo Mioto; retratos equivalentes de Gledson e Sidney; fotos de ações sociais e trilhas.

Enquanto faltam, a base usa as fotos fornecidas onde cabem, preto na UTI e tipografia editorial na repercussão. Não simula vídeo médico, recorte jornalístico ou retrato do ator. Crossfade já implementado, mas só poderá ser avaliado com os dois retratos reais. Ajuste `object-position` para alinhar os olhos. As legendas das reportagens são texto editorial baseado no roteiro, não manchetes citadas.

Use imagens WebP/AVIF em torno de 1600–2000 px para produção. Vídeos MP4 H.264 curtos e sem áudio, com `poster`, `muted`, `playsInline`, `loop`. As cenas só montam perto de sua janela; vídeos pausam quando saem ou quando a aba fica oculta. Falha de autoplay mantém o poster.

## Dramaturgia sonora

1. `openingTrack` e `finalTrack` apontam para `/media/tema-1.wav` ("A Vida Não Para — Tema 1"), fornecido junto ao projeto; "Impressionando os Anjos" ainda não foi recebida/autorizada, então o tema principal também cobre o clímax (64–100%) para a história não ficar em silêncio.
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
