const app = document.getElementById("app");
const visor = document.getElementById("visor");
const visorImg = document.getElementById("visor-img");
const visorVideo = document.getElementById("visor-video");
const visorPie = document.getElementById("visor-pie");
const lienzo = document.getElementById("confeti");
const ctx = lienzo.getContext("2d");

const CINTAS = ["#f2c14b", "#ef8d86", "#8ecae6", "#b7e4c7", "#f6bd60"];
const COLORES = ["#e76f51", "#f4a261", "#e9c46a", "#2a9d8f", "#ef476f", "#f6bd60", "#ffffff"];
let galeria = [];
let indiceVisor = 0;
let indiceHoja = 0;
let piezas = [];
let animando = false;
let volteando = false;
let toqueX = null;

function giroDe(texto) {
  let valor = 0;
  for (const letra of texto) valor = (valor * 33 + letra.charCodeAt(0)) % 997;
  return (valor % 7) - 3;
}

function prepararAmbiente() {
  const globos = document.getElementById("globos");
  const colores = ["#e76f51", "#f4a261", "#2a9d8f", "#ef476f", "#e9c46a", "#8ecae6"];
  colores.forEach((color, i) => {
    const globo = document.createElement("span");
    globo.className = "globo";
    globo.style.background = color;
    globo.style.left = `${8 + i * 15}%`;
    globo.style.animationDuration = `${11 + i * 1.7}s`;
    globo.style.animationDelay = `${-i * 2.2}s`;
    globo.appendChild(document.createElement("span"));
    globos.appendChild(globo);
  });

  const lluvia = document.getElementById("lluvia");
  for (let i = 0; i < 22; i += 1) {
    const pieza = document.createElement("span");
    pieza.style.left = `${Math.random() * 100}%`;
    pieza.style.background = COLORES[i % COLORES.length];
    pieza.style.animationDuration = `${7 + Math.random() * 8}s`;
    pieza.style.animationDelay = `${-Math.random() * 12}s`;
    pieza.style.width = `${6 + (i % 4) * 2}px`;
    lluvia.appendChild(pieza);
  }
}

function momento(dia) {
  const hora = Number(String(dia.items[0]?.hora || "").slice(0, 2));
  if (Number.isNaN(hora)) return "Un recuerdo";
  if (hora < 12) return "Por la mañana";
  if (hora < 19) return "Por la tarde";
  return "Por la noche";
}

function folio(numero) {
  return String(numero).padStart(2, "0");
}

function cabecera(titulo, fecha, extra, numero) {
  return `
    <header class="cabecera">
      <div class="cabecera-sup">
        <p class="masthead">Diario de vida</p>
        <p class="edicion">Plana ${folio(numero)}</p>
      </div>
      <div class="cabecera-main">
        <h3>${titulo}</h3>
        <p class="fecha-cab">${fecha}</p>
      </div>
    </header>
    <div class="filete" aria-hidden="true"></div>
    ${extra ? `<p class="nota-dia">${extra}</p>` : ""}`;
}

function htmlPortada() {
  return `
    <article class="hoja portada">
      <div class="marco-portada">
        <p class="masthead">Volumen I</p>
        <p class="sello">FC</p>
        <h1>Diario de vida</h1>
        <p class="dedicado">Para Maca</p>
        <p class="fecha-tapa">Feliz cumpleaños</p>
        <p class="arco">Nov 2025 — Sep 2026</p>
      </div>
    </article>`;
}

function htmlDedicatoria(cuentas) {
  const desde = DIARIO[0]?.fecha || "";
  const hasta = DIARIO[DIARIO.length - 1]?.fecha || "";
  return `
    <article class="hoja carta">
      ${cabecera("Para vos", "La primera plana", "", 2)}
      <p class="saludo">Maca,</p>
      <p>Este diario ordena los días que quedaron guardados, del ${desde} al ${hasta}. Cada plana lleva su fecha, el momento del día y las fotos de esa hora.</p>
      <ul class="fichas">
        <li><strong>${cuentas.dias}</strong><span>días</span></li>
        <li><strong>${cuentas.fotos}</strong><span>fotos</span></li>
        <li><strong>${cuentas.videos}</strong><span>videos</span></li>
      </ul>
      <p class="pista-hoja">Hojéala como una revista. Si hay un video, se mueve solo, en bucle, mientras esa plana está abierta.</p>
      <button id="pasar-titulo" type="button">Hojear la siguiente</button>
    </article>`;
}

function claseRecuerdos(fotos, videos) {
  if (videos.length && fotos.length >= 5) return "recuerdos plano-video";
  if (fotos.length >= 8) return "recuerdos ocho";
  if (fotos.length >= 5) return "recuerdos cinco";
  if (fotos.length <= 1 && !videos.length) return "recuerdos uno";
  return "recuerdos";
}

function htmlDia(dia, numero, total) {
  const fotos = dia.items.filter((item) => item.tipo === "foto");
  const videos = dia.items.filter((item) => item.tipo === "video");
  const clase = claseRecuerdos(fotos, videos);
  const densa = fotos.length >= 5;
  const horas = dia.items.map((item) => item.hora);
  const rango = horas.length > 1 ? `${horas[0]} – ${horas[horas.length - 1]}` : horas[0] || "";
  const piezasDia = dia.items.map((item) => {
    if (item.tipo === "video") {
      const poster = item.poster ? ` poster="${item.poster}"` : "";
      const horizontal = item.src.includes("20260815_180132");
      const video = `<video muted loop playsinline preload="metadata"${poster} src="${item.src}"></video>`;
      return `
        <figure class="film${horizontal ? " horizontal" : ""}">
          ${horizontal ? `<div class="giro-video">${video}</div>` : video}
          <figcaption>${item.hora}</figcaption>
          <button class="ver-video" type="button" hidden>Ver video</button>
          <p class="aviso-video" hidden>Este video no se pudo reproducir.</p>
        </figure>`;
    }
    const indice = galeria.push({ ...item, fecha: dia.fecha }) - 1;
    const giro = giroDe(item.src);
    const cinta = CINTAS[Math.abs(giro) % CINTAS.length];
    return `
      <button class="polaroid" type="button" data-media="${indice}" style="--giro:${giro}deg;--cinta:${cinta}">
        <img src="${item.src}" alt="${item.alt}" loading="lazy">
        <span>${item.hora}</span>
      </button>`;
  }).join("");
  const diaNombre = `${dia.dia.charAt(0).toUpperCase()}${dia.dia.slice(1)}`;
  const detalle = [
    diaNombre,
    rango,
    fotos.length ? `${fotos.length} ${fotos.length === 1 ? "foto" : "fotos"}` : "",
    videos.length ? `${videos.length} ${videos.length === 1 ? "video" : "videos"}` : "",
  ].filter(Boolean).join(" · ");

  return `
    <article class="hoja${densa ? " densa" : ""}">
      ${cabecera(momento(dia), dia.fecha, detalle, numero)}
      <div class="contexto">
        <p class="contexto-etiqueta">Este día</p>
        <p class="contexto-texto" contenteditable="true" data-nota="${dia.id}" spellcheck="true"></p>
      </div>
      <div class="${clase}">${piezasDia}</div>
      <footer class="colofon"><span>Para Maca</span><span>${folio(numero)}</span></footer>
    </article>`;
}

function htmlCarta(numero) {
  return `
    <article class="hoja misiva">
      ${cabecera("Una carta", "Antes de las velas", "", numero)}
      <p class="saludo-carta">Maca,</p>
      <div class="cuerpo-carta" contenteditable="true" data-nota="carta" spellcheck="true"></div>
      <footer class="colofon"><span>Para Maca</span><span>${folio(numero)}</span></footer>
    </article>`;
}

function htmlFinal(numero, total) {
  return `
    <article class="hoja cierre">
      ${cabecera("Hoy es tu día", "Feliz cumpleaños", "La última plana del diario.", numero)}
      <div class="velas" id="grupo-velas" aria-hidden="true">
        <span class="vela"><span class="llama"></span></span>
        <span class="vela"><span class="llama"></span></span>
        <span class="vela"><span class="llama"></span></span>
      </div>
      <p id="deseo" hidden>¡Feliz cumpleaños, Maca!</p>
      <button id="velas" type="button">Sopla las velas</button>
      <footer class="colofon"><span>Para Maca</span><span>${folio(numero)}</span></footer>
    </article>`;
}

function conLado(html, lado) {
  return html.replace('class="hoja', `class="hoja ${lado}`);
}

function htmlPliegos(paginas) {
  const pliegos = [];
  for (let i = 0; i < paginas.length; i += 2) {
    const derecha = paginas[i + 1] || `<article class="hoja vacia"></article>`;
    pliegos.push(`
      <section class="pliego ${i === 0 ? "activa" : "espera"}">
        <div class="plana izquierda">${conLado(paginas[i], "lado-izq")}</div>
        <div class="lomo" aria-hidden="true"></div>
        <div class="plana derecha">${conLado(derecha, "lado-der")}</div>
      </section>`);
  }
  return pliegos.join("");
}

function abrirLibreta() {
  document.body.classList.add("abierta");
  galeria = [];
  const cuentas = DIARIO.reduce((total, dia) => {
    dia.items.forEach((item) => {
      if (item.tipo === "foto") total.fotos += 1;
      if (item.tipo === "video") total.videos += 1;
    });
    return total;
  }, { dias: DIARIO.length, fotos: 0, videos: 0 });
  const dias = DIARIO.map((dia, i) => htmlDia(dia, i + 3, DIARIO.length + 4));
  const numeroCarta = DIARIO.length + 3;
  const paginas = [htmlPortada(), htmlDedicatoria(cuentas), ...dias, htmlCarta(numeroCarta), htmlFinal(numeroCarta + 1, numeroCarta + 1)];
  if (paginas.length % 2) paginas.push(`<article class="hoja vacia"></article>`);
  app.innerHTML = `
    <div class="libro">
      <header class="revista-barra">
        <p>Diario de vida</p>
        <p>Para Maca</p>
      </header>
      <button id="pasar-atras" class="pasar" type="button" aria-label="Hoja anterior"><span aria-hidden="true">‹</span><small>Anterior</small></button>
      <div class="ventana" id="ventana">
        <div id="riel">${htmlPliegos(paginas)}</div>
        <button id="canto-atras" class="canto canto-izq" type="button" aria-label="Hoja anterior"></button>
        <button id="canto-adelante" class="canto canto-der" type="button" aria-label="Hojear"></button>
      </div>
      <button id="pasar-adelante" class="pasar" type="button" aria-label="Hojear"><span aria-hidden="true">›</span><small>Hojear</small></button>
      <p class="contador" id="contador"></p>
    </div>`;
  indiceHoja = 0;
  mostrarHoja(0);
  prepararNotas();
}

function prepararNotas() {
  document.querySelectorAll("[data-nota]").forEach((nodo) => {
    const clave = `diario-nota:${nodo.dataset.nota}`;
    const guardado = localStorage.getItem(clave);
    if (guardado) nodo.textContent = guardado;
    nodo.addEventListener("input", () => {
      localStorage.setItem(clave, nodo.textContent.trim() ? nodo.textContent : "");
    });
  });
}

function listaHojas() {
  return [...document.querySelectorAll("#riel .pliego")];
}

function mostrarHoja(nueva) {
  const hojas = listaHojas();
  indiceHoja = Math.max(0, Math.min(hojas.length - 1, nueva));
  hojas.forEach((hoja, i) => {
    hoja.classList.toggle("activa", i === indiceHoja);
    hoja.classList.remove("debajo");
    hoja.classList.toggle("pasada", i < indiceHoja);
    hoja.classList.toggle("espera", i > indiceHoja);
    hoja.querySelectorAll("video").forEach((video) => {
      if (i === indiceHoja) reproducirGif(video);
      else video.pause();
    });
  });
  const alInicio = indiceHoja === 0;
  const alFinal = indiceHoja === hojas.length - 1;
  document.getElementById("pasar-atras").disabled = alInicio;
  document.getElementById("canto-atras").disabled = alInicio;
  document.getElementById("pasar-adelante").disabled = alFinal;
  document.getElementById("canto-adelante").disabled = alFinal;
  const desde = indiceHoja * 2 + 1;
  document.getElementById("contador").textContent = `Planas ${folio(desde)} – ${folio(desde + 1)}`;
}

function hojaDe(pliego, lado) {
  return pliego.querySelector(`.plana.${lado} .hoja`);
}

function pasar(delta) {
  if (!delta || volteando) return;
  const destino = indiceHoja + delta;
  const hojas = listaHojas();
  if (destino < 0 || destino >= hojas.length) return;
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducido) {
    mostrarHoja(destino);
    return;
  }
  voltear(delta);
}

function voltear(delta) {
  const hojas = listaHojas();
  const actual = hojas[indiceHoja];
  const siguiente = hojas[indiceHoja + delta];
  const adelante = delta > 0;
  const frenteNodo = hojaDe(actual, adelante ? "derecha" : "izquierda");
  const reversoNodo = hojaDe(siguiente, adelante ? "izquierda" : "derecha");
  if (!frenteNodo || !reversoNodo) {
    mostrarHoja(indiceHoja + delta);
    return;
  }

  volteando = true;
  document.body.classList.add("hojeando");
  actual.querySelectorAll("video").forEach((video) => video.pause());
  siguiente.classList.add("debajo");
  siguiente.classList.remove("espera", "pasada");

  const huecoFrente = frenteNodo.parentElement;
  const huecoReverso = reversoNodo.parentElement;
  const vuelta = document.createElement("div");
  vuelta.className = `vuelta ${adelante ? "adelante" : "atras"}`;
  const caraFrente = document.createElement("div");
  caraFrente.className = "cara frente";
  const caraReverso = document.createElement("div");
  caraReverso.className = "cara reverso";
  caraFrente.appendChild(frenteNodo);
  caraReverso.appendChild(reversoNodo);
  vuelta.append(caraFrente, caraReverso);
  document.getElementById("ventana").appendChild(vuelta);

  let cerrado = false;
  const terminar = () => {
    if (cerrado) return;
    cerrado = true;
    huecoFrente.appendChild(frenteNodo);
    huecoReverso.appendChild(reversoNodo);
    vuelta.remove();
    siguiente.classList.remove("debajo");
    mostrarHoja(indiceHoja + delta);
    volteando = false;
    document.body.classList.remove("hojeando");
  };
  vuelta.addEventListener("animationend", (evento) => {
    if (evento.target === vuelta) terminar();
  });
  window.setTimeout(terminar, 1200);
}

function reproducirGif(video) {
  const film = video.closest(".film");
  const boton = film?.querySelector(".ver-video");
  const aviso = film?.querySelector(".aviso-video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = false;
  const intento = video.play();
  if (!intento) return;
  intento.then(() => {
    if (boton) boton.hidden = true;
    if (aviso) aviso.hidden = true;
  }).catch(() => {
    if (boton) boton.hidden = false;
  });
}

function reproducirVideo(boton) {
  const video = boton.closest(".film")?.querySelector("video");
  if (video) reproducirGif(video);
}

function alClick(evento) {
  const boton = evento.target.closest("button");
  if (boton && (boton.id === "pasar-titulo" || boton.id === "pasar-adelante" || boton.id === "canto-adelante")) {
    pasar(1);
    return;
  }
  if (boton && (boton.id === "pasar-atras" || boton.id === "canto-atras")) {
    pasar(-1);
    return;
  }
  const video = evento.target.closest(".ver-video");
  if (video) {
    reproducirVideo(video);
    return;
  }
  const media = evento.target.closest("[data-media]");
  if (media) {
    abrirVisor(Number(media.dataset.media));
    return;
  }
  if (evento.target.id === "velas") soplarVelas();
}

function abrirVisor(indice) {
  indiceVisor = indice;
  const item = galeria[indice];
  visor.hidden = false;
  visorPie.textContent = `${item.fecha} · ${item.hora}`;
  visorVideo.pause();
  visorVideo.removeAttribute("src");
  visorVideo.load();
  visorVideo.hidden = true;
  visorImg.hidden = false;
  visorImg.src = item.src;
  visorImg.alt = item.alt;
  document.body.style.overflow = "hidden";
}

function cerrarVisor() {
  visor.hidden = true;
  document.body.style.overflow = "";
}

function pasoVisor(delta) {
  if (!galeria.length) return;
  abrirVisor((indiceVisor + delta + galeria.length) % galeria.length);
}

function soplarVelas() {
  document.getElementById("grupo-velas").classList.add("apagadas");
  document.getElementById("deseo").hidden = false;
  const rect = document.getElementById("velas").getBoundingClientRect();
  dispararConfeti(rect.left + rect.width / 2, rect.top);
  window.setTimeout(() => dispararConfeti(window.innerWidth * 0.3, window.innerHeight * 0.3), 250);
  window.setTimeout(() => dispararConfeti(window.innerWidth * 0.7, window.innerHeight * 0.25), 480);
}

function ajustarLienzo() {
  lienzo.width = window.innerWidth;
  lienzo.height = window.innerHeight;
}

function dispararConfeti(x, y) {
  for (let i = 0; i < 90; i += 1) {
    piezas.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -13 - 3,
      g: 0.22 + Math.random() * 0.08,
      w: 7 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: COLORES[i % COLORES.length],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }
  if (!animando) {
    animando = true;
    requestAnimationFrame(dibujarConfeti);
  }
}

function dibujarConfeti() {
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);
  piezas = piezas.filter((pieza) => pieza.y < lienzo.height + 40);
  piezas.forEach((pieza) => {
    pieza.vy += pieza.g;
    pieza.x += pieza.vx;
    pieza.y += pieza.vy;
    pieza.rot += pieza.vr;
    ctx.save();
    ctx.translate(pieza.x, pieza.y);
    ctx.rotate(pieza.rot);
    ctx.fillStyle = pieza.color;
    ctx.fillRect(-pieza.w / 2, -pieza.h / 2, pieza.w, pieza.h);
    ctx.restore();
  });
  if (piezas.length) requestAnimationFrame(dibujarConfeti);
  else {
    animando = false;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
  }
}

function alPointerDown(evento) {
  if (evento.target.closest("video, button, img, a, [contenteditable]")) return;
  toqueX = evento.clientX;
}

function alPointerUp(evento) {
  if (toqueX == null) return;
  const delta = evento.clientX - toqueX;
  toqueX = null;
  if (Math.abs(delta) < 70 || volteando) return;
  pasar(delta < 0 ? 1 : -1);
}

visor.addEventListener("click", (evento) => {
  if (evento.target.dataset.cerrar) cerrarVisor();
});
document.getElementById("visor-prev").addEventListener("click", () => pasoVisor(-1));
document.getElementById("visor-next").addEventListener("click", () => pasoVisor(1));
document.addEventListener("keydown", (evento) => {
  if (!visor.hidden) {
    if (evento.key === "Escape") cerrarVisor();
    if (evento.key === "ArrowRight") pasoVisor(1);
    if (evento.key === "ArrowLeft") pasoVisor(-1);
    return;
  }
  if (evento.key === "ArrowRight") pasar(1);
  if (evento.key === "ArrowLeft") pasar(-1);
});
window.addEventListener("resize", ajustarLienzo);
app.addEventListener("click", alClick);
app.addEventListener("pointerdown", alPointerDown);
window.addEventListener("pointerup", alPointerUp);

ajustarLienzo();
prepararAmbiente();
abrirLibreta();
