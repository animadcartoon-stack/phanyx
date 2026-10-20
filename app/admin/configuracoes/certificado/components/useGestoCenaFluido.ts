"use client";
import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { elementoOculto } from "@/lib/certificados/visibilidadeCertificado";

type Elemento = { id: number; x: number; y: number; largura?: number | null; altura?: number | null; rotate?: number | null; flipX?: boolean | null; flipY?: boolean | null };
type Registro = { elemento: HTMLElement; transform: string; transformOrigin: string; willChange: string };

export default function useGestoCenaFluido() {
  const pendente=useRef<{ campos: Elemento[]; confirmar: ()=>void; desenhar: ()=>void }|null>(null);
  const quadro=useRef<number|null>(null), originais=useRef(new Map<HTMLElement,Registro>());
  const caixas=useRef(new Map<HTMLElement,{left:string;top:string;width:string;height:string}>());
  const confirmar=useCallback(()=>{
    if(quadro.current!==null)cancelAnimationFrame(quadro.current);quadro.current=null;
    const atual=pendente.current;pendente.current=null;
    for(const [el,r] of originais.current){el.style.transform=r.transform;el.style.transformOrigin=r.transformOrigin;el.style.willChange=r.willChange;}
    originais.current.clear();
    for(const [el,r] of caixas.current)Object.assign(el.style,r);caixas.current.clear();
    atual?.confirmar();
  },[]);
  const prever=<T extends Elemento>(campos:T[], atualizar:T[]|((prev:T[])=>T[]), publicar:(campos:T[])=>void, canvas:HTMLElement|null, selecionados:readonly number[])=>{
    const base=(pendente.current?.campos as T[]|undefined)??campos;
    const novos=typeof atualizar==="function"?atualizar(base):atualizar;
    if(!canvas){publicar(novos);return;}
    const antes=new Map(campos.map(c=>[c.id,c]));
    const alterados=novos.filter(c=>c!==antes.get(c.id));
    // As copias virtuais de array continuam usando seu renderizador existente.
    if(alterados.some(c=>(c as any).arrayAtivo&&(c as any).arrayConfig?.ativo)){confirmar();publicar(novos);return;}
    const desenhar=()=>{
      const elementos=new Map<number,HTMLElement>();
      for(const el of Array.from(canvas.querySelectorAll<HTMLElement>("[data-campo-certificado-id]"))){const id=Number(el.dataset.campoCertificadoId);if(!elementos.has(id))elementos.set(id,el);}
      for(const campo of alterados){
        const el=elementos.get(campo.id), inicial=antes.get(campo.id);if(!el||!inicial)continue;
        if(!originais.current.has(el))originais.current.set(el,{elemento:el,transform:el.style.transform,transformOrigin:el.style.transformOrigin,willChange:el.style.willChange});
        const w=Number(inicial.largura)||el.offsetWidth||100,h=Number(inicial.altura)||el.offsetHeight||80;
        const nw=Number(campo.largura)||w,nh=Number(campo.altura)||h;
        const dx=campo.x-inicial.x+(nw-w)/2,dy=campo.y-inicial.y+(nh-h)/2;
        el.style.transformOrigin="50% 50%";el.style.willChange="transform";
        const original=originais.current.get(el)!;
        const rotacao=Number(campo.rotate||0)-Number(inicial.rotate||0);
        el.style.transform=`translate3d(${dx}px,${dy}px,0) rotate(${rotacao}deg) ${original.transform} scale(${nw/w},${nh/h})`;
      }
      const ids=new Set(selecionados),itens=novos.filter(c=>ids.has(c.id)&&!elementoOculto(c as any));
      if(itens.length>1){
        const x=Math.min(...itens.map(c=>c.x)),y=Math.min(...itens.map(c=>c.y));
        const w=Math.max(...itens.map(c=>c.x+Number(c.largura||120)))-x,h=Math.max(...itens.map(c=>c.y+Number(c.altura||40)))-y;
        for(const el of Array.from(canvas.querySelectorAll<HTMLElement>("[data-cert-grupo-caixa]"))){
          if(!caixas.current.has(el))caixas.current.set(el,{left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height});
          Object.assign(el.style,{left:`${x}px`,top:`${y}px`,width:`${w}px`,height:`${h}px`});
        }
      }
    };
    pendente.current={campos:novos,confirmar:()=>publicar(novos),desenhar};
    if(quadro.current===null)quadro.current=requestAnimationFrame(()=>{quadro.current=null;pendente.current?.desenhar();});
  };
  useEffect(()=>{
    const terminar=()=>{if(pendente.current)flushSync(confirmar);};
    const teclado=(e:KeyboardEvent)=>{if(["Escape","Tab","Enter"].includes(e.key)||(e.ctrlKey||e.metaKey)&&["z","s"].includes(e.key.toLowerCase()))terminar();};
    for(const nome of ["pointerdown","mousedown","pointerup","mouseup","pointercancel","blur"])window.addEventListener(nome,terminar,true);
    window.addEventListener("keydown",teclado,true);
    return()=>{for(const nome of ["pointerdown","mousedown","pointerup","mouseup","pointercancel","blur"])window.removeEventListener(nome,terminar,true);window.removeEventListener("keydown",teclado,true);confirmar();};
  },[confirmar]);
  return {prever,confirmar};
}
