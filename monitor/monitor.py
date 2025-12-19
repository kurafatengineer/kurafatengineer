import requests
from bs4 import BeautifulSoup
import hashlib
import os

# मल्टीपल वेबसाइट URLs
URLS = [
    "https://ssc.gov.in/home/notice-board",
    "https://example2.gov.in/notifications",
    # यहाँ आप अपनी और भी वेबसाइट जोड़ सकते हैं
]

# Telegram के लिए बोट टोकन और चैट आईडी
BOT_TOKEN = os.getenv("BOT_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

# हर वेबसाइट के लिए पिछले नोटिफिकेशन का हैश स्टोर करने के लिए एक डिक्शनरी
LAST_HASHES = {}

def send_telegram_message(message):
    telegram_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": CHAT_ID, "text": message}
    requests.post(telegram_url, data=payload)

def get_notifications_from_url(url):
    response = requests.get(url, timeout=100)  # टाइमआउट बढ़ा दिया है
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    
    # यहाँ आप वही CSS सेलेक्टर लगाएँ जो नोटिफिकेशन आपको निकालना है
    notifications = soup.find_all("a", class_="notice-link")
    
    new_notifications = []
    for notice in notifications:
        title = notice.get_text(strip=True)
        link = notice.get("href")
        # सुनिश्चित करें कि लिंक पूरा है
        if link and not link.startswith("http"):
            link = url.rstrip("/") + "/" + link
        
        # नोटिफिकेशन के टेक्स्ट का हैश बनाएँ
        content_hash = hashlib.md5(title.encode()).hexdigest()
        
        new_notifications.append((content_hash, title, link))
    
    return new_notifications

def main():
    # एग्जीक्यूशन शुरू होने पर टेलीग्राम मैसेज भेजें
    send_telegram_message("Execution started!")

    for url in URLS:
        print(f"Checking: {url}")
        new_notifs = get_notifications_from_url(url)
        
        for content_hash, title, link in new_notifs:
            last_hash = LAST_HASHES.get(url)
            if last_hash != content_hash:
                message = f"🚨 New notification on {url}:\n{title}\n🔗 {link}"
                send_telegram_message(message)
                LAST_HASHES[url] = content_hash

if __name__ == '__main__':
    main()
