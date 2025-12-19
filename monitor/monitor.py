import requests
from bs4 import BeautifulSoup
import hashlib
import os
import logging

# ---------------- LOGGING ----------------
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# ---------------- CONFIG ----------------
URLS = [
    "https://ssc.gov.in/home/notice-board",
    # add more sites later
]

BOT_TOKEN = os.getenv("BOT_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

TIMEOUT_SECONDS = 30

# ----------------------------------------

def send_telegram_message(text):
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        requests.post(
            url,
            data={"chat_id": CHAT_ID, "text": text},
            timeout=10
        )
    except Exception as e:
        logging.error(f"Telegram send failed: {e}")

def get_notifications_from_url(url):
    try:
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=TIMEOUT_SECONDS
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        links = soup.find_all("a")

        results = []
        for a in links:
            title = a.get_text(strip=True)
            link = a.get("href")

            if not title or not link:
                continue

            if not link.startswith("http"):
                link = url.rstrip("/") + "/" + link

            uid = hashlib.md5((title + link).encode()).hexdigest()
            results.append((uid, title, link))

        return results

    except requests.exceptions.ConnectTimeout:
        logging.error(f"TIMEOUT → {url}")
        send_telegram_message(
            f"⚠️ TIMEOUT while accessing:\n{url}\n"
            "Likely blocked or server not responding."
        )
        return []

    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP ERROR → {url} → {e}")
        return []

    except Exception as e:
        logging.error(f"UNKNOWN ERROR → {url} → {e}")
        return []

def main():
    # ---- execution start message ----
    send_telegram_message("🚀 Monitor execution started")

    for url in URLS:
        logging.info(f"Checking: {url}")
        notices = get_notifications_from_url(url)

        if not notices:
            logging.info("No data fetched (blocked / timeout)")
            continue

        send_telegram_message(
            f"✅ Data fetched successfully\n"
            f"Website: {url}\n"
            f"Items found: {len(notices)}"
        )

if __name__ == "__main__":
    main()
