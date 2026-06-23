"""
Model: notificacao.py
Representa uma notificação do sistema para o usuário.
"""
from datetime import datetime


class Notificacao:
    """
    Entidade que representa uma notificação do sistema ZicaPay.
    """

    def __init__(self, id: int, mensagem: str, tipo: str = "info", icone: str = "bell"):
        self._id = id
        self._mensagem = mensagem
        self._tipo = tipo          # info | sucesso | alerta | erro
        self._icone = icone
        self._lida = False
        self._data = datetime.now()

    @property
    def id(self) -> int:
        return self._id

    @property
    def mensagem(self) -> str:
        return self._mensagem

    @property
    def tipo(self) -> str:
        return self._tipo

    @property
    def icone(self) -> str:
        return self._icone

    @property
    def lida(self) -> bool:
        return self._lida

    @property
    def data(self) -> datetime:
        return self._data

    @property
    def data_formatada(self) -> str:
        # Pega o timezone atual da data se existir, para evitar erro de offset
        tz = getattr(self._data, 'tzinfo', None)
        agora = datetime.now(tz) if tz else datetime.now()
        diff = agora - self._data
        if diff.seconds < 60:
            return "Agora"
        elif diff.seconds < 3600:
            return f"{diff.seconds // 60}min atrás"
        elif diff.days == 0:
            return f"{diff.seconds // 3600}h atrás"
        elif diff.days == 1:
            return "Ontem"
        else:
            return self._data.strftime("%d/%m/%Y")

    def marcar_lida(self) -> None:
        self._lida = True

    def to_dict(self) -> dict:
        return {
            "id": self._id,
            "mensagem": self._mensagem,
            "tipo": self._tipo,
            "icone": self._icone,
            "lida": self._lida,
            "data": self.data_formatada,
        }

    def __repr__(self) -> str:
        return f"<Notificacao id={self._id} tipo='{self._tipo}' lida={self._lida}>"
