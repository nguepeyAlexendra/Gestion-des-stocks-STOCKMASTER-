import requests
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings

class BrevoEmailBackend(BaseEmailBackend):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = settings.BREVO_API_KEY  # ✅ lit depuis settings.py
        self.sender_email = "emmanuellenjomo07@gmail.com"
        self.sender_name = "StockMaster"

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        num_sent = 0
        for message in email_messages:
            try:
                html_content = ""
                text_content = message.body or ""
                
                if hasattr(message, 'alternatives'):
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_content = content
                            break
                
                if not html_content:
                    html_content = f"<p>{text_content}</p>"

                payload = {
                    "sender": {
                        "name": self.sender_name,
                        "email": self.sender_email
                    },
                    "to": [{"email": to, "name": to} for to in message.to],
                    "subject": message.subject,
                    "htmlContent": html_content,
                    "textContent": text_content
                }

                headers = {
                    "accept": "application/json",
                    "api-key": self.api_key,  # ✅ correctement chargée
                    "content-type": "application/json"
                }

                response = requests.post(
                    "https://api.brevo.com/v3/smtp/email",
                    json=payload,
                    headers=headers
                )

                if response.status_code == 201:
                    print(f"✅ Email envoyé à {message.to}")
                    num_sent += 1
                else:
                    print(f"❌ Erreur {response.status_code}: {response.text}")
                    if not self.fail_silently:
                        response.raise_for_status()

            except Exception as e:
                print(f"❌ Exception: {e}")
                if not self.fail_silently:
                    raise

        return num_sent