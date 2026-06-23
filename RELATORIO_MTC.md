# Relatório Técnico — Arquitetura MTC aplicada ao BancoHack
**Projeto:** BancoHack — Banco Digital (Hackathon Acadêmico)  
**Disciplina / Avaliador:** Prof. Claudinei  
**Framework:** Python 3.x + Flask  
**Padrão Arquitetural:** MTC (Model — Template — Controller)

---

## 1. Visão geral da organização do projeto

```
banco_digital/
├── app.py                        ← CONTROLLER (único ponto de entrada)
├── requirements.txt              ← Dependências (apenas Flask)
│
├── models/                       ← MODEL (dados + regras de negócio)
│   ├── __init__.py
│   ├── usuario.py                (superclasse: identidade e autenticação)
│   ├── conta.py                  (entidade: saldo e operações financeiras)
│   ├── cliente.py                (subclasse de Usuario, compõe Conta)
│   └── banco_dados.py            (repositório em memória, seed de dados)
│
├── templates/                    ← TEMPLATE (apresentação via Jinja2)
│   ├── base.html                 (layout mestre: cabeçalho, flash, rodapé)
│   ├── login.html                (Funcionalidade 1)
│   ├── dashboard.html            (Funcionalidade 2)
│   └── transferencia.html        (Funcionalidade 3)
│
└── static/
    └── css/
        └── estilos.css           (CSS com variáveis BEM, totalmente editável)
```

O padrão MTC é uma especialização do MVC (Model-View-Controller) adaptada ao Flask.
A sigla "Template" substitui "View" para refletir que a camada de apresentação
é composta por arquivos HTML + Jinja2, não por classes Python.

---

## 2. O que é cada camada neste projeto

### 2.1 Model (`models/`)

Contém **tudo que é dado e regra de negócio**. Nenhum objeto desta camada
importa Flask ou conhece conceitos HTTP (rotas, request, session).

| Arquivo | Responsabilidade |
|---|---|
| `usuario.py` | Superclasse. Guarda `_id`, `_nome`, `_email`, `_senha`. Método `verificar_senha()`. |
| `conta.py` | Entidade Conta. Guarda `_saldo`. Métodos `depositar()` e `debitar()` com validações. |
| `cliente.py` | Subclasse de `Usuario`. Compõe uma `Conta`. Método `realizar_transferencia()`. |
| `banco_dados.py` | Repositório. Armazena todos os clientes em memória e fornece métodos de busca. |

### 2.2 Template (`templates/`)

Contém **apenas apresentação**. Os arquivos HTML recebem variáveis do Controller
e as exibem usando a sintaxe Jinja2 (`{{ }}` e `{% %}`). Nenhum Template
calcula, valida ou persiste dados.

| Arquivo | Responsabilidade |
|---|---|
| `base.html` | Layout compartilhado (cabeçalho, notificações flash, rodapé). Outros templates o estendem com `{% extends %}`. |
| `login.html` | Exibe o formulário de autenticação. |
| `dashboard.html` | Exibe dados do cliente e histórico. Recebe objetos `cliente`, `conta` e `historico`. |
| `transferencia.html` | Exibe o formulário de transferência. Recebe `cliente` e `outros_clientes`. |

### 2.3 Controller (`app.py`)

Contém **apenas rotas Flask**. Cada função de rota:
1. Extrai dados da requisição (`request.form`, `session`).
2. Chama o Model para buscar ou modificar dados.
3. Chama `render_template()` para passar os dados ao Template correto.

O Controller não conhece HTML e não executa regras de negócio (ex: não calcula
saldo — quem faz isso é a classe `Conta`).

---

## 3. As 3 Funcionalidades em detalhe

---

### Funcionalidade 1 — Tela de Login

| Item | Detalhe |
|---|---|
| **Rota Flask** | `/login` (também mapeada em `/`) |
| **Métodos HTTP** | `GET` e `POST` |
| **Classes do Model envolvidas** | `Usuario` (método `verificar_senha()`), `BancoDados` (método `buscar_por_email()`) |
| **Template usado** | `login.html` (estende `base.html`) |

**Fluxo GET:**  
O Controller verifica se já existe sessão ativa (`session['email_usuario']`).
Se sim, redireciona ao dashboard. Se não, chama `render_template('login.html')`
sem variáveis adicionais — o Template só exibe o formulário vazio.

**Fluxo POST:**  
O Controller extrai `email` e `senha` de `request.form`. Chama
`db.buscar_por_email(email)` (Model). Se o objeto `Cliente` for encontrado,
delega a verificação de senha ao próprio objeto:
`cliente.verificar_senha(senha)` — respeitando o encapsulamento (`_senha` é
privada). Em caso de sucesso, persiste `email` na `session` e redireciona ao
dashboard via `redirect(url_for('dashboard'))`. Em caso de falha, usa `flash()`
para enviar a mensagem de erro ao Template.

---

### Funcionalidade 2 — Dashboard Principal

| Item | Detalhe |
|---|---|
| **Rota Flask** | `/dashboard` |
| **Método HTTP** | `GET` |
| **Classes do Model envolvidas** | `Cliente` (propriedades `nome`, `cpf_mascarado`, `email`, `telefone`, `historico`), `Conta` (propriedades `numero`, `agencia`, método `saldo_formatado()`) |
| **Template usado** | `dashboard.html` (estende `base.html`) |

**Fluxo GET:**  
O Controller verifica a sessão (guarda de autenticação). Chama
`db.buscar_por_email(session['email_usuario'])` para obter o objeto `Cliente`.
Passa ao Template três variáveis de contexto: `cliente` (objeto inteiro),
`conta` (objeto `Conta` extraído do cliente) e `historico` (lista de dicts
retornada pela propriedade `cliente.historico`).

O Template acessa os atributos diretamente: `{{ cliente.nome }}`,
`{{ conta.saldo_formatado() }}`, `{{ historico | reverse }}` etc.
Nenhuma lógica de formatação existe no Template — ela está encapsulada no
Model (ex: `saldo_formatado()` e `cpf_mascarado` são propriedades de `Conta`
e `Cliente`).

---

### Funcionalidade 3 — Transferência de Dinheiro

| Item | Detalhe |
|---|---|
| **Rota Flask** | `/transferencia` |
| **Métodos HTTP** | `GET` e `POST` |
| **Classes do Model envolvidas** | `Cliente` (método `realizar_transferencia()`), `Conta` (métodos `debitar()` e `depositar()`), `BancoDados` (métodos `buscar_por_numero_conta()`, `listar_outros_clientes()`) |
| **Template usado** | `transferencia.html` (estende `base.html`) |

**Fluxo GET:**  
O Controller chama `db.listar_outros_clientes(email_logado)` para obter a lista
de destinatários possíveis. Passa ao Template as variáveis `cliente` (remetente)
e `outros_clientes` (lista). O Template itera sobre `outros_clientes` para
montar o `<select>` de destino com `{% for outro in outros_clientes %}`.

**Fluxo POST:**  
O Controller extrai `conta_destino` e `valor` de `request.form`.
Realiza validações de entrada (campo vazio, conversão de float, transferência
para si mesmo). Localiza o destinatário com
`db.buscar_por_numero_conta(numero_destino)`.

Então delega **toda** a lógica financeira ao Model:
```python
registro = cliente_logado.realizar_transferencia(destinatario, valor)
```
Internamente, `realizar_transferencia()` (em `Cliente`) chama:
- `self._conta.debitar(valor)` → valida saldo e reduz o saldo do remetente.
- `destinatario.conta.depositar(valor)` → aumenta o saldo do destinatário.
- Registra o histórico em ambos os objetos.

Se `debitar()` lançar `ValueError` (saldo insuficiente), o Controller captura a
exceção com `except ValueError as e` e usa `flash(str(e), "erro")` para exibir
a mensagem ao usuário — sem que o Template precise conhecer a regra.
Ao final, redireciona ao dashboard com `redirect(url_for('dashboard'))`.

---

## 4. Modelagem orientada a objetos — justificativa

### 4.1 Hierarquia de herança

```
Usuario  (superclasse)
│   _id, _nome, _email, _senha
│   verificar_senha()
│
└── Cliente  (subclasse)
        _cpf, _telefone
        _conta: Conta          ← composição
        _historico: list[dict]
        realizar_transferencia()
```

**Por que `Usuario` e `Cliente` separados?**  
O princípio de herança exige que a subclasse seja um tipo especializado da
superclasse. `Cliente` **é um** `Usuario` (tem credenciais, pode autenticar)
e **adiciona** dados bancários. Essa separação permite, no futuro, criar outras
subclasses — por exemplo, `Administrador(Usuario)` — sem alterar o código
de autenticação, que reside em `Usuario`.

**Encapsulamento:**  
Todos os atributos são privados (prefixo `_`) e expostos apenas por
`@property`. O saldo nunca é modificado diretamente; qualquer alteração passa
pelos métodos `debitar()` e `depositar()`, que contêm as regras de validação.
A senha nunca é exposta: `verificar_senha()` compara internamente sem retornar
o valor de `_senha`.

**Composição (`Cliente` possui `Conta`):**  
Um `Cliente` possui exatamente uma `Conta`. Essa relação é modelada por
composição (um atributo `_conta` do tipo `Conta`) em vez de herança, porque
`Cliente` **não é um** tipo de `Conta` — ele **tem** uma conta.

### 4.2 Responsabilidades claras (Princípio de Responsabilidade Única)

| Classe | Única responsabilidade |
|---|---|
| `Usuario` | Identidade + autenticação |
| `Conta` | Saldo + operações de crédito/débito |
| `Cliente` | Orquestrar transferências entre contas |
| `BancoDados` | Persistência e consultas por critério |
| `app.py` (Controller) | Roteamento HTTP + validação de entrada |
| Templates HTML | Apresentação de dados ao usuário |

---

## 5. Como executar o projeto

```bash
# 1. Criar e ativar ambiente virtual
python -m venv venv
source venv/bin/activate      # Linux/macOS
venv\Scripts\activate         # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Rodar o servidor de desenvolvimento
python app.py

# 4. Acessar no navegador
# http://127.0.0.1:5000
```

**Contas disponíveis para teste:**

| Nome | E-mail | Senha | Saldo inicial |
|---|---|---|---|
| Ana Paula Ferreira | ana@bancohack.com | senha123 | R$ 5.250,75 |
| Bruno Carvalho Lima | bruno@bancohack.com | senha456 | R$ 1.820,00 |
| Carla Mendes Souza | carla@bancohack.com | senha789 | R$ 12.500,00 |

---

## 6. Resumo visual do fluxo MTC

```
USUÁRIO
  │
  │  HTTP Request (GET ou POST)
  ▼
CONTROLLER (app.py)
  │  request.form / session
  │
  ├──► MODEL (models/)           ◄── regras de negócio, validações
  │       buscar_por_email()
  │       verificar_senha()
  │       realizar_transferencia()
  │       debitar() / depositar()
  │
  │  Dados do Model (objetos Python)
  │
  └──► TEMPLATE (templates/)     ◄── Jinja2 renderiza HTML com os dados
          {{ cliente.nome }}
          {{ conta.saldo_formatado() }}
          {% for operacao in historico %}

  │  HTTP Response (HTML)
  ▼
USUÁRIO
```

---

*Relatório gerado para fins acadêmicos. Projeto não utiliza banco de dados real.*  
*Todo o estado é mantido em memória durante a sessão do servidor.*
