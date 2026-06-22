# Offline Mac edition

This edition stores all household data locally on one Mac and works without Firebase or an internet connection.

Local members do not need accounts. Add them in **Ajustes → Miembros**, then choose
who paid when adding a manual expense or importing a bank table. Monthly income
can also be entered separately for every local member.

You can create several independent households in **Ajustes → Hogar**. Each one
has its own members, categories, expenses and income.

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

## Use from an iPhone on the same Wi-Fi

1. Connect the Mac and iPhone to the same trusted Wi-Fi.
2. Double-click `start-offline-mac.command` and keep its Terminal window open.
3. The Terminal shows an address similar to `http://192.168.1.25:8765`.
4. Open that exact address in Safari on the iPhone.
5. If macOS asks whether Node may accept incoming connections, choose **Allow**.

The Mac remains the database. The Mac and iPhone can both add or edit expenses,
and changes normally appear on the other device within about three seconds.
No internet connection is required.

There is no login or password in this local-network edition. Anyone connected
to that Wi-Fi who knows the address can see and edit the data. Use it only on a
trusted home network, and close the Terminal window when finished.

## Later use

Double-click `start-offline-mac.command`. No internet connection is required.

## Data storage

- The shared database is stored in `offline-data/household-data.json` on this Mac.
- A browser copy is retained as an additional fallback.
- CSV and Excel bank files are read locally and are not uploaded.
- Use **Ajustes → Descargar backup** regularly. Restore the JSON file from the same screen.
- Do not clear this site's browser data unless you intend to erase the local household database.
- It synchronizes only while devices can reach this Mac on the same local network.
- It does not synchronize with the Firebase web edition.

## Updating the offline edition

After pulling a newer repository version, run:

```bash
npm run build:offline:mac
```

Then start it normally.
