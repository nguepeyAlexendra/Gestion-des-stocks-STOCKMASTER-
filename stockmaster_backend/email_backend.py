import os
import requests
from django.core.mail.backends.base import BaseEmailBackend

class BrevoEmailBackend(BaseEmailBackend):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = os.environ.get('BREVO_API_KEY')
        self.default_sender = os.environ.get('DEFAULT_FROM_EMAIL', 'StockMaster <emmanuellenjomo07@gmail.com>')

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        num_sent = 0
        for message in email_messages:
            try:
                # Gestion HTML / Texte
                html_content = ""
                text_content = message.body or ""
                for content, mimetype in message.alternatives:
                    if mimetype == 'text/html':
                        html_content = content
                        break
                if not html_content:
                    html_content = f"<p>{text_content}</p>"

                payload = {
                    "sender": {"email": message.from_email or self.default_sender},
                    "to": [{"email": to} for to in message.to],
                    "subject": message.subject,
                    "htmlContent": html_content,
                    "textContent": text_content
                }
                if message.cc:
                    payload["cc"] = [{"email": cc} for cc in message.cc]
                if message.bcc:
                    payload["bcc"] = [{"email": bcc} for bcc in message.bcc]

                response = requests.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={"api-key": self.api_key, "Content-Type": "application/json"},
                    json=payload
                )
                response.raise_for_status()
                num_sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return num_sent