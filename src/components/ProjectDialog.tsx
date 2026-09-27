import { useEffect, useRef } from 'react';
import { project } from '../config';
export default function ProjectDialog({open,onClose}:{open:boolean;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(open)ref.current?.showModal();else ref.current?.close();},[open]);
  return <dialog ref={ref} className="project-dialog" onClose={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}>
    <button className="dialog-close" onClick={onClose} aria-label="Fechar apresentação">×</button>
    <p className="eyebrow">A vida não para · O filme</p><h2>Há histórias que precisam encontrar mais pessoas.</h2>
    <p>Um longa-metragem inspirado na trajetória de Gledson Fonseca, com Marília como território central. Uma história de luto, paternidade, vínculos e reconstrução.</p>
    <div className="project-fact"><strong>20</strong><p>ações gratuitas de exibição e diálogo previstas, aproximando cinema, cuidado e comunidade.</p></div>
    <p>Um projeto de IGM — Instituto de Gestão de Mentes, Estúdio Mágico Filmes e Sapiência Filmes.</p>
    {project.contactUrl?<a className="button button--primary" href={project.contactUrl}>Vamos conversar ↗</a>:<p className="contact-pending">O canal de contato da produção será disponibilizado em breve.</p>}
  </dialog>;
}
