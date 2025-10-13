import express from 'express';
import { YtDlp } from 'ytdlp-nodejs';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const ytdlp = new YtDlp();

// Get video info
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
    
    // Get video information using ytdlp
    const info = await ytdlp.getInfoAsync(url);

    console.log('✅ [YouTube INFO] Successfully fetched video info:', {
      title: info.title,
      duration: (info as any).duration,
      uploader: (info as any).uploader,
      formats_count: Array.isArray((info as any).formats) ? (info as any).formats.length : 'N/A'
    });

    // Create format options for user selection — MAX 1440p
    const formatOptions = [
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
  } catch (error) {
    console.error('❌ [YouTube INFO] Error getting video info:', error.message);
    res.status(500).json({ error: 'Failed to get video information: ' + error.message });
  }
});

// Download video — MAX 1440p (no 4K logic)
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

    // First get video info to determine filename
    console.log('📡 [YouTube DOWNLOAD] Getting video info for filename...');
    const info = await ytdlp.getInfoAsync(url);

    const safeTitle = info.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50);
    
    console.log('🎬 [YouTube DOWNLOAD] Starting download:', {
      title: info.title,
      format: format_id || 'best',
      quality: quality
    });

    // Since we removed 4K, always use mp4 and direct streaming
    const desiredExt = 'mp4';

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${desiredExt}"`);

    console.log('🚀 [YouTube DOWNLOAD] Starting ytdlp download process...');

    try {
      // ALWAYS use direct streaming (no 4K = no disk merge needed)
      const execOptions: any = {
        format: format_id || 'best[height<=1440]/best',
        output: '-', // Output to stdout
      };
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
    } catch (execError) {
      console.error('❌ [YouTube DOWNLOAD] Failed to start download:', execError);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start download: ' + execError.message });
      }
    }

  } catch (error) {
    console.error('❌ [YouTube DOWNLOAD] Error downloading video:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video: ' + error.message });
    }
  }
});

// Get playlist info — MAX 1440p
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

    console.log('📡 [YouTube PLAYLIST INFO] Getting playlist information...');
    
    // Get playlist information using ytdlp to get all entries
    const info = await ytdlp.getInfoAsync(url);

    const playlistTitle = (info as any).playlist_title || (info as any).title || 'YouTube Playlist';
    const entries = (info as any).entries || [];
    
    console.log('✅ [YouTube PLAYLIST INFO] Successfully fetched playlist info:', {
      title: playlistTitle,
      video_count: entries.length
    });

    // Format entries for frontend
    const formattedEntries = entries.map((entry: any, index: number) => {
      const vid = entry.id || entry.video_id || (entry.resource_id && entry.resource_id.videoId);
      const videoUrl = vid ? `https://www.youtube.com/watch?v=${vid}` : (entry.url || `    https://www.youtube.com/watch?v=video_${index}`);
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

    // Format options — MAX 1440p
    const formatOptions = [
      { format_id: 'best[height<=1440]', ext: 'mp4', quality: '1440p (2K)', format_note: '2K (Usually no ffmpeg needed)' },
      { format_id: 'best[height<=1080]', ext: 'mp4', quality: '1080p (Best)' },
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
  } catch (error) {
    console.error('❌ [YouTube PLAYLIST INFO] Error getting playlist info:', error.message);
    res.status(500).json({ error: 'Failed to get playlist information: ' + error.message });
  }
});

// Download single video from playlist — MAX 1440p
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

    // Always mp4, no 4K
    const desiredExt = 'mp4';

    // Set response headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${desiredExt}"`);

    console.log('🚀 [YouTube PLAYLIST DOWNLOAD] Starting ytdlp download process...');

    try {
      // Direct streaming only
      const execOptions: any = {
        format: format_id || 'best[height<=1440]/best',
        output: '-',
      };
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
    } catch (execError) {
      console.error('❌ [YouTube PLAYLIST DOWNLOAD] Failed to start download:', execError);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start download: ' + execError.message });
      }
    }

  } catch (error) {
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

    // Get video info for filename
    console.log('📡 [YouTube MP3] Getting video info...');
    const info = await ytdlp.getInfoAsync(url);

    const safeTitle = info.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50);
    
    console.log('🎵 [YouTube MP3] Starting MP3 download:', {
      title: info.title,
      safeTitle: safeTitle
    });

    // Set response headers for MP3 download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);

    console.log('🚀 [YouTube MP3] Starting ytdlp MP3 extraction...');

    try {
      const childProcess = ytdlp.exec(url, {
        format: 'bestaudio',
        extractAudio: true,
        audioFormat: 'mp3',
        output: '-',
      });
      
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
    } catch (execError) {
      console.error('❌ [YouTube MP3] Failed to start MP3 extraction:', execError);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start MP3 download: ' + execError.message });
      }
    }

  } catch (error) {
    console.error('❌ [YouTube MP3] Error downloading MP3:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download MP3: ' + error.message });
    }
  }
});

// Download YouTube Shorts
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

    // First get video info to determine filename
    console.log('📡 [YouTube SHORTS] Getting video info for filename...');
    const info = await ytdlp.getInfoAsync(url);

    const safeTitle = info.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50);
    
    console.log('⚡ [YouTube SHORTS] Starting download:', {
      title: info.title,
      format: format_id || 'best',
      quality: quality
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);

    console.log('🚀 [YouTube SHORTS] Starting ytdlp download process...');

    try {
      const childProcess = ytdlp.exec(url, {
        format: format_id || 'best[height<=1440]/best',
        output: '-', // Output to stdout
      });
      
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
    } catch (execError) {
      console.error('❌ [YouTube SHORTS] Failed to start download:', execError);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to start Shorts download: ' + execError.message });
      }
    }

  } catch (error) {
    console.error('❌ [YouTube SHORTS] Error downloading Shorts:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download Shorts: ' + error.message });
    }
  }
});


export { router as YoutubeRoutes };
