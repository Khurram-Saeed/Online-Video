import express from 'express';
import cors from 'cors';
import path from 'path';
import { YoutubeRoutes } from './routes/youtube';
import { InstagramRoutes } from './routes/instagram';
import { FacebookRoutes } from './routes/facebook';
import { TiktokRoutes } from './routes/tiktok';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🔄 [${timestamp}] ${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/youtube', YoutubeRoutes);
app.use('/api/instagram', InstagramRoutes);
app.use('/api/facebook', FacebookRoutes);
app.use('/api/tiktok', TiktokRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/youtube', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/youtube.html'));
});

app.get('/instagram', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/instagram.html'));
});

app.get('/facebook', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/facebook.html'));
});

app.get('/tiktok', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/tiktok.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Video Downloader API is running' });
});

// 404 handler - handled by express.static for now

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Video Downloader Server is running on http://localhost:${PORT}`);
  console.log(`📱 Access the website at http://localhost:${PORT}`);
});

export default app;