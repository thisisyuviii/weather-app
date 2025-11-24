// 👉 IMPORTANT: Put your OpenWeatherMap API key here
const API_KEY = "0a6c1ad907eaefe6cfffb445c1582c83";

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const messageEl = document.getElementById("message");
const loaderEl = document.getElementById("loader");
const weatherCard = document.getElementById("weatherCard");
const forecastSection = document.getElementById("forecastSection");
const forecastList = document.getElementById("forecastList");

const cityNameEl = document.getElementById("cityName");
const countryEl = document.getElementById("country");
const tempEl = document.getElementById("temperature");
const iconEl = document.getElementById("weatherIcon");
const descEl = document.getElementById("description");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

function showMessage(text, type = "info") {
  messageEl.textContent = text;
  messageEl.className = "message " + type;
}

function setLoading(isLoading) {
  loaderEl.style.display = isLoading ? "block" : "none";
  searchBtn.disabled = isLoading;
}

async function getWeather(city) {
  if (!city) {
    showMessage("Please enter a city name.", "error");
    return;
  }

  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    showMessage("Please add your OpenWeatherMap API key in script.js.", "error");
    return;
  }

  showMessage("Loading weather data...", "info");
  setLoading(true);
  weatherCard.classList.remove("visible");
  forecastSection.classList.remove("visible");

  try {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric`;

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
    ]);

    if (!currentRes.ok) {
      if (currentRes.status === 404) {
        throw new Error("City not found. Please check the spelling.");
      } else {
        throw new Error("Unable to fetch weather data right now.");
      }
    }

    if (!forecastRes.ok) {
      throw new Error("Unable to fetch forecast data right now.");
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    updateCurrentWeather(currentData);
    updateForecast(forecastData);

    showMessage("");
  } catch (error) {
    console.error(error);
    weatherCard.classList.remove("visible");
    forecastSection.classList.remove("visible");
    showMessage(error.message || "Something went wrong.", "error");
  } finally {
    setLoading(false);
  }
}

function updateCurrentWeather(data) {
  const temperature = Math.round(data.main.temp);
  const description = data.weather[0].description;
  const iconCode = data.weather[0].icon;

  cityNameEl.textContent = data.name;
  countryEl.textContent = data.sys.country ? `• ${data.sys.country}` : "";
  tempEl.textContent = `${temperature}°C`;
  descEl.textContent = description;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${data.wind.speed} m/s`;
  iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  iconEl.alt = description;

  weatherCard.classList.add("visible");
}

function updateForecast(data) {
  const list = data.list || [];

  // Group by date (YYYY-MM-DD)
  const daysMap = new Map();

  list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

    // Pick one entry per day - prefer times around 12:00
    if (!daysMap.has(dateKey)) {
      daysMap.set(dateKey, item);
    } else {
      const existing = daysMap.get(dateKey);
      const existingHour = new Date(existing.dt * 1000).getUTCHours();
      const currentHour = date.getUTCHours();
      if (Math.abs(currentHour - 12) < Math.abs(existingHour - 12)) {
        daysMap.set(dateKey, item);
      }
    }
  });

  // Convert to array and sort by date
  const daysArray = Array.from(daysMap.entries())
    .map(([dateKey, item]) => ({ dateKey, item }))
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
    .slice(0, 5); // take first 5 days

  forecastList.innerHTML = "";

  daysArray.forEach(({ dateKey, item }, index) => {
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
    const dateLabel = date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
    const temp = Math.round(item.main.temp);
    const desc = item.weather[0].description;
    const icon = item.weather[0].icon;

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.style.animationDelay = `${index * 0.07}s`;

    card.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <div class="forecast-date">${dateLabel}</div>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" />
      <div class="forecast-temp">${temp}°C</div>
      <div class="forecast-desc">${desc}</div>
    `;

    forecastList.appendChild(card);
  });

  if (daysArray.length > 0) {
    forecastSection.classList.add("visible");
  } else {
    forecastSection.classList.remove("visible");
  }
}

// Event Listeners
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  getWeather(city);
});

cityInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    const city = cityInput.value.trim();
    getWeather(city);
  }
});
