#!/usr/bin/env node
'use strict';
// Genera docs/index.html (página estática para GitHub Pages) a partir de
// resultados/resultados.json y tools/pagina/plantilla.html. Sin dependencias.
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..', '..');
const datos = fs.readFileSync(path.join(raiz, 'resultados', 'resultados.json'), 'utf8');
JSON.parse(datos); // falla pronto si el JSON está mal
const plantilla = fs.readFileSync(path.join(__dirname, 'plantilla.html'), 'utf8');
if (!plantilla.includes('/*DATOS*/')) throw new Error('La plantilla no tiene el marcador /*DATOS*/');
// "<" escapado para que ningún texto de los datos pueda cerrar el <script>
const seguro = JSON.stringify(JSON.parse(datos)).replace(/</g, '\\u003c');
fs.mkdirSync(path.join(raiz, 'docs'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'docs', 'index.html'), plantilla.replace('/*DATOS*/', () => seguro));
console.log('docs/index.html generado');
