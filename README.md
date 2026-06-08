# FIAE Tutor Desktop

Desktop application for **IHK Fachinformatiker für Anwendungsentwicklung (FIAE)** exam preparation, algorithm training, and structured learning.

Built with **React, TypeScript, Tauri and Vite**.

---

## Overview

FIAE Tutor Desktop is a desktop learning platform designed for students preparing for the German IHK FIAE exams.

The application combines exam preparation, algorithm training, topic management, and structured learning content in a single desktop application.

A special focus of the project is bilingual learning support:

* 🇩🇪 German explanations for exam preparation
* 🇮🇷 Persian (Farsi/Dari) explanations for better understanding
* Side-by-side learning content
* Exam-oriented exercises and examples

The goal is to make FIAE exam preparation easier for learners with an international background while maintaining a strong focus on German IHK requirements.


---

## Features

### Topic Registry

* Structured topic management
* Categorized learning content
* Search and filtering support
* Topic metadata validation

### Algorithm Training

* Practice exercises
* Exam-oriented preparation
* Interactive learning workflow
* Progress tracking

### Exam Bank

* JSON-based exam question storage
* Organized AP2 exam content
* Validation tools
* HTML export generation

### Export System

* HTML export
* Printable learning material
* Automated content generation

### Desktop Experience

* Fast native desktop application
* Cross-platform architecture
* Lightweight deployment using Tauri

### Bilingual Learning System

* German and Persian learning content
* Exam-oriented explanations
* Simplified algorithm examples
* Technical terminology in both languages
* Support for FIAE exam preparation

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite

### Desktop

* Tauri
* Rust

### Development Tools

* Git
* GitHub Actions
* VS Code

---

## Project Structure

```text
src/                 React application
src-tauri/           Tauri backend
data/                Exam bank data
exam_tools/          Conversion and validation tools
assets/              Images and icons
public/              Public resources
docs/                Documentation
```

---

## Screenshots

### Dashboard

(Add screenshot here)

### Topic Registry

(Add screenshot here)

### Practice Mode

(Add screenshot here)

### Export Page

(Add screenshot here)

---

## Installation

```bash
git clone https://github.com/aryanbarak/fiae-tutor-desktop.git

cd fiae-tutor-desktop

npm install

npm run tauri dev
```

---

## Roadmap

### Completed

* Topic Registry
* Algorithm Training
* Export System
* Exam Bank Structure
* Desktop Packaging

### Planned

* Additional AP2 exam content
* Advanced search
* Learning statistics
* Progress tracking
* AI-assisted explanations

---

## Author

**Aryan Barakzai**

Fachinformatiker für Anwendungsentwicklung (IHK)

* GitHub: https://github.com/aryanbarak
* Portfolio: https://barakzai.cloud

---

## License

This project is provided for educational purposes.
