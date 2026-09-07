# Impromptu

A web app for practicing impromptu speaking, inspired by Toastmasters Table Topics.

![Impromptu Screenshot](assets/screenshot.png)

## How It Works

1. **Get a random topic** from 610 curated prompts
2. **Prepare your thoughts** for 1 minute with a guided speech framework
3. **Give your speech** for 1 minute with a countdown timer

## Features

- **3 speech frameworks**: Story Arc (H-D-E-C), PREP (P-R-E-P), STAR (S-T-A-R)
- **Framework guide**: Built-in help page explaining each framework with examples
- **Smart topic selection**: Filter by category and difficulty, tracks used topics to avoid repeats
- **Accurate timer**: `performance.now()` based timing that stays accurate even when tab is backgrounded
- **Responsive**: Mobile-first design that works on all screen sizes
- **No dependencies**: Pure HTML/CSS/JS, no frameworks, no build step

## Categories

The original 520 topics remain across General, Philosophical, Funny, Hypothetical, Personal, Opinion, Professional, and Creative. Present, Past, and Future add 30 tense-practice questions each in the same category dropdown. The live design, frameworks, and one-minute timers are unchanged.

## Tech Stack

- Vanilla HTML/CSS/JS
- Google Fonts (DM Serif Display, Inter)
- CSS animations and SVG circular timer
- localStorage for preferences and topic tracking
- Microsoft Clarity for analytics

## File Structure

```
impromptu/
  index.html          Single-page app shell
  css/style.css       Design system, layout, animations
  js/app.js           State machine, timer, controls
  js/topics.js        610 curated topics, including 90 tense questions
  assets/favicon.svg  Microphone icon
```

## Local Development

Open `index.html` directly in a browser, or serve locally:

```bash
python -m http.server 8080
```

Keep the `v` token on the stylesheet and both script URLs in `index.html` in sync, and bump it when changing app code or questions. This prevents an updated category menu from using an older cached question list. A missing question list now shows a recovery message instead of entering a blank topic screen; unavailable browser storage uses in-tab history without blocking practice.

## Deploy

GitHub Pages publishes the repository root from `master` at https://datal3x.github.io/impromptu/. Release changes only after owner approval, an independent review, and browser verification. Deploy the HTML, versioned script references, and matching question data together; verify the live page after the Pages build completes. Creator replies are drafted separately and are not posted automatically.

## License

MIT
