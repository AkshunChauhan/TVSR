# Grant Tracker

A lightweight React application for visualizing grant project timelines and tracking progress across multiple projects with real-time collaboration.

## Features

✨ **Visual Timeline Board**
- Unified timeline scale for accurate visual comparison
- Horizontal timelines for each grant with color-coded progress
- Auto-updating "Today" line that shows current date
- Draggable progress markers (for assigned users only)
- Numbered milestones positioned by target dates

🔐 **Invite-Only Authentication**
- Email/password authentication via Firebase
- Signup restricted to pre-invited organization emails
- Role-based permissions (assigned users can edit, others view-only)

🎨 **Modern UI/UX**
- Auto-detects system theme (light/dark mode)
- Premium design with smooth animations
- Glassmorphism effects and micro-interactions
- Fully responsive layout

⚡ **Real-Time Collaboration**
- Live updates when progress markers are moved
- Firebase Firestore for instant synchronization
- Offline persistence support

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Firebase (Firestore + Authentication)
- **Styling**: CSS with CSS Variables for theming
- **Routing**: React Router v6

## Prerequisites

- Node.js 16+ and npm
- Firebase project (free tier works fine)

## Setup Instructions

### 1. Clone and Install

```bash
cd grant-tracker
npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Email/Password provider
4. Enable **Firestore Database** → Start in production mode
5. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the configuration object

### 3. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace placeholders with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### 4. Deploy Firestore Security Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Use `firestore.rules` as the rules file
   - Skip the indexes file

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 5. Create Initial Invites

Since signup is invite-only, you need to manually add invited emails to Firestore:

1. Go to Firebase Console → Firestore Database
2. Create a collection called `invites`
3. Add a document with ID as the email address (lowercase):
   ```
   Document ID: your.email@organization.com
   Fields:
   - email: "your.email@organization.com"
   - invitedBy: "system"
   - invitedAt: (current timestamp)
   - used: false
   - usedAt: null
   ```

### 6. Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Usage

### First Time Setup

1. Open the app and click "Sign up"
2. Enter your invited email and create a password
3. You'll be redirected to the dashboard

### Creating a Grant

1. Click "+ Add Grant" in the header
2. Fill in:
   - Grant name
   - Start and end dates
   - Assign team members (select users who can edit)
   - Add milestones (optional)
3. Click "Create Grant"

### Tracking Progress

- **View**: All authenticated users can see all grants
- **Edit**: Only assigned users can drag the progress marker
- **Milestones**: Numbered circles show target dates
- **Today Line**: Vertical line shows current date across all timelines

### Managing Invites (Admin)

To invite new users, add their email to the `invites` collection in Firestore (as shown in step 5 above).

## Project Structure

```
grant-tracker/
├── src/
│   ├── components/          # React components
│   │   ├── Auth.jsx         # Login/signup page
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── Timeline.jsx     # Timeline visualization
│   │   └── GrantModal.jsx   # Grant creation modal
│   ├── contexts/            # React contexts
│   │   └── AuthContext.jsx  # Authentication state
│   ├── hooks/               # Custom hooks
│   │   ├── useTheme.js      # System theme detection
│   │   ├── useGrants.js     # Real-time grants data
│   │   └── useMilestones.js # Real-time milestones data
│   ├── services/            # Firebase services
│   │   ├── firebase.js      # Firebase initialization
│   │   ├── database.js      # Firestore operations
│   │   └── colorGenerator.js # Auto-generated colors
│   └── App.jsx              # Main app with routing
├── firestore.rules          # Firestore security rules
├── .env.example             # Environment template
└── README.md                # This file
```

## Deployment

### Firebase Hosting (Recommended)

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase init hosting
firebase deploy --only hosting
```

### Other Platforms

The app is a static site. Build with `npm run build` and deploy the `dist/` folder to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

## Firestore Data Structure

### Collections

**grants** (collection)
```javascript
{
  name: string,
  startDate: timestamp,
  endDate: timestamp,
  color: string,
  assignedUsers: array,
  progressDate: timestamp,
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**grants/{grantId}/milestones** (subcollection)
```javascript
{
  number: integer,
  targetDate: timestamp,
  label: string,
  createdAt: timestamp
}
```

**users** (collection)
```javascript
{
  email: string,
  displayName: string,
  isAdmin: boolean,
  createdAt: timestamp
}
```

**invites** (collection)
```javascript
{
  email: string,
  invitedBy: string,
  invitedAt: timestamp,
  used: boolean,
  usedAt: timestamp
}
```

## Security

- Invite-only signup enforced by Firestore security rules
- All authenticated users can read all grants
- Only assigned users can update grant progress and milestones
- Firebase security rules prevent unauthorized access

## Troubleshooting

**"This email has not been invited"**
- Make sure the email is added to the `invites` collection in Firestore
- Email must be lowercase
- `used` field must be `false`

**Timeline not showing**
- Check browser console for Firebase errors
- Verify Firestore security rules are deployed
- Ensure grants exist in Firestore

**Theme not switching**
- Theme auto-detects from system preferences
- Check OS/browser dark mode settings

## License

MIT License - feel free to use for your organization

## Support

For issues or questions, check the Firebase Console for error logs or review the browser console for client-side errors.
