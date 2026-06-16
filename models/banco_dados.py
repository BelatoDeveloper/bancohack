"""
Model: banco_dados.py (expandido para ZicaPay)
Repositório em memória com seed completo para demonstração.
"""
from models.conta import Conta
from models.cliente import Cliente
from models.notificacao import Notificacao


class BancoDados:
    """Repositório singleton em memória com todos os clientes ZicaPay."""

    def __init__(self):
        self._clientes: dict[str, Cliente] = {}
        self._id_counter = 4
        self._seed()

    def _seed(self) -> None:
        """Popula o sistema com dados iniciais de demonstração."""
        clientes_seed = [
            Cliente(
                id=1,
                nome="Ana Paula Ferreira",
                email="ana@zicapay.com",
                senha="senha123",
                cpf="123.456.789-01",
                telefone="(11) 98765-4321",
                conta=Conta(numero="0001-2", agencia="0001", saldo_inicial=5_250.75),
            ),
            Cliente(
                id=2,
                nome="Bruno Carvalho Lima",
                email="bruno@zicapay.com",
                senha="senha456",
                cpf="987.654.321-09",
                telefone="(21) 91234-5678",
                conta=Conta(numero="0002-8", agencia="0001", saldo_inicial=1_820.00),
            ),
            Cliente(
                id=3,
                nome="Carla Mendes Souza",
                email="carla@zicapay.com",
                senha="senha789",
                cpf="456.789.123-05",
                telefone="(31) 99876-5432",
                conta=Conta(numero="0003-4", agencia="0001", saldo_inicial=12_500.00),
            ),
        ]

        for c in clientes_seed:
            self._clientes[c.email] = c

        # Seed: chaves pix
        ana = self._clientes["ana@zicapay.com"]
        ana.adicionar_chave_pix("email", "ana@zicapay.com")
        ana.adicionar_chave_pix("telefone", "(11) 98765-4321")

        bruno = self._clientes["bruno@zicapay.com"]
        bruno.adicionar_chave_pix("cpf", "987.654.321-09")

        carla = self._clientes["carla@zicapay.com"]
        carla.adicionar_chave_pix("email", "carla@zicapay.com")

        # Seed: notificações iniciais
        ana.adicionar_notificacao(
            "Bem-vinda ao ZicaPay! Sua conta está pronta. 🎉",
            tipo="sucesso",
            icone="check-circle",
        )
        ana.adicionar_notificacao(
            "Cadastre sua chave Pix para receber transferências mais rápido.",
            tipo="info",
            icone="zap",
        )

        # Seed: histórico inicial
        from datetime import datetime, timedelta
        def fmt(v):
            return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        for i, (tipo, valor, nome, subtipo) in enumerate([
            ("ENTRADA", 1500.0, "Salário ZicaPay", "deposito"),
            ("SAÍDA", 89.90, "Netflix", "pagamento"),
            ("SAÍDA", 45.50, "iFood", "pagamento"),
            ("ENTRADA", 200.0, "Bruno Carvalho Lima", "pix"),
            ("SAÍDA", 30.0, "Carla Mendes Souza", "pix"),
        ]):
            data = (datetime.now() - timedelta(days=i)).strftime("%d/%m/%Y %H:%M")
            ana._historico.append({
                "id": i + 1,
                "tipo": tipo,
                "subtipo": subtipo,
                "valor": valor,
                "valor_formatado": fmt(valor),
                "nome": nome,
                "data": data,
                "status": "concluída",
                "icone": "arrow-down-left" if tipo == "ENTRADA" else "arrow-up-right",
            })

    # ── Métodos de consulta ──────────────────────────────────────────────

    def buscar_por_email(self, email: str) -> Cliente | None:
        return self._clientes.get(email)

    def buscar_por_numero_conta(self, numero: str) -> Cliente | None:
        for cliente in self._clientes.values():
            if cliente.conta.numero == numero:
                return cliente
        return None

    def buscar_por_cpf(self, cpf: str) -> Cliente | None:
        for cliente in self._clientes.values():
            if cliente.cpf == cpf:
                return cliente
        return None

    def buscar_por_chave_pix(self, chave: str) -> Cliente | None:
        for cliente in self._clientes.values():
            for cp in cliente.chaves_pix:
                if cp.valor == chave and cp.ativa:
                    return cliente
        return None

    def listar_outros_clientes(self, email_atual: str) -> list[Cliente]:
        return [c for email, c in self._clientes.items() if email != email_atual]

    def registrar_cliente(
        self,
        nome: str,
        email: str,
        senha: str,
        cpf: str,
        telefone: str,
    ) -> Cliente:
        if email in self._clientes:
            raise ValueError("E-mail já cadastrado.")
        numero_conta = f"{self._id_counter:04d}-{self._id_counter % 9}"
        conta = Conta(numero=numero_conta, agencia="0001", saldo_inicial=0.0)
        cliente = Cliente(
            id=self._id_counter,
            nome=nome,
            email=email,
            senha=senha,
            cpf=cpf,
            telefone=telefone,
            conta=conta,
        )
        cliente.adicionar_chave_pix("email", email)
        cliente.adicionar_notificacao(
            f"Bem-vindo(a) ao ZicaPay, {nome.split()[0]}! Sua conta está pronta. 🎉",
            tipo="sucesso",
            icone="check-circle",
        )
        self._id_counter += 1
        self._clientes[email] = cliente
        return cliente


# Instância global — compartilhada pela aplicação
db = BancoDados()
