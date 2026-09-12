# CodeWhisperer

**CodeWhisperer** is a VS Code extension that watches for errors in your code and explains them in plain English, not just "here's the fix," but what went wrong, why it happened, and a targeted correction, so you actually understand the bug instead of just patching over it.

## How It Works

When you run a file through CodeWhisperer and it crashes, here's what happens behind the scenes:

1. **Detect** – CodeWhisperer runs your file and watches for errors.
2. **Extract** – If your code crashes, it reads the full source file so it has complete context, not just the error message.
3. **Explain** – It sends the error and your code to Claude (Anthropic's AI), asking for a plain English breakdown: what broke, why, and how to fix it, with exact line numbers cited.
4. **Display** – The explanation opens in a panel next to your code. The line that crashed is highlighted in red, the explanation is in blue, and the suggested fix is in green, labeled with exactly which lines it replaces.

## Prerequisites

Before you begin, you'll need:

- [Node.js](https://nodejs.org) installed (includes npm)
- [Visual Studio Code](https://code.visualstudio.com)
- An **Anthropic API key** with billing enabled, from [console.anthropic.com](https://console.anthropic.com). This is separate from a Claude.ai subscription. CodeWhisperer works like any tool built on a paid AI API (similar to tools built on OpenAI's API): you bring your own key, and usage is billed to your own account based on how much you use it. Costs for typical use (explaining a handful of errors) are small, but the more you run CodeWhisperer, the more you should expect to spend, since each error explanation is a separate API call.

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ShawnKerzner/Code-Whisperer.git
   cd Code-Whisperer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Add your API key.** Create a file named `.env` in the project root with the following content:
   ```
   ANTHROPIC_API_KEY=your-actual-key-here
   ```
   Replace `your-actual-key-here` with your real Anthropic API key.

4. **Compile the extension:**
   ```bash
   npm run compile
   ```

5. **Run it:** Open the project folder in VS Code, then press `F5`. This launches a new "Extension Development Host" window with CodeWhisperer loaded.

## Usage

1. In the Extension Development Host window, open any JavaScript file (or create a test file with a deliberate bug).
2. With that file focused, open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run **`CodeWhisperer: Run File`**.
4. If your code runs cleanly, you'll see a confirmation in the Debug Console. If it crashes, a panel will open beside your editor showing the crash line highlighted, an explanation of what went wrong and why, and a suggested fix.

## Why `.env` instead of VS Code Settings

Many polished VS Code extensions let you enter an API key through the Settings UI instead of a `.env` file, since it's a friendlier setup experience. We considered this approach and built it, but reverted to `.env` for this release, for two reasons:

1. CodeWhisperer's intended audience is developers, who are already comfortable creating a `.env` file and are used to this pattern from other developer tools.
2. Testing a settings-based key flow properly requires Anthropic API billing to be active on the testing account, and we wanted to avoid claiming a flow works when we hadn't personally verified it end to end.

A settings-based key entry is a planned improvement (see Roadmap below).

## Reporting Bugs

CodeWhisperer is new and has really only been tested against a handful of deliberate JavaScript errors, so real-world edge cases are expected. If you run into a bug, please open a [GitHub Issue](https://github.com/ShawnKerzner/Code-Whisperer/issues) on this repo.

To help track it down, please include:
- The code that triggered the error (or a minimal example that reproduces it)
- The full error message CodeWhisperer showed (or the Debug Console output, if the panel didn't appear at all)
- What you expected to happen

Bug reports are welcome, though response times may vary.

## Current Status & Roadmap

**Currently working (Worker Mode):**
- Detects errors when running a JavaScript file through CodeWhisperer
- Sends the full error and source code to Claude for a structured explanation
- Displays a color-coded panel: crash location, explanation, and a targeted fix

**Planned:**
- **Student Mode:** on-demand, full-file, line-by-line plain-English explanation of any file, not just crashed ones
- **Settings-based API key entry**, instead of requiring a `.env` file
- **Packaged `.vsix` release**, so the extension can be installed directly without cloning and compiling
- **VS Code Marketplace publishing**, for one-click install and discoverability
- **Autofix (stretch):** optionally apply a suggested fix on a separate git branch for manual review, never directly on the working branch

**Known limitations:**
- Currently only tested against Node.js/JavaScript stack traces
- Requires the user's own Anthropic API key and billing