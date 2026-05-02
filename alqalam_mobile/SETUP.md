# AL Qalam EMS — Mobile App Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For Android: Android Studio + Android Emulator OR physical device with Expo Go
- For iOS: Xcode (Mac only) OR physical device with Expo Go

---

## 1. Install Dependencies

```bash
cd alqalam_mobile
npm install
```

---

## 2. Start Development Server

```bash
npx expo start
```

Then:
- Press `a` → Open on Android emulator
- Press `i` → Open on iOS simulator (Mac only)
- Scan QR code with **Expo Go** app on physical device

---

## 3. Connect to Your Backend

### Option A: PHP Backend (cPanel)
Edit `src/api/index.ts`:
```typescript
const API_URLS = {
  php:  'https://alqalam.edu.pk/ems/alqalam_backend.php',   // your cPanel URL
  node: 'https://api.alqalam.edu.pk',                       // your Node.js URL
};
```

### Option B: Local Development
```typescript
const API_URLS = {
  php:  'http://192.168.1.100/alqalam/backend.php',   // your local IP
  node: 'http://192.168.1.100:3000',
};
```
> **Note:** Use your computer's LAN IP (not localhost) — mobile devices cannot reach localhost.

---

## 4. Demo Login Credentials

| Role        | Username        | Password          |
|-------------|-----------------|-------------------|
| Admin       | `admin`         | `AqAdmin@2024`    |
| Principal   | `principal`     | `AqPrincipal@24`  |
| Teacher     | `teacher01`     | `AqTeach@2024`    |
| Student     | `AQ-2024-1045`  | `Student@123`     |
| Parent      | `parent_ali`    | `Parent@2024`     |
| Accountant  | `accountant1`   | `AqAcct@2024`     |

---

## 5. Build APK (Android)

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build
eas build:configure

# Build APK (development preview)
eas build --platform android --profile preview

# Build AAB (for Google Play Store)
eas build --platform android --profile production
```

### Local APK Build (without EAS)

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Prebuild (generate native code)
npx expo prebuild --platform android

# Build APK
cd android && ./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 6. Build for iOS

```bash
# Using EAS Build
eas build --platform ios --profile production

# Or locally (Mac + Xcode required)
npx expo prebuild --platform ios
cd ios && xcodebuild -workspace AlQalamEMS.xcworkspace -scheme AlQalamEMS -configuration Release
```

---

## 7. Project Structure

```
alqalam_mobile/
├── app/
│   ├── _layout.tsx          ← Root layout (QueryClient, Toast)
│   ├── index.tsx            ← Splash screen
│   ├── (auth)/
│   │   └── login.tsx        ← Login screen (all roles)
│   ├── (admin)/
│   │   ├── _layout.tsx      ← Bottom tabs: Dashboard, Students, Attendance, Fee, More
│   │   ├── index.tsx        ← Admin dashboard
│   │   ├── students.tsx     ← Student management
│   │   ├── attendance.tsx   ← Staff + student attendance
│   │   ├── fee.tsx          ← Fee collection + arrears
│   │   └── more.tsx         ← Staff, library, transport, settings
│   ├── (teacher)/
│   │   ├── _layout.tsx      ← Bottom tabs
│   │   ├── index.tsx        ← Teacher dashboard + today's classes
│   │   ├── attendance.tsx   ← Mark class attendance
│   │   ├── results.tsx      ← Enter student marks
│   │   ├── timetable.tsx    ← Weekly schedule
│   │   └── profile.tsx      ← Profile + leave application
│   ├── (student)/
│   │   ├── _layout.tsx      ← Bottom tabs
│   │   ├── index.tsx        ← Student dashboard
│   │   ├── attendance.tsx   ← Monthly attendance calendar
│   │   ├── results.tsx      ← Exam results + grades
│   │   ├── fee.tsx          ← Fee history + receipts
│   │   └── timetable.tsx    ← Class timetable
│   └── (parent)/
│       ├── _layout.tsx      ← Bottom tabs
│       ├── index.tsx        ← Parent dashboard (all children overview)
│       ├── children.tsx     ← Detailed child profiles
│       ├── fee.tsx          ← Fee management + receipts
│       ├── attendance.tsx   ← Children's attendance
│       └── profile.tsx      ← Parent profile + settings
├── src/
│   ├── api/index.ts         ← API service (PHP + Node.js dual backend)
│   ├── components/index.tsx ← Shared UI components
│   ├── store/auth.ts        ← Zustand auth store
│   └── theme/index.ts       ← Colors, spacing, fonts
├── app.json                 ← Expo config
├── babel.config.js
├── tailwind.config.js
└── package.json
```

---

## 8. Key Features Per Portal

### 👑 Admin Portal
- Real-time dashboard with stats
- Student management (search, filter, profiles)
- Staff + student attendance tracking
- Fee collection (cash/bank/cheque/online)
- Arrears management with WhatsApp reminders
- Staff management, library, transport, timetable
- System settings

### 📚 Teacher Portal
- Today's class schedule with live "now" indicator
- One-tap attendance marking (P/A/L/Leave)
- Enter marks per exam per class
- Weekly timetable
- Leave application

### 🎒 Student Portal
- Dashboard with attendance %, last grades, fee status
- Monthly attendance calendar
- Subject-wise results with grades
- Complete fee history + printable receipts
- Class timetable

### 👨 Parent Portal
- All children on one screen
- Attendance alerts (below 75% warning)
- Fee status + payment receipts
- Child academic progress
- WhatsApp/phone contact shortcuts

---

## 9. Technology Stack

| Package              | Version  | Purpose                    |
|----------------------|----------|----------------------------|
| Expo                 | ~51.0    | Build platform             |
| expo-router          | ~3.5     | File-based navigation      |
| Zustand              | ^4.5     | Auth state management      |
| @tanstack/react-query| ^5.32    | Server state + caching     |
| Axios                | ^1.6     | HTTP requests              |
| Socket.io-client     | ^4.7     | Real-time features         |
| expo-secure-store    | ~13.0    | Secure JWT storage         |
| expo-linear-gradient | ~13.0    | UI gradients               |
| react-native-toast-message | ^2.2 | Toast notifications     |
| NativeWind           | ^4.0     | Tailwind CSS               |

---

## 10. Troubleshooting

**Metro bundler cache issue:**
```bash
npx expo start --clear
```

**Package version conflicts:**
```bash
npx expo install --fix
```

**API connection refused (physical device):**
- Use your computer's LAN IP (e.g., `192.168.1.100`), not `localhost`
- Ensure device and computer are on same WiFi network
- Check firewall allows port 3000/80

**Expo Go not loading:**
- Ensure you're on Expo SDK 51 compatible Expo Go
- Try clearing Expo Go app data

---

*AL Qalam International EMS · Mobile App v1.0 · alqalam.edu.pk*
