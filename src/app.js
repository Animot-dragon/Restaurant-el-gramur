/* El Gramur — comportamiento del sitio (demo). */
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {initFire} from "./fire.js";

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const root=document.documentElement;
gsap.registerPlugin(ScrollTrigger);

/* ---------- Datos: horarios y carta (ficticios) ---------- */
const TZ="America/Argentina/Buenos_Aires";
const DAYS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const DAY_SHORT=["dom","lun","mar","mié","jue","vie","sáb"];
const m=(h,mi=0)=>h*60+mi;
/* rangos de servicio en minutos; un fin > 1440 continúa pasada la medianoche */
const SERVICE={
 0:[[m(12,30),m(17)]],
 1:[],
 2:[[m(19,30),m(24)]],
 3:[[m(19,30),m(24)]],
 4:[[m(19,30),m(24)]],
 5:[[m(12,30),m(16)],[m(19,30),m(25)]],
 6:[[m(12,30),m(16)],[m(19,30),m(25)]]
};
const fmt=min=>{const t=min%1440;return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")};

function nowBA(){
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false,weekday:"short"}).formatToParts(new Date());
 const g=t=>parts.find(p=>p.type===t).value;
 const wd={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[g("weekday")];
 const hour=+g("hour")%24;
 return {iso:`${g("year")}-${g("month")}-${g("day")}`,wd,min:hour*60+ +g("minute")};
}

const MENU=[
 {id:"entradas",name:"Entradas",items:[
  ["Provoleta de cabra ahumada","Tomates asados, orégano fresco y pan de masa madre del horno.",11800,["V"]],
  ["Empanada de matambre a la brasa","Cocida en horno de barro, con salsa criolla. Precio por unidad.",4200,[]],
  ["Mollejas crocantes","Limón quemado y chimichurri de hierbas de la huerta.",16900,["SG"]],
  ["Remolacha al rescoldo","Yogur de oveja, pistachos tostados y miel de eucalipto.",10500,["V","SG"]],
  ["Tártaro de lomo al humo","Yema curada, alcaparras fritas y tostadas de centeno.",17400,[]]
 ]},
 {id:"fuegos",name:"Los fuegos",items:[
  ["Ojo de bife, 400 g","Madurado 30 días en cámara propia, cocido sobre brasa de quebracho.",31500,["SG"]],
  ["Asado de tira a la cruz","Seis horas de cocción lenta frente al fuego, con sal de mar.",29800,["SG"]],
  ["Cordero patagónico al palo","Porción para compartir, glaseado con miel y romero.",34600,["SG"]],
  ["Entraña con ajo negro","Corte fino, a punto, con salsa de ajo negro y limón.",27900,[]],
  ["Pesca del día a las brasas","Manteca de algas, papines rotos y hierbas frescas.",28500,["SG"]],
  ["Berenjena entera al fuego","Tahini, granada y menta. El plato vegetal de la casa.",19800,["V","SG"]]
 ]},
 {id:"guarniciones",name:"Para acompañar",items:[
  ["Papas rústicas en grasa de pella","Doradas, con sal de hierbas.",7500,["SG"]],
  ["Hojas amargas","Radicchio, rúcula y escarola con aceto y nueces.",6900,["V","SG"]],
  ["Puré ahumado","Papa al rescoldo, manteca y cebolla de verdeo.",7200,["V","SG"]],
  ["Pan de horno de barro","Masa madre de 48 horas, con manteca batida.",4800,["V"]]
 ]},
 {id:"postres",name:"Postres",items:[
  ["Flan de dulce de leche quemado","Crema de campo batida a mano.",9800,["V","SG"]],
  ["Helado de crema con miel de caña","Sal ahumada y semillas de girasol tostadas.",8900,["V","SG"]],
  ["Peras al vino tinto","Crumble de almendras y crema de mascarpone.",10200,["V"]],
  ["Volcán de chocolate amargo","Naranja asada y aceite de oliva.",11400,["V"]]
 ]},
 {id:"bebidas",name:"Bebidas",items:[
  ["Malbec de altura, copa","Selección rotativa de pequeños productores.",8500,["V","SG"]],
  ["Blend de la casa, botella","Malbec, cabernet franc y petit verdot.",38000,["V","SG"]],
  ["Vermut de la casa","Sobre hielo, con naranja y aceituna.",7200,["V","SG"]],
  ["Humo Lento","Mezcal, miel de caña, naranja asada y bitter.",12500,["V","SG"]],
  ["Limonada de jengibre","Con menta y soda de sifón.",5600,["V","SG"]],
  ["Café de especialidad","Tostado en el día, de origen único.",4200,["V","SG"]]
 ]}
];
const peso=n=>"$ "+n.toLocaleString("es-AR");

/* ---------- Cabecera y menú móvil ---------- */
const top=$("[data-top]");
const solid=()=>top.classList.toggle("is-solid",scrollY>40);
addEventListener("scroll",solid,{passive:true});solid();
const burger=$(".burger"),nav=$("#menu-principal");
const setMenu=open=>{nav.classList.toggle("is-open",open);burger.setAttribute("aria-expanded",String(open));burger.setAttribute("aria-label",open?"Cerrar menú":"Abrir menú");document.body.style.overflow=open?"hidden":""};
burger.addEventListener("click",()=>setMenu(!nav.classList.contains("is-open")));
$$("a",nav).forEach(a=>a.addEventListener("click",()=>setMenu(false)));
addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});
matchMedia("(min-width:821px)").addEventListener("change",e=>{if(e.matches)setMenu(false)});
$$("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());

/* sección activa en la navegación */
const links=$$(".nav a[href^='#']:not(.btn)");
const secs=links.map(a=>$(a.getAttribute("href"))).filter(Boolean);
{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.removeAttribute("aria-current"));const a=links.find(l=>l.getAttribute("href")==="#"+e.target.id);if(a)a.setAttribute("aria-current","true")}}),{rootMargin:"-45% 0px -50% 0px"});secs.forEach(s=>io.observe(s))}

/* ---------- Estado abierto / cerrado ---------- */
function openStatus(){
 const n=nowBA();
 const today=SERVICE[n.wd],prev=SERVICE[(n.wd+6)%7];
 for(const [a,b] of today)if(n.min>=a&&n.min<b)return {open:true,text:"Abierto ahora",sub:"Cerramos a las "+fmt(b)+" · Av. del Fuego 1280"};
 for(const [a,b] of prev)if(b>1440&&n.min<b-1440)return {open:true,text:"Abierto ahora",sub:"Cerramos a las "+fmt(b)+" · Av. del Fuego 1280"};
 for(let d=0;d<8;d++){
  const wd=(n.wd+d)%7;
  for(const [a] of SERVICE[wd]){if(d>0||a>n.min){const when=d===0?"hoy":d===1?"mañana":DAYS[wd];return {open:false,text:"Cerrado ahora",sub:"Abrimos "+when+" a las "+fmt(a)+" · Av. del Fuego 1280"}}}
 }
 return {open:false,text:"Cerrado",sub:"Av. del Fuego 1280"};
}
function paintStatus(){
 const s=openStatus();
 $("[data-open-label]").textContent=s.text;$("[data-open-sub]").textContent=s.sub;
 $("[data-dot]").classList.toggle("is-open",s.open);
}
paintStatus();setInterval(paintStatus,60000);
{const row=$(`[data-hours] tr[data-d="${nowBA().wd}"]`);if(row)row.classList.add("is-today")}

/* ---------- Carta: pestañas, filtros y platos ---------- */
const tabsEl=$("[data-tabs]"),panel=$("[data-menu]");
let current=MENU[0].id;
const filters=new Set();
MENU.forEach(sec=>{
 const b=document.createElement("button");
 b.type="button";b.className="tab";b.role="tab";b.id="tab-"+sec.id;b.textContent=sec.name;
 b.setAttribute("aria-controls","menu-panel");b.setAttribute("aria-selected",String(sec.id===current));b.tabIndex=sec.id===current?0:-1;
 b.addEventListener("click",()=>select(sec.id));
 tabsEl.append(b);
});
panel.id="menu-panel";panel.setAttribute("role","tabpanel");
function renderMenu(animate){
 const sec=MENU.find(s=>s.id===current);
 panel.setAttribute("aria-labelledby","tab-"+current);
 const items=sec.items.filter(it=>[...filters].every(f=>it[3].includes(f)));
 panel.replaceChildren();
 if(!items.length){const p=document.createElement("p");p.className="empty";p.textContent="Ningún plato de esta sección cumple con los filtros elegidos. Probá con otra sección.";panel.append(p);return}
 items.forEach(([name,desc,price,tags])=>{
  const d=document.createElement("article");d.className="dish";
  const head=document.createElement("div");head.className="dish-head";
  const n=document.createElement("h3");n.className="dish-name";n.textContent=name;
  if(tags.length){const t=document.createElement("span");t.className="tags";tags.forEach(x=>{const g=document.createElement("span");g.className="tag";g.textContent=x;g.title=x==="V"?"Vegetariano":"Sin gluten";g.setAttribute("aria-label",x==="V"?"Vegetariano":"Sin gluten");t.append(g)});n.append(" ",t)}
  const dots=document.createElement("span");dots.className="dish-dots";dots.setAttribute("aria-hidden","true");
  const pr=document.createElement("span");pr.className="dish-price";pr.textContent=peso(price);
  head.append(n,dots,pr);
  const p=document.createElement("p");p.className="dish-desc";p.textContent=desc;
  d.append(head,p);panel.append(d);
 });
 if(animate&&!reduce)gsap.to($$(".dish",panel),{opacity:1,y:0,duration:.6,ease:"power3.out",stagger:.05,overwrite:true});
 else $$(".dish",panel).forEach(el=>{el.style.opacity=1;el.style.transform="none"});
}
function select(id){
 current=id;
 $$(".tab",tabsEl).forEach(t=>{const on=t.id==="tab-"+id;t.setAttribute("aria-selected",String(on));t.tabIndex=on?0:-1});
 renderMenu(true);
}
tabsEl.addEventListener("keydown",e=>{
 const tabs=$$(".tab",tabsEl);let i=tabs.findIndex(t=>t.getAttribute("aria-selected")==="true");
 if(e.key==="ArrowRight")i=(i+1)%tabs.length;else if(e.key==="ArrowLeft")i=(i-1+tabs.length)%tabs.length;else if(e.key==="Home")i=0;else if(e.key==="End")i=tabs.length-1;else return;
 e.preventDefault();tabs[i].focus();tabs[i].click();
});
$$("[data-filter]").forEach(c=>c.addEventListener("change",()=>{c.checked?filters.add(c.dataset.filter):filters.delete(c.dataset.filter);renderMenu(true)}));
renderMenu(false);

/* ---------- Reservas ---------- */
const form=$("[data-form]"),done=$("[data-done]"),err=$("[data-error]");
const dateEl=$("[data-date]"),slotsEl=$("[data-slots]"),hint=$("[data-slot-hint]");
const today=nowBA();
dateEl.min=today.iso;
{const max=new Date(Date.now()+1000*60*60*24*120);dateEl.max=max.toISOString().slice(0,10)}
const hashStr=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function slotTimes(range){const out=[];for(let t=range[0];t<=range[1]-60&&t<range[0]+240;t+=30)out.push(t);return out}
function buildSlots(){
 slotsEl.replaceChildren();
 const v=dateEl.value;
 if(!v){hint.textContent="Elegí una fecha para ver los turnos disponibles.";return}
 const [y,mo,d]=v.split("-").map(Number);
 const wd=new Date(Date.UTC(y,mo-1,d)).getUTCDay();
 const ranges=SERVICE[wd];
 if(!ranges.length){hint.textContent="Los lunes permanecemos cerrados. Elegí otro día.";return}
 hint.textContent="Turnos para el "+DAYS[wd]+" "+d+"/"+mo+". Los tachados ya están completos.";
 ranges.forEach(r=>{
  const lab=document.createElement("p");lab.className="slot-group";lab.textContent=r[0]<m(17)?"Almuerzo":"Cena";slotsEl.append(lab);
  slotTimes(r).forEach(t=>{
   const l=document.createElement("label");l.className="slot";
   const i=document.createElement("input");i.type="radio";i.name="turno";i.value=fmt(t);
   const past=v===today.iso&&t<=today.min+30;
   const full=hashStr(v+fmt(t))%100<22;
   if(past||full)i.disabled=true;
   const s=document.createElement("span");s.textContent=fmt(t);
   l.append(i,s);slotsEl.append(l);
  });
 });
}
dateEl.addEventListener("change",buildSlots);
$$("[data-pick]").forEach(a=>a.addEventListener("click",()=>{
 const sel=$("[data-ocasion]");const opt=[...sel.options].find(o=>o.text===a.dataset.pick);if(opt)sel.value=opt.value;
}));
function fail(msg,el){err.hidden=false;err.textContent=msg;if(el){el.setAttribute("aria-invalid","true");el.focus()}}
form.addEventListener("submit",e=>{
 e.preventDefault();err.hidden=true;$$("[aria-invalid]",form).forEach(x=>x.removeAttribute("aria-invalid"));
 const f=form.elements;
 if(!f.nombre.value.trim())return fail("Escribí tu nombre y apellido.",f.nombre);
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value))return fail("Revisá el correo electrónico: parece incompleto.",f.email);
 if(f.tel.value.replace(/\D/g,"").length<8)return fail("Escribí un teléfono con al menos 8 dígitos.",f.tel);
 if(!f.personas.value)return fail("Elegí la cantidad de personas.",f.personas);
 if(!f.fecha.value)return fail("Elegí una fecha.",f.fecha);
 const turno=form.querySelector('input[name="turno"]:checked');
 if(!turno)return fail("Elegí un turno disponible para esa fecha.",slotsEl.querySelector("input:not(:disabled)")||f.fecha);
 const [y,mo,d]=f.fecha.value.split("-").map(Number);
 const wd=new Date(Date.UTC(y,mo-1,d)).getUTCDay();
 const code="GR-"+Math.random().toString(36).slice(2,6).toUpperCase();
 $("[data-done-text]").textContent=`${f.nombre.value.trim().split(" ")[0]}, tu mesa para ${f.personas.value} ${f.personas.value==="1"?"persona":"personas"} el ${DAYS[wd]} ${d}/${mo} a las ${turno.value} quedó solicitada (${code}). Te escribiríamos a ${f.email.value} para confirmarla.`;
 form.hidden=true;done.hidden=false;done.focus();
 if(!reduce)gsap.from(done,{opacity:0,y:20,duration:.7,ease:"power3.out"});
 done.scrollIntoView({block:"center",behavior:reduce?"auto":"smooth"});
});
$("[data-again]").addEventListener("click",()=>{form.reset();slotsEl.replaceChildren();hint.textContent="Elegí una fecha para ver los turnos disponibles.";done.hidden=true;form.hidden=false;form.elements.nombre.focus()});

/* ---------- Movimiento ---------- */
const hero=$(".hero");
try{initFire($(".fire"),{reduce})}catch(e){const c=$(".fire");if(c)c.remove()}

/* texto del manifiesto: se enciende palabra por palabra con el scroll */
{
 const el=$("[data-scrub]");
 const words=el.textContent.trim().split(/\s+/);
 el.textContent="";
 const spans=words.map(w=>{const s=document.createElement("span");s.className="w";s.textContent=w;el.append(s," ");return s});
 let lit=0;
 const set=p=>{const n=Math.round(p*spans.length);if(n===lit)return;const a=Math.min(n,lit),b=Math.max(n,lit);for(let i=a;i<b;i++)spans[i].classList.toggle("lit",n>lit);lit=n};
 if(reduce)spans.forEach(s=>s.classList.add("lit"));
 else ScrollTrigger.create({trigger:el,start:"top 82%",end:"bottom 46%",onUpdate:s=>set(s.progress)});
}

if(!reduce){
 /* resto de la página: aparición discreta, una vez */
 const items=$$("[data-in]").filter(x=>!hero.contains(x));
 ScrollTrigger.batch(items,{start:"top 90%",once:true,onEnter:b=>gsap.to(b,{opacity:1,y:0,duration:.95,ease:"power3.out",stagger:.1,overwrite:true})});
 /* el hogar se aleja al bajar: el título sube un poco más lento */
 gsap.to(".hero-grid",{yPercent:-8,ease:"none",scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:true}});
}
root.classList.add("ready");
