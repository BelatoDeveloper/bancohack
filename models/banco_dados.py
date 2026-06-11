"""
Model: banco_dados.py
Camada de persistência em memória (substitui um banco de dados real).
Responsabilidade: manter o estado dos clientes durante a sessão e
                  fornecer métodos de consulta para o Controller.

Em produção, este arquivo seria substituído por um ORM (ex: SQLAlchemy).
"""

from models.conta import Conta
from models.cliente import Cliente


class BancoDados:
    """
    Repositório singleton em memória.
    Armazena todos os clientes e expõe métodos de busca usados pelo Controller.
    """

    def __init__(self):
        self._clientes: dict[str, Cliente] = {}  # chave: email
        self._seed()

    def _seed(self) -> None:
        """Popula o sistema com dados iniciais para demonstração."""
        clientes_seed = [
            Cliente(
                id=1,
                nome="Ana Paula Ferreira",
                email="ana@bancohack.com",
                senha="senha123",
                cpf="123.456.789-01",
                telefone="(11) 98765-4321",
                conta=Conta(numero="0001-2", agencia="0001", saldo_inicial=5_250.75),
            ),
            Cliente(
                id=2,
                nome="Bruno Carvalho Lima",
                email="bruno@bancohack.com",
                senha="senha456",
                cpf="987.654.321-09",
                telefone="(21) 91234-5678",
                conta=Conta(numero="0002-8", agencia="0001", saldo_inicial=1_820.00),
            ),
            Cliente(
                id=3,
                nome="Carla Mendes Souza",
                email="carla@bancohack.com",
                senha="senha789",
                cpf="456.789.123-05",
                telefone="(31) 99876-5432",
                conta=Conta(numero="0003-4", agencia="0001", saldo_inicial=12_500.00),
            ),
        ]
        for c in clientes_seed:
            self._clientes[c.email] = c

    # ── Métodos de consulta (usados pelo Controller) ──────────────────────

    def buscar_por_email(self, email: str) -> Cliente | None:
        """Retorna o Cliente com o e-mail informado, ou None se não existir."""
        return self._clientes.get(email)

    def buscar_por_numero_conta(self, numero: str) -> Cliente | None:
        """Retorna o Cliente dono da conta com o número informado."""
        for cliente in self._clientes.values():
            if cliente.conta.numero == numero:
                return cliente
        return None

    def listar_outros_clientes(self, email_atual: str) -> list[Cliente]:
        """Retorna todos os clientes, exceto o que está logado."""
        return [c for email, c in self._clientes.items() if email != email_atual]


# Instância global — funciona como um banco de dados compartilhado pela aplicação
db = BancoDados()
