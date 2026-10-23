@echo off
rem Uruchamia n8n z ustawieniami potrzebnymi do triazu poczty.
rem Zostaw to okno otwarte: zamkniecie go zatrzymuje n8n.
cd /d "%~dp0"
if not exist "%~dp0poczta" mkdir "%~dp0poczta"

rem Wlacza wezel Execute Command (domyslnie wylaczony od n8n 2.0).
set NODES_EXCLUDE=[]
rem Jedyny folder, do ktorego n8n moze zapisywac pliki.
set N8N_RESTRICT_FILE_ACCESS_TO=%~dp0poczta
set N8N_DIAGNOSTICS_ENABLED=false

n8n start
