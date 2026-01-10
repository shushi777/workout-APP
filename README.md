# 🏋️ Workout Video Editor

Progressive Web App (PWA) for editing workout videos with AI-powered scene detection, interactive timeline editing, and exercise tagging.

## ✨ Features

- 📹 **Video Upload**: Drag-and-drop video upload with multiple format support
- 🤖 **AI Scene Detection**: Automatic cut point detection using PySceneDetect
- ✂️ **Interactive Timeline**: Canvas-based timeline with drag-and-drop cut point adjustment
- 🏷️ **Exercise Tagging**: Tag segments with exercise name, muscle groups, and equipment
- 💾 **Cloud Storage**: Free video storage with Cloudflare R2 (10GB free + unlimited bandwidth)
- 📱 **PWA Support**: Install as mobile app with Web Share Target integration
- 🔍 **Exercise Library**: Search and filter saved exercises

## 🚀 Live Demo

**Production URL**: `https://your-app.up.railway.app` _(update after deployment)_

## 📋 Tech Stack

- **Backend**: Flask (Python 3.13)
- **Database**: PostgreSQL
- **Storage**: Cloudflare R2 (S3-compatible)
- **Video Processing**: FFmpeg + PySceneDetect + OpenCV
- **Frontend**: Vanilla JavaScript + Canvas API
- **Hosting**: Railway
- **WSGI Server**: Gunicorn

## 🛠️ Local Development

### Prerequisites

- Python 3.13.3
- PostgreSQL 14+
- FFmpeg
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/workout-video-editor.git
   cd workout-video-editor
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install FFmpeg**
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt-get install ffmpeg`

4. **Set up PostgreSQL**
   - Follow instructions in `DATABASE_SETUP.md`
   - Create database and run migrations

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local database credentials
   ```

6. **Run database migrations**
   ```bash
   python run_migration.py
   ```

7. **Start the development server**
   ```bash
   python server.py
   ```

8. **Open in browser**
   ```
   http://localhost:5000
   ```

## 🌐 Deployment

This app is designed for **free deployment** on Railway with Cloudflare R2 storage.

### Quick Deploy

1. **Prepare Cloudflare R2** (100% FREE)
   - Follow `CLOUDFLARE_R2_SETUP.md`
   - Get your credentials ready

2. **Deploy to Railway**
   - Follow `DEPLOYMENT.md` for detailed step-by-step instructions
   - Or use the quick checklist in `DEPLOYMENT_CHECKLIST.md`

3. **Set environment variables**
   - See `.env.example` for all required variables
   - Critical: `SECRET_KEY`, `R2_*` credentials, `STORAGE_BACKEND=r2`

### Total Monthly Cost: **$0-5**
- Railway: $5 free credit/month
- Cloudflare R2: 10GB free + unlimited bandwidth

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide for Railway
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[CLOUDFLARE_R2_SETUP.md](CLOUDFLARE_R2_SETUP.md)** - Cloudflare R2 setup instructions
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - PostgreSQL installation and setup
- **[CLAUDE.md](CLAUDE.md)** - Project overview and development guide

## 🏗️ Project Structure

```
workout_APP/
├── server.py                    # Flask backend
├── config.py                    # Configuration management
├── storage.py                   # Storage abstraction (Local/S3/R2)
├── video_processing.py          # FFmpeg video cutting
├── index.html                   # Upload page
├── timeline-editor.html         # Timeline editor
├── exercise-library.html        # Exercise library
├── static/
│   ├── css/                     # Stylesheets
│   └── js/                      # Frontend JavaScript
├── migrations/                  # Database migrations
├── Procfile                     # Railway deployment config
├── nixpacks.toml                # System dependencies
├── runtime.txt                  # Python version
├── requirements.txt             # Python dependencies
└── .env.example                 # Environment variables template
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key (generate with `secrets.token_hex(32)`) | Required |
| `FLASK_ENV` | Environment (`development`, `production`) | `development` |
| `STORAGE_BACKEND` | Storage type (`local`, `s3`, `r2`) | `local` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | Required for R2 |
| `R2_BUCKET_NAME` | R2 bucket name | Required for R2 |
| `R2_ACCESS_KEY` | R2 access key ID | Required for R2 |
| `R2_SECRET_KEY` | R2 secret access key | Required for R2 |
| `R2_PUBLIC_URL` | R2 public URL | Required for R2 |
| `DATABASE_URL` | PostgreSQL connection string (Railway auto-sets) | Auto |

See `.env.example` for all available variables.

## 🎯 Usage

1. **Upload Video**: Drag and drop a workout video on the upload page
2. **Scene Detection**: AI automatically detects scene transitions
3. **Edit Timeline**: Adjust cut points, add manual cuts, zoom in/out
4. **Tag Segments**: Add exercise name, muscle groups, and equipment for each segment
5. **Save**: Videos are split into segments and uploaded to cloud storage
6. **Browse Library**: Search, filter, and play saved exercises

## 🧪 Testing

### Manual Testing Checklist

- [ ] Upload video with scene detection
- [ ] Drag cut points on timeline
- [ ] Add manual cut points
- [ ] Tag segments with exercise details
- [ ] Save and verify videos in library
- [ ] Search and filter exercises
- [ ] Install PWA on mobile
- [ ] Share video via Web Share Target

## 🐛 Troubleshooting

### Common Issues

**OpenCV ImportError**
- Solution: Project uses `opencv-python-headless` + `nixpacks.toml` for Railway

**Database Connection Failed**
- Solution: Verify `DATABASE_URL` is set (Railway auto-provides)

**Videos Not Uploading to R2**
- Solution: Check all R2 environment variables are set correctly

See `DEPLOYMENT.md` for detailed troubleshooting.

## 📝 License

MIT License - feel free to use this project for your own workout tracking!

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Contact

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ using Flask, PostgreSQL, and Cloudflare R2**
