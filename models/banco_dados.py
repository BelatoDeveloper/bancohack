"""
Model: banco_dados.py (Refatorado para Firebase)
Repositório conectado ao Firestore.
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore
from models.conta import Conta
from models.cliente import Cliente
from models.notificacao import Notificacao
from models.pix import ChavePix
from models.cartao import Cartao


class BancoDados:
    """Repositório conectado ao Firebase Firestore."""

    def __init__(self):
        # Tenta inicializar o Firebase com o arquivo local
        cred_path = "firebase_credentials.json"
        if not firebase_admin._apps:
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                print(f"AVISO: Arquivo {cred_path} não encontrado. Firebase pode não funcionar localmente.")
                # Fallback para application default credentials se aplicável
                try:
                    firebase_admin.initialize_app()
                except Exception as e:
                    print(f"Erro ao inicializar Firebase: {e}")

        try:
            self.db = firestore.client()
            self._clientes_ref = self.db.collection("clientes")
        except Exception as e:
            self.db = None
            self._clientes_ref = None
            print(f"Erro ao conectar ao Firestore: {e}")

        self._id_counter = self._get_next_id()

    def _get_next_id(self) -> int:
        if not self._clientes_ref:
            return 1
        # Busca o maior ID atual de forma simples
        docs = self._clientes_ref.order_by("id", direction=firestore.Query.DESCENDING).limit(1).stream()
        for doc in docs:
            return doc.to_dict().get("id", 0) + 1
        return 1

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

        # Injeta estado interno sem disparar os métodos que gravam histórico/notificações
        cliente._historico = data.get("historico", [])
        cliente.cartao_oferta_vista = data.get("cartao_oferta_vista", False)
        cliente.pedido_cartao = data.get("pedido_cartao", None)
        # [BAD UX] Flag de taxa de abertura — persiste no Firestore para cobrar só uma vez
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
            notif._data = n.get("data", notif._data)
            notif._lida = n.get("lida", False)
            cliente._notificacoes.append(notif)
            
        return cliente

    def _cliente_to_dict(self, cliente: Cliente) -> dict:
        return {
            "id": cliente._id,
            "nome": cliente._nome,
            "email": cliente._email,
            "senha": cliente._senha, # Lembrete: em prod, deve ser hash
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
            # [BAD UX] Taxa de abertura — salvo para garantir cobrança única por usuário
            "taxa_abertura_paga": getattr(cliente, "taxa_abertura_paga", False),
            "cartao": {
                "numero": cliente.cartao.numero_mascarado,
                "cvv": cliente.cartao.cvv,
                "limite": cliente.cartao.limite,
                "bloqueado": cliente.cartao.bloqueado
            },
            "chaves_pix": [
                {"id": p.id, "tipo": p.tipo, "valor": p.valor, "ativa": p.ativa} for p in cliente.chaves_pix
            ],
            "notificacoes": [
                {"id": n.id, "mensagem": n.mensagem, "tipo": n.tipo, "icone": n.icone, "data": n.data, "lida": n.lida} for n in cliente.notificacoes
            ],
            "historico": cliente.historico
        }

    def salvar_cliente(self, cliente: Cliente) -> None:
        """Sincroniza o objeto Cliente de volta para o Firestore."""
        if not self._clientes_ref:
            return
        data = self._cliente_to_dict(cliente)
        self._clientes_ref.document(cliente.email).set(data)

    # ── Métodos de consulta ──────────────────────────────────────────────

    def buscar_por_email(self, email: str) -> Cliente | None:
        if not self._clientes_ref: return None
        doc = self._clientes_ref.document(email).get()
        if doc.exists:
            return self._cliente_from_dict(doc.to_dict())
        return None

    def buscar_por_numero_conta(self, numero: str) -> Cliente | None:
        if not self._clientes_ref: return None
        docs = self._clientes_ref.where(firestore.FieldPath(["conta", "numero"]), "==", numero).limit(1).stream()
        for doc in docs:
            return self._cliente_from_dict(doc.to_dict())
        return None

    def buscar_por_cpf(self, cpf: str) -> Cliente | None:
        if not self._clientes_ref: return None
        docs = self._clientes_ref.where("cpf", "==", cpf).limit(1).stream()
        for doc in docs:
            return self._cliente_from_dict(doc.to_dict())
        return None

    def buscar_por_chave_pix(self, chave: str) -> Cliente | None:
        if not self._clientes_ref: return None
        # O Firestore não suporta busca direta em array de dicionários de forma simples, 
        # a menos que saibamos o objeto exato. Vamos iterar sobre todos (para demo).
        docs = self._clientes_ref.stream()
        for doc in docs:
            c_dict = doc.to_dict()
            for cp in c_dict.get("chaves_pix", []):
                if cp.get("valor") == chave and cp.get("ativa"):
                    return self._cliente_from_dict(c_dict)
        return None

    def listar_outros_clientes(self, email_atual: str) -> list[Cliente]:
        if not self._clientes_ref: return []
        docs = self._clientes_ref.where("email", "!=", email_atual).stream()
        return [self._cliente_from_dict(doc.to_dict()) for doc in docs]

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
        return cliente


# Instância global — compartilhada pela aplicação
db = BancoDados()
