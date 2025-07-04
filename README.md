# 🥁 Drum Machine (Web Audio API Experiment)

This project is an experimental drum machine and step sequencer built with React and TypeScript, designed to explore the capabilities of the Web Audio API's `AudioContext` for real-time audio synthesis, sequencing, and effects in the browser.

## ✨ Features

- 🎛️ **Step Sequencer UI**: 16-step grid for programming drum patterns interactively.
- 🥁 **Sample-based Drum Tracks**: Built-in drum sounds (kick, snare, hat, clap) loaded as audio samples.
- ⏱️ **Real-time Playback**: Accurate timing and scheduling using a custom sequencer clock implemented with AudioWorklet and Comlink for low-latency, sample-accurate step events.
- 🎚️ **Adjustable Parameters**:
  - ⏩ **BPM**: Change tempo in real time.
  - 🎷 **Swing**: Add groove by shifting off-beat steps.
  - 🧪 *(Experimental)*: Humanization controls for velocity and timing (commented in code).
- 🎧 **Audio Effects**: Built-in echo and convolution reverb (with impulse response sample) applied to the output chain.
- 🔄 **Persistent Audio Pipeline**: Audio nodes and effects are managed efficiently for smooth parameter changes and low CPU usage.
- ⌨️ **Keyboard Control**: Spacebar toggles playback (unless a text input is focused).
- 🖥️ **Modern UI**: Responsive, styled with CSS modules for a vintage drum machine look.

## 🛠️ Technical Highlights

- 🎵 **Web Audio API**: Uses `AudioContext`, `AudioBufferSourceNode`, and custom AudioWorklet processors for precise timing.
- 🔗 **Comlink**: Bridges main thread and AudioWorklet for event-driven step callbacks.
- ⚛️ **React**: Functional components and hooks for UI and state management.
- 🦺 **TypeScript**: Strongly typed audio and sequencer logic.
- ⚡ **Vite**: Fast development and build tooling.
- 🧪 **Storybook & Vitest**: For component development and testing.

## 🚀 Getting Started

### 📦 Prerequisites
- 🟢 Node.js (18+ recommended)
- 📦 pnpm (or npm/yarn)

### ▶️ Install & Run
```bash
pnpm install
pnpm start
```
Then open [http://localhost:5005](http://localhost:5005) in your browser.

### 🎹 Usage
- 🖱️ Click steps in the grid to activate/deactivate drum hits.
- 🎚️ Adjust BPM and swing with the knobs.
- ▶️ Press the play button or use the spacebar to start/stop playback.
- ⏹️ Use the stop button to reset to the beginning.

## 🗂️ Project Structure
- `src/DrumMachine.tsx` — Main UI and sequencer logic
- `src/audio/` — Audio engine, effects, and sequencing
- `src/components/` — UI components (knobs, buttons, sequencer grid)
- `src/audio/getSequencerClock/` — Custom AudioWorklet-based sequencer clock

## 🧑‍💻 Code Conventions & Experiments
- 🏭 Factory functions over classes for audio pipeline management
- 📡 Event-driven state via custom event bus
- 🔄 Real-time parameter updates (BPM, swing) without audio glitches
- 🧩 Modular, testable code with strong typing

## 🙏 Credits
- 🥁 Drum samples and impulse responses are included in `src/audio/assets/audio/`.
- 🛠️ Built with [React](https://react.dev/), [Vite](https://vitejs.dev/), and [Comlink](https://github.com/GoogleChromeLabs/comlink).

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

For more details, see the code and comments throughout the `src/audio/` and `src/DrumMachine.tsx` files.