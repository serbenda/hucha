// El CSV de las descargas: en castellano, punto y coma y coma decimal (lo que espera Excel en español),
// con BOM para las tildes, y comillas cuando un texto lleva separadores, comillas o saltos de línea.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csv, fichero } from '../assets/js/descargas.js';

test('csv: separador, decimales, vacíos y comillas', () => {
  const texto = csv(['Nombre', 'Importe', 'Parte'], [
    ['Sanidad', 1234.5, 0.146],
    ['Obras; "urgentes"\nfase 2', null, 1],
  ]);
  assert.ok(texto.startsWith('﻿'), 'lleva BOM');
  assert.equal(
    texto.slice(1),
    'Nombre;Importe;Parte\r\nSanidad;1234,5;0,146\r\n"Obras; ""urgentes""\nfase 2";;1\r\n'
  );
});

test('csv: los decimales largos se recortan sin perder precisión útil', () => {
  assert.match(csv(['x'], [[0.1 + 0.2]]), /0,3\r\n$/);
});

test('fichero: nombre con prefijo hucha', () => {
  assert.equal(fichero('partidas-2024'), 'hucha-partidas-2024.csv');
});
