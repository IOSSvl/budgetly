# Budgetly Custom Completo

Stack: Node.js + Express + PostgreSQL + JWT + PWA frontend.

## 1) Setup rapido

1. Copia `.env.example` in `.env`
2. Avvia Postgres:
   - `docker compose up -d`
3. Installa dipendenze:
   - `npm install`
4. Avvia server:
   - `npm run dev`
5. Apri:
   - `http://localhost:3001/index.html`

## 2) Multi-account

- Registrazione: usa Nome + Email + Password
- Login: Email + Password
- I dati budget vengono salvati per utente in PostgreSQL (`user_budget_data`)

## 3) Uso da telefono

1. Trova IP del PC (es. `192.168.1.30`)
2. Avvia server su rete locale con PORT 3001 (già default)
3. Apri da telefono:
   - `http://192.168.1.30:3001/index.html`
4. Installa come PWA da browser (Aggiungi a schermata Home)

## Deploy rapido (script)

Dal PC Windows:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\ranoc\Documents\Risparmi\scripts\deploy-windows.ps1
```

Lo script:
- crea lo zip del progetto
- lo carica sul server
- lancia deploy server (`docker compose up -d --build`)

## Note

- In locale senza login continua a funzionare con salvataggio locale.
- Con login attivo, salva anche su cloud (Postgres) in automatico.
