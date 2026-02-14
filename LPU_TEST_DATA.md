# LPU Test Data - Quick Reference

## 📍 Location Details

**LPU (Lovely Professional University)**
- **Address:** Phagwara, Punjab, India
- **Coordinates:** 31.2520°N, 75.7050°E
- **Campus Area:** Approximately 600 acres

## 👥 Service Providers Added (30 Providers)

### Cleaning Service (5 providers)
- Gurpreet Singh ⭐ 4.9 - Available
- Simran Kaur ⭐ 4.8 - Available
- Rajveer Dhillon ⭐ 4.7 - Available
- Manpreet Brar ⭐ 4.6 - Available
- Harleen Gill ⭐ 4.5 - Unavailable

### Plumbing Service (5 providers)
- Jaswinder Singh ⭐ 4.9 - Available
- Kulwinder Kumar ⭐ 4.8 - Available
- Balwinder Sandhu ⭐ 4.7 - Available
- Tejinder Sidhu ⭐ 4.6 - Available
- Amarjeet Grewal ⭐ 4.5 - Unavailable

### Electric Service (5 providers)
- Harpreet Virk ⭐ 4.9 - Available
- Sukhwinder Randhawa ⭐ 4.8 - Available
- Navjot Bajwa ⭐ 4.7 - Available
- Paramjit Cheema ⭐ 4.6 - Available
- Joginder Atwal ⭐ 4.5 - Available

### Repair Service (5 providers)
- Avtar Singh ⭐ 4.9 - Available
- Baljit Kang ⭐ 4.8 - Available
- Charanjit Nagra ⭐ 4.7 - Available
- Davinder Sohal ⭐ 4.6 - Available
- Ekamjot Buttar ⭐ 4.5 - Unavailable

### Painting Service (5 providers)
- Fatehvir Pannu ⭐ 4.9 - Available
- Gurbir Hundal ⭐ 4.8 - Available
- Harbhajan Sekhon ⭐ 4.7 - Available
- Ishpreet Maan ⭐ 4.6 - Available
- Jatinder Chahal ⭐ 4.5 - Available

### Shifting Service (5 providers)
- Karamjit Dhami ⭐ 4.9 - Available
- Lakhwinder Bains ⭐ 4.8 - Available
- Malkit Ghuman ⭐ 4.7 - Available
- Nachhatar Samra ⭐ 4.6 - Available
- Onkar Deol ⭐ 4.5 - Unavailable

## 🚀 How to Seed the Database

### Option 1: Seed Only Providers (Recommended for Testing)

```bash
cd backend
npm run seed
```

This will:
- Add all 30 LPU providers + 24 Delhi providers (54 total)
- Won't affect existing users or bookings
- Won't create duplicate providers if run multiple times

### Option 2: Complete Demo Reset (Fresh Start)

```bash
cd backend
npm run seed:demo
```

This will:
- **Delete all users, providers, bookings, and notifications**
- Create demo users (admin, customers, providers)
- Create 5 demo providers (different from the 54 above)
- Create sample bookings

**Demo Credentials:**
- Admin: admin@instant.in / Admin@123
- Customer: ravi.customer@instant.in / Customer@123
- Customer: priya.customer@instant.in / Customer@123
- Providers: See console output after running

## 🧪 Testing Location Features

### 1. Using Auto-Detect (if at LPU)
- Navigate to any booking page (e.g., `/book/cleaning`)
- Click "Show Map"
- Click "Auto Detect My Location"
- Should detect coordinates near: 31.2520, 75.7050
- Nearby providers should appear immediately

### 2. Using Manual Coordinates

**Enter these exact coordinates:**
```
Latitude: 31.2520
Longitude: 75.7050
```

**Alternative test coordinates around LPU campus:**
```
Main Gate:     31.2520, 75.7050
Block 34:      31.2530, 75.7045
Block 35:      31.2540, 75.7035
Sports Complex: 31.2510, 75.7060
Main Building: 31.2525, 75.7055
```

### 3. Using Map Pin Selection

With Google Maps enabled:
- Click anywhere on the map around LPU campus
- Drag the marker to fine-tune your location
- Coordinates will update automatically

## 📊 Expected Results

When you set location to LPU coordinates (31.2520, 75.7050):

### For Cleaning Service:
1. **Gurpreet Singh** - ~0 km (Nearest) ⭐ 4.9
2. **Rajveer Dhillon** - ~0.2 km ⭐ 4.7
3. **Simran Kaur** - ~0.5 km ⭐ 4.8
4. **Manpreet Brar** - ~1.0 km ⭐ 4.6
5. (More providers sorted by distance...)

### Distance Calculations:
- Providers are sorted by distance using Haversine formula
- Only providers with matching service type are shown
- Maximum 10 providers displayed
- Only available providers shown (availability: true)

### ETA Estimates:
- Based on distance and average speed (30 km/h default)
- ~0 km = 5 mins (minimum)
- ~1 km = 7 mins
- ~2 km = 9 mins
- Maximum 15 mins for regular bookings

## 🔍 Verification Steps

1. **Check Database Seeded:**
   ```bash
   # In MongoDB or MongoDB Compass
   # Count providers: should be 54 (30 LPU + 24 Delhi)
   db.providers.countDocuments()
   
   # Find LPU providers (latitude around 31.25)
   db.providers.find({ "location.latitude": { $gt: 31, $lt: 32 } })
   ```

2. **Test Each Service Type:**
   - Cleaning: `/book/cleaning`
   - Plumbing: `/book/plumbing`
   - Electric: `/book/electric`
   - Repair: `/book/repair`
   - Painting: `/book/painting`
   - Shifting: `/book/shifting`

3. **Check Nearby Providers API:**
   ```bash
   # Using curl or Postman
   POST http://localhost:3000/nearby-providers
   Content-Type: application/json
   
   {
     "latitude": 31.2520,
     "longitude": 75.7050,
     "serviceType": "Cleaning"
   }
   ```

   Expected response: Array of providers sorted by distance with ETA

## 🎯 Test Scenarios

### Scenario 1: Student in Hostel Block 34
```
Location: 31.2530, 75.7045
Service: Cleaning
Expected: 4-5 cleaning providers within 1km
Nearest: Simran Kaur (~50m)
```

### Scenario 2: Faculty in Main Building
```
Location: 31.2525, 75.7055
Service: Electric
Expected: 5 electricians within 1km
Nearest: Harpreet Virk (~100m)
```

### Scenario 3: Off-Campus Area
```
Location: 31.2600, 75.7100
Service: Plumbing
Expected: All 5 plumbers but farther away (2-5km)
Nearest: Balwinder Sandhu (~3km)
```

### Scenario 4: Emergency Booking
```
Location: 31.2520, 75.7050
Service: Repair
Emergency: true
Expected: Fixed 5 min ETA, nearest provider auto-assigned
```

## 📱 Real Device Testing

If testing on a real device at LPU:
1. Allow location permissions when prompted
2. GPS should automatically detect LPU coordinates
3. Nearby providers should load instantly
4. Map should center on LPU campus

## 🐛 Troubleshooting

### No Providers Showing?
- Verify database seeded: `npm run seed`
- Check service type spelling (case-sensitive)
- Ensure at least one provider is available
- Check console for errors

### Wrong Location Detected?
- GPS may take a few seconds to stabilize
- Try manual entry if GPS is inaccurate
- Use map pin for precise location selection

### Providers Too Far?
- You might be using Delhi coordinates by mistake
- Verify you're using 31.25, 75.70 (LPU) not 28.61, 77.20 (Delhi)
- Check latitude is ~31 not ~28

## 📈 Provider Distribution

All 30 LPU providers are distributed within:
- **Latitude range:** 31.2500 to 31.2545 (~5 km)
- **Longitude range:** 75.7035 to 75.7075 (~4 km)
- **Total area:** Approximately 20 km²
- **Centered at:** LPU Main Campus

This distribution simulates providers spread across:
- Different hostel blocks
- Faculty housing areas
- Off-campus locations nearby
- Commercial areas around campus

## 💡 Tips

- **Best match test:** Use exact center coordinates (31.2520, 75.7050)
- **Distance test:** Use edge coordinates (31.2545, 75.7035)
- **Service availability:** 3 providers in each category are marked unavailable
- **Rating test:** Providers have ratings from 4.5 to 4.9
- **Real-world simulation:** Names are common Punjabi names for authenticity

---

**Note:** The old Delhi region providers (24 providers) are still available for testing dual-location scenarios. You can test switching between Delhi (28.61, 77.20) and LPU (31.25, 75.70) to see different providers.
