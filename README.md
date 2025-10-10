# 🎥 Video Downloader Website

A modern web application for downloading videos from popular platforms including YouTube, Instagram, Facebook, and TikTok. Built with TypeScript, Node.js, Express, and uses ytdlp-nodejs for video processing.

## ✨ Features

### Supported Platforms
- **YouTube**: Regular videos, Shorts, Playlists, MP3 audio extraction
- **Instagram**: Reels, Stories, Posts
- **Facebook**: Reels, Videos, Watch content
- **TikTok**: Short videos, Long videos, Audio extraction

### Key Features
- 🚀 Fast and reliable downloads
- 📱 Mobile and desktop responsive design
- 🎯 Multiple video quality options
- 🎵 Audio extraction (MP3)
- 🔒 Secure and private (no registration required)
- 💯 Completely free to use
- 🌍 Multi-platform support

## 🛠️ Tech Stack

**Backend:**
- Node.js with TypeScript
- Express.js server framework
- ytdlp-nodejs for video processing
- CORS for cross-origin requests

**Frontend:**
- Vanilla HTML5, CSS3, and JavaScript
- Responsive design with CSS Grid and Flexbox
- No framework dependencies for simplicity

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Python (required by yt-dlp)
- ffmpeg (required for merging video+audio streams and 4K downloads)

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd video-downloader-website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Or start the production server:**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run watch` - Watch TypeScript files and recompile on changes
- `npm run clean` - Clean build directory

## 🏗️ Project Structure

```
video-downloader-website/
├── src/                    # TypeScript source files
│   ├── routes/            # API route handlers
│   │   ├── youtube.ts     # YouTube download routes
│   │   ├── instagram.ts   # Instagram download routes
│   │   ├── facebook.ts    # Facebook download routes
│   │   └── tiktok.ts      # TikTok download routes
│   └── server.ts          # Main server file
├── public/                # Static frontend files
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   ├── pages/            # HTML pages
│   └── index.html        # Homepage
├── dist/                 # Compiled JavaScript (generated)
├── tsconfig.json         # TypeScript configuration
├── package.json          # Project dependencies and scripts
└── README.md            # Project documentation
```

## 🔧 API Endpoints

### YouTube
- `POST /api/youtube/info` - Get video information
- `POST /api/youtube/download` - Download video
- `POST /api/youtube/playlist` - Download playlist
- `POST /api/youtube/shorts` - Download YouTube Shorts
- `POST /api/youtube/mp3` - Download audio as MP3

### Instagram
- `POST /api/instagram/info` - Get content information
- `POST /api/instagram/reel` - Download Instagram Reel
- `POST /api/instagram/story` - Download Instagram Story
- `POST /api/instagram/post` - Download Instagram Post

### Facebook
- `POST /api/facebook/info` - Get content information
- `POST /api/facebook/reel` - Download Facebook Reel
- `POST /api/facebook/video` - Download Facebook Video
- `POST /api/facebook/watch` - Download Facebook Watch

### TikTok
- `POST /api/tiktok/info` - Get video information
- `POST /api/tiktok/short` - Download short video
- `POST /api/tiktok/long` - Download long video
- `POST /api/tiktok/video` - Download any video
- `POST /api/tiktok/audio` - Extract audio as MP3

## 🌐 Usage

1. **Navigate to the homepage** at `http://localhost:3000`
2. **Choose a platform** (YouTube, Instagram, Facebook, or TikTok)
3. **Paste the video URL** in the input field
4. **Click "Get Info"** to fetch video details
5. **Select quality/format** if needed
6. **Click "Download"** to start the download

## 🔒 Privacy & Security

- No user registration required
- URLs are processed server-side only
- No video content is stored permanently
- Downloads are streamed directly to users
- Respects content creators' rights

## ⚠️ Important Notes

- This tool is for personal use only
- Respect copyright laws and content creators' rights
- Some private content may not be accessible
- Download speeds depend on your internet connection
- Ensure you have proper permissions to download content

## 🐛 Troubleshooting

**Common Issues:**

1. **"ytdlp-nodejs not found" error:**
   - Ensure Python is installed and accessible
   - Try reinstalling: `npm install ytdlp-nodejs`

2. **Downloads not working:**
   - Check if the URL is correct and publicly accessible
   - Some platforms may block automated downloads

3. **Server not starting:**
   - Check if port 3000 is available
   - Run `npm run build` first for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [ytdlp-nodejs](https://github.com/iqbal-rashed/ytdlp-nodejs) for video processing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for the underlying video extraction
- Express.js and Node.js communities

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information

---

**⚠️ Disclaimer:** This tool is for educational and personal use only. Always respect copyright laws and the terms of service of the platforms you're downloading from.