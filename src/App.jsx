import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [search, setSearch] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch weather data
  const getWeather = async (cityName) => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Find city coordinates
      const locationResponse = await fetch(
        'https://geocoding-api.open-meteo.com/v1/search?name=' +
          encodeURIComponent(cityName) +
          '&count=1&language=en&format=json'
      );

      if (!locationResponse.ok) {
        throw new Error('Unable to find location.');
      }

      const locationData = await locationResponse.json();

      if (!locationData.results || locationData.results.length === 0) {
        throw new Error('City not found. Try another city.');
      }

      const location = locationData.results[0];

      // Step 2: Fetch current weather and 5-day forecast
      const weatherResponse = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=' +
          location.latitude +
          '&longitude=' +
          location.longitude +
          '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m' +
          '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
          '&forecast_days=5&timezone=auto'
      );

      if (!weatherResponse.ok) {
        throw new Error('Unable to fetch weather.');
      }

      const weatherData = await weatherResponse.json();

      if (!weatherData.current) {
        throw new Error('Weather information is unavailable.');
      }

      // Step 3: Store weather information
      const forecast = weatherData.daily?.time
        ? weatherData.daily.time.map((date, index) => ({
            date: date,
            maxTemp: weatherData.daily.temperature_2m_max[index],
            minTemp: weatherData.daily.temperature_2m_min[index],
            code: weatherData.daily.weather_code[index]
          }))
        : [];

      setWeather({
        city: location.name,
        country: location.country,
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        wind: weatherData.current.wind_speed_10m,
        code: weatherData.current.weather_code,
        isDay: weatherData.current.is_day,
        forecast: forecast
      });

    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setWeather(null);

    } finally {
      setLoading(false);
    }
  };

  // Load Chennai weather when the page opens
  useEffect(() => {
    getWeather('Chennai');
  }, []);

  // Weather conditions
  const getCondition = (code) => {
    if (code === 0) return 'Clear Sky';
    if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 66, 67].includes(code)) return 'Rainy';
    if ([71, 73, 75, 77].includes(code)) return 'Snowy';
    if ([80, 81, 82].includes(code)) return 'Rain Showers';
    if ([85, 86].includes(code)) return 'Snow Showers';
    if ([95, 96, 99].includes(code)) return 'Thunderstorm';

    return 'Weather Unavailable';
  };

  // Weather icons
  const getIcon = (code, isDay = 1) => {
    if (code === 0) return isDay ? '☀️' : '🌙';
    if ([1, 2, 3].includes(code)) return '🌤️';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';

    return '🌥️';
  };

  // Search city
  const handleSearch = () => {
    if (search.trim() !== '') {
      getWeather(search.trim());
      setSearch('');
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="app">
      <div className="weather-card">

        <h1>🌦️ SkyCast</h1>

        <p className="subtitle">
          Your Personal Weather Forecast
        </p>

        {/* Search Box */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />

          <button onClick={handleSearch} disabled={loading}>
            Search
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <p className="status">Loading weather...</p>
        )}

        {/* Error */}
        {error && (
          <p className="error">{error}</p>
        )}

        {/* Weather Information */}
        {weather && !loading && (
          <>

            <div className="weather-info">

              <h2>
                {weather.city}, {weather.country}
              </h2>

              <div className="weather-icon">
                {getIcon(weather.code, weather.isDay)}
              </div>

              <h1 className="temperature">
                {weather.temperature}°C
              </h1>

              <p>
                {getCondition(weather.code)}
              </p>

            </div>

            {/* Humidity and Wind */}
            <div className="weather-details">

              <div className="detail">
                <h3>💧 Humidity</h3>
                <p>{weather.humidity}%</p>
              </div>

              <div className="detail">
                <h3>💨 Wind Speed</h3>
                <p>{weather.wind} km/h</p>
              </div>

            </div>

            {/* Five Day Forecast */}
            <div className="forecast-section">

              <h2>5-Day Forecast</h2>

              <div className="forecast-container">

                {(weather.forecast || []).map((day, index) => (

                  <div className="forecast-card" key={day.date}>

                    <h3>
                      {index === 0 ? 'Today' : formatDate(day.date)}
                    </h3>

                    <div className="forecast-icon">
                      {getIcon(day.code)}
                    </div>

                    <p className="forecast-condition">
                      {getCondition(day.code)}
                    </p>

                    <p className="forecast-temp">
                      {Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°
                    </p>

                  </div>

                ))}

              </div>

              {weather.forecast.length === 0 && (
                <p className="status">
                  Forecast information unavailable.
                </p>
              )}

            </div>

          </>
        )}

      </div>
    </div>
  );
}

export default App;