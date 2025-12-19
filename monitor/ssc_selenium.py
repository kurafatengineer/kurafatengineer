from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import os
import requests

BOT_TOKEN = os.getenv("BOT_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

def send_telegram(text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    requests.post(url, data={"chat_id": CHAT_ID, "text": text})

def main():
    send_telegram("🚀 Selenium job started")

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(options=chrome_options)

    try:
        driver.get("https://ssc.gov.in/home/notice-board")
        time.sleep(8)

        links = driver.find_elements(By.TAG_NAME, "a")

        pdf_links = []
        for a in links:
            href = a.get_attribute("href")
            text = a.text.strip()

            if href and ".pdf" in href.lower():
                pdf_links.append((text, href))

        if not pdf_links:
            send_telegram("⚠️ Page loaded but no PDF links found")
            return

        msg = "📄 SSC PDFs found:\n\n"
        for t, l in pdf_links[:5]:
            msg += f"{t}\n{l}\n\n"

        send_telegram(msg)

    except Exception as e:
        send_telegram(f"❌ Selenium error:\n{e}")

    finally:
        driver.quit()

if __name__ == "__main__":
    main()
