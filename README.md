# Weather App

A weather website built with HTML, CSS and JavaScript. It has the same functionality as `Weather App.py`:

1. You type in a city.
2. The [Open-Meteo geocoding API](https://open-meteo.com/) finds its latitude/longitude.
3. The current temperature, humidity, wind speed and weather conditions are displayed, along with the time the data was last updated.
4. If the city isn't found, it shows **Invalid city**.

**New:** the page background changes to match the weather — sunny skies, drifting clouds, falling rain, snow, lightning flashes for thunderstorms, and a starry night sky when it's night-time at that location.

## Run it locally

No build step needed. From this folder run:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

(Or just double-click `index.html` — it works straight from the file too.)

## Host it for free with GitHub Pages

1. Merge this branch into `main`.
2. On GitHub go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", pick `main` and the `/ (root)` folder, then save.
4. After about a minute your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page structure: search bar, weather card, background layers |
| `style.css` | Styling, weather-themed backgrounds and animations |
| `script.js` | Fetches the weather from Open-Meteo and updates the page |
| `Weather App.py` | The original terminal version (unchanged) |
