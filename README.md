# Para Maca

Revista estática para GitHub Pages. Se abre en el navegador con las fotos, los videos y las dos planas del diario. La canción de fondo se agrega después.

## Cómo verla

Publica esta carpeta en GitHub Pages. La dirección queda en `https://usuario.github.io/nombre-del-repositorio/`. Todas las rutas son relativas, así que también funciona dentro de un repositorio de proyecto.

Los videos se ven con el botón **Ver video** de cada plana.

## Si agregas fotos o videos

Copia los archivos nuevos en `Fotos`, con el nombre que pone el celular (`AAAAMMDD_HHMMSS.jpg` o `.mp4`), y ejecuta:

```bash
python preparar.py
```

Eso actualiza las copias livianas y el índice de la libreta.
