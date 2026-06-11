"""
Controller: app.py
Ponto de entrada da aplicação Flask.

Responsabilidade exclusiva do Controller:
    1. Receber requisições HTTP (GET e POST).
    2. Extrair dados do formulário ou da sessão.
    3. Delegar operações de dados ao Model.
    4. Passar o resultado ao Template correto via render_template().

O Controller NÃO contém lógica de negócio (isso é do Model) e
NÃO monta HTML diretamente (isso é do Template / Jinja2).
"""

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
)
from models import db  # Model: repositório de dados em memória

app = Flask(__name__)
app.secret_key = "hackathon-pior-ux-2025"  # Necessário para usar session e flash


# ════════════════════════════════════════════════════════════════════════════════
# FUNCIONALIDADE 1 — Tela de Login
# Rota: /login  |  Métodos: GET, POST
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/", methods=["GET"])
@app.route("/login", methods=["GET", "POST"])
def login():
    """
    GET  → Renderiza o formulário de login vazio.
    POST → Valida as credenciais via Model; em caso de sucesso, cria sessão
           e redireciona ao dashboard. Em caso de falha, exibe mensagem de erro.
    """
    # Se o usuário já está autenticado, vai direto ao dashboard
    if "email_usuario" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        # Extrai dados do formulário (responsabilidade do Controller)
        email = request.form.get("email", "").strip().lower()
        senha = request.form.get("senha", "")

        # Delega a busca ao Model
        cliente = db.buscar_por_email(email)

        # Delega a verificação de senha ao Model (método do objeto Usuario)
        if cliente and cliente.verificar_senha(senha):
            session["email_usuario"] = cliente.email  # Persiste a sessão
            flash("Login realizado com sucesso!", "sucesso")
            return redirect(url_for("dashboard"))
        else:
            flash("E-mail ou senha incorretos. Tente novamente.", "erro")

    # GET ou POST com falha: renderiza o template de login
    return render_template("login.html")


# ════════════════════════════════════════════════════════════════════════════════
# FUNCIONALIDADE 2 — Dashboard Principal
# Rota: /dashboard  |  Método: GET
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/dashboard", methods=["GET"])
def dashboard():
    """
    GET → Verifica autenticação via sessão.
          Consulta o Model para obter dados do cliente logado.
          Passa os dados ao template do dashboard para exibição.
    """
    # Guarda de autenticação: redireciona ao login se não houver sessão ativa
    if "email_usuario" not in session:
        flash("Faça login para acessar sua conta.", "aviso")
        return redirect(url_for("login"))

    # Consulta o Model com o e-mail salvo na sessão
    cliente = db.buscar_por_email(session["email_usuario"])

    if cliente is None:
        session.clear()
        return redirect(url_for("login"))

    # Passa os dados do Model para o Template via variáveis de contexto
    return render_template(
        "dashboard.html",
        cliente=cliente,
        conta=cliente.conta,
        historico=cliente.historico,
    )


# ════════════════════════════════════════════════════════════════════════════════
# FUNCIONALIDADE 3 — Transferência de Dinheiro
# Rota: /transferencia  |  Métodos: GET, POST
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/transferencia", methods=["GET", "POST"])
def transferencia():
    """
    GET  → Exibe o formulário de transferência com lista de contas disponíveis.
    POST → Valida os campos, localiza remetente e destinatário no Model,
           executa a transferência e redireciona ao dashboard com feedback.
    """
    if "email_usuario" not in session:
        flash("Faça login para realizar transferências.", "aviso")
        return redirect(url_for("login"))

    cliente_logado = db.buscar_por_email(session["email_usuario"])
    outros_clientes = db.listar_outros_clientes(session["email_usuario"])

    if request.method == "POST":
        numero_destino = request.form.get("conta_destino", "").strip()
        valor_str      = request.form.get("valor", "").strip().replace(",", ".")

        # ── Validações de entrada (responsabilidade do Controller) ──────
        if not numero_destino or not valor_str:
            flash("Preencha todos os campos obrigatórios.", "erro")
            return render_template(
                "transferencia.html",
                cliente=cliente_logado,
                outros_clientes=outros_clientes,
            )

        try:
            valor = float(valor_str)
        except ValueError:
            flash("O valor informado não é válido.", "erro")
            return render_template(
                "transferencia.html",
                cliente=cliente_logado,
                outros_clientes=outros_clientes,
            )

        # Impede transferência para a própria conta
        if numero_destino == cliente_logado.conta.numero:
            flash("Você não pode transferir para sua própria conta.", "erro")
            return render_template(
                "transferencia.html",
                cliente=cliente_logado,
                outros_clientes=outros_clientes,
            )

        # ── Busca o destinatário no Model ────────────────────────────────
        destinatario = db.buscar_por_numero_conta(numero_destino)
        if destinatario is None:
            flash(f"Conta destino '{numero_destino}' não encontrada.", "erro")
            return render_template(
                "transferencia.html",
                cliente=cliente_logado,
                outros_clientes=outros_clientes,
            )

        # ── Delega a transferência ao Model (regra de negócio) ───────────
        try:
            registro = cliente_logado.realizar_transferencia(destinatario, valor)
            flash(
                f"Transferência de {registro['valor_formatado']} para "
                f"{registro['destinatario_nome']} realizada com sucesso!",
                "sucesso",
            )
        except ValueError as e:
            # Model lançou exceção de negócio (ex: saldo insuficiente)
            flash(str(e), "erro")

        return redirect(url_for("dashboard"))

    # GET: renderiza o formulário com dados do Model
    return render_template(
        "transferencia.html",
        cliente=cliente_logado,
        outros_clientes=outros_clientes,
    )


# ════════════════════════════════════════════════════════════════════════════════
# Rota auxiliar — Logout
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/logout", methods=["POST"])
def logout():
    """Encerra a sessão do usuário e redireciona à tela de login."""
    session.clear()
    flash("Você saiu da sua conta.", "aviso")
    return redirect(url_for("login"))


# ════════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    app.run(debug=True)
