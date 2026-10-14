# Genera fotos livianas, la melodía de fondo y data.js
from __future__ import annotations

import json
import math
import struct
import wave
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
FOTOS = ROOT / "Fotos"
IMG_OUT = ROOT / "assets" / "images"
AUDIO_OUT = ROOT / "assets" / "audio"

MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"}


def parsear(path: Path) -> datetime:
    fecha, hora = path.stem.split("_", 1)
    return datetime.strptime(fecha + hora[:6], "%Y%m%d%H%M%S")


def optimizar(origen: Path, destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and destino.stat().st_mtime >= origen.stat().st_mtime:
        return
    with Image.open(origen) as cruda:
        imagen = ImageOps.exif_transpose(cruda)
        imagen = imagen.convert("RGB")
        imagen.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        imagen.save(destino, "JPEG", quality=78, optimize=True, progressive=True)


def nota(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def sintetizar(ruta: Path) -> None:
    sr = 32000
    bpm = 96
    pulso = 60.0 / bpm
    compases = 16
    duracion = compases * 3 * pulso + 0.4
    total = int(sr * duracion)
    buffer = [0.0] * total

    def sumar(inicio: float, muestras: list[float]) -> None:
        i0 = int(inicio * sr)
        for i, valor in enumerate(muestras):
            j = i0 + i
            if 0 <= j < total:
                buffer[j] += valor

    def caja(freq: float, dur: float, vol: float) -> list[float]:
        n = int(sr * dur)
        parciales = ((1.0, 1.0), (2.02, 0.28), (3.05, 0.1), (4.3, 0.04))
        salida = []
        for i in range(n):
            t = i / sr
            env = math.exp(-t * 3.6) * (1 - math.exp(-t * 90))
            señal = 0.0
            for mult, amp in parciales:
                señal += amp * math.sin(2 * math.pi * freq * mult * t)
            salida.append(vol * env * señal)
        return salida

    def acorde(freq: float, dur: float, vol: float) -> list[float]:
        n = int(sr * dur)
        salida = []
        for i in range(n):
            t = i / sr
            ataque = min(1.0, t / 0.35)
            suelta = min(1.0, max(0.0, (dur - t) / 0.45))
            env = ataque * suelta
            señal = (
                math.sin(2 * math.pi * freq * t)
                + 0.45 * math.sin(2 * math.pi * freq * 1.003 * t)
            )
            salida.append(vol * env * señal)
        return salida

    melodia = [
        (0, 76, 1), (1, 79, 1), (2, 84, 1),
        (3, 83, 1), (4, 81, 1), (5, 79, 1),
        (6, 81, 2), (8, 79, 1),
        (9, 76, 1), (10, 74, 1), (11, 76, 2),
        (14, 72, 1), (15, 76, 1), (16, 79, 1),
        (17, 81, 2), (19, 79, 1),
        (20, 76, 1), (21, 74, 1), (22, 72, 3),
        (25, 76, 1), (26, 79, 1), (27, 81, 1),
        (28, 84, 2), (30, 83, 1),
        (31, 81, 1), (32, 79, 1), (33, 76, 1),
        (34, 79, 2), (36, 81, 1),
        (37, 79, 1), (38, 76, 1), (39, 74, 1),
        (40, 76, 1), (41, 72, 1), (42, 74, 1),
        (43, 76, 1), (44, 79, 1), (45, 76, 1),
        (46, 72, 2),
    ]
    for pulso_ini, midi, largo in melodia:
        sumar(pulso_ini * pulso, caja(nota(midi), largo * pulso + 0.8, 0.22))

    progresion = [60, 55, 57, 52, 53, 60, 50, 55, 60, 55, 57, 52, 53, 50, 55, 48]
    intervalos = [0, 4, 7]
    graves = {50: (50, 53, 57), 48: (48, 52, 55), 52: (52, 55, 59), 55: (55, 59, 62)}
    for i, bajo in enumerate(progresion):
        voces = graves.get(bajo, tuple(bajo + n for n in intervalos))
        inicio = i * 3 * pulso
        for voz in voces:
            sumar(inicio, acorde(nota(voz), 3 * pulso, 0.045))
        sumar(inicio, caja(nota(bajo - 12), 1.4, 0.12))

    retraso = int(0.16 * sr)
    for i in range(retraso, total):
        buffer[i] += 0.2 * buffer[i - retraso]

    pico = max(abs(v) for v in buffer) or 1
    fade = int(0.03 * sr)
    with wave.open(str(ruta), "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sr)
        frames = bytearray()
        for i, valor in enumerate(buffer):
            muestra = valor / pico * 0.82
            if i < fade:
                muestra *= i / fade
            if i > total - fade:
                muestra *= (total - i) / fade
            frames += struct.pack("<h", int(max(-1, min(1, muestra)) * 32767))
        wav.writeframes(frames)


def construir() -> None:
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    AUDIO_OUT.mkdir(parents=True, exist_ok=True)
    sintetizar(AUDIO_OUT / "fondo.wav")
    print("melodia lista")

    archivos = sorted(
        p for p in FOTOS.iterdir() if p.is_file() and p.suffix.lower() in EXTENSIONES
    )
    grupos: dict[str, dict] = {}
    for indice, origen in enumerate(archivos, start=1):
        cuando = parsear(origen)
        clave = cuando.strftime("%Y-%m-%d")
        if clave not in grupos:
            grupos[clave] = {
                "id": clave,
                "fecha": f"{cuando.day} de {MESES[cuando.month - 1]} de {cuando.year}",
                "dia": DIAS[cuando.weekday()],
                "items": [],
            }
        hora = cuando.strftime("%H:%M")
        if origen.suffix.lower() in {".mp4", ".mov", ".webm"}:
            convertido = ROOT / "assets" / "videos" / origen.name
            grupos[clave]["items"].append({
                "tipo": "video",
                "src": f"assets/videos/{origen.name}" if convertido.exists() else f"Fotos/{origen.name}",
                "hora": hora,
                "poster": "",
                "alt": f"Video del {grupos[clave]['fecha']}, {hora}",
            })
            print(f"[{indice}/{len(archivos)}] video {origen.name}")
            continue
        destino = IMG_OUT / f"{origen.stem}.jpg"
        optimizar(origen, destino)
        grupos[clave]["items"].append({
            "tipo": "foto",
            "src": f"assets/images/{destino.name}",
            "hora": hora,
            "alt": f"Foto del {grupos[clave]['fecha']}, {hora}",
        })
        print(f"[{indice}/{len(archivos)}] foto {origen.name}")

    for dia in grupos.values():
        fotos = [item["src"] for item in dia["items"] if item["tipo"] == "foto"]
        if not fotos:
            continue
        for item in dia["items"]:
            if item["tipo"] == "video":
                item["poster"] = fotos[0]

    diario = [grupos[clave] for clave in sorted(grupos)]
    (ROOT / "data.js").write_text(
        "const DIARIO = " + json.dumps(diario, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    fotos = sum(1 for d in diario for i in d["items"] if i["tipo"] == "foto")
    videos = sum(1 for d in diario for i in d["items"] if i["tipo"] == "video")
    print(f"listo: {len(diario)} dias, {fotos} fotos, {videos} videos")


if __name__ == "__main__":
    construir()
