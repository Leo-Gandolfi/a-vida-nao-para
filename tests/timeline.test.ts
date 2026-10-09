import test from 'node:test';
import assert from 'node:assert/strict';
import {audioMix,audioTone,beatAt,beats,MUSIC_IN,TONE_MUFFLED,TONE_OPEN} from '../src/timeline.ts';
test('tragédia permanece em silêncio inclusive em rolagem reversa',()=>{
 for(const p of [.3,.32,.34,.36,.4,.42,.449,.42,.35])assert.deepEqual(audioMix(p),{opening:0,finale:0,silence:true});
});
test('mixagem mantém ganhos válidos em todo o percurso',()=>{
 for(let i=0;i<=1000;i++){const m=audioMix(i/1000);assert.ok(m.opening>=0&&m.opening<=1);assert.ok(m.finale>=0&&m.finale<=1);}
 assert.ok(audioMix(.695).finale>audioMix(.74).finale); // a trilha baixa depois do encontro
 assert.equal(audioMix(MUSIC_IN-.001).finale,0);          // a canção só entra no encontro
 assert.equal(beatAt(MUSIC_IN+.001)?.id,'encounter');
 assert.ok(audioMix(.49).opening>0);
});
test('o som afunda antes do silêncio e reabre com a luz',()=>{
 // Nunca sai da faixa audível útil, em nenhum ponto do percurso.
 for(let i=0;i<=1000;i++){const f=audioTone(i/1000);assert.ok(f>=TONE_MUFFLED&&f<=TONE_OPEN,`corte fora da faixa em ${i/1000}: ${f}`);}
 assert.equal(audioTone(.1),TONE_OPEN);            // promessa: som aberto
 assert.ok(audioTone(.25)<TONE_OPEN*.5);           // ruptura: já afundando
 assert.equal(audioTone(.35),TONE_MUFFLED);        // silêncio: abafado no fundo
 assert.ok(audioTone(.49)>audioTone(.46));         // reabrindo conforme a luz volta
 assert.equal(audioTone(.64),TONE_OPEN);           // a canção entra com o som inteiro
 // A varredura é monotônica nos dois sentidos (sem solavancos de timbre).
 for(let p=.20;p<.30;p+=.005)assert.ok(audioTone(p+.005)<=audioTone(p)+1e-6);
 for(let p=.45;p<.52;p+=.005)assert.ok(audioTone(p+.005)>=audioTone(p)-1e-6);
});
test('roteiro da página de captação, pausa vazia e convite persistente',()=>{
 assert.equal(beats.length,30);
 assert.equal(new Set(beats.map(b=>b.id)).size,beats.length);
 assert.equal(beats.at(-2)?.id,'marilia');
 assert.equal(beatAt(.405),undefined);
 assert.equal(beatAt(1)?.id,'final');
 for(let i=1;i<beats.length;i++)assert.ok(beats[i].start>=beats[i-1].end);
});
