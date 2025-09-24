# Alpha Pump - AI-Powered Fitness App

A comprehensive fitness application that combines traditional workout management with AI-powered personal training.

## 🚀 Try the App

**Live Demo**: [https://preview--alpha-pump.lovable.app](https://preview--alpha-pump.lovable.app)

Simply visit the link above to start using the app immediately. Create an account to access all features.

## ✨ Features

### Solo Fitness Features

**🏋️ Workout Routines**
- Create custom workout routines with multiple training days
- Organize exercises by muscle groups (Push, Pull, Legs, etc.)
- Set reps, sets, weights, and rest periods for each exercise
- Save and manage your personal routine library
- Activate routines to track your training schedule

**📚 Exercise Library**
- Browse a comprehensive database of exercises
- Filter by muscle groups, equipment, and exercise type
- View detailed instructions and form tips
- Track which exercises you've used in your routines

**🎯 Custom Workouts**
- Create one-off workout sessions
- Log sets, reps, weights, and RPE (Rate of Perceived Exertion)
- Track workout duration and performance
- Add notes and observations for each session

**📊 Progress Tracking**
- View workout history and statistics
- Track your training consistency
- Monitor performance improvements over time

### AI Trainer Features

**🤖 AI Fitness Coach**
- 24/7 AI-powered personal trainer
- Chat interface for instant fitness guidance
- Get personalized workout recommendations
- Ask questions about form, nutrition, and training

**💬 Smart Conversations**
- Persistent chat history with your AI trainer
- Context-aware responses based on your fitness goals
- Multiple conversation threads for different topics

**📋 AI-Generated Workouts**
- Request custom workout plans through chat
- AI creates structured routines with proper progression
- Automatically saves generated routines to your library
- Tailored to your experience level and available equipment

## 🛠️ Local Development Setup

### Prerequisites

- Node.js (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn package manager

### Installation Steps

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd alpha-pump

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## 🏗️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI Integration**: Google Gemini API
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6

## 🔧 Environment Setup

For local development, you'll need to set up environment variables for:

- Supabase project URL and keys
- Google Gemini API key for AI features

Contact the project maintainer for environment configuration details.
