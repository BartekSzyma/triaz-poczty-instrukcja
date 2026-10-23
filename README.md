# Triaż poczty z n8n i Claude Code

Strona: https://bartekszyma.github.io/triaz-poczty-instrukcja/

Instrukcja krok po kroku: n8n odbiera nowe maile z testowej skrzynki Gmail, Claude Code (`claude -p`, bez narzędzi) nadaje każdemu kategorię i pisze szkic odpowiedzi, n8n nadaje etykiety, a maile do odpowiedzi trafiają na prywatny kanał Discorda. Tam w formularzu poprawiasz szkic i wybierasz: wyślij, zapisz jako szkic w Gmailu albo odrzuć. Pod każdą propozycją bot dopisuje raport z decyzją. Dalszy ciąg [ćwiczeń z Discorda](https://bartekszyma.github.io/discord-instrukcja/cwiczenia-discord.html).

Pliki:

- `triaz-poczty-instrukcja.html` - instrukcja (zrzuty w folderze `zrzuty/`)
- `start-n8n.cmd` - uruchamia n8n z włączonym węzłem Execute Command i jednym folderem do zapisu
- `workflow-test-bez-gmaila.json` - krok 4: test na 5 przykładowych mailach
- `workflow-triaz-poczty.json` - główny workflow (IMAP)
- `workflow-triaz-poczty-bez-imap.json` - główny workflow z wyzwalaczem Gmaila

W plikach workflow nie ma poświadczeń ani ID - tylko `WPISZ_ID_SERWERA` i `WPISZ_ID_KANALU` do uzupełnienia.

Testy: `npm test` (sekrety, linki i zrzuty w instrukcji, poprawność plików workflow).
