<!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube 4K Downloader Pro</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        h1 {
            color: #333;
            font-size: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 8px;
        }
        
        .badge {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        
        .input-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        
        .input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        input {
            flex: 1;
            padding: 16px;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            font-size: 15px;
            transition: all 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
        
        .btn-primary {
            padding: 16px 35px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            white-space: nowrap;
        }
        
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .api-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 13px;
            color: #28a745;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background: #28a745;
            border-radius: 50%;
            animation: blink 1.5s infinite;
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        
        .loading {
            text-align: center;
            padding: 30px;
            display: none;
        }
        
        .loading.show {
            display: block;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: #667eea;
            font-weight: 600;
        }
        
        .error, .success {
            padding: 16px;
            border-radius: 12px;
            margin: 15px 0;
            display: none;
            animation: slideIn 0.3s;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .error {
            background: #fee;
            color: #c33;
            border: 2px solid #fcc;
        }
        
        .error.show {
            display: block;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
        }
        
        .success.show {
            display: block;
        }
        
        .video-preview {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
            display: none;
        }
        
        .video-preview.show {
            display: block;
            animation: fadeIn 0.5s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .video-header {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .thumbnail-wrapper {
            position: relative;
            flex-shrink: 0;
        }
        
        .thumbnail {
            width: 240px;
            height: 135px;
            border-radius: 12px;
            object-fit: cover;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .duration-badge {
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .video-info {
            flex: 1;
        }
        
        .video-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .video-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            font-size: 13px;
            color: #666;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin: 25px 0 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .formats-grid {
            display: grid;
            gap: 12px;
        }
        
        .format-card {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .format-card:hover {
            border-color: #667eea;
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        
        .format-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .quality-tag {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 18px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 15px;
            min-width: 90px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        
        .quality-tag.ultra {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .quality-tag.high {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        
        .quality-tag.medium {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
        
        .format-details {
            flex: 1;
        }
        
        .format-type {
            font-weight: 600;
            color: #333;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .format-specs {
            color: #666;
            font-size: 13px;
        }
        
        .download-btn {
            padding: 12px 24px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .download-btn:hover:not(:disabled) {
            background: #218838;
            transform: scale(1.05);
        }
        
        .download-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .info-box {
            background: linear-gradient(135deg, #e7f3ff 0%, #f0e7ff 100%);
            border: 2px solid #b3d9ff;
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            font-size: 13px;
            line-height: 1.7;
        }
        
        .info-box strong {
            color: #004085;
            display: block;
            margin-bottom: 8px;
        }
        
        .info-box ul {
            margin-left: 20px;
            color: #004085;
        }
        
        .info-box li {
            margin: 5px 0;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 25px;
            }
            
            .video-header {
                flex-direction: column;
            }
            
            .thumbnail {
                width: 100%;
                height: auto;
            }
            
            .input-group {
                flex-direction: column;
            }
            
            .format-card {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
            
            .format-left {
                flex-direction: column;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                🎬 YouTube Downloader
                <span class="badge">4K PRO</span>
            </h1>
            <p class="subtitle">High Quality Downloads - All Resolutions</p>
        </div>
        
        <div class="input-section">
            <div class="input-group">
                <input type="text" id="urlInput" placeholder="YouTube video URL yahan paste karein (e.g., https://www.youtube.com/watch?v=...)">
                <button class="btn-primary" id="fetchBtn">🔍 Get Video</button>
            </div>
            <div class="api-status">
                <span class="status-dot"></span>
                API Connected & Ready
            </div>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div class="loading-text">Video information load ho rahi hai...</div>
        </div>
        
        <div class="error" id="error"></div>
        <div class="success" id="success"></div>
        
        <div class="video-preview" id="videoPreview">
            <div class="video-header">
                <div class="thumbnail-wrapper">
                    <img class="thumbnail" id="thumbnail" alt="Video Thumbnail">
                    <div class="duration-badge" id="durationBadge"></div>
                </div>
                <div class="video-info">
                    <div class="video-title" id="videoTitle"></div>
                    <div class="video-meta">
                        <div class="meta-item">
                            <span>📺</span>
                            <span id="channel"></span>
                        </div>
                        <div class="meta-item">
                            <span>👁️</span>
                            <span id="views"></span>
                        </div>
                        <div class="meta-item">
                            <span>📅</span>
                            <span id="uploadDate"></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section-header">
                🎥 Video Quality Options
            </div>
            <div class="formats-grid" id="videoFormats"></div>
            
            <div class="section-header">
                🎵 Audio Only Downloads
            </div>
            <div class="formats-grid" id="audioFormats"></div>
        </div>
        
        <div class="info-box">
            <strong>💡 Kaise Use Karein:</strong>
            <ul>
                <li>YouTube se kisi bhi video ka URL copy karein</li>
                <li>Upar input box mein paste karein aur "Get Video" click karein</li>
                <li>Apni pasand ki quality select karke download button click karein</li>
                <li>Video automatically download hona shuru ho jayegi</li>
            </ul>
            <strong style="margin-top: 12px;">✨ Supported Formats:</strong>
            <ul>
                <li>Video: 4K (2160p), 1440p, 1080p, 720p, 480p, 360p</li>
                <li>Audio: MP3, M4A, WEBM (High Quality)</li>
            </ul>
        </div>
    </div>

    <script>
        const API_KEY = 'de28b57151msha29c0cb0c3be776p1c3177jsn7c7a2b4a02d5';
        const API_HOST = 'youtube-media-downloader.p.rapidapi.com';
        
        const urlInput = document.getElementById('urlInput');
        const fetchBtn = document.getElementById('fetchBtn');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const success = document.getElementById('success');
        const videoPreview = document.getElementById('videoPreview');
        const thumbnail = document.getElementById('thumbnail');
        const durationBadge = document.getElementById('durationBadge');
        const videoTitle = document.getElementById('videoTitle');
        const channel = document.getElementById('channel');
        const views = document.getElementById('views');
        const uploadDate = document.getElementById('uploadDate');
        const videoFormats = document.getElementById('videoFormats');
        const audioFormats = document.getElementById('audioFormats');

        function getVideoId(url) {
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
                /youtube\.com\/shorts\/([^&\n?#]+)/
            ];
            
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) return match[1];
            }
            return null;
        }

        function formatDuration(seconds) {
            if (!seconds) return '0:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            
            if (h > 0) {
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            return `${m}:${s.toString().padStart(2, '0')}`;
        }

        function formatNumber(num) {
            if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }

        function getQualityClass(quality) {
            const q = parseInt(quality);
            if (q >= 1440) return 'ultra';
            if (q >= 720) return 'high';
            return 'medium';
        }

        async function fetchVideoInfo() {
            const url = urlInput.value.trim();
            if (!url) {
                showError('❌ Please YouTube video URL enter karein');
                return;
            }

            const videoId = getVideoId(url);
            if (!videoId) {
                showError('❌ Invalid YouTube URL! Sahi URL enter karein');
                return;
            }

            loading.classList.add('show');
            error.classList.remove('show');
            success.classList.remove('show');
            videoPreview.classList.remove('show');
            fetchBtn.disabled = true;

            try {
                // Video info fetch karein
                const infoUrl = `https://${API_HOST}/v2/video/details?videoId=${videoId}`;
                
                const response = await fetch(infoUrl, {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': API_KEY,
                        'X-RapidAPI-Host': API_HOST
                    }
                });
                
                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const data = await response.json();
                
                if (!data || !data.title) {
                    throw new Error('Video data not found');
                }
                
                displayVideoInfo(data, videoId);
                showSuccess('✅ Video successfully load ho gai!');
                
            } catch (err) {
                console.error('Error:', err);
                showError('❌ Video load nahi hui! URL check karein ya thodi der baad try karein.');
            } finally {
                loading.classList.remove('show');
                fetchBtn.disabled = false;
            }
        }

        function displayVideoInfo(data, videoId) {
            // Basic info
            thumbnail.src = data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            thumbnail.onerror = () => {
                thumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            };
            
            videoTitle.textContent = data.title || 'Unknown Title';
            durationBadge.textContent = formatDuration(data.lengthSeconds);
            channel.textContent = data.channelTitle || data.author || 'Unknown Channel';
            views.textContent = formatNumber(data.viewCount || 0) + ' views';
            uploadDate.textContent = data.uploadDate || 'Unknown date';
            
            // Video formats
            videoFormats.innerHTML = '';
            const videoLinks = data.formats?.filter(f => f.hasVideo && f.hasAudio) || [];
            
            // Sort by quality
            const sortedVideos = [...videoLinks].sort((a, b) => {
                return (parseInt(b.qualityLabel) || 0) - (parseInt(a.qualityLabel) || 0);
            });
            
            if (sortedVideos.length > 0) {
                sortedVideos.forEach(format => {
                    if (format.url) {
                        const card = createFormatCard(format, 'video', videoId);
                        videoFormats.appendChild(card);
                    }
                });
            } else {
                videoFormats.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Video formats available nahi hain</p>';
            }
            
            // Audio formats
            audioFormats.innerHTML = '';
            const audioLinks = data.formats?.filter(f => f.hasAudio && !f.hasVideo) || [];
            
            if (audioLinks.length > 0) {
                const sortedAudio = [...audioLinks].sort((a, b) => {
                    return (parseInt(b.audioBitrate) || 0) - (parseInt(a.audioBitrate) || 0);
                });
                
                sortedAudio.slice(0, 5).forEach(format => {
                    if (format.url) {
                        const card = createFormatCard(format, 'audio', videoId);
                        audioFormats.appendChild(card);
                    }
                });
            } else {
                audioFormats.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Audio formats available nahi hain</p>';
            }
            
            videoPreview.classList.add('show');
        }

        function createFormatCard(format, type, videoId) {
            const card = document.createElement('div');
            card.className = 'format-card';
            
            let quality, formatType, specs, qualityClass;
            
            if (type === 'video') {
                quality = format.qualityLabel || format.quality || 'Unknown';
                formatType = (format.mimeType?.split(';')[0]?.split('/')[1] || 'MP4').toUpperCase();
                const size = format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown size';
                const fps = format.fps ? format.fps + ' FPS' : '';
                specs = `${formatType} • ${size}${fps ? ' • ' + fps : ''}`;
                qualityClass = getQualityClass(quality);
            } else {
                quality = format.audioBitrate ? format.audioBitrate + 'kbps' : 'Audio';
                formatType = (format.mimeType?.split(';')[0]?.split('/')[1] || 'Audio').toUpperCase();
                const size = format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown size';
                specs = `${formatType} • ${size}`;
                qualityClass = 'medium';
            }
            
            card.innerHTML = `
                <div class="format-left">
                    <div class="quality-tag ${qualityClass}">${quality}</div>
                    <div class="format-details">
                        <div class="format-type">${type === 'video' ? '🎥 Video' : '🎵 Audio Only'}</div>
                        <div class="format-specs">${specs}</div>
                    </div>
                </div>
                <button class="download-btn" onclick="downloadVideo('${format.url}', '${videoTitle.textContent}', '${quality}', '${type}')">
                    ⬇️ Download
                </button>
            `;
            
            return card;
        }

        function downloadVideo(url, title, quality, type) {
            if (!url) {
                showError('❌ Download link available nahi hai');
                return;
            }
            
            showSuccess(`✅ ${quality} ${type} download shuru ho rahi hai...`);
            
            // Create temporary link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}_${quality}.${type === 'video' ? 'mp4' : 'mp3'}`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        function showError(message) {
            error.innerHTML = message;
            error.classList.add('show');
            setTimeout(() => error.classList.remove('show'), 5000);
        }

        function showSuccess(message) {
            success.innerHTML = message;
            success.classList.add('show');
            setTimeout(() => success.classList.remove('show'), 4000);
        }

        fetchBtn.addEventListener('click', fetchVideoInfo);
        
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchVideoInfo();
            }
        });

        // Clear error on input
        urlInput.addEventListener('input', () => {
            error.classList.remove('show');
        });
    </script>
</body>
</html>
