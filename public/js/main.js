// Main JavaScript functionality for Video Downloader

// Global variables
let currentPlatform = '';
let currentPlaylistData = null;
let downloadQueue = [];
let isDownloading = false;

// Utility functions
function showLoading(text = 'Processing your request...') {
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    if (loading) {
        loading.classList.remove('hidden');
        if (loadingText) loadingText.textContent = text;
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

function showProgress(text = 'Downloading...', percentage = 0) {
    const progressContainer = document.getElementById('progress-container');
    const progressText = document.getElementById('progress-text');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressFill = document.getElementById('progress-fill');
    
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
        if (progressText) progressText.textContent = text;
        if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
        if (progressFill) progressFill.style.width = `${percentage}%`;
    }
}

function updateProgress(percentage, speed = '', eta = '') {
    const progressPercentage = document.getElementById('progress-percentage');
    const progressFill = document.getElementById('progress-fill');
    const progressSpeed = document.getElementById('progress-speed');
    const progressEta = document.getElementById('progress-eta');
    
    if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressSpeed) progressSpeed.textContent = speed;
    if (progressEta) progressEta.textContent = eta;
}

function hideProgress() {
    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) {
        progressContainer.classList.add('hidden');
    }
}

function showError(message, details = null) {
    let errorMsg = `Error: ${message}`;
    if (details) {
        errorMsg += `\n\nDetails: ${details}`;
    }
    alert(errorMsg);
    console.error('Error:', message, details ? `Details: ${details}` : '');
}

function showSuccess(message) {
    console.log('Success:', message);
}

function formatDuration(seconds) {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// API helper functions
async function makeAPIRequest(endpoint, data) {
    try {
        showLoading();
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            let errorDetails = null;
            if (contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                    errorDetails = errorData.details || null;
                } catch (_) {
                    // ignore JSON parse error in error path
                }
            } else {
                try {
                    const text = await response.text();
                    errorDetails = text.substring(0, 300);
                } catch (_) {}
            }
            const error = new Error(errorMsg);
            error.details = errorDetails;
            throw error;
        }

        if (!contentType.includes('application/json')) {
            const text = await response.text();
            const error = new Error('Unexpected non-JSON response from server');
            error.details = text.substring(0, 300);
            throw error;
        }

        return await response.json();
    } catch (error) {
        showError(error.message, error.details);
        throw error;
    } finally {
        hideLoading();
    }
}

async function downloadFile(endpoint, data, filename = null, showProgressBar = true) {
    try {
        hideLoading();
        if (showProgressBar) {
            showProgress('Starting download...', 0);
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.error || 'Download failed';
            const errorDetails = errorData.details || null;
            
            const error = new Error(errorMsg);
            error.details = errorDetails;
            throw error;
        }

        // Show progress
        if (showProgressBar) {
            updateProgress(50, 'Preparing download...', '');
        }

        // Create blob and download
        const blob = await response.blob();
        
        if (showProgressBar) {
            updateProgress(75, 'Creating download...', '');
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename || 'video';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        if (showProgressBar) {
            updateProgress(100, 'Complete!', '');
            setTimeout(() => hideProgress(), 2000);
        }
        
        showSuccess('Download started successfully!');
    } catch (error) {
        showError(error.message, error.details);
        if (showProgressBar) {
            hideProgress();
        }
        throw error;
    }
}

// YouTube functionality
function initializeYouTubePage() {
    window.__vdInit = window.__vdInit || {};
    if (window.__vdInit.youtube) return;
    window.__vdInit.youtube = true;
    currentPlatform = 'youtube';
    initializeTabs();
    
    // Video download
    const videoForm = document.getElementById('youtube-video-form');
    const getVideoInfoBtn = document.getElementById('get-video-info');
    const downloadVideoBtn = document.getElementById('download-video-btn');
    
    if (getVideoInfoBtn) {
        getVideoInfoBtn.addEventListener('click', async () => {
            const url = document.getElementById('video-url').value;
            if (!url) {
                showError('Please enter a YouTube URL');
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/youtube/info', { url });
                displayVideoInfo(info, 'video');
                downloadVideoBtn.disabled = false;
            } catch (error) {
                console.error('Error getting video info:', error);
            }
        });
    }
    
    if (videoForm) {
        videoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('video-url').value;
            const formatSelect = document.getElementById('video-format');
            const format_id = formatSelect ? formatSelect.value : 'best';
            const selectedOption = formatSelect ? formatSelect.options[formatSelect.selectedIndex] : null;
            const quality = selectedOption ? selectedOption.textContent.split(' ')[0] : 'best';
            
            try {
                await downloadFile('/api/youtube/download', { url, format_id, quality }, 'youtube-video.mp4');
            } catch (error) {
                console.error('Error downloading video:', error);
            }
        });
    }
    
    // Playlist download
    const playlistForm = document.getElementById('youtube-playlist-form');
    const getPlaylistInfoBtn = document.getElementById('get-playlist-info');
    
    if (getPlaylistInfoBtn) {
        getPlaylistInfoBtn.addEventListener('click', async () => {
            const url = document.getElementById('playlist-url').value;
            if (!url) {
                showError('Please enter a YouTube playlist URL');
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/youtube/playlist/info', { url });
                displayPlaylistInfo(info);
                currentPlaylistData = info;
            } catch (error) {
                console.error('Error getting playlist info:', error);
            }
        });
    }
    
    // Shorts download
    const shortsForm = document.getElementById('youtube-shorts-form');
    const getShortsInfoBtn = document.getElementById('get-shorts-info');
    const downloadShortsBtn = document.getElementById('download-shorts-btn');
    
    if (getShortsInfoBtn) {
        getShortsInfoBtn.addEventListener('click', async () => {
            const url = document.getElementById('shorts-url').value;
            if (!url) {
                showError('Please enter a YouTube Shorts URL');
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/youtube/info', { url });
                displayVideoInfo(info, 'shorts');
                downloadShortsBtn.disabled = false;
            } catch (error) {
                console.error('Error getting shorts info:', error);
            }
        });
    }
    
    if (shortsForm) {
        shortsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('shorts-url').value;
            const formatSelect = document.getElementById('shorts-format');
            const format_id = formatSelect ? formatSelect.value : 'best';
            const selectedOption = formatSelect ? formatSelect.options[formatSelect.selectedIndex] : null;
            const quality = selectedOption ? selectedOption.textContent.split(' ')[0] : 'best';
            
            try {
                await downloadFile('/api/youtube/download', { url, format_id, quality }, 'youtube-shorts.mp4');
            } catch (error) {
                console.error('Error downloading shorts:', error);
            }
        });
    }
    
    // MP3 download
    const mp3Form = document.getElementById('youtube-mp3-form');
    const getMp3InfoBtn = document.getElementById('get-mp3-info');
    const downloadMp3Btn = document.getElementById('download-mp3-btn');
    
    if (getMp3InfoBtn) {
        getMp3InfoBtn.addEventListener('click', async () => {
            const url = document.getElementById('mp3-url').value;
            if (!url) {
                showError('Please enter a YouTube URL');
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/youtube/info', { url });
                displayVideoInfo(info, 'mp3');
                downloadMp3Btn.disabled = false;
            } catch (error) {
                console.error('Error getting video info:', error);
            }
        });
    }
    
    if (mp3Form) {
        mp3Form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('mp3-url').value;
            
            try {
                await downloadFile('/api/youtube/mp3', { url }, 'youtube-audio.mp3');
            } catch (error) {
                console.error('Error downloading MP3:', error);
            }
        });
    }
}

// Instagram functionality
function initializeInstagramPage() {
    window.__vdInit = window.__vdInit || {};
    if (window.__vdInit.instagram) return;
    window.__vdInit.instagram = true;
    currentPlatform = 'instagram';
    initializeTabs();
    
    // Reel download
    const reelForm = document.getElementById('instagram-reel-form');
    const getReelInfoBtn = document.getElementById('get-reel-info');
    const downloadReelBtn = document.getElementById('download-reel-btn');
    
    if (getReelInfoBtn) {
        getReelInfoBtn.addEventListener('click', async () => {
            const url = document.getElementById('reel-url').value;
            if (!url) {
                showError('Please enter an Instagram Reel URL');
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/instagram/info', { url });
                displayVideoInfo(info, 'reel');
                downloadReelBtn.disabled = false;
            } catch (error) {
                console.error('Error getting reel info:', error);
            }
        });
    }
    
    if (reelForm) {
        reelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('reel-url').value;
            const formatSelect = document.getElementById('reel-format');
            const format_id = formatSelect ? formatSelect.value : 'best';
            
            try {
                await downloadFile('/api/instagram/download', { url, format_id }, 'instagram-reel.mp4');
            } catch (error) {
                console.error('Error downloading reel:', error);
            }
        });
    }
    
    // Story download - Direct download without info button
    const storyForm = document.getElementById('instagram-story-form');
    
    if (storyForm) {
        storyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('story-url').value;
            const formatSelect = document.getElementById('story-format');
            const format_id = formatSelect ? formatSelect.value : 'best';
            
            try {
                await downloadFile('/api/instagram/story', { url, format_id }, 'instagram-story.mp4');
            } catch (error) {
                console.error('Error downloading story:', error);
            }
        });
    }
    
    // Photo download
    const photoForm = document.getElementById('instagram-photo-form');
    const getPhotoInfoBtn = document.getElementById('get-photo-info');
    const downloadPhotoBtn = document.getElementById('download-photo-btn');
    
    if (getPhotoInfoBtn) {
        getPhotoInfoBtn.addEventListener('click', async () => {
            const url = document.getElementById('photo-url').value;
            if (!url) {
                showError('Please enter an Instagram Photo URL');
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/instagram/info', { url });
                displayVideoInfo(info, 'photo');
                downloadPhotoBtn.disabled = false;
            } catch (error) {
                console.error('Error getting photo info:', error);
            }
        });
    }
    
    if (photoForm) {
        photoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('photo-url').value;
            const formatSelect = document.getElementById('photo-format');
            const format_id = formatSelect ? formatSelect.value : 'best';
            
            try {
                await downloadFile('/api/instagram/photo', { url, format_id }, 'instagram-photo.jpg');
            } catch (error) {
                console.error('Error downloading photo:', error);
            }
        });
    }
    
    // Story Highlights download - Direct download without info button
    const highlightsForm = document.getElementById('instagram-highlights-form');
    
    if (highlightsForm) {
        highlightsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('highlights-url').value;
            const formatSelect = document.getElementById('highlights-format');
            const format_id = formatSelect ? formatSelect.value : 'best';
            
            try {
                await downloadFile('/api/instagram/highlights', { url, format_id }, 'instagram-highlights.mp4');
            } catch (error) {
                console.error('Error downloading highlights:', error);
            }
        });
    }
    
    // Profile Photo + Profile Info
    const profileForm = document.getElementById('instagram-profile-form');
    const getProfileInfoBtn = document.getElementById('get-profile-info');

    if (getProfileInfoBtn) {
        getProfileInfoBtn.addEventListener('click', async () => {
            const username = document.getElementById('profile-username').value;
            if (!username) {
                showError('Please enter an Instagram username or profile URL');
                return;
            }
            try {
                const info = await makeAPIRequest('/api/instagram/profile/info', { username });
                displayProfileInfo(info, 'profile');
            } catch (error) {
                console.error('Error getting profile info:', error);
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('profile-username').value;
            
            if (!username) {
                showError('Please enter an Instagram username');
                return;
            }
            
            try {
                // Clean username to remove any @ symbol or URL parts
                const cleanUsername = username.replace('@', '').replace(/.*instagram\.com\/([^\/]+).*/, '$1');
                await downloadFile('/api/instagram/profile', { username }, `${cleanUsername}_profile_photo.jpg`);
            } catch (error) {
                console.error('Error downloading profile photo:', error);
            }
        });
    }
}

// Facebook functionality
function initializeFacebookPage() {
    window.__vdInit = window.__vdInit || {};
    if (window.__vdInit.facebook) return;
    window.__vdInit.facebook = true;
    currentPlatform = 'facebook';
    initializeTabs();
    
    // Similar pattern for Facebook - Reel, Video, Watch
    setupFacebookHandlers('reel', '/api/facebook/reel', 'facebook-reel.mp4');
    setupFacebookHandlers('video', '/api/facebook/video', 'facebook-video.mp4');
    setupFacebookHandlers('watch', '/api/facebook/watch', 'facebook-watch.mp4');
}

function setupFacebookHandlers(type, endpoint, filename) {
    const form = document.getElementById(`facebook-${type}-form`);
    const getInfoBtn = document.getElementById(`get-${type}-info`);
    const downloadBtn = document.getElementById(`download-${type}-btn`);
    
    if (getInfoBtn) {
        getInfoBtn.addEventListener('click', async () => {
            const url = document.getElementById(`${type}-url`).value;
            if (!url) {
                showError(`Please enter a Facebook ${type} URL`);
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/facebook/info', { url });
                displayVideoInfo(info, type);
                downloadBtn.disabled = false;
            } catch (error) {
                console.error(`Error getting ${type} info:`, error);
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById(`${type}-url`).value;
            const formatSelect = document.getElementById(`${type}-format`);
            const format_id = formatSelect ? formatSelect.value : 'best';
            
            try {
                await downloadFile('/api/facebook/download', { url, format_id }, filename);
            } catch (error) {
                console.error(`Error downloading ${type}:`, error);
            }
        });
    }
}

// TikTok functionality
function initializeTikTokPage() {
    window.__vdInit = window.__vdInit || {};
    if (window.__vdInit.tiktok) return;
    window.__vdInit.tiktok = true;
    currentPlatform = 'tiktok';
    initializeTabs();
    
    // TikTok handlers
    setupTikTokHandlers('short', '/api/tiktok/short', 'tiktok-short.mp4');
    setupTikTokHandlers('long', '/api/tiktok/long', 'tiktok-long.mp4');
    setupTikTokHandlers('video', '/api/tiktok/video', 'tiktok-video.mp4');
    
    // Audio handler
    const audioForm = document.getElementById('tiktok-audio-form');
    const getAudioInfoBtn = document.getElementById('get-audio-info');
    const downloadAudioBtn = document.getElementById('download-audio-btn');
    
    if (getAudioInfoBtn) {
        getAudioInfoBtn.addEventListener('click', async () => {
            const url = document.getElementById('audio-url').value;
            if (!url) {
                showError('Please enter a TikTok URL');
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/tiktok/info', { url });
                displayVideoInfo(info, 'audio');
                downloadAudioBtn.disabled = false;
            } catch (error) {
                console.error('Error getting audio info:', error);
            }
        });
    }
    
    if (audioForm) {
        audioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('audio-url').value;
            
            try {
                await downloadFile('/api/tiktok/download', { url, format_id: 'bestaudio' }, 'tiktok-audio.mp3');
            } catch (error) {
                console.error('Error downloading audio:', error);
            }
        });
    }
}

function setupTikTokHandlers(type, endpoint, filename) {
    const form = document.getElementById(`tiktok-${type}-form`);
    const getInfoBtn = document.getElementById(`get-${type}-info`);
    const downloadBtn = document.getElementById(`download-${type}-btn`);
    
    if (getInfoBtn) {
        getInfoBtn.addEventListener('click', async () => {
            const url = document.getElementById(`${type}-url`).value;
            if (!url) {
                showError(`Please enter a TikTok ${type} URL`);
                return;
            }
            
            try {
                const info = await makeAPIRequest('/api/tiktok/info', { url });
                displayVideoInfo(info, type);
                downloadBtn.disabled = false;
            } catch (error) {
                console.error(`Error getting ${type} info:`, error);
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById(`${type}-url`).value;
            const formatSelect = document.getElementById(`${type}-format`);
            const format_id = formatSelect ? formatSelect.value : 'best';
            
            try {
                await downloadFile('/api/tiktok/download', { url, format_id }, filename);
            } catch (error) {
                console.error(`Error downloading ${type}:`, error);
            }
        });
    }
}

// Display video info
function displayVideoInfo(info, type) {
    const titleElement = document.getElementById(`${type}-title`);
    const uploaderElement = document.getElementById(`${type}-uploader`);
    const durationElement = document.getElementById(`${type}-duration`);
    const infoContainer = document.getElementById(`${type}-info`);
    
    if (titleElement) titleElement.textContent = info.title || `${currentPlatform} Content`;
    if (uploaderElement) uploaderElement.textContent = `By: ${info.uploader || 'Unknown'}`;
    if (durationElement) durationElement.textContent = `Duration: ${formatDuration(info.duration)}`;
    
    // Inject or update thumbnail if available
    const infoContainerEl = document.getElementById(`${type}-info`);
    const infoCard = infoContainerEl ? infoContainerEl.querySelector('.info-card') : null;
    let thumbUrl = info.thumbnail;
    if (!thumbUrl && Array.isArray(info.thumbnails) && info.thumbnails.length) {
        // Pick the highest resolution available
        const best = [...info.thumbnails].sort((a, b) => (b.height || 0) - (a.height || 0))[0];
        thumbUrl = best?.url || best;
    }
    if (infoCard && (thumbUrl || document.getElementById(`${type}-thumbnail`))) {
        let img = document.getElementById(`${type}-thumbnail`);
        if (!img) {
            img = document.createElement('img');
            img.id = `${type}-thumbnail`;
            img.alt = info.title || `${currentPlatform} thumbnail`;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            img.style.margin = '10px 0';
            if (titleElement && titleElement.parentElement === infoCard) {
                infoCard.insertBefore(img, titleElement);
            } else {
                infoCard.insertBefore(img, infoCard.firstChild);
            }
        }
        if (thumbUrl) {
            img.src = thumbUrl;
            img.style.display = '';
        } else {
            img.style.display = 'none';
        }
    }
    
    // Update format dropdown with actual available formats
    const formatSelect = document.getElementById(`${type}-format`);
    if (formatSelect && info.formats) {
        formatSelect.innerHTML = ''; // Clear existing options
        info.formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.format_id;
            option.textContent = `${format.quality} (${format.ext})`;
            if (format.format_note) {
                option.textContent += ` - ${format.format_note}`;
            }
            formatSelect.appendChild(option);
        });
    }
    
    if (infoContainer) {
        infoContainer.classList.remove('hidden');
    }
}

// Display playlist info with individual video list
function displayPlaylistInfo(info) {
    const titleElement = document.getElementById('playlist-title');
    const countElement = document.getElementById('playlist-count');
    const videosContainer = document.getElementById('playlist-videos');
    const infoContainer = document.getElementById('playlist-info');
    const formatSelect = document.getElementById('playlist-format');
    
    if (titleElement) titleElement.textContent = info.playlist_title || 'YouTube Playlist';
    if (countElement) countElement.textContent = `Videos: ${info.playlist_count || info.entries?.length || 0}`;
    
    // Update format dropdown
    if (formatSelect && info.formats) {
        formatSelect.innerHTML = '';
        info.formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.format_id;
            option.textContent = `${format.quality} (${format.ext}) - ${format.format_note}`;
            formatSelect.appendChild(option);
        });
    }
    
    // Display playlist stats and bulk actions
    if (videosContainer && info.entries) {
        videosContainer.innerHTML = `
            <div class="playlist-stats">
                <span>📊 ${info.entries.length} videos found</span>
                <span>Ready to download individually</span>
            </div>
            <div class="playlist-bulk-actions">
                <button class="bulk-download-btn" onclick="downloadAllPlaylistVideos()">
                    📥 Download All (${info.entries.length} videos)
                </button>
                <span style="color: #666; font-size: 0.9rem;">or download videos individually below:</span>
            </div>
        `;
        
        // Add individual video items
        info.entries.forEach((video, index) => {
            const videoItem = document.createElement('div');
            videoItem.className = 'playlist-video-item';
            videoItem.innerHTML = `
                <img class="playlist-video-thumbnail" 
                     src="${video.thumbnail || '/images/video-placeholder.png'}" 
                     alt="Video thumbnail"
                     onerror="this.style.display='none'">
                <div class="playlist-video-info">
                    <div class="playlist-video-title">${video.title || `Video ${index + 1}`}</div>
                    <div class="playlist-video-details">
                        ${video.uploader ? `👤 ${video.uploader}` : ''}
                        ${video.duration ? ` • ⏱️ ${formatDuration(video.duration)}` : ''}
                        ${video.view_count ? ` • 👁️ ${formatNumber(video.view_count)} views` : ''}
                    </div>
                </div>
                <div class="playlist-video-actions">
                    <button class="playlist-download-btn" 
                            data-video-index="${index}"
                            onclick="downloadPlaylistVideo(${index})">
                        Download
                    </button>
                </div>
            `;
            videosContainer.appendChild(videoItem);
        });
    }
    
    if (infoContainer) {
        infoContainer.classList.remove('hidden');
    }
}

// Download individual video from playlist
async function downloadPlaylistVideo(videoIndex) {
    if (!currentPlaylistData || !currentPlaylistData.entries || !currentPlaylistData.entries[videoIndex]) {
        showError('Video data not found');
        return;
    }
    
    const video = currentPlaylistData.entries[videoIndex];
    const formatSelect = document.getElementById('playlist-format');
    const format_id = formatSelect ? formatSelect.value : 'best[height<=1080]';
    const selectedOption = formatSelect ? formatSelect.options[formatSelect.selectedIndex] : null;
    const quality = selectedOption ? selectedOption.textContent.split(' ')[0] : 'best';
    
    const button = document.querySelector(`button[data-video-index="${videoIndex}"]`);
    if (button) {
        button.textContent = 'Downloading...';
        button.classList.add('downloading');
        button.disabled = true;
    }
    
    try {
        showProgress(`Downloading: ${video.title}`, 0);
        await downloadFile('/api/youtube/playlist/download', {
            url: video.url,
            format_id: format_id,
            quality: quality,
            title: video.title
        }, `${video.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50)}.mp4`);
        
        if (button) {
            button.textContent = '✓ Downloaded';
            button.classList.remove('downloading');
            button.classList.add('completed');
        }
    } catch (error) {
        console.error('Error downloading video:', error);
        if (button) {
            button.textContent = '✗ Error';
            button.classList.remove('downloading');
            button.classList.add('error');
            button.disabled = false;
            
            // Reset button after 3 seconds
            setTimeout(() => {
                button.textContent = 'Download';
                button.classList.remove('error');
            }, 3000);
        }
    }
}

// Download all videos in playlist
async function downloadAllPlaylistVideos() {
    if (!currentPlaylistData || !currentPlaylistData.entries) {
        showError('Playlist data not found');
        return;
    }
    
    const bulkBtn = document.querySelector('.bulk-download-btn');
    if (bulkBtn) {
        bulkBtn.textContent = 'Downloading All...';
        bulkBtn.disabled = true;
    }
    
    let completed = 0;
    const total = currentPlaylistData.entries.length;
    
    for (let i = 0; i < total; i++) {
        try {
            showProgress(`Downloading ${i + 1}/${total}: ${currentPlaylistData.entries[i].title}`, Math.round((completed / total) * 100));
            await downloadPlaylistVideo(i);
            completed++;
        } catch (error) {
            console.error(`Error downloading video ${i + 1}:`, error);
        }
    }
    
    hideProgress();
    if (bulkBtn) {
        bulkBtn.textContent = `✓ All Downloaded (${completed}/${total})`;
        bulkBtn.classList.add('completed');
    }
    
    showSuccess(`Playlist download completed! ${completed}/${total} videos downloaded.`);
}

// Format large numbers
function formatNumber(num) {
    if (!num) return '';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Display profile info
function displayProfileInfo(info, type) {
    const titleElement = document.getElementById(`${type}-title`);
    const usernameElement = document.getElementById(`${type}-username-display`);
    const followerCountElement = document.getElementById(`${type}-follower-count`);
    const followingCountElement = document.getElementById(`${type}-following-count`);
    const postsCountElement = document.getElementById(`${type}-posts-count`);
    const previewElement = document.getElementById(`${type}-preview`);
    const infoContainer = document.getElementById(`${type}-info`);
    const bioElement = document.getElementById(`${type}-bio`);
    const externalUrlElement = document.getElementById(`${type}-external-url`);

    if (titleElement) titleElement.textContent = info.full_name || 'Profile';
    if (usernameElement) usernameElement.textContent = `Username: ${info.username || 'Unknown'}`;

    if (followerCountElement) {
        const followers = info.followers || info.subscriber_count;
        followerCountElement.textContent = followers != null ? `Followers: ${formatNumber(followers)}` : '';
    }
    if (followingCountElement) {
        const following = info.following;
        followingCountElement.textContent = following != null ? `Following: ${formatNumber(following)}` : '';
    }
    if (postsCountElement) {
        const posts = info.posts;
        postsCountElement.textContent = posts != null ? `Posts: ${formatNumber(posts)}` : '';
    }

    if (bioElement) {
        bioElement.textContent = info.biography || '';
    }

    if (externalUrlElement) {
        if (info.external_url) {
            externalUrlElement.innerHTML = `🔗 <a href="${info.external_url}" target="_blank" rel="noopener">${info.external_url}</a>`;
        } else {
            externalUrlElement.innerHTML = '';
        }
    }

    // Show profile preview if thumbnail is available
    if (previewElement && (info.thumbnail || info.profile_pic_url_hd || info.profile_pic_url)) {
        const src = info.thumbnail || info.profile_pic_url_hd || info.profile_pic_url;
        previewElement.innerHTML = `<img src="${src}" alt="Profile preview" style="max-width: 150px; border-radius: 50%; margin: 10px 0;">`;
    }

    if (infoContainer) {
        infoContainer.classList.remove('hidden');
    }
}

// Initialize page based on current URL
function initializePage() {
    const path = window.location.pathname;
    
    if (path.includes('youtube')) {
        initializeYouTubePage();
    } else if (path.includes('instagram')) {
        initializeInstagramPage();
    } else if (path.includes('facebook')) {
        initializeFacebookPage();
    } else if (path.includes('tiktok')) {
        initializeTikTokPage();
    } else {
        // Home page - no specific initialization needed
        console.log('Home page loaded');
    }
}

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add loading states to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Processing...';
                submitBtn.disabled = true;
                
                // Reset button after 10 seconds (backup)
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Download';
                }, 10000);
            }
        });
    });
    
    // Store original button texts
    document.querySelectorAll('button[type="submit"]').forEach(btn => {
        btn.dataset.originalText = btn.textContent;
    });
});

// Error handling for uncaught errors
window.addEventListener('error', function(e) {
    console.error('Uncaught error:', e.error);
    hideLoading();
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    hideLoading();
});