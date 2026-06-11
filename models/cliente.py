"""
Model: cliente.py
Subclasse de Usuario que representa o cliente do banco digital.
Responsabilidade: combinar identidade (Usuario) com posse de conta (Conta).
Demonstra herança simples e composição de objetos.
"""

from models.usuario import Usuario
from models.conta import Conta


class Cliente(Usuario):
    """
    Especialização de Usuario para clientes do banco digital.
    Herda credenciais e autenticação de Usuario e adiciona:
        - Dados pessoais (CPF, telefone)
        - Associação com uma Conta bancária
        - Histórico de transferências realizadas

    Herança: Cliente -> Usuario
    Composição: Cliente possui uma Conta
    """

    def __init__(
        self,
        id: int,
        nome: str,
        email: str,
        senha: str,
        cpf: str,
        telefone: str,
        conta: Conta,
    ):
        # Chama o construtor da superclasse (Usuario)
        super().__init__(id=id, nome=nome, email=email, senha=senha)

        # Atributos exclusivos de Cliente (encapsulados)
        self._cpf = cpf
        self._telefone = telefone
        self._conta = conta
        self._historico: list[dict] = []  # Registros de transferências

    # ── Getters ──────────────────────────────────────────────────────────

    @property
    def cpf(self) -> str:
        return self._cpf

    @property
    def cpf_mascarado(self) -> str:
        """Exibe apenas os últimos 4 dígitos por segurança."""
        return f"***.***.***-{self._cpf[-2:]}"

    @property
    def telefone(self) -> str:
        return self._telefone

    @property
    def conta(self) -> Conta:
        return self._conta

    @property
    def historico(self) -> list[dict]:
        return list(self._historico)  # Retorna cópia para não expor referência interna

    # ── Métodos de negócio ───────────────────────────────────────────────

    def realizar_transferencia(self, destinatario: "Cliente", valor: float) -> dict:
        """
        Orquestra uma transferência entre dois clientes.
        1. Debita da conta do remetente (esta instância).
        2. Credita na conta do destinatário.
        3. Registra no histórico de ambos.
        Retorna um dicionário com o registro da operação.
        """
        self._conta.debitar(valor)          # pode lançar ValueError
        destinatario.conta.depositar(valor)

        registro = {
            "tipo": "SAÍDA",
            "valor": valor,
            "valor_formatado": f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "destinatario_nome": destinatario.nome,
            "destinatario_conta": destinatario.conta.numero,
        }
        self._historico.append(registro)

        # Registra também no histórico do destinatário
        destinatario._historico.append({
            "tipo": "ENTRADA",
            "valor": valor,
            "valor_formatado": registro["valor_formatado"],
            "remetente_nome": self._nome,
            "remetente_conta": self._conta.numero,
        })

        return registro

    def __repr__(self) -> str:
        return f"<Cliente id={self._id} nome='{self._nome}' conta='{self._conta.numero}'>"
