# 🏃‍♂️ FitSync - AI-Powered Nutrition & Preventive Health Platform

> Smart, personalized wellness plans powered by AI and wearable data

## 📖 Overview

**FitSync** is an AI-powered personalized nutrition and preventive health platform that integrates wearable fitness data with real-time analytics to create smart, data-driven wellness plans. Users input their profile details, health goals, and wearable stats (steps, calories, heart rate, sleep) to receive AI-generated meal and activity recommendations.

The platform leverages **LangChain + OpenAI GPT-4o** for structured health insights, **Prisma + PostgreSQL** for secure data storage, and **Redis + Firebase** for real-time performance and scalability. The MVP showcases static wearable data analysis, personalized meal plans, calorie burn estimation, and progress dashboards — scalable to live wearable integrations, predictive disease prevention, and enterprise wellness partnerships.

---

## ✨ Features

- **User Profiles:** Age, gender, height, weight, health goals, and activity level
- **Wearable Data Integration:** Steps, calories, heart rate, sleep (static for MVP)
- **AI-Generated Recommendations:** Personalized meal and activity plans
- **Calorie Burn Estimation:** Based on user activity and profile
- **Progress Dashboards:** Visualize health metrics and progress
- **Secure Data Storage:** Prisma ORM + PostgreSQL
- **Real-Time Performance:** Redis + Firebase (for future scalability)
- **Scalable Architecture:** Ready for live device integration and enterprise use

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Node.js, Express.js
- **Database:** Prisma ORM, PostgreSQL
- **AI/ML:** LangChain, OpenAI GPT-4o
- **Real-Time:** Redis, Firebase
- **Authentication:** JWT, bcryptjs

---

## 📱 App Structure

```
fitsync-new/
├── app/
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── chat.tsx
│   │   ├── diet.tsx
│   │   ├── feed.tsx
│   │   ├── index.tsx
│   │   ├── profile.tsx
│   │   └── ...
├── assets/
│   └── images/
├── package.json
├── tsconfig.json
├── app.json
├── ...
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### 1. Clone the Repository
```bash
git clone https://github.com/ag21o9/bitnbuild_frontend
cd fitsync-new
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the App
```bash
npx expo start
```
- Scan the QR code with Expo Go (iOS/Android)
- Press 'a' for Android emulator, 'i' for iOS simulator (Mac only)

### 4. Build for Production
See [Expo docs](https://docs.expo.dev/classic/building-standalone-apps/) for APK/IPA builds.

---

## 🧑‍💻 Usage

1. **Sign Up / Log In:** Create your profile with health details and goals.
2. **Onboarding:** Enter wearable stats (steps, calories, heart rate, sleep).
3. **Dashboard:** View AI-generated meal/activity plans and progress.
4. **Chat:** Ask the AI assistant for health, nutrition, or fitness advice.
5. **Profile:** Update your health data and goals anytime.

---

## 👥 Team: Class_Bunkers

- **Divya Ratna Gautam** - Frontend Developer & Team Lead  
- **Vishesh Sachan** - Backend & Integration
- **Mohd Nazeeb Mansoori** - Frontend & Integration
- **Abhijeet Gupta** - Backend Developer & GenAI Developer

---

## 📚 API Endpoints (Backend)

- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login
- `GET /api/users/profile` - Get profile
- `POST /api/stats/bmi` - BMI calculation
- `POST /api/stats/activity` - Calorie calculation
- `POST /api/stats/meal` - Log meal
- `GET /api/stats/meals` - Meal history
- `POST /api/stats/chat` - AI assistant
- ...and more

---

## 🔮 Future Scope

- Live wearable device sync (Apple Health, Google Fit, etc.)
- Predictive disease prevention analytics
- Enterprise wellness dashboards
- Social features: challenges, leaderboards
- Doctor/coach integrations

---

## 🏆 Hackathon Achievement

Built for **BitsNBuild Hackathon** by Team **Class_Bunkers**:
- Full-stack AI/ML integration
- Secure, scalable architecture
- Real-time analytics foundation

---

## 📄 License

Proprietary for BitsNBuild Hackathon. Contact team for collaboration.

---

*Built with ❤️ by Team Class_Bunkers, 2025*
