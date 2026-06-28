🌿 Earthify V2

A gamified eco-challenge web application for students and teachers — built to make sustainability fun, competitive, and rewarding.


🚀 Live Demo
🔗https://earthify-one.vercel.app/

📖 About
Earthify V2 is a full-stack web application where students complete daily sustainability challenges, earn XP points, and redeem eco-friendly rewards — all managed by their teachers.
Built as a prototype originally with HTML/CSS/JS + Firebase, this version is a complete rebuild using React, Supabase, and modern web technologies — deployed on Vercel.

✨ Features
👩‍🏫 Teacher Portal

Secure login with unique teacher access code
Create and manage classes with auto-generated class codes
Post eco challenges with title, description, difficulty, due date, and reference images
Review student submissions with photo proof and notes
Approve or reject submissions and award XP points
Manage a reward catalog (certificates, eco gifts, privileges, vouchers)
View all students in their class with points, streak, and level

🎒 Student Portal

Join a class using a teacher-provided class code
View and complete daily eco challenges
Upload photo proof and description when submitting
Track XP points, level, and daily streak
Compete on a class leaderboard
Browse and redeem rewards using earned XP


🛠️ Tech Stack
LayerTechnologyFrontendReact 18 + ViteAnimationsFramer MotionDatabasePostgreSQL via SupabaseAuthenticationSupabase AuthFile StorageSupabase StorageBackendSupabase (serverless)DeploymentVercel

🗄️ Database Schema
users          — stores both students and teachers with role + class
classes        — teacher-created classes with unique join codes
challenges     — eco tasks posted by teachers per class
submissions    — student challenge submissions with photo + status
points         — awarded XP history per student
rewards        — teacher-created reward catalog
redemptions    — student reward redemption history

🏗️ Project Structure
Earthify_V2/
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentRewards.jsx
│   │   │   └── TeacherDashboard.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env
│   └── package.json
└── server/

🚦 Getting Started
1. Clone the repository
bashgit clone https://github.com/yourusername/earthify-v2.git
cd earthify-v2/client
npm install
2. Configure environment variables
Create a .env file inside client/:
envVITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TEACHER_CODE=your_secret_teacher_code
3. Run locally
bashnpm run dev

🔐 Authentication Flow
Login Page
├── Teacher  →  Teacher code on signup  →  Teacher Dashboard
└── Student  →  Class code on signup   →  Student Dashboard

📱 Pages
RoutePageAccess/Login / SignupPublic/student/dashboardStudent DashboardStudent only/student/rewardsRewards StoreStudent only/teacher/dashboardTeacher DashboardTeacher only

🚀 Deployment

Push code to GitHub
Import repo on vercel.com
Set root directory to client
Add environment variables in Vercel dashboard
Deploy!


🔮 Future Improvements

Admin panel for managing multiple schools
Email notifications when submissions are approved
Mobile app version
AI-powered challenge suggestions
Parent portal to track child's progress




"Every small act saves the Earth" 🌿
