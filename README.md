# 🎓 FIAE Tutor Desktop

Desktop learning platform for German FIAE (IHK) exam preparation featuring algorithm training, topic registry, AP2 exam bank, desk-check simulations, PDF export and bilingual (German/Persian) learning content.

Built with React, TypeScript and Tauri.

---

## 📚 Why this project?

This application was created to support candidates preparing for the German IHK FIAE examination.

It provides:

- Algorithm understanding
- Pseudocode practice
- Desk-check simulations
- AP2 exam bank
- Structured exam preparation
- PDF export for learning materials

The content is available in German and Persian to help bilingual learners.

---

## 🚀 Features

- Interactive algorithm training
- Multiple algorithm variants
- German pseudocode generation
- Trace mode for step-by-step learning
- Desk-check (Schreibtischtest) simulation
- PDF export
- AP2 Exam Bank
- German and Persian learning content
- Desktop application built with Tauri
- Topic Registry architecture
- Exam-oriented learning workflow

---

## 🛠 Tech Stack

### Frontend

- React
- TypeScript
- Vite

### Desktop

- Tauri
- Rust

### Tools

- Git
- GitHub Actions

---

## 📸 Screenshots

### Topic Registry & Variants

Each algorithm contains multiple exam-oriented variants used in IHK FIAE examinations.

![Topic Registry](screenshots/variants.png)

---

### Algorithm Pseudocode

Interactive pseudocode generation with multiple algorithm implementations.

![Pseudocode](screenshots/dashboard.png)

---

### Desk Check Simulation

Step-by-step algorithm tracing and exam-style desk-check training.

![Desk Check](screenshots/practice-page.png)

---

### AP2 Exam Bank

Integrated question bank for FIAE AP2 exam preparation.

![Exam Bank](screenshots/topic-registry.png)

---

### PDF Export

Generate printable learning materials and algorithm documentation.

![PDF Export](screenshots/export-page.png)

---

## 🏗 Project Structure

```text
src/
├── domain/
├── views/
├── components/
├── services/

src-tauri/
├── src/
├── icons/

data/
└── exam_bank/

exam_tools/
├── json_to_html.py
└── validate_exam_json.py
```

---

## 🎯 Main Modules

### Algorithm Tutor

- Selection Sort
- Bubble Sort
- Insertion Sort
- Multiple exam variants
- Pseudocode generation

### Schreibtischtest

- Step-by-step execution
- Trace visualization
- Exam preparation workflow

### AP2 Exam Bank

- Question collection
- Categories
- Difficulty filters
- Search functionality
- PDF export

### Export System

- HTML export
- PDF generation
- Printable learning material

---

## 🌍 Languages

Learning content is available in:

- 🇩🇪 German
- 🇮🇷 Persian (Farsi)

---

## 📦 Installation

```bash
git clone https://github.com/aryanbarak/fiae-tutor-desktop.git

cd fiae-tutor-desktop

npm install

npm run dev
```

### Tauri Desktop

```bash
npm run tauri dev
```

---

## 🎓 Target Audience

- FIAE (Fachinformatiker Anwendungsentwicklung) students
- IHK exam candidates
- Self-learners studying algorithms
- German-speaking and Persian-speaking IT learners

---

## 👨‍💻 Author

Aryan Barakzai

- Portfolio: https://barakzai.cloud
- GitHub: https://github.com/aryanbarak
- LinkedIn: https://www.linkedin.com/in/aryan-barakzai

---

## 📄 License

MIT License
