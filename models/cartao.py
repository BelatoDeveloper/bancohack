"""
Model: cartao.py
Representa um cartão de crédito/débito virtual associado a uma conta.
"""
import random
import string
from datetime import datetime, timedelta


class Cartao:
    """
    Entidade que representa um cartão de crédito virtual no ZicaPay.
    """

    def __init__(
        self,
        id: int,
        numero: str = None,
        cvv: str = None,
        validade: str = None,
        limite: float = 5000.0,
        nome_titular: str = "",
    ):
        self._id = id
        self._numero = numero or self._gerar_numero()
        self._cvv = cvv or self._gerar_cvv()
        self._validade = validade or self._gerar_validade()
        self._limite = limite
        self._limite_usado = 0.0
        self._nome_titular = nome_titular
        self._bloqueado = False

    def _gerar_numero(self) -> str:
        return " ".join(
            "".join(random.choices(string.digits, k=4)) for _ in range(4)
        )

    def _gerar_cvv(self) -> str:
        return "".join(random.choices(string.digits, k=3))

    def _gerar_validade(self) -> str:
        data = datetime.now() + timedelta(days=365 * 4)
        return data.strftime("%m/%y")

    @property
    def id(self) -> int:
        return self._id

    @property
    def numero(self) -> str:
        return self._numero

    @property
    def numero_mascarado(self) -> str:
        partes = self._numero.split(" ")
        return f"**** **** **** {partes[-1]}"

    @property
    def cvv(self) -> str:
        return self._cvv

    @property
    def validade(self) -> str:
        return self._validade

    @property
    def limite(self) -> float:
        return self._limite

    @property
    def limite_disponivel(self) -> float:
        return self._limite - self._limite_usado

    @property
    def nome_titular(self) -> str:
        return self._nome_titular

    @property
    def bloqueado(self) -> bool:
        return self._bloqueado

    @property
    def status(self) -> str:
        return "Bloqueado" if self._bloqueado else "Ativo"

    def bloquear(self) -> None:
        self._bloqueado = True

    def desbloquear(self) -> None:
        self._bloqueado = False

    def ajustar_limite(self, novo_limite: float) -> None:
        if novo_limite < 0:
            raise ValueError("Limite não pode ser negativo.")
        self._limite = novo_limite


    def renovar(self, anos: int = 4) -> str:
        """
        Renova o cartao estendendo a validade por N anos a partir de hoje.
        Retorna a nova validade no formato MM/AA.
        """
        from datetime import datetime, timedelta
        nova_data = datetime.now() + timedelta(days=365 * anos)
        self._validade = nova_data.strftime("%m/%y")
        return self._validade

    def to_dict(self) -> dict:
        return {
            "id": self._id,
            "numero_mascarado": self.numero_mascarado,
            "numero_completo": self._numero,
            "cvv": self._cvv,
            "validade": self._validade,
            "limite": self._limite,
            "limite_disponivel": self.limite_disponivel,
            "nome_titular": self._nome_titular,
            "bloqueado": self._bloqueado,
            "status": self.status,
        }

    def __repr__(self) -> str:
        return f"<Cartao id={self._id} status='{self.status}'>"
