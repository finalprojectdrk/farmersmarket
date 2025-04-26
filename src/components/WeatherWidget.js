import React, { useState, useEffect } from "react";
import "./WeatherWidget.css";

const WeatherWidget = () => {
  const [location, setLocation] = useState("Chennai"); // Default location
  const [search, setSearch] = useState(""); // User input for search
  const [weather, setWeather] = useState(null);
  const API_KEY = "2ab607c6bd2d472eac8e508b8d6f78e4"; // Replace with your API key

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${API_KEY}`
        );
        if (!response.ok) {
          throw new Error("Weather data not found");
        }
        const data = await response.json();
        setWeather(data);
      } catch (error) {
        console.error("Error fetching weather data:", error);
        setWeather(null); // Reset weather data on error
      }
    };
    fetchWeather();
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim() !== "") {
      setLocation(search);
      setSearch(""); // Clear the search input after updating location
    }
  };

  return (
    <div className="weather-widget">
      <form onSubmit={handleSearch} className="weather-search">
        <input
          type="text"
          placeholder="Enter location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">🔍 Search</button>
      </form>

      {weather ? (
        <div className="weather-info">
          <h3>🌤️ {weather.name} Weather</h3>
          <p>🌡️ Temperature: {weather.main.temp}°C</p>
          <p>🌬
