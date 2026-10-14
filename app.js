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

function cabecera(titulo, fecha, extra) {
  return `
    <header class="cabecera">
      <div>
        <p class="masthead">Diario de vida</p>
        <h3>${titulo}</h3>
      </div>
      <p class="fecha-cab">${fecha}</p>
    </header>
    ${extra ? `<p class="nota-dia">${extra}</p>` : ""}`;
}

function htmlPortada() {
  return `
    <article class="hoja portada">
      <p class="masthead">FC · Nº 01</p>
      <h1>Diario de vida</h1>
      <p class="dedicado">Para Maca</p>
      <p class="fecha-tapa">Feliz cumpleaños</p>
    </article>`;
}

function htmlDedicatoria() {
  return `
    <article class="hoja carta">
      ${cabecera("Para vos", "Nov 2025 — Sep 2026", "")}
      <p class="saludo">Maca,</p>
      <p>Este diario junta los días que fuimos guardando. Cada plana tiene su fecha, su título y las fotos de ese momento.</p>
      <p>Pasa la revista hacia la derecha. Si hay un video, se ve en la misma página.</p>
      <button id="pasar-titulo" type="button">Abrir la siguiente plana</button>
    </article>`;
}

function htmlDia(dia, numero, total) {
  const fotos = dia.items.filter((item) => item.tipo === "foto");
  const clase = fotos.length <= 1 ? "recuerdos uno" : "recuerdos";
  const horas = dia.items.map((item) => item.hora);
  const rango = horas.length > 1 ? `${horas[0]} – ${horas[horas.length - 1]}` : horas[0] || "";
  const piezasDia = dia.items.map((item) => {
    if (item.tipo === "video") {
      const poster = item.poster ? ` poster="${item.poster}"` : "";
      return `
        <figure class="film">
          <video preload="metadata" playsinline${poster} src="${item.src}"></video>
          <button class="ver-video" type="button">Ver video · ${item.hora}</button>
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

  return `
    <article class="hoja">
      ${cabecera(momento(dia), dia.fecha, `${diaNombre}${rango ? ` · ${rango}` : ""}`)}
      <div class="${clase}">${piezasDia}</div>
      <p class="num-pagina">${numero} / ${total}</p>
    </article>`;
}

function htmlFinal(numero, total) {
  return `
    <article class="hoja cierre">
      ${cabecera("Hoy es tu día", "Feliz cumpleaños", "La última plana del diario.")}
      <div class="velas" id="grupo-velas" aria-hidden="true">
        <span class="vela"><span class="llama"></span></span>
        <span class="vela"><span class="llama"></span></span>
        <span class="vela"><span class="llama"></span></span>
      </div>
      <p id="deseo" hidden>¡Feliz cumpleaños, Maca!</p>
      <button id="velas" type="button">Sopla las velas</button>
      <p class="num-pagina">${numero} / ${total}</p>
    </article>`;
}

function htmlPliegos(paginas) {
  const pliegos = [];
  for (let i = 0; i < paginas.length; i += 2) {
    const derecha = paginas[i + 1] || `<article class="hoja vacia"></article>`;
    pliegos.push(`
      <section class="pliego ${i === 0 ? "activa" : "espera"}">
        <div class="plana izquierda">${paginas[i]}</div>
        <div class="lomo" aria-hidden="true"></div>
        <div class="plana derecha">${derecha}</div>
      </section>`);
  }
  return pliegos.join("");
}

function abrirLibreta() {
  document.body.classList.add("abierta");
  galeria = [];
  const dias = DIARIO.map((dia, i) => htmlDia(dia, i + 3, DIARIO.length + 3));
  const paginas = [htmlPortada(), htmlDedicatoria(), ...dias, htmlFinal(DIARIO.length + 3, DIARIO.length + 3)];
  if (paginas.length % 2) paginas.push(`<article class="hoja vacia"></article>`);
  app.innerHTML = `
    <div class="libro">
      <button id="pasar-atras" class="pasar" type="button" aria-label="Planas anteriores">‹</button>
      <div class="ventana" id="ventana">
        <div id="riel">${htmlPliegos(paginas)}</div>
      </div>
      <button id="pasar-adelante" class="pasar" type="button" aria-label="Planas siguientes">›</button>
      <p class="contador" id="contador"></p>
    </div>`;
  indiceHoja = 0;
  mostrarHoja(0);
  requestAnimationFrame(() => document.getElementById("riel").classList.add("animable"));
}

function listaHojas() {
  return [...document.querySelectorAll("#riel .pliego")];
}

function mostrarHoja(nueva) {
  const hojas = listaHojas();
  indiceHoja = Math.max(0, Math.min(hojas.length - 1, nueva));
  hojas.forEach((hoja, i) => {
    hoja.classList.toggle("activa", i === indiceHoja);
    hoja.classList.toggle("pasada", i < indiceHoja);
    hoja.classList.toggle("espera", i > indiceHoja);
    if (i !== indiceHoja) {
      hoja.querySelectorAll("video").forEach((video) => video.pause());
    }
  });
  document.getElementById("pasar-atras").disabled = indiceHoja === 0;
  document.getElementById("pasar-adelante").disabled = indiceHoja === hojas.length - 1;
  const desde = indiceHoja * 2 + 1;
  document.getElementById("contador").textContent = `Planas ${desde} – ${desde + 1}`;
}

function pasar(delta) {
  if (!delta) return;
  mostrarHoja(indiceHoja + delta);
}

function reproducirVideo(boton) {
  const film = boton.closest(".film");
  const video = film.querySelector("video");
  const aviso = film.querySelector(".aviso-video");
  document.querySelectorAll("video").forEach((otro) => {
    if (otro !== video) otro.pause();
  });
  video.controls = true;
  boton.hidden = true;
  aviso.hidden = true;
  video.play().catch(() => {
    boton.hidden = false;
    aviso.hidden = false;
  });
}

function alClick(evento) {
  if (evento.target.id === "pasar-titulo" || evento.target.id === "pasar-adelante") {
    pasar(1);
    return;
  }
  if (evento.target.id === "pasar-atras") {
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
  if (evento.target.closest("video, button, img, a")) return;
  toqueX = evento.clientX;
}

function alPointerUp(evento) {
  if (toqueX == null) return;
  const delta = evento.clientX - toqueX;
  toqueX = null;
  if (Math.abs(delta) < 60) return;
  pasar(delta > 0 ? 1 : -1);
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
document.addEventListener("ended", (evento) => {
  if (evento.target.tagName !== "VIDEO") return;
  const boton = evento.target.closest(".film")?.querySelector(".ver-video");
  if (boton) {
    boton.hidden = false;
    boton.textContent = "Ver otra vez";
  }
}, true);
