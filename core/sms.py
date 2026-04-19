"""
sms.py — Manshot
Canal de disparo via SMS usando Vonage.
Imagens são enviadas como link no corpo da mensagem.
"""

from vonage import Auth, Vonage
from vonage_sms import SmsMessage, SmsResponse
import re
from html import unescape
import unicodedata

from .base import BaseChannel, Contact, DispatchResult
from .config import settings


class SMSChannel(BaseChannel):
    """
    Disparo de SMS em massa via Vonage.
    Imagens são incluídas como link na mensagem.
    """

    @staticmethod
    def _build_client(vonage_key: str, vonage_secret: str) -> Vonage:
        return Vonage(Auth(api_key=vonage_key, api_secret=vonage_secret))

    @staticmethod
    def _sanitize_phone(phone: str) -> str:
        # Mantem apenas digitos para evitar falha por espacos, parenteses, tracos e +
        return re.sub(r"\D", "", phone or "")

    @staticmethod
    def _html_to_text(message: str) -> str:
        if not message:
            return ""

        text = message
        text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
        text = re.sub(r"</p\s*>", "\n", text, flags=re.IGNORECASE)
        text = re.sub(r"<[^>]+>", "", text)
        text = unescape(text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return unicodedata.normalize("NFC", text.strip())

    @staticmethod
    def _is_valid_br_international(phone: str) -> bool:
        # Formato esperado: 55 + DDD + numero (12 ou 13 digitos)
        return phone.startswith("55") and len(phone) in (12, 13)

    @staticmethod
    def _normalize_sender_id(sender: str) -> str:
        """
        Normaliza sender ID para formato aceito por gateways SMS.
        - Numerico: apenas digitos (sem +)
        - Alfanumerico: apenas A-Z/0-9 com ate 11 caracteres
        """
        raw = (sender or "").strip()
        if not raw:
            return ""

        numeric = re.sub(r"\D", "", raw)
        if numeric:
            return numeric

        ascii_sender = (
            unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode("ascii")
        )
        alnum = re.sub(r"[^A-Za-z0-9]", "", ascii_sender).upper()
        return alnum[:11]

    @staticmethod
    def _normalize_display_sender(sender: str, fallback_sender_id: str) -> str:
        """
        Nome exibido no corpo do SMS (fallback visual).
        Preserva acentos para aparecer como digitado no Manshot.
        """
        visual_fallback = (fallback_sender_id or "Manshot").strip() or "Manshot"
        raw = unicodedata.normalize("NFC", (sender or "").strip())
        if not raw:
            return visual_fallback

        # Remove apenas colchetes para manter o prefixo [NOME] consistente.
        clean = raw.replace("[", "").replace("]", "")
        cleaned = clean.strip()
        if not cleaned:
            return visual_fallback
        return cleaned[:30]

    def send(
        self,
        contact: Contact,
        message: str,
        image_url: str = None,
        sms_from: str = None,
        vonage_key: str = None,
        vonage_secret: str = None,
    ) -> DispatchResult:
        """
        Envia SMS para um contato.
        Se image_url for fornecida, adiciona o link da imagem na mensagem.
        O número deve estar no formato internacional sem +: 5521999999999
        """
        try:
            resolved_key = (vonage_key or settings.VONAGE_API_KEY or "").strip()
            resolved_secret = (
                vonage_secret or settings.VONAGE_API_SECRET or ""
            ).strip()

            if not resolved_key or not resolved_secret:
                return DispatchResult(
                    contact=contact,
                    success=False,
                    error="Credenciais Vonage não configuradas para este usuário.",
                )

            client = self._build_client(resolved_key, resolved_secret)

            sanitized_phone = self._sanitize_phone(contact.destination)
            if not self._is_valid_br_international(sanitized_phone):
                return DispatchResult(
                    contact=contact,
                    success=False,
                    error=(
                        f"Telefone invalido para SMS: '{contact.destination}'. "
                        "Use o formato 55DDDNXXXXXXXX (ex: 5521999999999)."
                    ),
                )

            plain_message = self._html_to_text(message)
            sender_raw = sms_from or settings.VONAGE_PHONE_FROM
            sender_id = self._normalize_sender_id(sender_raw)
            if not sender_id:
                return DispatchResult(
                    contact=contact,
                    success=False,
                    error="Remetente SMS invalido. Use apenas letras/numeros.",
                )
            display_sender = self._normalize_display_sender(sender_raw, sender_id)

            body_message = plain_message.format(name=contact.name).strip()
            # Sempre inclui o remetente entre colchetes no corpo do SMS.
            # Se nao houver mensagem, envia somente o prefixo.
            sender_prefix = f"[{display_sender}]"
            personalized_message = (
                f"{sender_prefix}\n{body_message}" if body_message else sender_prefix
            )

            # Adiciona o link da imagem no SMS se houver
            if image_url:
                personalized_message += f"\n\nVer imagem: {image_url}"

            # Alguns planos trial da Vonage adicionam sufixo promocional no fim do SMS.
            # Garante separacao visual entre a mensagem do usuario e o sufixo do provedor.
            if personalized_message and not personalized_message[-1].isspace():
                personalized_message += " "

            print(f"[SMS] sender_id='{sender_id}' destino='{sanitized_phone}'")

            msg = SmsMessage(
                to=sanitized_phone,
                from_=sender_id,
                text=personalized_message,
                type="unicode",
            )

            response: SmsResponse = client.sms.send(msg)
            status = response.messages[0].status
            success = status == "0"
            error = response.messages[0].error_text if not success else ""

            return DispatchResult(contact=contact, success=success, error=error)

        except Exception as e:
            return DispatchResult(contact=contact, success=False, error=str(e))
