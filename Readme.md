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
