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
const optionsEl = document.getElementById("options");
const optionsListEl = document.getElementById("options-list");

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

const THEMES = ["default", "clear", "partly-cloudy", "overcast", "fog", "rain", "snow", "thunder", "night", "night-cloudy"];

// Resolves the final theme, swapping day skies for night ones after dark
function themeFor(current) {
  const codeInfo = WEATHER_CODES[current.weather_code] || {
    description: "Unknown conditions",
    emoji: "🌡️",
    theme: "default",
  };
  let theme = codeInfo.theme;
  if (current.is_day === 0) {
    if (theme === "clear") theme = "night";
    else if (theme === "partly-cloudy" || theme === "overcast") theme = "night-cloudy";
  }
  return { codeInfo, theme };
}

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

// Builds a readable "State, Country" line for a geocoding result
function placeRegion(place) {
  return [place.admin1, place.country].filter(Boolean).join(", ");
}

// Reuses the same three cloud elements and animation classes as the full sky.
function createPreviewClouds() {
  const clouds = document.createElement("span");
  clouds.className = "option-weather-clouds";
  clouds.setAttribute("aria-hidden", "true");

  ["cloud-1", "cloud-2", "cloud-3"].forEach((cloudClass) => {
    const cloud = document.createElement("span");
    cloud.className = "cloud " + cloudClass;
    clouds.appendChild(cloud);
  });

  return clouds;
}

// Shows a clickable list of places when several share the searched name,
// each previewing its current weather (background, temperature, description)
async function showOptions(places) {
  // One batched request fetches the current weather for every candidate
  const weatherResponse = await fetch(
    "https://api.open-meteo.com/v1/forecast?" +
      "latitude=" + places.map((p) => p.latitude).join(",") +
      "&longitude=" + places.map((p) => p.longitude).join(",") +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day"
  );
  const data = await weatherResponse.json();
  const weathers = Array.isArray(data) ? data : [data];

  optionsListEl.innerHTML = "";
  places.forEach((place, i) => {
    const weather = weathers[i];
    const { codeInfo, theme } = themeFor(weather.current);

    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option opt-" + theme;

    const nameSpan = document.createElement("span");
    nameSpan.className = "option-name";
    nameSpan.textContent = place.name;

    const regionSpan = document.createElement("span");
    regionSpan.className = "option-region";
    regionSpan.textContent = placeRegion(place);

    const descSpan = document.createElement("span");
    descSpan.className = "option-desc";
    descSpan.textContent = codeInfo.description;

    const tempSpan = document.createElement("span");
    tempSpan.className = "option-temp";
    tempSpan.textContent = Math.round(weather.current.temperature_2m) + "°";

    button.append(nameSpan, regionSpan, descSpan, tempSpan, createPreviewClouds());
    button.addEventListener("click", () => {
      hide(optionsEl);
      displayWeather(place, weather);
    });
    li.appendChild(button);
    optionsListEl.appendChild(li);
  });
  show(optionsEl);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = input.value.trim().toLowerCase();
  if (!city) return;

  hide(errorEl);
  hide(card);
  hide(optionsEl);
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

    // The API fuzzy-matches (e.g. "reykjavik" also returns "Reykjavik
    // Airport"), so only places whose name exactly matches the search count
    // as "the same name". Duplicate name/state/country rows are merged.
    const exactMatches = [];
    const seen = new Set();
    for (const place of geoData.results) {
      if (place.name.toLowerCase() !== city) continue;
      const key = place.name + "|" + (place.admin1 || "") + "|" + place.country;
      if (seen.has(key)) continue;
      seen.add(key);
      exactMatches.push(place);
    }

    // Several distinct places share this name -> let the user pick.
    // Exactly one (or no exact match) -> go straight to the best result.
    if (exactMatches.length > 1) {
      await showOptions(exactMatches);
      hide(loadingEl);
      return;
    }

    fetchWeather(exactMatches[0] || geoData.results[0]);
  } catch (err) {
    hide(loadingEl);
    errorEl.textContent = "Something went wrong. Please try again.";
    show(errorEl);
  }
});

async function fetchWeather(place) {
  hide(errorEl);
  hide(card);
  show(loadingEl);

  try {
    // Step 2: fetch the current weather (same variables as the Python version,
    // plus is_day so night-time gets a night sky background)
    const weatherResponse = await fetch(
      "https://api.open-meteo.com/v1/forecast?" +
        "latitude=" + place.latitude +
        "&longitude=" + place.longitude +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day"
    );
    const weather = await weatherResponse.json();
    displayWeather(place, weather);
  } catch (err) {
    hide(loadingEl);
    errorEl.textContent = "Something went wrong. Please try again.";
    show(errorEl);
  }
}

// Step 3: display everything
function displayWeather(place, weather) {
  const current = weather.current;
  const units = weather.current_units;
  const { codeInfo, theme } = themeFor(current);

  cityNameEl.textContent = place.name;
  emojiEl.textContent = theme === "night" ? "🌙" : codeInfo.emoji;
  temperatureEl.textContent = current.temperature_2m + units.temperature_2m;
  descriptionEl.textContent = codeInfo.description;
  humidityEl.textContent = current.relative_humidity_2m + units.relative_humidity_2m;
  windEl.textContent = current.wind_speed_10m + " " + units.wind_speed_10m;
  // current.time looks like "2026-07-14T13:30" -> keep only the time part,
  // same as the Python version's time[11:]
  updatedEl.textContent = "Data last updated at " + current.time.slice(11);

  setTheme(theme);
  hide(loadingEl);
  show(card);
}
