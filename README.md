# ArUco 3D-Messwerkzeug

Ein kompaktes Open-Source-3D-Messwerkzeug aus **3D-gedruckten 2-Farb-ArUco-Messwürfeln (`DICT_4X4_50`)** und einer mobilen **Browser-Web-App (`OpenCV.js` / WASM)**.

Die gesamte Bildverarbeitung läuft **100 % lokal im Smartphone-Browser** (iOS Safari / Android Chrome) — ohne Backend, ohne Cloud und ohne App-Installation.

---

## Features

- **Kugelkoordinaten zur Kamera:** Echtzeit-Messung von **Azimut (Orbit um Z)**, **Elevation (Höhenwinkel)** und **Abstand** relativ zu jedem Messwürfel.
- **Multi-Marker 3D-Vermessung (bis zu 3 Würfel gleichzeitig):** Berechnet zwischen allen sichtbaren Würfeln den **3D-Abstand (mm)**, den relativen **Versatz (`ΔX / ΔY / ΔZ`)**, den **Flächenwinkel (`+Z/+Z`)**, die **3D-Gesamtdrehung**, **Euler-Winkel (ZYX)** und die **Normalenvektoren**.
- **Zeitgesteuertes 3s-Capture mit Ausreißer-Filterung:** 1 s Vorlauf (Hand beruhigen) → 3 s Aufzeichnung mit Multi-Flächen-Bevorzugung, MAD-Ausreißer-Filter, zirkulärem Mittelwert (`±σ`) und anschließendem Standbild.
- **Interaktive 3D-Raumansicht (`🧊 3D`):** Zeigt nach dem Capture (oder live) alle 1–3 Messwürfel maßstabsgetreu mit ihren Auflageflächen im 3D-Raum (frei dreh- & zoombar, inkl. `Oben / Vorne / Rechts`-Ansichten), mit klar markierten 3D-Abständen, `ΔX/ΔY/ΔZ`-Projektion und automatischem **90°-Rechtwinkligkeits-Check** für Wände & Flächen.
- **Direkter `.txt`-Export & Zwischenablage:** Strukturierter Messbericht für CAD-Workflows, Dokumentation oder Weiterverarbeitung.
- **Frei skalierbare Würfelgröße:** Die 48-mm-Würfel lassen sich im Slicer beliebig gleichmäßig skalieren (z. B. 30 mm, 36 mm, 60 mm) — die neue Kantenlänge wird einfach in den Einstellungen (`⚙`) eingetragen (das Marker-Verhältnis von exakt `75 %` bleibt dabei erhalten).
- **Interaktive 3D-Start-Schematik:** Animierter, frei drehbarer 3D-Würfel beim Start (jederzeit über `?` aufrufbar), der `+X / -Y / +Z`, Boden (`Z = 0`) und die **3 mm Orientierungsfase unten rechts** eindeutig zeigt.
- **PWA & 100 % Offline-Modus (Add to Home Screen):** Vollständige Progressive Web App (`manifest.webmanifest`, App-Icons, Service Worker `sw.js`). Einmal über GitHub Pages geöffnet, werden App und `OpenCV.js` lokal gecacht — danach per *Teilen → Zum Home-Bildschirm* als Vollbild-App auch komplett **offline (z. B. Tiefgarage / Flugmodus)** nutzbar.
- **Bambu-Studio- / AMS-fertige 3MF-Dateien:** Alle 3 Würfel flächenbündig als 2-Farb-Baugruppen (`PLA Matte Weiß` + `PLA Matte Schwarz`), sowohl einzeln als auch zusammen auf einer Druckplatte.

---

## Schnellstart

### Option A: GitHub Pages (empfohlen — automatisches HTTPS)
1. Repository auf GitHub pushen.
2. In den Repository-Einstellungen unter **Settings → Pages → Build and deployment → Source** auf **GitHub Actions** umstellen.
3. Der Workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) prüft automatisch JavaScript-Syntax, Links und 3MF-Integrität und veröffentlicht die App unter:
   ```text
   https://<dein-benutzername>.github.io/<repo-name>/
   ```
4. URL direkt auf dem Smartphone öffnen (HTTPS ist für Kamerazugriff und Service Worker erforderlich).
5. **Als Offline-App installieren (iOS Safari):** Auf das **Teilen-Symbol → „Zum Home-Bildschirm“** tippen. Sobald die App einmalig online geöffnet wurde, liegen Oberfläche und `OpenCV.js` lokal im Cache und funktionieren danach auch **komplett ohne Internetverbindung**.

### Option B: Lokaler HTTPS-Server im WLAN (macOS / Linux)
```bash
bash start_live_server.sh
```
Das Skript erzeugt einmalig ein selbstsigniertes Zertifikat in `/tmp` und gibt die lokale `https://<LAN-IP>:8443/`-Adresse fürs Smartphone aus.

---

## 3D-Messwürfel & Druckhinweise

Alle 3 Messwürfel liegen im Ordner [`models/`](models/) (und sind auch direkt in der Web-App unter **⚙** herunterladbar):

| Modell | ArUco-IDs (`DICT_4X4_50`) | Dateien |
| :--- | :---: | :--- |
| **Alle 3 Würfel (1 Druckplatte)** | `0–14` | [`models/messwuerfel-alle-3.3mf`](models/messwuerfel-alle-3.3mf) *(AMS-ready, 2 Materialien)* |
| **Marker 1** (Grün) | `0–4` | [`messwuerfel-1.3mf`](models/messwuerfel-1.3mf) · [`messwuerfel-1.step`](models/messwuerfel-1.step) · [`messwuerfel-1.sc`](models/messwuerfel-1.sc) |
| **Marker 2** (Cyan) | `5–9` | [`messwuerfel-2.3mf`](models/messwuerfel-2.3mf) · [`messwuerfel-2.step`](models/messwuerfel-2.step) · [`messwuerfel-2.sc`](models/messwuerfel-2.sc) |
| **Marker 3** (Amber) | `10–14` | [`messwuerfel-3.3mf`](models/messwuerfel-3.3mf) · [`messwuerfel-3.step`](models/messwuerfel-3.step) · [`messwuerfel-3.sc`](models/messwuerfel-3.sc) |

### Geometrie (Standard 48 mm)
- **Grundkörper:** `48 × 48 × 48 mm`
- **ArUco-Marker (5 Seiten):** `36 × 36 mm` (`75 %` der Kantenlänge, `6 mm` Zellen, `6 mm` weiße Quiet Zone), `0,8 mm` tief flächenbündig eingelassen
- **Orientierungsfase:** `3 mm` Fase an der unteren `+X`-Kante (`unten rechts`)
- **Boden-Bohrung:** `Ø 5,7 × 10 mm` mittig bei `(0, 0, 0)` (z. B. für M4-Einschmelzgewinde / Stativ-Adapter)

### Empfohlene Druckeinstellungen
- **Material:** **PLA Matte Weiß** (`Wuerfel_Weiss`) + **PLA Matte Schwarz** (`Marker_ID*`) — mattes Filament verhindert Spiegelungen für maximale Kamera-Erkennung
- **Schichthöhe:** `0,2 mm`, keine Stützstruktur nötig
- **Skalierung:** Gleichmäßig (X/Y/Z) im Slicer skalierbar (z. B. `75 %` = `36 mm`) → anschließend unter **⚙ → Würfelgröße (mm)** denselben Wert eintragen

---

## Koordinaten-Konvention (CAD-Rechtssystem, Z-up)

Mit der **Bohrung nach unten (`Z = 0`)** und der **3 mm Fase unten rechts**:

- **`+X` = Rechts** (Orientierungsfase)
- **`-Y` = Vorne** (zum Betrachter, `Azimut = 0°`)
- **`+Y` = Hinten** (`Azimut = ±180°`)
- **`+Z` = Oben** (`Elevation = +90°`)

| Flächen-Offset | Fläche | Richtung |
| :---: | :--- | :--- |
| `+0` | Oben | `+Z` (`+X` zeigt zur Fase) |
| `+1` | Vorne | `-Y` (`Azimut 0°`) |
| `+2` | Rechts | `+X` (`Azimut +90°`, Seite mit Fase) |
| `+3` | Hinten | `+Y` (`Azimut ±180°`) |
| `+4` | Links | `-X` (`Azimut -90°`) |

**Kugelkoordinaten der Kamera (relativ zum Würfel):**
- **`angle_azimuth`** = Orbit um `Z` (`0°` = vorne `-Y`, `+90°` = rechts `+X`, `-90°` = links `-X`)
- **`angle_elevation`** = Höhenwinkel über der Horizontalen (`0°` = waagerecht, `+90°` = senkrecht von oben `+Z`)

> **Tipp für maximale Genauigkeit:** Möglichst **2–3 Würfelflächen** gleichzeitig im Bild erfassen, `1×`-Hauptkamera nutzen und **⏺ Capture** (1 s Vorlauf + 3 s Mittelung) verwenden. Unter **⚙** die passende 35mm-Äquivalent-Brennweite einstellen (iPhone 14–16: `24 mm`, ältere iPhones: `26 mm`).

---

## Beispiel-Messbericht (`.txt`-Export)

```text
[Marker 1] (IDs: 0, 1, 2 · Ø aus 17/19 Samples (Ausreißer gefiltert))
  Sichtbare Flächen:  ID 0 (Oben (+Z)), ID 1 (Vorne (-Y)), ID 2 (Rechts (+X, Fase))
  >>> Kugelkoordinaten (Kamera relativ zum Würfel):
      angle_azimuth   = 32.45 deg  (±0.18 deg)
      angle_elevation = 24.80 deg  (±0.14 deg)
      pivot_z         = 0 mm
  Abstand Kamera:     41.20 cm (412.0 mm ±1.4 mm)
  Genauigkeit (RMS):  1.62 px

[Marker 1  --->  Marker 2] (Ø aus 17 Samples)
  3D-Abstand:             142.50 mm (±0.85 mm) | 14.25 cm
  Versatz B in A (mm):    dX=+138.20, dY=+31.40, dZ=-14.80
  Flächenwinkel (+Z/+Z):  18.40 deg
```

---

## Projektstruktur

```text
.
├── .github/workflows/deploy-pages.yml   # CI-Validierung & GitHub-Pages-Deployment
├── icons/                               # iOS Apple-Touch-Icon & PWA-App-Icons (PNG)
├── models/                              # 3D-Messwürfel (3MF, STEP, SC)
│   ├── messwuerfel-alle-3.3mf
│   ├── messwuerfel-1.{3mf,step,sc}
│   ├── messwuerfel-2.{3mf,step,sc}
│   └── messwuerfel-3.{3mf,step,sc}
├── index.html                           # Mobile-First Web-App (OpenCV.js)
├── manifest.webmanifest                 # PWA-Manifest (Add to Home Screen)
├── sw.js                                # Offline-Service-Worker (App + OpenCV.js Cache)
├── start_live_server.sh                 # Lokaler HTTPS-Server fürs WLAN
├── LICENSE                              # MIT-Lizenz
└── README.md
```

---

## Lizenz & Danksagung

Veröffentlicht unter der [MIT-Lizenz](LICENSE).

- Nutzt [OpenCV.js](https://docs.opencv.org/) (Apache-2.0-Lizenz) und das ArUco-Dictionary `DICT_4X4_50`.
