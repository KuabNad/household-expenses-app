# Offline Mac edition

This edition stores all household data locally on one Mac and works without Firebase or an internet connection.

Local members do not need accounts. Add them in **Ajustes → Miembros**, then choose
who paid when adding a manual expense or importing a bank table. Monthly income
can also be entered separately for every local member.

## First-time setup

An internet connection is required only to download the project dependencies once:

```bash
npm install
npm run build:offline:mac
```

Then double-click `start-offline-mac.command`. The app opens at:

```text
http://127.0.0.1:8765
```

Keep the small Terminal window open while using the app. Close it or press `Control+C` when finished.

## Later use

Double-click `start-offline-mac.command`. No internet connection is required.

## Data storage

- Data stays in the browser storage for `127.0.0.1:8765` on this Mac.
- CSV and Excel bank files are read locally and are not uploaded.
- Use **Ajustes → Descargar backup** regularly. Restore the JSON file from the same screen.
- Do not clear this site's browser data unless you intend to erase the local household database.
- This edition is designed for one local household operator. It does not synchronize with another device or the Firebase web edition.

## Updating the offline edition

After pulling a newer repository version, run:

```bash
npm run build:offline:mac
```

Then start it normally.
