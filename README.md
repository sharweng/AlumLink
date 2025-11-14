# AlumLink 🎓

AlumLink is a comprehensive alumni networking platform that connects alumni, students, and educational institutions. The platform facilitates networking, mentorship, job postings, event management, discussion forums, and real-time communication to foster a thriving alumni community.

## Features

- **User Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Alumni Networking**: Connect with fellow alumni, send connection requests, and build your professional network
- **Mentorship Program**: Find mentors or become a mentor, schedule sessions, and track mentorship progress
- **Job Board**: Post and browse job opportunities within the alumni network
- **Event Management**: Create, manage, and RSVP to alumni events with feedback collection
- **Discussion Forums**: Engage in topic-based discussions with the community
- **Real-time Messaging**: Chat with connections using Socket.IO for instant communication
- **Video & Audio Calls**: Integrated Stream.IO for video conferencing and audio calls
- **Achievements System**: Track and showcase your professional achievements
- **Admin Dashboard**: Comprehensive admin panel for user management, moderation, and analytics
- **Content Moderation**: AI-powered profanity filtering and community reporting system
- **Email Notifications**: Automated email notifications using Nodemailer and SendGrid
- **File Storage**: Support for both Cloudinary and Cloudflare R2 for media storage

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Cloudinary / Cloudflare R2** for file storage
- **Stream.IO** for video/audio calls
- **Google Gemini AI** for content generation
- **SendGrid & Nodemailer** for email services

### Frontend
- **React** with **Vite**
- **TanStack Query** (React Query) for data fetching
- **Axios** for HTTP requests
- **Socket.IO Client** for real-time features
- **Stream.IO Video SDK** for video/audio calls
- **Tailwind CSS** with **DaisyUI** for styling
- **React Router** for navigation
- **Recharts** for data visualization

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sharweng/AlumLink.git
cd AlumLink
```

### 2. Environment Configuration

Create a `.env` file in the root directory by copying the `.env copy` file:

```bash
cp ".env copy" .env
```

Edit the `.env` file and configure the following environment variables:

#### Required Configuration

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Frontend URL
CLIENT_URL=http://localhost:5173

# Email Service (Nodemailer)
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_USER=your_email@gmail.com
NODEMAILER_PASS=your_email_app_password
NODEMAILER_EMAIL_FROM=alumnilink.management@gmail.com
EMAIL_FROM=alumnilink.management@gmail.com
EMAIL_FROM_NAME=AlumniLink
```

#### Optional Services

```env
# SendGrid (Alternative Email Service)
SENDGRID_API_KEY=your_sendgrid_api_key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_LOGO_URL=your_logo_url

# Cloudflare R2 (Alternative Storage)
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_r2_public_url

# Stream.IO (Video/Audio Calls)
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
VITE_STREAM_API_KEY=your_stream_api_key

# AI Features (Choose one)
# Option 1: Google Gemini (Alternative - you can use this if preferred)
GEMINI_API_KEY=your_gemini_api_key

# Option 2: Ollama (Recommended - using Mistral or Neural-Chat)
OLLAMA_BASE_URL=http://localhost:11434

# Frontend Feature Flags
VITE_ENABLE_FEEDBACK_MODAL=true
VITE_ENABLE_WIDTH_WARNING=true
```

### 3. Install Dependencies

#### Install Backend Dependencies
```bash
npm install
```

#### Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

Alternatively, you can install both at once from the root directory:
```bash
npm install && npm install --prefix frontend
```

### 4. Ollama Setup (Recommended for AI Features)

This project uses Ollama for AI-powered features like content moderation and assistance. Follow these steps to set it up:

#### Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS:**
```bash
brew install ollama
```

Or download from: https://ollama.com/download

#### Start Ollama Service
```bash
ollama serve
```

#### Pull Required Models

**Mistral (Recommended for CV Extraction):**
```bash
ollama pull mistral
```

**Neural-Chat (Recommended for Job Categorization):**
```bash
ollama pull neural-chat
```

Verify the installation:
```bash
bash scripts/verify-ollama.sh
```

**Note:** You can alternatively use Google Gemini AI by setting the `GEMINI_API_KEY` in your `.env` file, but this project is configured to use Ollama by default.

### 5. Database Setup

Ensure MongoDB is running. If using MongoDB Atlas, make sure your connection string is properly configured in the `.env` file.

#### Optional: Populate Sample Data
```bash
node scripts/populateData.js
```

This script will create sample data including:
- **At least 5 users** (required for the script to work properly)
- Sample posts
- Sample job postings
- Sample discussions
- Sample events

The script requires a minimum of 5 users to properly populate all related content and associations.

#### Create Super Admin (Optional)
```bash
node scripts/createSuperAdmin.js
```

### 6. Start the Application

#### Option 1: Run Both Backend and Frontend Separately

**Terminal 1 - Start Backend:**
```bash
npm run dev
```
The backend server will run on `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

#### Option 2: Start Backend Only (from root)
```bash
npm run dev
```

#### Option 3: Production Build
```bash
npm run build
npm start
```

### 7. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Project Structure

```
AlumLink/
├── backend/                 # Backend server code
│   ├── controllers/        # Route controllers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── lib/               # Third-party integrations
│   ├── emails/            # Email templates and handlers
│   └── server.js          # Entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/           # Utilities and configs
│   │   └── utils/         # Helper functions
│   └── public/            # Static assets
├── scripts/               # Utility scripts
├── .env                   # Environment variables (create this)
└── package.json           # Root package.json
```

## API Documentation

The backend provides RESTful APIs for:
- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/posts` - Social posts
- `/api/events` - Event management
- `/api/jobs` - Job postings
- `/api/mentorship` - Mentorship programs
- `/api/messages` - Real-time messaging
- `/api/discussions` - Discussion forums
- `/api/notifications` - User notifications
- `/api/admin` - Admin operations
- `/api/reports` - Content reporting
- `/api/achievements` - User achievements
- `/api/feedback` - Feedback collection

## Scripts

- `npm run dev` - Start backend in development mode with nodemon
- `npm start` - Start backend in production mode
- `npm run build` - Build for production (installs dependencies and builds frontend)
- `npm run populate` - Populate database with sample data
- `node scripts/createSuperAdmin.js` - Create a super admin user

## Troubleshooting

### MongoDB Connection Issues
- Verify your `MONGO_URI` is correct
- Ensure MongoDB is running (if using local installation)
- Check network access settings (if using MongoDB Atlas)

### Port Already in Use
- Change the `PORT` in `.env` file
- Kill the process using the port: `lsof -ti:5000 | xargs kill -9`

### Email Not Sending
- Verify SMTP credentials in `.env`
- For Gmail, use an app-specific password
- Check SendGrid API key if using SendGrid

### Ollama Not Working
- Ensure Ollama service is running: `ollama serve`
- Verify models are installed: `ollama list`
- Check `OLLAMA_BASE_URL` in `.env` (default: `http://localhost:11434`)
- Test with: `bash scripts/verify-ollama.sh`

### Frontend Not Loading
- Ensure backend is running on the correct port
- Check `CLIENT_URL` in backend `.env`
- Verify `VITE_*` environment variables for frontend features

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue on the GitHub repository.

---

**AlumLink** - Connecting Alumni, Building Communities 🎓
