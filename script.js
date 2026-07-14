// Same behaviour as the Python weather app:
//  1. Geocode the city name with the Open-Meteo geocoding API
//  2. Fetch current temperature, humidity, wind speed and weather code
//  3. Show "Invalid city" when the city isn't found
// Plus: the page background changes to match the weather.

const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const errorEl = document.getElementById("error");
const loadingEl = document.getElementById("loading");
const card = document.getElementById("weather-card");

const cityNameEl = document.getElementById("city-name");
const emojiEl = document.getElementById("weather-emoji");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const updatedEl = document.getElementById("updated");

// WMO weather codes -> description, emoji and the background theme class.
// Codes 0-3 match the original Python dictionary; the rest cover every
// other code Open-Meteo can return so the background always fits.
const WEATHER_CODES = {
  0: { description: "Clear skies", emoji: "☀️", theme: "clear" },
  1: { description: "Mainly clear", emoji: "🌤️", theme: "clear" },
  2: { description: "Partly cloudy", emoji: "⛅", theme: "partly-cloudy" },
  3: { description: "Overcast", emoji: "☁️", theme: "overcast" },
  45: { description: "Fog", emoji: "🌫️", theme: "fog" },
  48: { description: "Depositing rime fog", emoji: "🌫️", theme: "fog" },
  51: { description: "Light drizzle", emoji: "🌦️", theme: "rain" },
  53: { description: "Moderate drizzle", emoji: "🌦️", theme: "rain" },
  55: { description: "Dense drizzle", emoji: "🌧️", theme: "rain" },
  56: { description: "Light freezing drizzle", emoji: "🌧️", theme: "rain" },
  57: { description: "Dense freezing drizzle", emoji: "🌧️", theme: "rain" },
  61: { description: "Slight rain", emoji: "🌧️", theme: "rain" },
  63: { description: "Moderate rain", emoji: "🌧️", theme: "rain" },
  65: { description: "Heavy rain", emoji: "🌧️", theme: "rain" },
  66: { description: "Light freezing rain", emoji: "🌧️", theme: "rain" },
  67: { description: "Heavy freezing rain", emoji: "🌧️", theme: "rain" },
  71: { description: "Slight snowfall", emoji: "🌨️", theme: "snow" },
  73: { description: "Moderate snowfall", emoji: "🌨️", theme: "snow" },
  75: { description: "Heavy snowfall", emoji: "❄️", theme: "snow" },
  77: { description: "Snow grains", emoji: "❄️", theme: "snow" },
  80: { description: "Slight rain showers", emoji: "🌦️", theme: "rain" },
  81: { description: "Moderate rain showers", emoji: "🌧️", theme: "rain" },
  82: { description: "Violent rain showers", emoji: "🌧️", theme: "rain" },
  85: { description: "Slight snow showers", emoji: "🌨️", theme: "snow" },
  86: { description: "Heavy snow showers", emoji: "❄️", theme: "snow" },
  95: { description: "Thunderstorm", emoji: "⛈️", theme: "thunder" },
  96: { description: "Thunderstorm with slight hail", emoji: "⛈️", theme: "thunder" },
  99: { description: "Thunderstorm with heavy hail", emoji: "⛈️", theme: "thunder" },
};

const THEMES = ["default", "clear", "partly-cloudy", "overcast", "fog", "rain", "snow", "thunder", "night"];

function setTheme(theme) {
  document.body.classList.remove(...THEMES);
  document.body.classList.add(theme);
}

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = input.value.trim().toLowerCase();
  if (!city) return;

  hide(errorEl);
  hide(card);
  show(loadingEl);

  try {
    // Step 1: geocode the city (same API as the Python version)
    const geoResponse = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city)
    );
    const geoData = await geoResponse.json();

    if (!geoData.results) {
      hide(loadingEl);
      show(errorEl);
      setTheme("default");
      return;
    }

    const place = geoData.results[0];

    // Step 2: fetch the current weather (same variables as the Python version,
    // plus is_day so night-time gets a night sky background)
    const weatherResponse = await fetch(
      "https://api.open-meteo.com/v1/forecast?" +
        "latitude=" + place.latitude +
        "&longitude=" + place.longitude +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day"
    );
    const weather = await weatherResponse.json();
    const current = weather.current;
    const units = weather.current_units;

    const codeInfo = WEATHER_CODES[current.weather_code] || {
      description: "Unknown conditions",
      emoji: "🌡️",
      theme: "default",
    };

    // Step 3: display everything
    cityNameEl.textContent = place.name;
    emojiEl.textContent = current.is_day === 0 && codeInfo.theme === "clear" ? "🌙" : codeInfo.emoji;
    temperatureEl.textContent = current.temperature_2m + units.temperature_2m;
    descriptionEl.textContent = codeInfo.description;
    humidityEl.textContent = current.relative_humidity_2m + units.relative_humidity_2m;
    windEl.textContent = current.wind_speed_10m + " " + units.wind_speed_10m;
    // current.time looks like "2026-07-14T13:30" -> keep only the time part,
    // same as the Python version's time[11:]
    updatedEl.textContent = "Data last updated at " + current.time.slice(11);

    // Night overrides clear/partly-cloudy skies; storms and rain keep their look
    const useNight = current.is_day === 0 && (codeInfo.theme === "clear" || codeInfo.theme === "partly-cloudy");
    setTheme(useNight ? "night" : codeInfo.theme);

    hide(loadingEl);
    show(card);
  } catch (err) {
    hide(loadingEl);
    errorEl.textContent = "Something went wrong. Please try again.";
    show(errorEl);
  }
});
