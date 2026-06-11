"""
Model: conta.py
Representa a conta bancária associada a um Cliente.
Responsabilidade: guardar saldo e executar as regras de débito/crédito.
"""


class Conta:
    """
    Entidade que representa uma conta corrente digital.

    Atributos encapsulados:
        _numero (str): Número identificador da conta.
        _agencia (str): Agência da conta.
        _saldo (float): Saldo disponível (somente leitura externa).
    """

    def __init__(self, numero: str, agencia: str, saldo_inicial: float = 0.0):
        self._numero = numero
        self._agencia = agencia
        self._saldo = saldo_inicial

    # ── Getters ──────────────────────────────────────────────────────────

    @property
    def numero(self) -> str:
        return self._numero

    @property
    def agencia(self) -> str:
        return self._agencia

    @property
    def saldo(self) -> float:
        return self._saldo

    # ── Métodos de negócio ───────────────────────────────────────────────

    def depositar(self, valor: float) -> None:
        """Aumenta o saldo da conta. Chamado quando se recebe uma transferência."""
        if valor <= 0:
            raise ValueError("O valor do depósito deve ser positivo.")
        self._saldo += valor

    def debitar(self, valor: float) -> None:
        """
        Reduz o saldo. Contém a regra de negócio de saldo insuficiente.
        Lança ValueError para que o Controller trate e informe o Template.
        """
        if valor <= 0:
            raise ValueError("O valor da transferência deve ser positivo.")
        if valor > self._saldo:
            raise ValueError("Saldo insuficiente para realizar a operação.")
        self._saldo -= valor

    def saldo_formatado(self) -> str:
        """Retorna o saldo no formato monetário brasileiro."""
        return f"R$ {self._saldo:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    def __repr__(self) -> str:
        return f"<Conta numero='{self._numero}' saldo={self._saldo:.2f}>"
