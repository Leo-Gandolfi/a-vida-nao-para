import test from 'node:test';
import assert from 'node:assert/strict';
import {audioMix,beatAt,beats} from '../src/timeline.ts';
test('tragédia permanece em silêncio inclusive em rolagem reversa',()=>{
 for(const p of [.3,.32,.34,.36,.4,.42,.449,.42,.35])assert.deepEqual(audioMix(p),{opening:0,finale:0,silence:true});
});
test('mixagem mantém ganhos válidos em todo o percurso',()=>{
 for(let i=0;i<=1000;i++){const m=audioMix(i/1000);assert.ok(m.opening>=0&&m.opening<=1);assert.ok(m.finale>=0&&m.finale<=1);}
 assert.ok(audioMix(.68).finale>audioMix(.72).finale);
 assert.ok(audioMix(.49).opening>0);
});
test('14 movimentos, pausa vazia e convite persistente',()=>{
 assert.equal(new Set(beats.map(b=>b.movement)).size,14);
 assert.equal(beatAt(.405),undefined);
 assert.equal(beatAt(1)?.id,'final');
 for(let i=1;i<beats.length;i++)assert.ok(beats[i].start>=beats[i-1].end);
});
