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
const fondo = new Audio("assets/audio/Antes%20De%20Los%2030.mp3");
fondo.loop = true;
fondo.preload = "auto";
let fondoPausadoAMano = false;

function pintarMusica() {
  const boton = document.getElementById("fondo-musica");
  if (!boton) return;
  const sonando = !fondo.paused;
  boton.setAttribute("aria-pressed", String(sonando));
  boton.textContent = sonando ? "Pausar música" : "Seguir música";
}

function iniciarFondo() {
  if (fondoPausadoAMano || !fondo.paused) return;
  const intento = fondo.play();
  if (intento) intento.then(pintarMusica).catch(() => {});
}

function alternarFondo() {
  if (fondo.paused) {
    fondoPausadoAMano = false;
    const intento = fondo.play();
    if (intento) intento.then(pintarMusica).catch(() => {});
  } else {
    fondoPausadoAMano = true;
    fondo.pause();
  }
  pintarMusica();
}

function giroDe(texto) {
  let valor = 0;
  for (const letra of texto) valor = (valor * 33 + letra.charCodeAt(0)) % 997;
  return ((valor % 9) - 4) * 1.4;
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

function folio(numero) {
  return String(numero).padStart(2, "0");
}

function escapar(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function cabecera(titulo, fecha, extra, numero) {
  const encabezado = titulo ? `<h3>${escapar(titulo)}</h3>` : "";
  return `
    <header class="cabecera">
      <div class="cabecera-sup">
        <p class="masthead">Diario de vida</p>
        <p class="edicion">Plana ${folio(numero)}</p>
      </div>
      <div class="cabecera-main">
        ${encabezado}
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
        <h1>Diario de anécdotas</h1>
        <p class="dedicado">Para Maca</p>
        <p class="fecha-tapa">Feliz cumpleaños</p>
        <p class="arco">Historias de Nov 2025 — Sep 2026</p>
        <button id="abrir-tapa" type="button">Abrir</button>
      </div>
    </article>`;
}

function htmlIndice(entradas, esInicio, cuentas) {
  const filas = entradas.map((entrada) => `
    <li>
      <button type="button" data-ir="${entrada.pliego}">
        <span class="num">${folio(entrada.numero)}</span>
        <span class="cuando">${escapar(entrada.fecha)}</span>
        <em>${escapar(entrada.titulo)}</em>
      </button>
    </li>`).join("");
  const intro = esInicio ? `
      <p class="saludo">Índice</p>
      <p class="pista-indice">Elige un día, o empieza a hojear desde la primera plana.</p>
      <ul class="fichas fichas-indice">
        <li><strong>${cuentas.fotos}</strong><span>fotos</span></li>
        <li><strong>${cuentas.videos}</strong><span>videos</span></li>
      </ul>` : `
      <p class="sigue-indice">Sigue</p>`;
  const cierre = esInicio ? "" : `<button id="pasar-titulo" type="button">Empezar a hojear</button>`;
  return `
    <article class="hoja indice">
      ${intro}
      <ol class="lista-indice">${filas}</ol>
      ${cierre}
    </article>`;
}

function claseRecuerdos(fotos, videos, dia) {
  if (videos.length && fotos.length >= 5) {
    return dia.id === "2026-08-15" ? "recuerdos plano-video foto-tres" : "recuerdos plano-video";
  }
  if (dia.id === "2026-02-14") return "recuerdos ultima";
  if (fotos.length >= 8) return "recuerdos ocho";
  if (dia.id === "2026-09-06") return "recuerdos penultima";
  if (dia.id === "2026-09-08") return "recuerdos extremos";
  if (fotos.length >= 5) return "recuerdos cinco";
  if (fotos.length === 3 && !videos.length) return "recuerdos tres";
  if (fotos.length <= 1 && !videos.length) return "recuerdos uno";
  return "recuerdos";
}

function htmlDia(dia, numero, total) {
  const fotos = dia.items.filter((item) => item.tipo === "foto");
  const videos = dia.items.filter((item) => item.tipo === "video");
  const clase = claseRecuerdos(fotos, videos, dia);
  const densa = fotos.length >= 5;
  const horas = dia.items.map((item) => item.hora);
  const rango = horas.length > 1 ? `${horas[0]} – ${horas[horas.length - 1]}` : horas[0] || "";
  const piezasDia = dia.items.map((item) => {
    if (item.tipo === "video") {
      const poster = item.poster ? ` poster="${item.poster}"` : "";
      return `
        <figure class="film">
          <video muted loop playsinline preload="metadata"${poster} src="${item.src}"></video>
          <div class="film-pie">
            <figcaption>${item.hora}</figcaption>
            <span class="sonido">
              <button class="audio-video" type="button" data-sonido="on" aria-label="Oír el video" aria-pressed="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a4.5 4.5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              </button>
              <button class="audio-video" type="button" data-sonido="off" aria-label="Silenciar el video" aria-pressed="true">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l4 5M21 9.5l-4 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              </button>
            </span>
          </div>
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
      ${cabecera(dia.titulo || "", dia.fecha, detalle, numero)}
      <div class="${clase}">${piezasDia}</div>
      <p class="nota-hoja">${escapar(dia.nota)}</p>
      <footer class="colofon"><span>Para Maca</span><span>${folio(numero)}</span></footer>
    </article>`;
}

function htmlCarta(numero) {
  const carta = [
    "Pendeja, te deseo un muy feliz cumpleaños. Te pido disculpas por no hablarte en todo el día, pero era parte de la sorpresa jajaja. Espero que hayas disfrutado mucho tu día y que este nuevo año de vida venga cargado de cosas bonitas, nuevas experiencias y muchas razones para reírte.",
    "",
    "Agradezco de verdad ser parte de tu vida y poder compartir tantas anécdotas contigo. Has sido una partner y una mejor amiga indispensable para mí. Sé que no siempre expreso las cosas tanto como debiese, pero quiero que sepas que eres una persona muy importante en mi vida y que valoro muchísimo tenerte en ella.",
    "",
    "Cada una de estas fotos guarda un recuerdo de algo que vivimos juntos. Algunas son de panoramas increíbles, otras de salidas improvisadas y otras de esos días en los que literalmente no hicimos nada jajaja. Pero, al final, creo que eso es lo bonito de todo esto: que no necesitamos hacer algo extraordinario para pasarlo bien, porque hasta los panoramas más simples terminan convirtiéndose en anécdotas que recordamos y nos dan risa después.",
    "",
    "Gracias por escucharme mil veces hablar de los mismos temas sobre mi pasado, por tenerme paciencia y por ayudarme a sobrellevar cosas que no siempre han sido fáciles para mí. Todas las conversaciones que has escuchado de lo mismo, pero estas ahí siempre.",
    "",
    "También quiero que sepas que espero poder estar para ti de la misma manera. Para escucharte cuando lo necesites, o solamente acompañarte sin decirnos nada. Gracias por estar ahí, por tu amistad y por dejarme ser parte de tu vida (que es bastante complicado formar parte de ella).",
    "",
    "Feliz cumpleaños pinche mujer, espero que la vida te siga regalando todo lo que te mereces, y que nadie te haga dudar de que así lo es. Y, por si no te lo digo lo suficiente, quiero que sepas que te quiero mucho y que me alegra muchísimo haberte conocido y que nuestros caminos se hayan cruzado. Gracias por ser mi mejor amiga.",
    "",
    "Con cariño, el mas pendejo de Chile, el gato de montaña, el hombre mas mentiroso.",
    "Brian",
  ].join("\n");
  return `
    <article class="hoja misiva">
      ${cabecera("Feliz Cumpleaños Pendeja", "Antes de las velas", "", numero)}
      <div class="cuerpo-carta" contenteditable="true" data-nota="carta-brian" spellcheck="true">${escapar(carta)}</div>
      <footer class="colofon"><span>Para Maca</span><span>${folio(numero)}</span></footer>
    </article>`;
}

function htmlFinal(numero, total) {
  return `
    <article class="hoja cierre">
      ${cabecera("Hoy es tu día", "Feliz cumpleaños", "", numero)}
      <div class="fiesta">
        <p class="brindis">Cierra los ojos y pide un deseo</p>
        <div class="torta" id="grupo-velas" aria-hidden="true">
          <span class="plato"></span>
          <span class="piso piso-bajo">
            <span class="cinta-torta"></span>
            <span class="mono"></span>
          </span>
          <span class="piso piso-alto"></span>
          <span class="guinda g1"></span>
          <span class="guinda g2"></span>
          <span class="guinda g3"></span>
          <span class="vela v1 alta"><span class="llama"></span></span>
          <span class="vela v2"><span class="llama"></span></span>
          <span class="vela v3 baja"><span class="llama"></span></span>
          <span class="vela v4 media"><span class="llama"></span></span>
          <span class="vela v5"><span class="llama"></span></span>
        </div>
        <p id="deseo" hidden>¡Feliz cumpleaños, Maca!</p>
        <button id="velas" type="button">Sopla las velas</button>
      </div>
      <footer class="colofon"><span>Para Maca</span><span>${folio(numero)}</span></footer>
    </article>`;
}

function conLado(html, lado) {
  return html.replace('class="hoja', `class="hoja ${lado}`);
}

function htmlPliegos(tapa, paginas) {
  const pliegos = [`
    <section class="pliego tapa activa">
      <div class="plana izquierda">${conLado(tapa, "lado-izq")}</div>
      <div class="lomo" aria-hidden="true"></div>
      <div class="plana derecha"></div>
    </section>`];
  for (let i = 0; i < paginas.length; i += 2) {
    const derecha = paginas[i + 1] || `<article class="hoja vacia"></article>`;
    pliegos.push(`
      <section class="pliego espera${i === 0 ? " indice" : ""}">
        <div class="plana izquierda">${conLado(paginas[i], "lado-izq")}</div>
        <div class="lomo" aria-hidden="true"></div>
        <div class="plana derecha">${conLado(derecha, "lado-der")}</div>
      </section>`);
  }
  return pliegos.join("");
}

function armarPaginas(cuentas) {
  const dias = DIARIO.map((dia, i) => htmlDia(dia, i + 3, DIARIO.length + 4));
  const numeroCarta = DIARIO.length + 3;
  const hojaBlanca = `<article class="hoja vacia"><p class="sigue-hoja">Sigue</p></article>`;
  const cartaALaIzquierda = (2 + dias.length) % 2 === 1;
  const paginas = [
    "",
    "",
    ...dias,
    ...(cartaALaIzquierda ? [hojaBlanca] : []),
    htmlCarta(numeroCarta),
    htmlFinal(numeroCarta + 1, numeroCarta + 1),
  ];
  if (paginas.length % 2) paginas.push(`<article class="hoja vacia"></article>`);
  const entradas = DIARIO.map((dia, i) => {
    const horas = dia.items.map((item) => item.hora).filter(Boolean);
    const hora = horas.length > 1 && horas[0] !== horas[horas.length - 1]
      ? `${horas[0]} – ${horas[horas.length - 1]}`
      : (horas[0] || "");
    return {
      numero: i + 3,
      titulo: hora,
      fecha: dia.fecha,
      pliego: 1 + Math.floor((2 + i) / 2),
    };
  });
  const indiceCarta = 2 + dias.length + (cartaALaIzquierda ? 1 : 0);
  const pliegoCarta = 1 + Math.floor(indiceCarta / 2);
  entradas.push(
    { numero: numeroCarta, titulo: "Una carta", fecha: "Antes de las velas", pliego: pliegoCarta },
    { numero: numeroCarta + 1, titulo: "Hoy es tu día", fecha: "Feliz cumpleaños", pliego: pliegoCarta },
  );
  const mitad = Math.ceil(entradas.length / 2);
  paginas[0] = htmlIndice(entradas.slice(0, mitad), true, cuentas);
  paginas[1] = htmlIndice(entradas.slice(mitad), false, cuentas);
  return paginas;
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
  const paginas = armarPaginas(cuentas);
  app.innerHTML = `
    <div class="libro tapa">
      <header class="revista-barra">
        <p>Diario de anécdotas</p>
        <p>Para Maca</p>
      </header>
      <button id="pasar-atras" class="pasar" type="button" aria-label="Hoja anterior"><span aria-hidden="true">‹</span><small>Anterior</small></button>
      <div class="ventana" id="ventana">
        <div id="riel">${htmlPliegos(htmlPortada(), paginas)}</div>
        <button id="canto-atras" class="canto canto-izq" type="button" aria-label="Hoja anterior"></button>
        <button id="canto-adelante" class="canto canto-der" type="button" aria-label="Abrir"></button>
      </div>
      <button id="pasar-adelante" class="pasar" type="button" aria-label="Abrir"><span aria-hidden="true">›</span><small>Abrir</small></button>
      <div class="pie-libro">
        <p class="contador" id="contador"></p>
        <button id="fondo-musica" class="musica" type="button" aria-pressed="false">Seguir música</button>
        <button id="volver-inicio" class="volver" type="button" hidden>Volver al inicio</button>
      </div>
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
      if (nodo.classList.contains("cuerpo-carta")) ajustarCarta();
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
  const libro = document.querySelector(".libro");
  if (libro && !libro.classList.contains("abriendo")) libro.classList.toggle("tapa", alInicio);
  document.getElementById("pasar-atras").disabled = alInicio;
  document.getElementById("canto-atras").disabled = alInicio;
  document.getElementById("pasar-adelante").disabled = alFinal;
  document.getElementById("canto-adelante").disabled = alFinal;
  const pasarAdelante = document.getElementById("pasar-adelante");
  const cantoAdelante = document.getElementById("canto-adelante");
  const textoPaso = alInicio ? "Abrir" : "Hojear";
  if (pasarAdelante) {
    pasarAdelante.setAttribute("aria-label", textoPaso);
    const pequeno = pasarAdelante.querySelector("small");
    if (pequeno) pequeno.textContent = textoPaso;
  }
  if (cantoAdelante) cantoAdelante.setAttribute("aria-label", textoPaso);
  document.getElementById("volver-inicio").hidden = !alFinal;
  document.getElementById("contador").textContent = textoContador(hojas[indiceHoja]);
  requestAnimationFrame(ajustarCarta);
}

function ajustarCarta() {
  const carta = document.querySelector(".pliego.activa .cuerpo-carta");
  if (!carta) return;
  const plana = carta.closest(".plana");
  const footer = carta.closest(".hoja").querySelector(".colofon");
  const cabe = () => {
    const rango = document.createRange();
    rango.selectNodeContents(carta);
    const rects = rango.getClientRects();
    const limiteAbajo = footer.getBoundingClientRect().top - 14;
    const limiteDerecha = plana.getBoundingClientRect().right - 12;
    for (const rect of rects) {
      if (rect.width < 1) continue;
      if (rect.bottom > limiteAbajo || rect.right > limiteDerecha) return false;
    }
    return true;
  };
  let tamano = 12;
  carta.style.lineHeight = "1.32";
  carta.style.fontSize = `${tamano}px`;
  while (tamano < 28 && cabe()) {
    tamano += 0.5;
    carta.style.fontSize = `${tamano}px`;
  }
  while (tamano > 10 && !cabe()) {
    tamano -= 0.5;
    carta.style.fontSize = `${tamano}px`;
  }
}

function textoContador(pliego) {
  if (!pliego || pliego.classList.contains("tapa")) return "Tapa";
  if (pliego.classList.contains("indice")) return "Índice";
  const numeros = [...pliego.querySelectorAll(".edicion")].map((nodo) => nodo.textContent.replace("Plana ", ""));
  if (numeros.length === 2) return `Planas ${numeros[0]} – ${numeros[1]}`;
  if (numeros.length === 1) return `Plana ${numeros[0]}`;
  return "";
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
  if (indiceHoja === 0 && delta > 0) {
    if (reducido) mostrarHoja(destino);
    else abrirTapa();
    return;
  }
  if (destino === 0) {
    if (reducido) mostrarHoja(0);
    else cerrarTapa();
    return;
  }
  if (reducido) {
    mostrarHoja(destino);
    return;
  }
  voltear(delta);
}

function abrirTapa() {
  volteando = true;
  document.body.classList.add("hojeando");
  const libro = document.querySelector(".libro");
  const ventana = document.getElementById("ventana");
  const hojas = listaHojas();
  const portada = hojas[0].querySelector(".hoja.portada");
  const ancho = ventana.getBoundingClientRect().width;
  const vuelo = document.createElement("div");
  vuelo.className = "vuelo-tapa";
  vuelo.style.setProperty("--ancho-tapa", `${ancho}px`);
  vuelo.appendChild(portada);
  ventana.appendChild(vuelo);
  hojas[1].classList.add("debajo");
  hojas[1].classList.remove("espera");
  libro.classList.add("abriendo");
  libro.classList.remove("tapa");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => vuelo.classList.add("abierta"));
  });
  window.setTimeout(() => {
    const hueco = hojas[0].querySelector(".plana.izquierda");
    if (hueco && portada) hueco.appendChild(portada);
    vuelo.remove();
    libro.classList.remove("abriendo");
    mostrarHoja(1);
    volteando = false;
    document.body.classList.remove("hojeando");
  }, 980);
}

function cerrarTapa() {
  volteando = true;
  document.body.classList.add("hojeando");
  const libro = document.querySelector(".libro");
  libro.classList.add("cerrando");
  window.setTimeout(() => {
    libro.classList.remove("cerrando");
    mostrarHoja(0);
    volteando = false;
    document.body.classList.remove("hojeando");
  }, 720);
}

function volverAlInicio() {
  if (volteando || indiceHoja === 0) return;
  mostrarHoja(0);
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
  video.muted = video.dataset.conSonido !== "1";
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

function marcarSonido(film, activo) {
  film.querySelectorAll(".audio-video").forEach((boton) => {
    const esEscuchar = boton.dataset.sonido === "on";
    boton.setAttribute("aria-pressed", String(esEscuchar === activo));
  });
}

function alternarSonido(boton) {
  const film = boton.closest(".film");
  const video = film?.querySelector("video");
  if (!video) return;
  const activar = boton.dataset.sonido === "on";
  document.querySelectorAll(".film").forEach((otro) => {
    if (otro === film) return;
    const otroVideo = otro.querySelector("video");
    if (!otroVideo) return;
    otroVideo.muted = true;
    delete otroVideo.dataset.conSonido;
    marcarSonido(otro, false);
  });
  video.muted = !activar;
  if (activar) video.dataset.conSonido = "1";
  else delete video.dataset.conSonido;
  marcarSonido(film, activar);
  if (activar) video.play().catch(() => {});
}

function alClick(evento) {
  const boton = evento.target.closest("button");
  if (boton && boton.id === "fondo-musica") {
    alternarFondo();
    return;
  }
  iniciarFondo();
  if (boton && (boton.id === "abrir-tapa" || boton.id === "pasar-titulo" || boton.id === "pasar-adelante" || boton.id === "canto-adelante")) {
    pasar(1);
    return;
  }
  if (boton && (boton.id === "pasar-atras" || boton.id === "canto-atras")) {
    pasar(-1);
    return;
  }
  if (boton && boton.id === "volver-inicio") {
    volverAlInicio();
    return;
  }
  const salto = evento.target.closest("[data-ir]");
  if (salto) {
    const destino = Number(salto.dataset.ir);
    if (!volteando && destino !== indiceHoja) mostrarHoja(destino);
    return;
  }
  if (boton && boton.classList.contains("audio-video")) {
    alternarSonido(boton);
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
  if (!evento.target.closest("#fondo-musica")) iniciarFondo();
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
  iniciarFondo();
  if (!visor.hidden) {
    if (evento.key === "Escape") cerrarVisor();
    if (evento.key === "ArrowRight") pasoVisor(1);
    if (evento.key === "ArrowLeft") pasoVisor(-1);
    return;
  }
  if (evento.key === "ArrowRight") pasar(1);
  if (evento.key === "ArrowLeft") pasar(-1);
});
window.addEventListener("resize", () => {
  ajustarLienzo();
  ajustarCarta();
});
app.addEventListener("click", alClick);
app.addEventListener("pointerdown", alPointerDown);
window.addEventListener("pointerup", alPointerUp);

ajustarLienzo();
prepararAmbiente();
abrirLibreta();
