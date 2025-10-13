import express from 'express';
import { YtDlp } from 'ytdlp-nodejs';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const ytdlp = new YtDlp();

// Check if cookies.txt exists
const COOKIES_PATH = path.resolve(process.cwd(), 'cookies.txt');
const hasCookies = fs.existsSync(COOKIES_PATH);

// Get video info — FULL QUALITY (for single video)
router.post('/info', async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('🎬 [YouTube INFO] User requested info for URL:', url);
    
    if (!url) {
      console.log('❌ [YouTube INFO] No URL provided');
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      console.log('❌ [YouTube INFO] Invalid YouTube URL:', url);
      return res.status(400).json({ error: 'Please provide a valid YouTube URL' });
    }

    console.log('📡 [YouTube INFO] Fetching video information...');
    
    const execOptions: any = {};
    if (hasCookies) execOptions.cookies = COOKIES_PATH;

    const info = await ytdlp.getInfoAsync(url, execOptions);

    console.log('✅ [YouTube INFO] Successfully fetched video info:', {
      title: info.title,
      duration: (info as any).duration,
      uploader: (info as any).uploader,
      formats_count: Array.isArray((info as any).formats) ? (info as any).formats.length : 'N/A'
    });

    // FULL QUALITY options (for single video)
    const formatOptions = [
      { format_id: 'bestvideo[height=2160]+bestaudio/best[height<=2160]', ext: 'mkv', quality: '2160p (4K)', format_note: '4K (Requires ffmpeg)' },
      { format_id: 'best[height<=1440]', ext: 'mp4', quality: '1440p (2K)', format_note: '2K (Usually no ffmpeg needed)' },
      { format_id: 'best[height<=1080]', ext: 'mp4', quality: '1080p (Full HD)', format_note: '1080p (Best)' },
      { format_id: 'best[height<=720]', ext: 'mp4', quality: '720p (HD)' },
      { format_id: 'best[height<=480]', ext: 'mp4', quality: '480p (Standard)' },
      { format_id: 'best[height<=360]', ext: 'mp4', quality: '360p (Low)' },
      { format_id: 'bestaudio', ext: 'mp3', quality: 'Audio Only', format_note: 'Audio Only (MP3)' }
    ];

    console.log('📋 [YouTube INFO] Available formats:', formatOptions.map(f => f.quality));

    res.json({
      title: info.title,
      duration: (info as any).duration,
      uploader: (info as any).uploader || (info as any).channel,
      thumbnail: (info as any).thumbnail,
      view_count: (info as any).view_count,
      description: (info as any).description ? (info as any).description.substring(0, 200) + '...' : '',
      formats: formatOptions
    });
  } catch (error: any) {
    console.error('❌ [YouTube INFO] Error getting video info:', error.message);
    res.status(500).json({ error: 'Failed to get video information: ' + error.message });
  }
});

// Download video — FULL QUALITY (4K/2K supported)
router.post('/download', async (req, res) => {
  try {
    const { url, format_id, quality } = req.body;
    
    console.log('⬇️ [YouTube DOWNLOAD] User requested download:', { url, format_id, quality });
    
    if (!url) {
      console.log('❌ [YouTube DOWNLOAD] No URL provided');
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      console.log('❌ [YouTube DOWNLOAD] Invalid YouTube URL:', url);
      return res.status(400).json({ error: 'Please provide a valid YouTube URL' });
    }

    const info = await ytdlp.getInfoAsync(url);
    const safeTitle = info.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50);
    
    console.log('🎬 [YouTube DOWNLOAD] Starting download:', {
      title: info.title,
      format: format_id || 'best',
      quality: quality
    });

    const isFourKSelected = (typeof format_id === 'string' && /2160|bestvideo\[.*2160/.test(format_id)) || (typeof quality === 'string' && /2160/.test(quality));
    const desiredExt = isFourKSelected ? 'mkv' : 'mp4';

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${desiredExt}"`);

    console.log('🚀 [YouTube DOWNLOAD] Starting ytdlp download process...');

    try {
      if (isFourKSelected) {
        // 4K: download + merge to disk
        const tempDir = path.join(process.cwd(), 'tmp_downloads');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const finalPath = path.join(tempDir, `${safeTitle}.mkv`);

        const execOptions: any = {
          format: format_id || 'bestvideo[height=2160]+bestaudio/best',
          mergeOutputFormat: 'mkv',
          output: finalPath,
        };
        if (hasCookies) execOptions.cookies = COOKIES_PATH;

        const childProcess = ytdlp.exec(url, execOptions);

        childProcess.stderr?.on('data', (data) => {
          console.log('📊 [YouTube DOWNLOAD] Progress:', data.toString().trim());
        });

        childProcess.on('close', (code) => {
          console.log(`✅ [YouTube DOWNLOAD] Download process exited with code: ${code}`);
          if (code !== 0) {
            if (!res.headersSent) {
              res.status(500).json({ error: 'Download failed during merging. Ensure ffmpeg is installed and accessible.' });
            }
            return;
          }

          let streamPath = finalPath;
          if (!fs.existsSync(streamPath)) {
            const candidates = ['mkv', 'mp4', 'webm', 'm4v'].map(ext => path.join(tempDir, `${safeTitle}.${ext}`));
            for (const candidate of candidates) {
              if (fs.existsSync(candidate)) {
                streamPath = candidate;
                break;
              }
            }
            if (!fs.existsSync(streamPath)) {
              try {
                const files = fs.readdirSync(tempDir)
                  .filter(f => f.startsWith(`${safeTitle}.`) && !f.endsWith('.part'))
                  .map(f => path.join(tempDir, f));
                if (files.length) {
                  files.sort((a, b) => (fs.statSync(b).size - fs.statSync(a).size));
                  streamPath = files[0];
                }
              } catch (e) {
                // ignore
              }
            }
          }

          if (!fs.existsSync(streamPath)) {
            if (!res.headersSent) {
              res.status(500).json({ error: 'Merged file not found after download.' });
            }
            return;
          }

          const readStream = fs.createReadStream(streamPath);
          readStream.on('error', (err) => {
            console.error('❌ [YouTube DOWNLOAD] Read stream error:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to stream merged file: ' + err.message });
            }
          });
          readStream.on('close', () => {
            fs.unlink(streamPath, () => {});
          });
          readStream.pipe(res);
        });

        childProcess.on('error', (error) => {
          console.error('❌ [YouTube DOWNLOAD] Process error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed: ' + error.message });
          }
        });
      } else {
        // Non-4K: direct streaming
        const execOptions: any = {
          format: format_id || 'best[height<=1440]/best',
          output: '-',
        };
        if (hasCookies) execOptions.cookies = COOKIES_PATH;

        const childProcess = ytdlp.exec(url, execOptions);
        childProcess.stdout?.pipe(res);

        childProcess.on('close', (code) => {
          console.log(`✅ [YouTube DOWNLOAD] Download completed with code: ${code}`);
        });

        childProcess.on('error', (error) => {
          console.error('❌ [YouTube DOWNLOAD] Process error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed: ' + error.message });
          }
        });

        childProcess.stderr?.on('data', (data) => {
          console.log('📊 [YouTube DOWNLOAD] Progress:', data.toString().trim());
        });
      }
    } catch (execError: any) {
      console.error('❌ [YouTube DOWNLOAD] Failed to start download:', execError.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start download: ' + execError.message });
      }
    }

  } catch (error: any) {
    console.error('❌ [YouTube DOWNLOAD] Error downloading video:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video: ' + error.message });
    }
  }
});

// Get playlist info — MAX 720p
router.post('/playlist/info', async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('📋 [YouTube PLAYLIST INFO] User requested playlist info:', { url });
    
    if (!url) {
      console.log('❌ [YouTube PLAYLIST INFO] No URL provided');
      return res.status(400).json({ error: 'Playlist URL is required' });
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      console.log('❌ [YouTube PLAYLIST INFO] Invalid YouTube URL:', url);
      return res.status(400).json({ error: 'Please provide a valid YouTube URL' });
    }

    const execOptions: any = {};
    if (hasCookies) execOptions.cookies = COOKIES_PATH;

    const info = await ytdlp.getInfoAsync(url, execOptions);

    const playlistTitle = (info as any).playlist_title || (info as any).title || 'YouTube Playlist';
    const entries = (info as any).entries || [];
    
    console.log('✅ [YouTube PLAYLIST INFO] Successfully fetched playlist info:', {
      title: playlistTitle,
      video_count: entries.length
    });

    const formattedEntries = entries.map((entry: any, index: number) => {
      const vid = entry.id || entry.video_id || (entry.resource_id && entry.resource_id.videoId);
      const videoUrl = vid ? `https://www.youtube.com/watch?v=${vid}` : (entry.url || `https://www.youtube.com/watch?v=video_${index}`);
      return {
        id: vid || `video_${index}`,
        title: entry.title || `Video ${index + 1}`,
        url: videoUrl,
        duration: entry.duration,
        uploader: entry.uploader || entry.channel,
        thumbnail: entry.thumbnail,
        view_count: entry.view_count
      };
    });

    // Playlist: MAX 720p
    const formatOptions = [
      { format_id: 'best[height<=720]', ext: 'mp4', quality: '720p (HD)' },
      { format_id: 'best[height<=480]', ext: 'mp4', quality: '480p (Standard)' },
      { format_id: 'best[height<=360]', ext: 'mp4', quality: '360p (Low)' },
      { format_id: 'bestaudio', ext: 'mp3', quality: 'Audio Only', format_note: 'Audio Only (MP3)' }
    ];

    console.log('📋 [YouTube PLAYLIST INFO] Available formats:', formatOptions.map(f => f.quality));

    res.json({
      playlist_title: playlistTitle,
      playlist_count: entries.length,
      entries: formattedEntries,
      formats: formatOptions
    });
  } catch (error: any) {
    console.error('❌ [YouTube PLAYLIST INFO] Error getting playlist info:', error.message);
    res.status(500).json({ error: 'Failed to get playlist information: ' + error.message });
  }
});

// Download single video from playlist — MAX 720p
router.post('/playlist/download', async (req, res) => {
  try {
    const { url, format_id, quality, title } = req.body;
    
    console.log('⬇️ [YouTube PLAYLIST DOWNLOAD] User requested video download:', { url, format_id, quality, title });
    
    if (!url) {
      console.log('❌ [YouTube PLAYLIST DOWNLOAD] No URL provided');
      return res.status(400).json({ error: 'Video URL is required' });
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      console.log('❌ [YouTube PLAYLIST DOWNLOAD] Invalid YouTube URL:', url);
      return res.status(400).json({ error: 'Please provide a valid YouTube URL' });
    }

    const safeTitle = (title || 'YouTube_Video').replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50);
    
    console.log('🎬 [YouTube PLAYLIST DOWNLOAD] Starting download:', {
      title: title,
      format: format_id || 'best',
      quality: quality
    });

    const desiredExt = 'mp4';

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${desiredExt}"`);

    console.log('🚀 [YouTube PLAYLIST DOWNLOAD] Starting ytdlp download process...');

    try {
      const execOptions: any = {
        format: format_id || 'best[height<=720]/best',
        output: '-',
      };
      if (hasCookies) execOptions.cookies = COOKIES_PATH;

      const childProcess = ytdlp.exec(url, execOptions);
      childProcess.stdout?.pipe(res);

      childProcess.on('close', (code) => {
        console.log(`✅ [YouTube PLAYLIST DOWNLOAD] Download completed with code: ${code}`);
      });

      childProcess.on('error', (error) => {
        console.error('❌ [YouTube PLAYLIST DOWNLOAD] Process error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed: ' + error.message });
        }
      });

      childProcess.stderr?.on('data', (data) => {
        console.log('📊 [YouTube PLAYLIST DOWNLOAD] Progress:', data.toString().trim());
      });
    } catch (execError: any) {
      console.error('❌ [YouTube PLAYLIST DOWNLOAD] Failed to start download:', execError.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start download: ' + execError.message });
      }
    }

  } catch (error: any) {
    console.error('❌ [YouTube PLAYLIST DOWNLOAD] Error downloading video:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video: ' + error.message });
    }
  }
});

// Download as MP3
router.post('/mp3', async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('🎵 [YouTube MP3] User requested MP3 download for URL:', url);
    
    if (!url) {
      console.log('❌ [YouTube MP3] No URL provided');
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      console.log('❌ [YouTube MP3] Invalid YouTube URL:', url);
      return res.status(400).json({ error: 'Please provide a valid YouTube URL' });
    }

    const execOptions: any = {};
    if (hasCookies) execOptions.cookies = COOKIES_PATH;

    const info = await ytdlp.getInfoAsync(url, execOptions);
    const safeTitle = info.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50);
    
    console.log('🎵 [YouTube MP3] Starting MP3 download:', {
      title: info.title,
      safeTitle: safeTitle
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);

    console.log('🚀 [YouTube MP3] Starting ytdlp MP3 extraction...');

    try {
      const execOptions: any = {
        format: 'bestaudio',
        extractAudio: true,
        audioFormat: 'mp3',
        output: '-',
      };
      if (hasCookies) execOptions.cookies = COOKIES_PATH;

      const childProcess = ytdlp.exec(url, execOptions);
      childProcess.stdout?.pipe(res);
      
      childProcess.on('close', (code) => {
        console.log(`✅ [YouTube MP3] Download completed with code: ${code}`);
      });
      
      childProcess.on('error', (error) => {
        console.error('❌ [YouTube MP3] Process error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'MP3 download failed: ' + error.message });
        }
      });
      
      childProcess.stderr?.on('data', (data) => {
        console.log('📊 [YouTube MP3] Progress:', data.toString().trim());
      });
    } catch (execError: any) {
      console.error('❌ [YouTube MP3] Failed to start MP3 extraction:', execError.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start MP3 download: ' + execError.message });
      }
    }

  } catch (error: any) {
    console.error('❌ [YouTube MP3] Error downloading MP3:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download MP3: ' + error.message });
    }
  }
});

// Download YouTube Shorts — MAX 720p
router.post('/shorts', async (req, res) => {
  try {
    const { url, format_id, quality } = req.body;
    
    console.log('⚡ [YouTube SHORTS] User requested download:', { url, format_id, quality });
    
    if (!url) {
      console.log('❌ [YouTube SHORTS] No URL provided');
      return res.status(400).json({ error: 'Shorts URL is required' });
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      console.log('❌ [YouTube SHORTS] Invalid YouTube URL:', url);
      return res.status(400).json({ error: 'Please provide a valid YouTube URL' });
    }

    const execOptions: any = {};
    if (hasCookies) execOptions.cookies = COOKIES_PATH;

    const info = await ytdlp.getInfoAsync(url, execOptions);
    const safeTitle = info.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50);
    
    console.log('⚡ [YouTube SHORTS] Starting download:', {
      title: info.title,
      format: format_id || 'best',
      quality: quality
    });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);

    console.log('🚀 [YouTube SHORTS] Starting ytdlp download process...');

    try {
      const execOptions: any = {
        format: format_id || 'best[height<=720]/best',
        output: '-',
      };
      if (hasCookies) execOptions.cookies = COOKIES_PATH;

      const childProcess = ytdlp.exec(url, execOptions);
      childProcess.stdout?.pipe(res);
      
      childProcess.on('close', (code) => {
        console.log(`✅ [YouTube SHORTS] Download completed with code: ${code}`);
      });
      
      childProcess.on('error', (error) => {
        console.error('❌ [YouTube SHORTS] Process error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Shorts download failed: ' + error.message });
        }
      });
      
      childProcess.stderr?.on('data', (data) => {
        console.log('📊 [YouTube SHORTS] Progress:', data.toString().trim());
      });
    } catch (execError: any) {
      console.error('❌ [YouTube SHORTS] Failed to start download:', execError.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start Shorts download: ' + execError.message });
      }
    }

  } catch (error: any) {
    console.error('❌ [YouTube SHORTS] Error downloading Shorts:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download Shorts: ' + error.message });
    }
  }
});

// Cleanup tmp dir on startup
(() => {
  const tempDir = path.join(process.cwd(), 'tmp_downloads');
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('⚠️ Could not clean tmp_downloads on startup');
    }
  }
  fs.mkdirSync(tempDir, { recursive: true });
})();

export { router as YoutubeRoutes };
