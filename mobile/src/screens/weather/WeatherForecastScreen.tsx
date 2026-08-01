// Weather Forecast Screen - 24-hour forecast display

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { weatherService, WeatherData, ForecastData } from '../../services/weather';

const PANGASINAN_CITIES = [
  { name: 'Libertad, Tayug', lat: 16.0305, lon: 120.7442 },
  { name: 'Dagupan City', lat: 16.0433, lon: 120.3397 },
  { name: 'San Carlos City', lat: 15.9294, lon: 120.3417 },
  { name: 'Urdaneta City', lat: 15.9761, lon: 120.5711 },
  { name: 'Alaminos City', lat: 16.1581, lon: 119.9819 },
  { name: 'Lingayen', lat: 16.0194, lon: 120.2286 }
];

export const WeatherForecastScreen: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData[]>([]);
  const [selectedCity, setSelectedCity] = useState(PANGASINAN_CITIES[0]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWeatherData();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadForecast();
    }
  }, [selectedCity]);

  const loadWeatherData = async () => {
    try {
      const weather = await weatherService.getCurrentWeather();
      setCurrentWeather(weather);
    } catch (error) {
      console.error('Error loading weather:', error);
      Alert.alert('Error', 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const loadForecast = async () => {
    try {
      const forecastData = await weatherService.getHourlyForecast(
        selectedCity.lat,
        selectedCity.lon,
        24
      );
      setForecast(forecastData);
    } catch (error) {
      console.error('Error loading forecast:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    await loadForecast();
    setRefreshing(false);
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      hour12: true 
    });
  };

  const getCurrentCityWeather = () => {
    return currentWeather.find(w => w.name === selectedCity.name);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  const cityWeather = getCurrentCityWeather();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* City Selector */}
      <View style={styles.citySelector}>
        <Text style={styles.sectionTitle}>Select City</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PANGASINAN_CITIES.map((city) => (
            <TouchableOpacity
              key={city.name}
              style={[
                styles.cityButton,
                selectedCity.name === city.name && styles.cityButtonActive
              ]}
              onPress={() => setSelectedCity(city)}
            >
              <Text
                style={[
                  styles.cityButtonText,
                  selectedCity.name === city.name && styles.cityButtonTextActive
                ]}
              >
                {city.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Current Weather Card */}
      {cityWeather && (
        <View style={styles.currentWeatherCard}>
          <View style={styles.currentWeatherHeader}>
            <Text style={styles.cityName}>{cityWeather.name}</Text>
            <Text style={styles.weatherIcon}>
              {weatherService.getWeatherIcon(cityWeather.weatherCode)}
            </Text>
          </View>
          
          <Text style={styles.temperature}>
            {Math.round(cityWeather.temperature)}°C
          </Text>
          <Text style={styles.weatherDescription}>
            {cityWeather.weatherDescription}
          </Text>
          <Text style={styles.feelsLike}>
            Feels like {Math.round(cityWeather.apparentTemperature)}°C
          </Text>

          <View style={styles.weatherDetails}>
            <View style={styles.weatherDetailItem}>
              <Ionicons name="water-outline" size={20} color={COLORS.primary} />
              <Text style={styles.weatherDetailLabel}>Humidity</Text>
              <Text style={styles.weatherDetailValue}>{cityWeather.humidity}%</Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} />
              <Text style={styles.weatherDetailLabel}>Wind</Text>
              <Text style={styles.weatherDetailValue}>
                {Math.round(cityWeather.windSpeed)} km/h
              </Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Ionicons name="rainy-outline" size={20} color={COLORS.primary} />
              <Text style={styles.weatherDetailLabel}>Rain</Text>
              <Text style={styles.weatherDetailValue}>
                {cityWeather.precipitation.toFixed(1)} mm
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 24-Hour Forecast */}
      {forecast && (
        <View style={styles.forecastSection}>
          <Text style={styles.sectionTitle}>24-Hour Forecast</Text>
          
          {forecast.hourly.map((hour, index) => {
            const isSevere = weatherService.isSevereWeather(
              hour.precipitation,
              hour.windSpeed,
              hour.precipitationProbability,
              hour.weatherCode
            );

            return (
              <View
                key={index}
                style={[
                  styles.forecastCard,
                  isSevere && styles.forecastCardSevere
                ]}
              >
                <View style={styles.forecastTime}>
                  <Text style={styles.forecastTimeText}>
                    {formatTime(hour.time)}
                  </Text>
                  {isSevere && (
                    <View style={styles.severeWarningBadge}>
                      <Ionicons name="warning" size={12} color="#fff" />
                      <Text style={styles.severeWarningText}>Severe</Text>
                    </View>
                  )}
                </View>

                <View style={styles.forecastMain}>
                  <Text style={styles.forecastIcon}>
                    {weatherService.getWeatherIcon(hour.weatherCode)}
                  </Text>
                  <View style={styles.forecastInfo}>
                    <Text style={styles.forecastTemp}>
                      {Math.round(hour.temperature)}°C
                    </Text>
                    <Text style={styles.forecastDescription}>
                      {weatherService.getWeatherDescription(hour.weatherCode)}
                    </Text>
                  </View>
                </View>

                <View style={styles.forecastDetails}>
                  <View style={styles.forecastDetailItem}>
                    <Ionicons name="rainy-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.forecastDetailText}>
                      {hour.precipitation.toFixed(1)}mm ({hour.precipitationProbability}%)
                    </Text>
                  </View>
                  <View style={styles.forecastDetailItem}>
                    <Ionicons name="speedometer-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.forecastDetailText}>
                      {Math.round(hour.windSpeed)} km/h
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Info Footer */}
      <View style={styles.infoFooter}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>
          Weather data updates every hour. Severe weather warnings are highlighted.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  citySelector: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  cityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cityButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cityButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  cityButtonTextActive: {
    color: '#fff',
  },
  currentWeatherCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  weatherIcon: {
    fontSize: 48,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  weatherDescription: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  weatherDetailItem: {
    alignItems: 'center',
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  weatherDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  forecastSection: {
    padding: 16,
  },
  forecastCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  forecastCardSevere: {
    borderColor: COLORS.error,
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  forecastTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  forecastTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  severeWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  severeWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  forecastMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  forecastIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  forecastInfo: {
    flex: 1,
  },
  forecastTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  forecastDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  forecastDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  forecastDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  forecastDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
