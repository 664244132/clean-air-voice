# 🎨 Design Spec: Clean Air Voice Index Redesign & Modular Refactoring

**Date**: 2026-08-20  
**Project**: Clean Air Voice Assistant  
**Status**: Approved  

---

## 🎯 1. Overview & Goals

The objective of this task is to modernize the user interface of the **Clean Air Voice Assistant** by adapting the dark, futuristic design from the `index/` workspace (`index/src/app/App.tsx`), while modularizing the frontend architecture and refactoring all code according to project standards specified in the `markdowns/` folder (`REFACTORCODE.md`, `HTMLCodingGuide.md`, `CSSCodingGuide.md`, `TailwindCodingGuide.md`, `DeMorgansLaws.md`, `DEBUG.md`).

---

## 🏗️ 2. Frontend Architecture (Modular Structure)

In accordance with `markdowns/REFACTORCODE.md`, the client-side code in `public/` will be structured into single-responsibility ES modules:

```text
public/
├── index.html            # Semantic HTML5 document with full accessibility (a11y) support
├── css/
│   └── style.css         # Modern CSS design tokens, custom font utilities, and Tailwind-inspired visual styles
├── js/
│   ├── audio-helper.js   # Audio DSP, PCM16 conversion, Base64 encoding, audio queue playback, and 2D canvas frequency visualizer
│   ├── gemini-client.js  # Ephemeral Token fetching, Gemini Live WebSocket API connector (@google/genai), and tool handler
│   ├── ui-controller.js  # DOM binding, UI state management, transcript rendering, and video player modal control
│   └── app.js            # Main application entry point orchestrating all modules
└── clean-air-for-life.mp4 # Video asset for the Clean Air campaign
```

---

## 🎨 3. UI/UX Specifications

### 3.1 Color Palette & Theme Tokens
- **Background**: `#09090b` (Zinc 950) with subtle radial gradient overlays.
- **Borders & Dividers**: `rgba(255, 255, 255, 0.08)` / `#27272a` (Zinc 800).
- **Primary Accents**:
  - Cyan: `#06b6d4` / `#22d3ee` (Live recording / connection glow).
  - Amber: `#fbbf24` (Paused / holding / waiting state).
  - Red: `#f87171` (Active recording indicator).
- **Typography**:
  - Headings & Labels: Uppercase, tracking wide (`tracking-[0.28em]`).
  - Monospace Data / Timers: Tabular numbers font family.

### 3.2 Key Layout Components
1. **Header (`<header>`)**:
   - Status indicator dot (cyan pulse when connected).
   - Project title: **CLEAN AIR VOICE**.
   - Protocol metadata: `GEMINI LIVE API · WEB AUDIO`.
2. **Main Control Area (`<main>`)**:
   - **Status Badge**: Real-time feedback ("Standby", "Connecting...", "Listening for 'ไอที'", "Wake Word Detected", "Speaking...", "Error").
   - **Mic Action Button**:
     - Circular 136px action button with multi-ring pulse animations (`animate-ping`) when active.
     - Mic icon in standby state; stop icon when running.
   - **Transcript Box**:
     - Displays detected input speech (`ได้ยิน: ...`) and AI status messages.
3. **Real-time Audio Visualizer Canvas (`<canvas>`)**:
   - 72-bar frequency visualizer driven by `AnalyserNode` frequency byte data.
   - Dynamic height gradient and drop-shadow glow (Cyan blend).
   - Frequency axis markers: 20Hz, 250Hz, 1kHz, 4kHz, 20kHz.
4. **Media Video Player Container (`<video>`)**:
   - Responsive video card with clean rounded corners (`rounded-2xl`).
   - Displays automatically when Gemini Live API executes the `open_clean_air_video` tool.
   - Automatically hides and resets state back to wake-word detection ("ไอที") when video playback finishes.

---

## 🔒 4. Code Standards & Best Practices

1. **De Morgan's Laws & Operator Inversion**:
   - No `!(A && B)` -> converted to `!A || !B`.
   - No `!(A || B)` -> converted to `!A && !B`.
   - Invert comparison operators explicitly (e.g. `==` -> `!=`, `<` -> `>=`).
2. **Early Return & Guard Clauses**:
   - Prevent deep `if` nesting. Return early on error/inactive conditions.
3. **Security**:
   - Client fetches Ephemeral Token via `GET /api/token` from `server.js`.
   - `GEMINI_API_KEY` remains on the server.
4. **Memory & Audio Management**:
   - Explicit cleanup of `MediaStream` tracks (`track.stop()`), `AudioContext` nodes (`disconnect()`), and `requestAnimationFrame` IDs when stopping.
5. **Accessibility (a11y)**:
   - Use semantic tags (`<header>`, `<main>`, `<section>`, `<button>`).
   - Use `aria-live="polite"` for transcript updates and `sr-only` for accessibility screen readers.

---

## 🧪 5. Verification & Testing Plan

1. **Static Code Review**: Check code against `markdowns/DeMorgansLaws.md` and `markdowns/REFACTORCODE.md`.
2. **Server & Token Check**: Verify `node server.js` serves `/api/token` properly.
3. **Frontend UI Test**: Verify page rendering, frequency canvas animation loop, and microphone state transitions.
4. **Gemini Live Integration**: Test wake-word "ไอที" -> AI response -> command "Clean Air for Life" -> video playback -> auto-reset.
