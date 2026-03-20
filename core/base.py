"""
base.py — Manshot
Define o contrato que todo canal de disparo deve seguir.
Email, SMS e Telegram herdam dessa classe — garantindo que todos
funcionem da mesma forma do ponto de vista do sistema.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class Contact:
    """Representa um contato na lista de disparo."""
    name: str
    destination: str  # email, telefone ou chat_id dependendo do canal


@dataclass
class DispatchResult:
    """Resultado de um disparo individual."""
    contact: Contact
    success: bool
    error: str = ""


class BaseChannel(ABC):
    """
    Classe base para todos os canais do Manshot.
    Todo novo canal precisa implementar os métodos abaixo.
    """

    @abstractmethod
    def send(self, contact: Contact, message: str) -> DispatchResult:
        """Envia mensagem para um único contato."""
        pass

    def send_bulk(self, contacts: list[Contact], message: str) -> list[DispatchResult]:
        """
        Dispara mensagem para uma lista de contatos.
        Usa o método send() individualmente e coleta os resultados.
        """
        results = []
        for contact in contacts:
            result = self.send(contact, message)
            results.append(result)
        return results

    def summary(self, results: list[DispatchResult]) -> dict:
        """Retorna um resumo do disparo em massa."""
        total = len(results)
        success = sum(1 for r in results if r.success)
        return {
            "total": total,
            "success": success,
            "failed": total - success,
            "success_rate": f"{(success / total * 100):.1f}%" if total > 0 else "0%"
        }
