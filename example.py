"""
example.py — Manshot
Exemplo de uso do core. Rode este arquivo para testar os canais.
Certifique-se de ter o .env preenchido antes.
"""

from core import EmailChannel, SMSChannel, TelegramChannel, Contact

# --- Lista de contatos de exemplo ---
contacts = [
    Contact(name="Mandré",  destination="seuemail@gmail.com"),
    Contact(name="João",    destination="joao@email.com"),
    Contact(name="Maria",   destination="maria@email.com"),
]

# --- Mensagem com personalização ---
message = "Olá, {name}! Essa é uma mensagem enviada pelo Manshot 🚀"

# --- Disparo via Email ---
print("=== Disparando emails ===")
email = EmailChannel()
results = email.send_bulk(contacts, message)
print(email.summary(results))

# --- Disparo via SMS ---
# (ajuste os destinations para números de telefone)
# sms_contacts = [Contact(name="Mandré", destination="+5521999999999")]
# print("\n=== Disparando SMS ===")
# sms = SMSChannel()
# results = sms.send_bulk(sms_contacts, message)
# print(sms.summary(results))

# --- Disparo via Telegram ---
# (ajuste os destinations para chat_ids do Telegram)
# tg_contacts = [Contact(name="Mandré", destination="123456789")]
# print("\n=== Disparando Telegram ===")
# tg = TelegramChannel()
# results = tg.send_bulk(tg_contacts, message)
# print(tg.summary(results))
