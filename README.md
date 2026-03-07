# Impromptu

A web app for practicing impromptu speaking, inspired by Toastmasters Table Topics.

![Impromptu Screenshot](assets/screenshot.png)

## How It Works

1. **Get a random topic** from 520+ curated prompts
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

520+ topics across 8 categories: General, Philosophical, Funny, Hypothetical, Personal, Opinion, Professional, Creative.

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
  js/topics.js        520 curated topics
  assets/favicon.svg  Microphone icon
```

## Local Development

Open `index.html` directly in a browser, or serve locally:

```bash
python -m http.server 8080
```

## Deploy

Push to GitHub and enable GitHub Pages from the repository settings (source: root `/`).

## License

MIT
