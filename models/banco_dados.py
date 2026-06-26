"""
Model: banco_dados.py (Refatorado para Fallback Local)
Repositório mock usando arquivo JSON local para evitar travamentos do gRPC/Firebase.
"""
import os
import json
from datetime import datetime

# FIX VERCEL FIREBASE: Importando Firebase admin
import firebase_admin
from firebase_admin import credentials, firestore

from models.conta import Conta
from models.cliente import Cliente
from models.notificacao import Notificacao
from models.pix import ChavePix
from models.cartao import Cartao

LOCAL_DB_FILE = "local_db.json"

# FIX: Bug Hackathon — Inicialização Firebase com suporte a variáveis de ambiente (Vercel)
# Prioridade: 1) Env var FIREBASE_SERVICE_ACCOUNT_JSON (produção Vercel)
#             2) Arquivo firebase_credentials.json (desenvolvimento local)
#             3) GOOGLE_APPLICATION_CREDENTIALS (path para arquivo via env var)
try:
    if not firebase_admin._apps:
        db_firestore = None

        # Tentativa 1: Credenciais via variável de ambiente (JSON completo como string)
        # Configurado no painel da Vercel: Settings > Environment Variables
        firebase_json_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if firebase_json_env:
            try:
                cred_dict = json.loads(firebase_json_env)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                db_firestore = firestore.client()
                print("[ZicaPay] Firebase inicializado via variável de ambiente FIREBASE_SERVICE_ACCOUNT_JSON")
            except Exception as e_env:
                print(f"[ZicaPay] Falha ao inicializar Firebase via env var: {e_env}")

        # Tentativa 2: Arquivo físico local (desenvolvimento)
        if db_firestore is None:
            cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase_credentials.json")
            if os.path.exists(cred_path):
                try:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    db_firestore = firestore.client()
                    print("[ZicaPay] Firebase inicializado via arquivo local firebase_credentials.json")
                except Exception as e_file:
                    print(f"[ZicaPay] Falha ao inicializar Firebase via arquivo: {e_file}")

        if db_firestore is None:
            print("[ZicaPay] Firebase indisponível — usando banco local (local_db.json)")
    else:
        db_firestore = firestore.client()
except Exception as e:
    print(f"[ZicaPay] Erro crítico ao inicializar Firebase: {e}")
    db_firestore = None


class BancoDados:
    """Repositório mock usando arquivo JSON local."""

    def __init__(self):
        self._clientes_dict = {}
        self._id_counter = 1
        self._carregar_local()

    def _carregar_local(self):
        # FIX VERCEL FIREBASE: Usar Firebase se disponível e estiver na Vercel
        if os.environ.get("VERCEL") and db_firestore:
            try:
                docs = db_firestore.collection('clientes').stream()
                for doc in docs:
                    data = doc.to_dict()
                    self._clientes_dict[data.get('email')] = self._cliente_from_dict(data)
                
                meta_doc = db_firestore.collection('metadata').document('banco').get()
                if meta_doc.exists:
                    self._id_counter = meta_doc.to_dict().get("id_counter", 1)
                return
            except Exception as e:
                print(f"Erro ao carregar do Firebase: {e}")

        # FIX VERCEL FIREBASE: Tratamento de erros (fallback)
        try:
            if os.path.exists(LOCAL_DB_FILE):
                with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._id_counter = data.get("id_counter", 1)
                    for k, v in data.get("clientes", {}).items():
                        self._clientes_dict[k] = self._cliente_from_dict(v)
        except OSError:
            pass
        except Exception as e:
            print(f"Erro ao carregar {LOCAL_DB_FILE}: {e}")

    def _salvar_local(self):
        # FIX VERCEL FIREBASE: Pular gravação local se estiver na Vercel
        if os.environ.get("VERCEL"):
            return

        data = {
            "id_counter": self._id_counter,
            "clientes": {k: self._cliente_to_dict(v) for k, v in self._clientes_dict.items()}
        }
        
        # FIX VERCEL FIREBASE: Tratamento de erro (fallback) para infra Serverless
        try:
            with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        except OSError:
            pass
        except Exception as e:
            print(f"Erro ao salvar {LOCAL_DB_FILE}: {e}")

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
            elif isinstance(raw_data, datetime):
                # FIX VERCEL FIREBASE: Suporte nativo para datetime retornado pelo Firebase
                notif._data = raw_data
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
        
        # FIX VERCEL FIREBASE: Gravar cliente no Firebase
        if db_firestore:
            try:
                db_firestore.collection('clientes').document(cliente.email).set(self._cliente_to_dict(cliente))
            except Exception as e:
                print(f"Erro ao salvar cliente no Firebase: {e}")
                
        self._salvar_local()

    # ── Métodos de consulta ──────────────────────────────────────────────

    def buscar_por_email(self, email: str) -> Cliente | None:
        # Tenta encontrar na memória RAM local primeiro
        cliente = self._clientes_dict.get(email)
        if cliente:
            return cliente

        # BLINDAGEM HACKATHON: Se não encontrou na RAM, tenta recuperar do Firebase
        # Isso resolve o problema de "amnésia" serverless na Vercel
        if db_firestore:
            try:
                doc = db_firestore.collection('clientes').document(email).get()
                if doc.exists:
                    data = doc.to_dict()
                    cliente = self._cliente_from_dict(data)
                    # Recarrega na memória local para uso imediato
                    self._clientes_dict[email] = cliente
                    return cliente
            except Exception as e:
                print(f"Erro ao buscar cliente no Firebase: {e}")

        return None

    def buscar_por_numero_conta(self, numero: str) -> Cliente | None:
        for c in self._clientes_dict.values():
            if c.conta.numero == numero:
                return c
        return None

        def buscar_por_email_fresh(self, email: str) -> Cliente | None:
        """FIX: Bug Hackathon — Busca diretamente no Firebase, ignorando o cache RAM.

        Usado pelo /api/accounts/balance para garantir o saldo mais recente persistido,
        evitando que instâncias serverless diferentes retornem saldos desatualizados
        de suas caches de memória locais independentes.

        Após a leitura, atualiza o cache local para servir requisições subsequentes.
        """
        if db_firestore:
            try:
                doc = db_firestore.collection('clientes').document(email).get()
                if doc.exists:
                    data = doc.to_dict()
                    cliente = self._cliente_from_dict(data)
                    # Atualiza cache local — a instância atual terá o saldo correto
                    self._clientes_dict[email] = cliente
                    return cliente
            except Exception as e:
                print(f"[ZicaPay] buscar_por_email_fresh: erro Firebase: {e}")

        # Fallback: usa o cache local se Firebase falhar
        return self._clientes_dict.get(email)

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
        
        # FIX VERCEL FIREBASE: Sincronizar metadata id_counter no Firebase
        if db_firestore:
            try:
                db_firestore.collection('metadata').document('banco').set({"id_counter": self._id_counter}, merge=True)
            except Exception as e:
                print(f"Erro ao atualizar id_counter no Firebase: {e}")
                
        self._salvar_local()
        return cliente


# Instância global — compartilhada pela aplicação
db = BancoDados()
