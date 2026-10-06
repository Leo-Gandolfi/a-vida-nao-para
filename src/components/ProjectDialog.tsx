import { useEffect, useRef } from 'react';
import { project } from '../config';
export default function ProjectDialog({open,onClose,onShare,shareMessage}:{open:boolean;onClose:()=>void;onShare:()=>void;shareMessage:string}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(open)ref.current?.showModal();else ref.current?.close();},[open]);
  return <dialog ref={ref} className="project-dialog" onClose={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}>
    <button className="dialog-close" onClick={onClose} aria-label="Fechar apresentação">×</button>
    <p className="eyebrow">A vida não para · O filme</p>
    <h2>Há histórias que precisam encontrar mais pessoas.</h2>
    <p>Um longa-metragem inspirado na trajetória de Gledson Fonseca. Uma história real de luto, paternidade, vínculos, reconstrução e continuidade.</p>
    <p>Uma história que nasceu em Marília, alcançou o Brasil e agora se prepara para ganhar as telas do cinema.</p>
    <div className="project-purpose">
      <p>Mais do que transformar uma história em filme, queremos fazer com que esse filme continue gerando histórias.</p>
      <p>Parte da renda do filme poderá apoiar projetos sociais como o Amor de Criança.</p>
    </div>
    <p className="project-credits">Um projeto de Instituto VOLTE, Estúdio Mágico Filmes e Sapiência Filmes.</p>
    <div className="dialog-actions">
      {project.contactUrl
        ? <a className="button button--primary" href={project.contactUrl}>Quero conversar sobre o projeto <span className="button-arrow" aria-hidden="true">→</span></a>
        : <button className="button button--primary" disabled aria-describedby="contact-pending">Quero conversar sobre o projeto <span className="button-arrow" aria-hidden="true">→</span></button>}
      <button className="button button--ghost" onClick={onShare}>Compartilhar esta história</button>
    </div>
    {!project.contactUrl && <p id="contact-pending" className="contact-pending">O canal de contato da produção será disponibilizado em breve.</p>}
    <p className="contact-pending" role="status">{shareMessage}</p>
  </dialog>;
}
