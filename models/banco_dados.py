"""
Model: banco_dados.py (Refatorado para Fallback Local)
Repositório mock usando arquivo JSON local para evitar travamentos do gRPC/Firebase.
"""
import os
import json
from datetime import datetime
from models.conta import Conta
from models.cliente import Cliente
from models.notificacao import Notificacao
from models.pix import ChavePix
from models.cartao import Cartao

LOCAL_DB_FILE = "local_db.json"

class BancoDados:
    """Repositório mock usando arquivo JSON local."""

    def __init__(self):
        self._clientes_dict = {}
        self._id_counter = 1
        self._carregar_local()

    def _carregar_local(self):
        if os.path.exists(LOCAL_DB_FILE):
            try:
                with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._id_counter = data.get("id_counter", 1)
                    for k, v in data.get("clientes", {}).items():
                        self._clientes_dict[k] = self._cliente_from_dict(v)
            except Exception as e:
                print(f"Erro ao carregar {LOCAL_DB_FILE}: {e}")

    def _salvar_local(self):
        data = {
            "id_counter": self._id_counter,
            "clientes": {k: self._cliente_to_dict(v) for k, v in self._clientes_dict.items()}
        }
        with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    def _get_next_id(self) -> int:
        return self._id_counter

    def _cliente_from_dict(self, data: dict) -> Cliente:
        # Reconstrói a Conta
        c_data = data.get("conta", {})
        conta = Conta(
            numero=c_data.get("numero", ""),
            agencia=c_data.get("agencia", ""),
            saldo_inicial=c_data.get("saldo", 0.0),
            tipo=c_data.get("tipo", "corrente")
        )

        # Reconstrói o Cliente
        cliente = Cliente(
            id=data.get("id", 0),
            nome=data.get("nome", ""),
            email=data.get("email", ""),
            senha=data.get("senha", ""),
            cpf=data.get("cpf", ""),
            telefone=data.get("telefone", ""),
            conta=conta,
            foto_url=data.get("foto_url")
        )

        cliente._historico = data.get("historico", [])
        cliente.cartao_oferta_vista = data.get("cartao_oferta_vista", False)
        cliente.pedido_cartao = data.get("pedido_cartao", None)
        cliente.taxa_abertura_paga = data.get("taxa_abertura_paga", False)
        
        # Reconstrói Cartão
        cartao_data = data.get("cartao", {})
        if cartao_data:
            cliente._cartao = Cartao(id=cliente._id, limite=cartao_data.get("limite", 5000.0), nome_titular=cliente._nome)
            cliente._cartao._numero = cartao_data.get("numero", cliente._cartao._numero)
            cliente._cartao._cvv = cartao_data.get("cvv", cliente._cartao._cvv)
            cliente._cartao._bloqueado = cartao_data.get("bloqueado", False)

        # Reconstrói Chaves Pix
        cliente._chaves_pix = []
        for p in data.get("chaves_pix", []):
            chave = ChavePix(id=p.get("id", 1), tipo=p.get("tipo", ""), valor=p.get("valor", ""))
            if not p.get("ativa", True):
                chave.desativar()
            cliente._chaves_pix.append(chave)
            if p.get("id", 1) >= cliente._pix_id_counter:
                cliente._pix_id_counter = p.get("id", 1) + 1

        # Reconstrói Notificações
        cliente._notificacoes = []
        for n in data.get("notificacoes", []):
            notif = Notificacao(
                id=n.get("id", 1),
                mensagem=n.get("mensagem", ""),
                tipo=n.get("tipo", "info"),
                icone=n.get("icone", "bell")
            )
            raw_data = n.get("data")
            if isinstance(raw_data, str):
                try:
                    notif._data = datetime.fromisoformat(raw_data)
                except ValueError:
                    try:
                        notif._data = datetime.strptime(raw_data.split(".")[0], "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        pass
            notif._lida = n.get("lida", False)
            cliente._notificacoes.append(notif)
            
        return cliente

    def _cliente_to_dict(self, cliente: Cliente) -> dict:
        return {
            "id": cliente._id,
            "nome": cliente._nome,
            "email": cliente._email,
            "senha": cliente._senha,
            "cpf": cliente._cpf,
            "telefone": cliente._telefone,
            "foto_url": cliente._foto_url,
            "conta": {
                "numero": cliente.conta.numero,
                "agencia": cliente.conta.agencia,
                "saldo": cliente.conta.saldo,
                "tipo": cliente.conta.tipo
            },
            "cartao_oferta_vista": getattr(cliente, "cartao_oferta_vista", False),
            "pedido_cartao": getattr(cliente, "pedido_cartao", None),
            "taxa_abertura_paga": getattr(cliente, "taxa_abertura_paga", False),
            "cartao": {
                "numero": getattr(cliente.cartao, "_numero", ""),
                "cvv": getattr(cliente.cartao, "_cvv", ""),
                "limite": cliente.cartao.limite,
                "bloqueado": cliente.cartao.bloqueado
            } if cliente.cartao else {},
            "chaves_pix": [
                {"id": p.id, "tipo": p.tipo, "valor": p.valor, "ativa": p.ativa} for p in cliente.chaves_pix
            ],
            "notificacoes": [
                {"id": n.id, "mensagem": n.mensagem, "tipo": n.tipo, "icone": n.icone, "data": n.data, "lida": n.lida} for n in cliente.notificacoes
            ],
            "historico": cliente.historico
        }

    def salvar_cliente(self, cliente: Cliente) -> None:
        self._clientes_dict[cliente.email] = cliente
        self._salvar_local()

    # ── Métodos de consulta ──────────────────────────────────────────────

    def buscar_por_email(self, email: str) -> Cliente | None:
        return self._clientes_dict.get(email)

    def buscar_por_numero_conta(self, numero: str) -> Cliente | None:
        for c in self._clientes_dict.values():
            if c.conta.numero == numero:
                return c
        return None

    def buscar_por_cpf(self, cpf: str) -> Cliente | None:
        for c in self._clientes_dict.values():
            if c._cpf == cpf:
                return c
        return None

    def buscar_por_chave_pix(self, chave: str) -> Cliente | None:
        for c in self._clientes_dict.values():
            for cp in c.chaves_pix:
                if cp.valor == chave and cp.ativa:
                    return c
        return None

    def listar_outros_clientes(self, email_atual: str) -> list[Cliente]:
        return [c for c in self._clientes_dict.values() if c.email != email_atual]

    def registrar_cliente(
        self,
        nome: str,
        email: str,
        senha: str,
        cpf: str,
        telefone: str,
    ) -> Cliente:
        if self.buscar_por_email(email):
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
        
        self.salvar_cliente(cliente)
        self._id_counter += 1
        self._salvar_local()
        return cliente


# Instância global — compartilhada pela aplicação
db = BancoDados()
