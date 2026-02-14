# Google Maps Location Tracking Setup Guide

## 🗺️ Features Implemented

1. **Location Tracking**
   - Auto-detect user's GPS location (with permission)
   - Manual latitude/longitude input
   - Interactive Google Maps with pinpoint selection
   - Draggable marker for precise location selection

2. **Nearest Provider Detection**
   - Real-time display of nearby available providers
   - Distance calculation and ETA estimation
   - Automatic assignment of nearest provider on booking
   - Visual highlighting of the closest provider

3. **Map Integration**
   - Click anywhere on the map to select location
   - Drag marker to adjust position
   - Full-screen map view with controls
   - Fallback to manual input if Maps API unavailable

## 🚀 Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Geocoding API** (optional, for address lookup)
   - **Places API** (optional, for location search)

4. Create credentials:
   - Go to "Credentials" in the left sidebar
   - Click "Create Credentials" → "API Key"
   - Copy your API key
   - (Recommended) Restrict the API key to your domain for security

### Step 2: Configure Frontend

1. Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env
```

2. Add your Google Maps API Key to `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
VITE_API_URL=http://localhost:3000
```

3. **Important:** Never commit `.env` to version control!

### Step 3: Test the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend server:
```bash
cd frontend
npm run dev
```

3. Navigate to a booking page (e.g., `/book/cleaning`)

4. Test location features:
   - Click "Show Map" to open the map interface
   - Click "Auto Detect My Location" to use GPS
   - Click anywhere on the map to select a location
   - Drag the marker to adjust position
   - Enter coordinates manually if needed

## 📍 How It Works

### Location Selection Options

#### 1. Auto-Detect (GPS)
- Requests browser geolocation permission
- Uses device GPS for accurate location
- Automatically updates map and coordinates
- Shows error if permission denied or unavailable

#### 2. Map Pin Selection
- Click anywhere on the interactive map
- Marker appears at clicked location
- Drag marker to fine-tune position
- Coordinates update in real-time

#### 3. Manual Entry
- Enter latitude and longitude directly
- Useful when GPS unavailable
- Click "Update Location on Map" to visualize

### Nearest Provider Detection

The system automatically:
1. Calculates distance from user location to all available providers
2. Sorts providers by distance (nearest first)
3. Estimates ETA based on distance and average speed
4. Displays top 10 nearest providers
5. Highlights the closest provider with a "Nearest" badge
6. Auto-assigns the nearest available provider on booking

### Distance Calculation

Uses **Haversine formula** for accurate distance calculation:
- Accounts for Earth's curvature
- Returns distance in kilometers
- Accurate for short and medium distances
- Fast calculation (no external API calls)

### ETA Estimation

Formula: `ETA = (Distance ÷ Avg Speed) × 60 minutes`
- Default average speed: 30 km/h (configurable)
- Emergency bookings: Fixed 5-minute priority
- Regular bookings: Max of 15 minutes or calculated time

## 🔧 Troubleshooting

### Map Not Loading

**Issue:** Map shows yellow warning or doesn't load

**Solutions:**
1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`
2. Check API key is valid in Google Cloud Console
3. Ensure Maps JavaScript API is enabled
4. Check browser console for specific errors
5. Verify no billing issues in Google Cloud

**Fallback:** System works with manual coordinate input even without Maps API

### Location Permission Denied

**Issue:** Auto-detect shows "Location permission denied"

**Solutions:**
1. Click browser address bar icon to allow location
2. In Chrome: Settings → Privacy → Site Settings → Location
3. In Firefox: Permissions → Location → Allow
4. In Safari: Preferences → Websites → Location
5. Use manual entry or map pin as alternative

### No Nearby Providers

**Issue:** "No providers available in your area"

**Solutions:**
1. Verify providers exist in database
2. Check provider availability status is `true`
3. Ensure serviceType matches exactly
4. Seed demo providers: `npm run seed` (in backend)
5. Providers may be in different location - adjust test coordinates

### Slow Provider Search

**Issue:** Nearby providers take long to load

**Optimization:**
1. Backend caches available providers
2. Database has geospatial indexes (optional enhancement)
3. Only top 10 providers returned
4. Client-side debouncing on location changes

## 🔐 Security Best Practices

### API Key Security

1. **Restrict API Key Usage:**
   - In Google Cloud Console → Credentials
   - Select your API key → "API restrictions"
   - Choose "Restrict key" to specific APIs
   - Add "Maps JavaScript API"

2. **Add Application Restrictions:**
   - HTTP referrers: `http://localhost:5174/*`, `yourdomain.com/*`
   - Prevents unauthorized use of your API key

3. **Monitor Usage:**
   - Check Google Cloud Console regularly
   - Set up billing alerts
   - Review API usage patterns

### Environment Variables

- Never commit `.env` files
- Add `.env` to `.gitignore`
- Use different API keys for dev/prod
- Rotate keys if accidentally exposed

## 💰 Cost Considerations

### Google Maps Pricing

- **Free Tier:** $200/month credit
- Maps JavaScript API: ~$7 per 1,000 loads
- With free credit: ~28,500 free map loads/month
- Most small apps stay within free tier

### Cost Optimization

1. Load map only when needed (show/hide toggle)
2. Cache provider locations
3. Use manual entry as alternative
4. Consider Leaflet + OpenStreetMap for free alternative

## 🎯 Usage Examples

### For Customers

1. **Quick Booking:**
   - Click "Auto Detect" for instant location
   - View nearby providers
   - Confirm booking

2. **Specific Location:**
   - Enter address manually
   - Or click on map to pin location
   - See distance to providers

### For Testing

```javascript
// Test coordinates (New Delhi)
Latitude: 28.6139
Longitude: 77.2090

// Test coordinates (Mumbai)
Latitude: 19.0760
Longitude: 72.8777

// Test coordinates (Bangalore)
Latitude: 12.9716
Longitude: 77.5946
```

## 📱 Browser Compatibility

### Location Features
- ✅ Chrome 50+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (with permission)

### HTTPS Requirement
- Geolocation API requires HTTPS in production
- Works on `localhost` for development
- Use SSL certificate for production deployment

## 🚀 Future Enhancements

Possible improvements:
- [ ] Geocoding API for address search
- [ ] Places Autocomplete for address input
- [ ] Heat map of provider availability
- [ ] Real-time provider location tracking
- [ ] Route visualization to provider
- [ ] Street View integration
- [ ] Multiple location save/management
- [ ] Geofencing for service areas
- [ ] Distance-based pricing tiers
- [ ] Provider density analysis

## 📚 Additional Resources

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Geolocation API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [@react-google-maps/api Docs](https://react-google-maps-api-docs.netlify.app/)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure backend is running on correct port
4. Test with manual coordinates first
5. Check Google Cloud Console for API status

---

**Note:** The system gracefully degrades if Google Maps is unavailable - users can still enter coordinates manually and the nearest provider algorithm works independently of the map interface.
