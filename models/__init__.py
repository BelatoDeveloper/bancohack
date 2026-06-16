"""
models/__init__.py — exporta a instância global do banco de dados.
"""
from models.banco_dados import db

__all__ = ["db"]
