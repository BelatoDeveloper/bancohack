"""
Model: conta.py (expandido para ZicaPay)
Representa a conta bancária associada a um Cliente.
"""
from datetime import datetime


class Conta:
    """
    Entidade que representa uma conta corrente digital ZicaPay.
    """

    def __init__(
        self,
        numero: str,
        agencia: str,
        saldo_inicial: float = 0.0,
        tipo: str = "corrente",
    ):
        self._numero = numero
        self._agencia = agencia
        self._saldo = saldo_inicial
        self._tipo = tipo

    @property
    def numero(self) -> str:
        return self._numero

    @property
    def agencia(self) -> str:
        return self._agencia

    @property
    def saldo(self) -> float:
        return self._saldo

    @property
    def tipo(self) -> str:
        return self._tipo

    def depositar(self, valor: float) -> None:
        """Aumenta o saldo da conta."""
        if valor <= 0:
            raise ValueError("O valor do depósito deve ser positivo.")
        self._saldo += valor

    def debitar(self, valor: float) -> None:
        """Reduz o saldo com validação de saldo insuficiente."""
        if valor <= 0:
            raise ValueError("O valor da transferência deve ser positivo.")
        if valor > self._saldo:
            raise ValueError("Saldo insuficiente para realizar a operação.")
        self._saldo -= valor

    def debitar_forcado(self, valor: float) -> None:
        """Reduz o saldo ignorando a validação de limite (pode negativar)."""
        if valor <= 0:
            raise ValueError("O valor da transferência deve ser positivo.")
        self._saldo -= valor

    def saldo_formatado(self) -> str:
        """Retorna o saldo no formato monetário brasileiro."""
        return f"R$ {self._saldo:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    def __repr__(self) -> str:
        return f"<Conta numero='{self._numero}' saldo={self._saldo:.2f}>"
