<p align="center">
  <img src="public/hero_image.jpeg" alt="Connekt Banner" width="100%" />
</p>

<h1 align="center">💼 Connekt</h1>

<p align="center">
  <strong>Scale Beyond Yourself — The All-in-One Professional Freelance Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#license">License</a>
</p>

---

## 🚀 Overview

**Connekt** is a modern, full-featured platform designed to connect freelance professionals with clients. It provides everything from talent discovery and project management to AI-powered tools, real-time messaging, and secure payment processing — all wrapped in a stunning, premium UI.

Whether you're a freelancer looking to grow your career or a business seeking top talent, Connekt provides the tools to **Scale Beyond Yourself, Your Team, Borders, and Limits**.

---

## ✨ Features

### 👤 **Profiles & Discovery**
- Professional profile pages with portfolio showcase
- Explore and discover talent based on skills and roles
- Advanced search and filtering

### 🤖 **Connekt AI**
- AI-powered project cover image generation (Imagen 3)
- Intelligent assistance via Google Gemini integration
- Smart recommendations and insights

### 📬 **Connekt Mail**
- Built-in email/messaging system
- Seamless communication with clients and teams

### 📊 **Analytics Dashboard**
- Real-time performance analytics
- Visual data with interactive charts (Recharts)
- Track earnings, projects, and engagement

### 📝 **Contracts & Legal**
- Contract lifecycle management
- Template system for quick setup
- Legal enforcement and escrow services

### 👥 **Teams & Workspaces**
- Create and manage agencies/teams
- Collaborative workspaces for projects
- Role-based access control

### 📁 **Project Management**
- Full project lifecycle tracking
- Task management with drag-and-drop (dnd-kit)
- Calendar integration and scheduling

### 💬 **Real-Time Messaging**
- Instant messaging and group chats
- Live notifications
- Presence indicators

### 🎥 **Meetings & Conferencing**
- Schedule and manage meetings
- Calendar sync and reminders

### 💰 **Wallet & Payments**
- Secure payment processing (Modem Pay)
- Wallet management
- Transaction history

### 🔔 **Notifications**
- Real-time notification system
- Email and in-app alerts
- Customizable preferences

### 🛡️ **Proof System**
- Verification and trust badges
- Work proof documentation
- Professional credentialing

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | Headless UI, Lucide Icons, React Icons |
| **Animations** | Framer Motion, GSAP |
| **3D Graphics** | Three.js, React Three Fiber, OGL |
| **Database & Auth** | Firebase (Firestore, Auth, Storage) |
| **AI Integration** | Google Gemini / GenAI |
| **Charts** | Recharts |
| **Payments** | Modem Pay |
| **Drag & Drop** | dnd-kit |
| **PDF Generation** | jsPDF, html2canvas |
| **Theming** | next-themes |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm**, **yarn**, **pnpm**, or **bun**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ak-badjie/connekt.git
   cd connekt
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # AI Features (Required for AI features including project cover generation)
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📁 Project Structure

```
connekt/
├── app/                    # Next.js App Router pages
│   ├── [username]/         # Dynamic user profile routes
│   ├── admin/              # Admin dashboard
│   ├── agency/             # Agency management
│   ├── ai-tools/           # AI-powered tools
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Main user dashboard
│   ├── explore/            # Talent discovery
│   ├── mail/               # Email/messaging
│   ├── onboarding/         # User onboarding flow
│   ├── payment/            # Payment processing
│   ├── projects/           # Project management
│   ├── settings/           # User settings
│   └── page.tsx            # Landing page
├── components/             # Reusable React components
│   ├── ai/                 # AI-related components
│   ├── auth/               # Authentication components
│   ├── calendar/           # Calendar components
│   ├── chat/               # Chat/messaging components
│   ├── contracts/          # Contract management
│   ├── dashboard/          # Dashboard components
│   ├── landing/            # Landing page sections
│   ├── mail/               # Mail components
│   ├── profile/            # Profile components
│   ├── projects/           # Project components
│   ├── teams/              # Team management
│   ├── ui/                 # UI primitives
│   ├── wallet/             # Wallet components
│   └── workspaces/         # Workspace components
├── lib/                    # Utilities and services
│   ├── services/           # Backend services
│   ├── types/              # TypeScript types
│   └── utils/              # Helper utilities
├── context/                # React context providers
├── hooks/                  # Custom React hooks
└── public/                 # Static assets
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🌐 Deployment

The easiest way to deploy Connekt is using the [Vercel Platform](https://vercel.com/new):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)

For other deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

<p align="center">
  Made with ❤️ by the Connekt Team
</p>
