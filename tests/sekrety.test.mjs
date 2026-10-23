import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KORZEN = fileURLToPath(new URL('..', import.meta.url));
const ROZSZERZENIA = new Set(['.html', '.mjs', '.js', '.md', '.json', '.cmd', '.txt']);
const POMIJANE = new Set(['.git', 'node_modules']);

function pliki(katalog) {
  const wynik = [];
  for (const wpis of readdirSync(katalog, { withFileTypes: true })) {
    if (POMIJANE.has(wpis.name)) continue;
    const sciezka = join(katalog, wpis.name);
    if (wpis.isDirectory()) wynik.push(...pliki(sciezka));
    else wynik.push(sciezka);
  }
  return wynik;
}

// Wzorce sklejane z części, żeby ten plik sam do nich nie pasował.
const WZORCE = {
  'token Discord': new RegExp('[MNO][A-Za-z\\d_-]{23,27}' + '\\.' + '[A-Za-z\\d_-]{6}' + '\\.' + '[A-Za-z\\d_-]{27,40}'),
  'sekret klienta Google': new RegExp('GOC' + 'SPX-[A-Za-z\\d_-]{20,}'),
  'Client ID Google': new RegExp('\\d{6,}-[a-z\\d]{32}' + '\\.apps\\.googleusercontent\\.com'),
  'hasło do aplikacji Google': new RegExp('\\b[a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}\\b'),
};

test('żaden plik tekstowy w repo nie zawiera tokenu ani klucza', () => {
  const tekstowe = pliki(KORZEN).filter((p) => ROZSZERZENIA.has(extname(p)));
  assert.ok(tekstowe.length > 0);
  for (const p of tekstowe) {
    const tresc = readFileSync(p, 'utf8');
    for (const [nazwa, wzor] of Object.entries(WZORCE)) {
      assert.ok(!wzor.test(tresc), `${p}: wygląda na ${nazwa}`);
    }
  }
});

test('w repo nie ma pliku client_secret ani folderu poczta', () => {
  for (const p of pliki(KORZEN)) {
    assert.ok(!/client_secret/i.test(p), `${p}: plik z sekretem klienta`);
    assert.ok(!/[\\/]poczta[\\/]/.test(p), `${p}: mail z folderu poczta`);
  }
});

test('.gitignore wyklucza sekret klienta i maile', () => {
  const linie = readFileSync(join(KORZEN, '.gitignore'), 'utf8').split(/\r?\n/);
  for (const w of ['client_secret*.json', 'poczta/', '.env']) assert.ok(linie.includes(w), `brak wpisu ${w}`);
});
