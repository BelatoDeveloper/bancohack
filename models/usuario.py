"""
Model: usuario.py
Superclasse base que representa qualquer usuário do sistema.
Responsabilidade: armazenar credenciais e dados de identificação comuns.
"""


class Usuario:
    """
    Superclasse abstrata que define a identidade e as credenciais de acesso
    de qualquer participante do sistema bancário.

    Atributos encapsulados:
        _id (int): Identificador único do usuário.
        _nome (str): Nome completo.
        _email (str): E-mail usado como login.
        _senha (str): Senha de acesso (em produção, seria um hash).
    """

    def __init__(self, id: int, nome: str, email: str, senha: str):
        self._id = id
        self._nome = nome
        self._email = email
        self._senha = senha  # Em produção: armazenar hash (ex: bcrypt)

    # ── Getters (encapsulamento: atributos privados, acesso controlado) ──

    @property
    def id(self) -> int:
        return self._id

    @property
    def nome(self) -> str:
        return self._nome

    @property
    def email(self) -> str:
        return self._email

    # ── Métodos de comportamento ─────────────────────────────────────────

    def verificar_senha(self, senha_digitada: str) -> bool:
        """
        Verifica se a senha fornecida corresponde à senha cadastrada.
        Centraliza a lógica de autenticação na própria entidade.
        """
        return self._senha == senha_digitada

    def __repr__(self) -> str:
        return f"<Usuario id={self._id} email='{self._email}'>"
