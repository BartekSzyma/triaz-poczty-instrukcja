import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KORZEN = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(KORZEN + 'triaz-poczty-instrukcja.html', 'utf8');

test('każdy zrzut użyty w instrukcji istnieje i każdy plik w zrzuty/ jest użyty', () => {
  const uzyte = [...html.matchAll(/src="(zrzuty\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(uzyte.length >= 10);
  for (const z of uzyte) assert.ok(existsSync(KORZEN + z), `brak pliku ${z}`);
  for (const plik of readdirSync(KORZEN + 'zrzuty')) assert.ok(uzyte.includes('zrzuty/' + plik), `nieużyty zrzut ${plik}`);
});

test('każdy zrzut ma tekst alternatywny', () => {
  for (const m of html.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /alt="[^"]{10,}"/, m[0].slice(0, 80));
});

test('nie ma linków do plików na dysku, a lokalne linki prowadzą do istniejących plików', () => {
  assert.ok(!/href="file:/.test(html), 'link file:/// nie działa na GitHub Pages');
  for (const m of html.matchAll(/href="([^"#:]+)"/g)) assert.ok(existsSync(KORZEN + m[1]), `brak pliku ${m[1]}`);
});

test('każda kotwica ze spisu treści ma swoją sekcję', () => {
  for (const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${m[1]}"`), `brak id="${m[1]}"`);
});

test('instrukcja opisuje kanał i trzy decyzje, a nie stare wiadomości prywatne', () => {
  for (const s of ['WPISZ_ID_KANALU', 'Zapisz jako szkic w Gmailu', 'Odrzuć', 'Discord: raport']) assert.ok(html.includes(s), `brak „${s}”`);
  for (const s of ['WPISZ_SWOJE_ID', 'Otwórz formularz', 'Nie wysyłaj, zostaw szkic']) assert.ok(!html.includes(s), `nieaktualne „${s}”`);
});

test('index.html przekierowuje do instrukcji', () => {
  const index = readFileSync(KORZEN + 'index.html', 'utf8');
  assert.match(index, /url=triaz-poczty-instrukcja\.html/);
});
