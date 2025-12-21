# 📓 Personal Pixel Journal

A modern, pixelated-style personal journal application with dual modes for private writing and public sharing. Built with a minimalist dark theme and retro aesthetic.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![MongoDB](https://img.shields.io/badge/mongodb-latest-green)

## 🎯 Project Overview

Personal Pixel Journal is a full-stack web application that allows you to maintain a personal digital journal with two distinct modes:

- 🛡️ **Admin Mode** - Private space where you can create, edit, and manage your journal entries
- 👁️ **Visitor Mode** - Public-facing view where visitors can browse your published content in a beautifully organized, minimal interface

The application features a unique pixelated design aesthetic with a dark theme, creating a nostalgic yet modern journaling experience.

## ✨ Key Features

### 🎨 Design & UX
- **Pixelated Minimalist Interface** - Retro pixel art aesthetic with crisp edges
- **Dark Theme** - Easy on the eyes, perfect for journaling
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Smooth Animations** - Subtle pixel-perfect transitions and hover effects

### 📝 Content Management
- **Multiple Content Types**
  - 📖 Stories (text-based entries)
  - 🧠 Memories (special moments)
  - 🗺️ Journeys (travel experiences)
  - 🖼️ Images (with captions)
  - 🎥 Videos (embedded or uploaded)
- **Rich Media Support** - Upload and display images/videos alongside text
- **Tagging System** - Organize entries with custom tags
- **Mood Tracking** - Visual mood indicators (happy, sad, excited, calm, etc.)
- **Location Tagging** - Add geographical context to your entries

### 🔐 Privacy & Security
- **Dual Mode System** - Clear separation between admin and visitor access
- **JWT Authentication** - Secure admin login with token-based auth
- **No Comments** - Visitor mode is strictly view-only
- **Protected Routes** - Admin endpoints require authentication

### 🗂️ Organization & Discovery
- **Multiple Sort Options** - Sort by date (newest/oldest), mood, or content type
- **Advanced Filtering** - Filter by tags, content type, or date range
- **Pagination** - Clean pagination for large journal collections
- **Search Functionality** - Find entries by keywords or phrases

## 🏗️ System Architecture

### Tech Stack

**Backend**
- Node.js - Runtime environment
- Express.js - Web framework
- MongoDB - NoSQL database
- Mongoose - MongoDB object modeling
- JWT - Authentication tokens
- Bcrypt.js - Password hashing

**Frontend**
- React 18 - UI library
- React Router - Client-side routing
- Axios - HTTP client
- date-fns - Date formatting
- React Icons - Icon library
- CSS3 - Custom pixelated styling

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn
- MongoDB (local or via Docker)
- Docker & Docker Compose (for containerized deployment)

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd Project_journal
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/personal-journal

# JWT Configuration
JWT_SECRET=your-generated-secret-key-change-this-in-production
JWT_EXPIRE=24h
JWT_COOKIE_EXPIRE=30

# Server Configuration
PORT=5000
NODE_ENV=development

# Admin Default Credentials
ADMIN_USERNAME=admin
ADMIN_INITIAL_PASSWORD=changeme123
```

Initialize the database with default admin user:
```bash
npm run init-db
```

Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will be available at `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

### Default Credentials
- **Username**: admin
- **Password**: changeme123

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## 🐳 Docker Deployment (Recommended)

### Using Docker Compose

1. Ensure Docker and Docker Compose are installed
2. From the project root directory, run:

```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend on port 3000

Initialize the database:
```bash
docker-compose exec backend npm run init-db
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Environment Variables for Docker

Update the environment variables in `docker-compose.yml`:

```yaml
environment:
  - MONGODB_URI=mongodb://admin:password@mongodb:27017/personal-journal?authSource=admin
  - JWT_SECRET=your-super-secret-jwt-key-change-this
  - NODE_ENV=production
  - REACT_APP_API_URL=http://localhost:5000/api
```

### Building Individual Docker Images

**Backend:**
```bash
docker build -t personal-journal-backend ./backend
docker run -p 5000:5000 --env-file backend/.env personal-journal-backend
```

**Frontend:**
```bash
docker build -t personal-journal-frontend ./frontend
docker run -p 3000:3000 personal-journal-frontend
```

### Docker Compose Down
```bash
docker-compose down
```

## 📚 API Documentation

### Authentication Endpoints

**POST `/api/auth/login`**
- Login with username and password
- Returns JWT token and user info
- Request body: `{ username, password }`

**GET `/api/auth/logout`**
- Logout and clear cookie

**GET `/api/auth/me`** *(Protected)*
- Get current logged-in admin info

### Posts Endpoints

**GET `/api/posts`**
- Get all published posts (paginated)
- Query params: `sort`, `type`, `tag`, `page`, `limit`
- Example: `/api/posts?sort=newest&type=story&page=1&limit=10`

**GET `/api/posts/public/:id`**
- Get single published post

**GET `/api/posts/admin/all`** *(Protected)*
- Get all posts (admin view, includes unpublished)

**POST `/api/posts`** *(Protected)*
- Create new post
- Request body: Post object with all fields

**PUT `/api/posts/:id`** *(Protected)*
- Update post

**DELETE `/api/posts/:id`** *(Protected)*
- Delete post

## 🔧 Environment Configuration

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/personal-journal
JWT_SECRET=your-generated-secret-key
JWT_EXPIRE=24h
JWT_COOKIE_EXPIRE=30
PORT=5000
NODE_ENV=development
MAX_FILE_UPLOAD=10000000
FILE_UPLOAD_PATH=./uploads
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🔒 Security Notes

1. **Change Default Credentials**: Update admin password immediately
2. **JWT Secret**: Generate a strong JWT secret for production
3. **CORS Configuration**: Configure CORS appropriately for your domain
4. **HTTPS**: Use HTTPS in production
5. **Environment Variables**: Never commit `.env` files to version control
6. **MongoDB**: Enable authentication for MongoDB in production

## 📝 Post Schema

```javascript
{
  title: String (required),
  content: String (required),
  type: String (enum: 'story', 'memory', 'journey', 'image', 'video'),
  media: String (URL to file),
  tags: [String],
  date: Date (required),
  mood: String (enum: 'happy', 'sad', 'excited', 'calm', 'reflective', 'adventurous'),
  location: String,
  isPublished: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## 📝 Admin Schema

```javascript
{
  username: String (required, unique),
  password: String (required, hashed with bcrypt),
  createdAt: Date
}
```

## 🚢 Production Deployment

### Deployment Checklist

- [ ] Update all environment variables
- [ ] Change default admin credentials
- [ ] Generate strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure MongoDB with authentication
- [ ] Set NODE_ENV=production
- [ ] Enable CORS for your domain
- [ ] Set up database backups
- [ ] Configure error logging
- [ ] Set up monitoring and alerts

### Deployment Options

1. **Heroku + MongoDB Atlas**
   - Deploy backend and frontend as separate apps
   - Use MongoDB Atlas for cloud database

2. **AWS EC2 + RDS/MongoDB**
   - Use EC2 for Node.js backend
   - Use CloudFront for React frontend
   - Use MongoDB Atlas or RDS for database

3. **DigitalOcean App Platform**
   - Use Docker containers for easy management
   - Cost-effective and simple

4. **Self-hosted VPS with Docker**
   - Use Docker Compose for management
   - Set up Nginx as reverse proxy
   - Use Let's Encrypt for SSL

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or specify different port
PORT=5001 npm start
```

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
brew services start mongodb-community
```

### CORS Errors
- Ensure `REACT_APP_API_URL` matches backend URL
- Check backend CORS configuration
- Verify request headers include Authorization if needed

### Authentication Issues
- Clear browser cookies and localStorage
- Verify JWT token is valid
- Check if token is being sent in Authorization header

### Frontend Not Connecting to Backend
- Check that both backend and frontend are running
- Verify `REACT_APP_API_URL` environment variable
- Check browser console for errors
- Verify firewall isn't blocking port 5000

## 📄 License

MIT License - feel free to use this project for personal and commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please create an issue on the repository.

## 🎨 Customization

### Theme Colors
Edit `frontend/src/styles/theme.css`:
```css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --accent: #4a9eff;
  --accent-dark: #357abd;
  --border: #333;
  --pixel-size: 2px;
}
```

### Post Types
Update the enums in `backend/models/Post.js` and options in frontend components.

## 📈 Future Enhancements

- [ ] Full-text search functionality
- [ ] Export posts to PDF
- [ ] Social media sharing
- [ ] Comments system (moderated)
- [ ] Multiple admin users with roles
- [ ] Advanced analytics dashboard
- [ ] Import/export functionality
- [ ] Dark/light theme toggle
- [ ] Multi-language support
- [ ] Calendar view for timeline browsing

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the flexible database
- All open-source contributors
- Pixel art community for inspiration

---

**Made with ❤️ for personal journaling**

"Every pixel tells a story."
