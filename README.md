<div align="center">

# Algorithm Studio

**Cross-platform Desktop App for Algorithm & Pseudocode Training**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

*Algorithm training · Pseudocode practice · Desk-check simulations · AP2 exam bank · Bilingual (German / Persian)*

</div>

---

## Overview

Algorithm Studio is an offline-capable cross-platform desktop app for algorithm training, pseudocode practice and IHK FIAE exam preparation. Built with React, TypeScript and Tauri (Rust).

Part of the **SmartFlow** ecosystem · [barakzai.cloud](https://barakzai.cloud)

---

## Screenshots

### Topic Registry & Algorithm Variants
![Topic Registry](screenshots/variants.png)

### Pseudocode Generation
![Pseudocode](screenshots/dashboard.png)

### Desk-Check Simulation (Schreibtischtest)
![Desk Check](screenshots/practice-page.png)

### AP2 Exam Bank
![Exam Bank](screenshots/topic-registry.png)

### PDF Export
![PDF Export](screenshots/export-page.png)

---

## Features

- **Algorithm Tutor** — Bubble Sort, Selection Sort, Insertion Sort with exam variants
- **German Pseudocode** — IHK-style keywords (`FUER`, `BIS`, `WENN`, `AUSGABE`)
- **Schreibtischtest** — step-by-step desk-check trace visualization
- **AP2 Exam Bank** — searchable question bank with difficulty filters and PDF export
- **Bilingual content** — German and Persian (Farsi)
- **Offline-capable** — no internet required
- **Cross-platform** — Windows, macOS, Linux via Tauri

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Desktop runtime | Tauri 2.x (Rust) |
| Styling | Tailwind CSS |
| Export | HTML → PDF generation |
| CI/CD | GitHub Actions |

---

## Getting Started

```bash
git clone https://github.com/aryanbarak/algorithm-studio.git
cd algorithm-studio
npm install

# Run in browser (dev mode)
npm run dev

# Run as desktop app (requires Rust + Tauri CLI)
npm run tauri dev
```

> Tauri requires Rust. See [tauri.app/start](https://tauri.app/start/) for setup.

---

## Project Structure


src/

├── domain/       # Algorithm logic and exam data models

├── views/        # Page-level components

├── components/   # Reusable UI components

└── services/     # PDF export, data loading
src-tauri/

└── src/          # Rust backend
data/

└── exam_bank/    # AP2 exam questions (JSON)

---

## Target Audience

- Fachinformatiker Anwendungsentwicklung (FIAE) candidates
- IHK AP1 / AP2 exam candidates
- German and Persian-speaking IT learners

---

## Author

**Aryan Barakzai** · Fachinformatiker Anwendungsentwicklung (IHK) · Germany

[![Portfolio](https://img.shields.io/badge/Portfolio-barakzai.cloud-DAA520?style=flat)](https://barakzai.cloud)
[![GitHub](https://img.shields.io/badge/GitHub-aryanbarak-181717?style=flat&logo=github)](https://github.com/aryanbarak)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Aryan_Barakzai-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/aryan-barakzai)

---

## License

MIT License — see [LICENSE](./LICENSE) for details.
