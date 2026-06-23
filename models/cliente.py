"""
Model: cliente.py (expandido para ZicaPay)
Subclasse de Usuario com cartão, chaves pix e notificações.
"""
from datetime import datetime
from models.usuario import Usuario
from models.conta import Conta
from models.cartao import Cartao
from models.pix import ChavePix
from models.notificacao import Notificacao


class Cliente(Usuario):
    """
    Especialização de Usuario para clientes do banco digital ZicaPay.
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
        foto_url: str = None,
    ):
        super().__init__(id=id, nome=nome, email=email, senha=senha)
        self._cpf = cpf
        self._telefone = telefone
        self._conta = conta
        self._foto_url = foto_url or f"https://ui-avatars.com/api/?name={nome.replace(' ', '+')}&background=21C25E&color=fff&size=128"
        self._historico: list[dict] = []
        self._chaves_pix: list[ChavePix] = []
        self._cartao: Cartao = Cartao(id=id, limite=5000.0, nome_titular=nome)
        self._notificacoes: list[Notificacao] = []
        self._pix_id_counter = 1

    # ── Getters ─────────────────────────────────────────────────────────

    @property
    def cpf(self) -> str:
        return self._cpf

    @property
    def cpf_mascarado(self) -> str:
        return f"***.***.***-{self._cpf[-2:]}"

    @property
    def telefone(self) -> str:
        return self._telefone

    @property
    def conta(self) -> Conta:
        return self._conta

    @property
    def foto_url(self) -> str:
        return self._foto_url

    @property
    def historico(self) -> list[dict]:
        return list(self._historico)

    @property
    def chaves_pix(self) -> list[ChavePix]:
        return list(self._chaves_pix)

    @property
    def cartao(self) -> Cartao:
        return self._cartao

    @property
    def notificacoes(self) -> list[Notificacao]:
        return list(self._notificacoes)

    @property
    def notificacoes_nao_lidas(self) -> int:
        return sum(1 for n in self._notificacoes if not n.lida)

    @property
    def primeiro_nome(self) -> str:
        return self._nome.split()[0]

    @property
    def saudacao(self) -> str:
        hora = datetime.now().hour
        if hora < 12:
            return "Bom dia"
        elif hora < 18:
            return "Boa tarde"
        else:
            return "Boa noite"

    # ── Métodos de negócio ──────────────────────────────────────────────

    def realizar_transferencia(self, destinatario: "Cliente", valor: float) -> dict:
        """Orquestra transferência entre dois clientes."""
        self._conta.debitar(valor)
        destinatario.conta.depositar(valor)

        def fmt(v):
            return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        registro = {
            "id": len(self._historico) + 1,
            "tipo": "SAÍDA",
            "subtipo": "transferencia",
            "valor": valor,
            "valor_formatado": fmt(valor),
            "nome": destinatario.nome,
            "destinatario_nome": destinatario.nome,
            "destinatario_conta": destinatario.conta.numero,
            "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "status": "concluída",
            "icone": "arrow-up-right",
        }
        self._historico.insert(0, registro)

        destinatario._historico.insert(0, {
            "id": len(destinatario._historico) + 1,
            "tipo": "ENTRADA",
            "subtipo": "transferencia",
            "valor": valor,
            "valor_formatado": fmt(valor),
            "nome": self._nome,
            "remetente_nome": self._nome,
            "remetente_conta": self._conta.numero,
            "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "status": "concluída",
            "icone": "arrow-down-left",
        })

        destinatario._notificacoes.insert(0, Notificacao(
            id=len(destinatario._notificacoes) + 1,
            mensagem=f"Você recebeu {fmt(valor)} de {self._nome}",
            tipo="sucesso",
            icone="arrow-down-left",
        ))
        return registro

    def realizar_deposito(self, valor: float, descricao: str = "Depósito") -> dict:
        """Simula um depósito na conta."""
        self._conta.depositar(valor)

        def fmt(v):
            return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        registro = {
            "id": len(self._historico) + 1,
            "tipo": "ENTRADA",
            "subtipo": "deposito",
            "valor": valor,
            "valor_formatado": fmt(valor),
            "nome": descricao,
            "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "status": "concluída",
            "icone": "plus-circle",
        }
        self._historico.insert(0, registro)

        self._notificacoes.insert(0, Notificacao(
            id=len(self._notificacoes) + 1,
            mensagem=f"Depósito de {fmt(valor)} recebido com sucesso!",
            tipo="sucesso",
            icone="check-circle",
        ))
        return registro

    def realizar_pix(self, destinatario: "Cliente", valor: float) -> dict:
        """Realiza uma transferência via Pix."""
        self._conta.debitar(valor)
        destinatario.conta.depositar(valor)

        def fmt(v):
            return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        registro = {
            "id": len(self._historico) + 1,
            "tipo": "SAÍDA",
            "subtipo": "pix",
            "valor": valor,
            "valor_formatado": fmt(valor),
            "nome": destinatario.nome,
            "destinatario_nome": destinatario.nome,
            "destinatario_conta": destinatario.conta.numero,
            "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "status": "concluída",
            "icone": "zap",
        }
        self._historico.insert(0, registro)

        destinatario._historico.insert(0, {
            "id": len(destinatario._historico) + 1,
            "tipo": "ENTRADA",
            "subtipo": "pix",
            "valor": valor,
            "valor_formatado": fmt(valor),
            "nome": self._nome,
            "remetente_nome": self._nome,
            "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "status": "concluída",
            "icone": "zap",
        })

        destinatario._notificacoes.insert(0, Notificacao(
            id=len(destinatario._notificacoes) + 1,
            mensagem=f"Pix de {fmt(valor)} recebido de {self._nome}",
            tipo="sucesso",
            icone="zap",
        ))
        return registro

    def adicionar_chave_pix(self, tipo: str, valor: str) -> ChavePix:
        """Cadastra uma nova chave Pix."""
        for chave in self._chaves_pix:
            if chave.tipo == tipo and chave.ativa:
                raise ValueError(f"Já existe uma chave do tipo {tipo} cadastrada.")
        chave = ChavePix(id=self._pix_id_counter, tipo=tipo, valor=valor)
        self._pix_id_counter += 1
        self._chaves_pix.append(chave)
        return chave

    def remover_chave_pix(self, chave_id: int) -> bool:
        """Remove uma chave Pix pelo ID."""
        for chave in self._chaves_pix:
            if chave.id == chave_id:
                chave.desativar()
                return True
        return False

    def adicionar_notificacao(self, mensagem: str, tipo: str = "info", icone: str = "bell") -> Notificacao:
        n = Notificacao(
            id=len(self._notificacoes) + 1,
            mensagem=mensagem,
            tipo=tipo,
            icone=icone,
        )
        self._notificacoes.insert(0, n)
        return n

    def marcar_notificacao_lida(self, notif_id: int) -> bool:
        for n in self._notificacoes:
            if n.id == notif_id:
                n.marcar_lida()
                return True
        return False

    def excluir_notificacao(self, notif_id: int) -> bool:
        antes = len(self._notificacoes)
        self._notificacoes = [n for n in self._notificacoes if n.id != notif_id]
        return len(self._notificacoes) < antes

    def __repr__(self) -> str:
        return f"<Cliente id={self._id} nome='{self._nome}' conta='{self._conta.numero}'>"
