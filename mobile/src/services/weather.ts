// Weather Service - Mobile API Integration

import api from './api';

export interface WeatherData {
  name: string;
  lat: number;
  lon: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  apparentTemperature: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  precipitationProbability: number;
}

export interface ForecastData {
  cityName: string;
  lat: number;
  lon: number;
  hourly: HourlyForecast[];
}

export const weatherService = {
  // Get current weather for all monitored cities
  async getCurrentWeather(): Promise<WeatherData[]> {
    try {
      const response = await api.get('/weather/current');
      // Backend returns { status: 'success', data: [...] }
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  },

  // Get hourly forecast for a specific city
  async getHourlyForecast(lat: number, lon: number, hours: number = 24): Promise<ForecastData> {
    try {
      const response = await api.get('/weather/forecast', {
        params: { lat, lon, hours }
      });
      // Backend returns { status: 'success', data: {...} }
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  },

  // Get weather icon emoji based on weather code
  getWeatherIcon(code: number): string {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 57) return '🌦️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  },

  // Get weather description from code
  getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
  },

  // Determine if weather is severe
  isSevereWeather(precipitation: number, windSpeed: number, precipProb: number, weatherCode: number): boolean {
    return precipitation > 50 || windSpeed > 50 || precipProb > 70 || weatherCode >= 95;
  }
};
