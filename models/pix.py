"""
Model: pix.py
Representa uma chave Pix associada a um cliente.
"""
import uuid


class ChavePix:
    """
    Entidade que representa uma chave Pix cadastrada no sistema ZicaPay.
    Tipos suportados: CPF, email, telefone, aleatória.
    """

    TIPOS_VALIDOS = ["cpf", "email", "telefone", "aleatoria"]

    def __init__(self, id: int, tipo: str, valor: str):
        if tipo not in self.TIPOS_VALIDOS:
            raise ValueError(f"Tipo de chave inválido: {tipo}")
        self._id = id
        self._tipo = tipo
        self._valor = valor
        self._ativa = True

    @property
    def id(self) -> int:
        return self._id

    @property
    def tipo(self) -> str:
        return self._tipo

    @property
    def tipo_label(self) -> str:
        labels = {
            "cpf": "CPF",
            "email": "E-mail",
            "telefone": "Telefone",
            "aleatoria": "Chave Aleatória",
        }
        return labels.get(self._tipo, self._tipo)

    @property
    def valor(self) -> str:
        return self._valor

    @property
    def ativa(self) -> bool:
        return self._ativa

    def desativar(self) -> None:
        self._ativa = False

    def to_dict(self) -> dict:
        return {
            "id": self._id,
            "tipo": self._tipo,
            "tipo_label": self.tipo_label,
            "valor": self._valor,
            "ativa": self._ativa,
        }

    @staticmethod
    def gerar_chave_aleatoria() -> str:
        return str(uuid.uuid4())

    def __repr__(self) -> str:
        return f"<ChavePix id={self._id} tipo='{self._tipo}' ativa={self._ativa}>"
