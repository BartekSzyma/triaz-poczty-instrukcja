import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const wczytaj = (plik) => JSON.parse(readFileSync(new URL('../' + plik, import.meta.url), 'utf8'));
const GLOWNE = ['workflow-triaz-poczty.json', 'workflow-triaz-poczty-bez-imap.json'];
const WSZYSTKIE = [...GLOWNE, 'workflow-test-bez-gmaila.json'];
const wezly = (wf) => Object.fromEntries(wf.nodes.map((n) => [n.name, n]));

test('pliki workflow nie zawierają poświadczeń ani prawdziwych ID Discorda', () => {
  for (const plik of WSZYSTKIE) {
    const wf = wczytaj(plik);
    for (const n of wf.nodes) assert.equal(n.credentials, undefined, `${plik}: ${n.name} ma credentials`);
    assert.ok(!/\b\d{17,20}\b/.test(JSON.stringify(wf)), `${plik}: wygląda na prawdziwe ID Discorda`);
    assert.equal(wf.staticData ?? null, null, `${plik}: zawiera stan wyzwalacza`);
  }
});

test('każde połączenie prowadzi do istniejącego węzła', () => {
  for (const plik of WSZYSTKIE) {
    const wf = wczytaj(plik);
    const n = wezly(wf);
    for (const [zrodlo, wyjscia] of Object.entries(wf.connections)) {
      assert.ok(n[zrodlo], `${plik}: brak węzła ${zrodlo}`);
      for (const lista of wyjscia.main) for (const c of lista) assert.ok(n[c.node], `${plik}: ${zrodlo} → brak ${c.node}`);
    }
  }
});

test('akceptacja idzie na kanał, z trzema decyzjami i bezpieczną wartością domyślną', () => {
  for (const plik of GLOWNE) {
    const n = wezly(wczytaj(plik));
    for (const nazwa of ['Discord: akceptacja', 'Discord: raport']) {
      const p = n[nazwa].parameters;
      assert.equal(p.sendTo, 'channel', `${plik}: ${nazwa}`);
      assert.equal(p.channelId.value, 'WPISZ_ID_KANALU');
      assert.equal(p.guildId.value, 'WPISZ_ID_SERWERA');
    }
    const decyzja = n['Discord: akceptacja'].parameters.formFields.values[1];
    assert.deepEqual(decyzja.fieldOptions.values.map((v) => v.option), ['Wyślij', 'Zapisz jako szkic w Gmailu', 'Odrzuć']);
    assert.equal(decyzja.defaultValue, 'Zapisz jako szkic w Gmailu');
    assert.ok(!n['Wysłać?'], `${plik}: został stary węzeł If`);
  }
});

test('Switch Decyzja: wysyłka tylko po „Wyślij”, brak decyzji idzie do szkicu', () => {
  for (const plik of GLOWNE) {
    const wf = wczytaj(plik);
    const p = wezly(wf)['Decyzja'].parameters;
    assert.deepEqual(p.rules.values.map((r) => r.outputKey), ['Wyślij', 'Odrzuć']);
    assert.equal(p.options.fallbackOutput, 'extra');
    assert.deepEqual(wf.connections['Decyzja'].main.map((l) => l[0].node), ['Wyślij odpowiedź', 'Raport decyzji', 'Szkic odpowiedzi']);
  }
});

// Uruchamia kod węzła Code tak jak n8n: z $input i $(nazwa).
function uruchom(kod, { wejscie = [], wezly: dane = {} }) {
  const $ = (nazwa) => ({ first: () => ({ json: dane[nazwa] }) });
  const $input = { all: () => wejscie.map((json) => ({ json })) };
  return vm.runInNewContext(`(function () { ${kod} })()`, { $, $input });
}

test('Wiadomość do Discorda rozbraja markdown z maila i daje opis formularza bez gwiazdek', () => {
  const n = wezly(wczytaj(GLOWNE[1]));
  const mail = { kategoria: 'pilne', nadawca: 'jan@firma.pl', temat: 'Hej [klik](http://zly.link) @everyone', fragment: 'Treść', szkic: 'Odpowiedź' };
  const [w] = uruchom(n['Wiadomość do Discorda'].parameters.jsCode, { wejscie: [mail] });
  assert.ok(!w.json.wiadomosc.includes('](') && !w.json.wiadomosc.includes('@'));
  assert.ok(w.json.wiadomosc.includes('**Temat:**'));
  assert.ok(!w.json.opis_formularza.includes('**'));
});

test('Raport decyzji: cztery wyniki', () => {
  const kod = wezly(wczytaj(GLOWNE[1]))['Raport decyzji'].parameters.jsCode;
  const mail = { nadawca: 'a@b.pl', temat: 'T' };
  const raport = (data) => uruchom(kod, { wezly: { 'Wiadomość do Discorda': mail, 'Discord: akceptacja': { data } } })[0].json.wiadomosc;
  assert.match(raport({ Decyzja: 'Wyślij', 'Odpowiedź': 'Tekst' }), /^✅[\s\S]*Tekst$/);
  assert.match(raport({ Decyzja: 'Wyślij', 'Odpowiedź': '  ' }), /^📝/);
  assert.match(raport({ Decyzja: 'Zapisz jako szkic w Gmailu', 'Odpowiedź': 'x' }), /^📝/);
  assert.match(raport({ Decyzja: 'Odrzuć', 'Odpowiedź': 'x' }), /^🗑️/);
  assert.match(raport(undefined), /^⏰/);
});
