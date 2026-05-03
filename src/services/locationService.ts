// src/services/locationService.ts
import * as Location from 'expo-location';
import i18n from 'i18next';

export const LocationService = {
  async getCurrentLocationName(): Promise<string> {
    try {
      // 1. 🛰️ Request Native Permissions
      // This is what stops the "Detecting..." hang by showing the system popup
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return i18n.t('location.errors.permissionDenied', "Permission Denied");
      }

      // 2. 📍 Get Coordinates (Balanced accuracy is faster for networking)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 3. 🌐 Reverse Geocode via Nominatim API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { 
          headers: { 'User-Agent': 'ConnectMe-App' },
          signal: controller.signal 
        }
      );
      clearTimeout(timeoutId);
      
      const data = await response.json();
      const addr = data.address;
      
      // 🚀 THE SYNC: Extract multiple geographic layers
      const city = addr.city || addr.town || addr.village || addr.suburb || '';
      const state = addr.state || '';
      const country = addr.country || '';

      // 🚀 THE SYNC: Join into a professional rich string
      const fullLocation = [city, state, country]
        .filter(part => part && part.trim().length > 0)
        .join(', ');

      return fullLocation || i18n.t('location.defaultCity', "Unknown Location");

    } catch (error: any) {
      console.error("Location Service Error:", error);
      
      // Handle Timeouts or API failures
      if (error.name === 'AbortError') {
        return i18n.t('location.errors.timeout', "Timeout");
      }
      
      return i18n.t('location.errors.generic', "Location Error");
    }
  }
};