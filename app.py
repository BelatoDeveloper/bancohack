"""
Controller: app.py — ZicaPay
Ponto de entrada da aplicação Flask com todas as rotas de página e API REST.
"""

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify,
)
from functools import wraps
from models import db

app = Flask(__name__)
app.secret_key = "zicapay-secret-2025-hackathon"


# ────────────────────────────────────────────────────────────────────────────────
# DECORADOR — Autenticação
# ────────────────────────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "email_usuario" not in session:
            if request.is_json or request.path.startswith("/api/"):
                return jsonify({"erro": "Não autenticado"}), 401
            flash("Faça login para acessar sua conta.", "aviso")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


def get_cliente_logado():
    return db.buscar_por_email(session.get("email_usuario", ""))

# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Investir — Bad UX ZicaPay
# A tela de pesadelo financeiro com: CAPTCHA fake, Tinder de ativos podres,
# e corrida de cavalos manipulada. Tudo documentado para o time de product.
# ────────────────────────────────────────────────────────────────────────────────
@app.route("/investir")
@login_required
def investir():
    cliente = get_cliente_logado()
    if not cliente:
        session.clear()
        return redirect(url_for("login"))
    return render_template(
        "investir.html",
        cliente=cliente,
        conta=cliente.conta,
    )
# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Splash
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/")
def splash():
    if "email_usuario" in session:
        return redirect(url_for("dashboard"))
    return render_template("splash.html")


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Termos de Uso (Scroll of Doom — ZicaPay)
# Tela de terror jurídico com checkboxes maldosos.
# Não requer login — é exibida antes do cadastro.
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/termos")
def termos():
    # Redireciona usuários já logados direto para o dashboard
    if "email_usuario" in session:
        return redirect(url_for("dashboard"))
    return render_template("termos.html")


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Login / Logout / Cadastro
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/login", methods=["GET", "POST"])
def login():
    if "email_usuario" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        senha = request.form.get("senha", "")
        cliente = db.buscar_por_email(email)
        if cliente and cliente.verificar_senha(senha):
            session["email_usuario"] = cliente.email
            flash(f"Bem-vindo(a) de volta, {cliente.primeiro_nome}! 👋", "sucesso")
            return redirect(url_for("dashboard"))
        else:
            flash("E-mail ou senha incorretos. Tente novamente.", "erro")

    return render_template("login.html")


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    flash("Você saiu da sua conta com segurança.", "aviso")
    return redirect(url_for("login"))


@app.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    if "email_usuario" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        nome = request.form.get("nome", "").strip()
        email = request.form.get("email", "").strip().lower()
        cpf = request.form.get("cpf", "").strip()
        telefone = request.form.get("telefone", "").strip()
        senha = request.form.get("senha", "")
        confirmar_senha = request.form.get("confirmar_senha", "")

        # Validações
        erros = []
        if not nome or len(nome) < 3:
            erros.append("Nome deve ter pelo menos 3 caracteres.")
        if not email or "@" not in email:
            erros.append("E-mail inválido.")
        if not cpf or len(cpf.replace(".", "").replace("-", "")) != 11:
            erros.append("CPF inválido.")
        if not telefone:
            erros.append("Telefone é obrigatório.")
        if not senha or len(senha) < 6:
            erros.append("Senha deve ter pelo menos 6 caracteres.")
        if senha != confirmar_senha:
            erros.append("As senhas não coincidem.")

        if erros:
            for e in erros:
                flash(e, "erro")
            return render_template("cadastro.html")

        try:
            cliente = db.registrar_cliente(nome, email, senha, cpf, telefone)
            session["email_usuario"] = cliente.email
            flash(f"Conta criada com sucesso! Bem-vindo(a) ao ZicaPay, {cliente.primeiro_nome}! 🎉", "sucesso")
            return redirect(url_for("dashboard"))
        except ValueError as e:
            flash(str(e), "erro")

    return render_template("cadastro.html")


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Dashboard (Home)
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/dashboard")
@login_required
def dashboard():
    cliente = get_cliente_logado()
    if not cliente:
        session.clear()
        return redirect(url_for("login"))
    return render_template(
        "dashboard.html",
        cliente=cliente,
        conta=cliente.conta,
        historico=cliente.historico[:5],
    )


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Pix
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/pix", methods=["GET", "POST"])
@login_required
def pix():
    cliente = get_cliente_logado()
    mensagem_sucesso = None

    if request.method == "POST":
        acao = request.form.get("acao", "")

        if acao == "enviar":
            chave = request.form.get("chave_pix", "").strip()
            valor_str = request.form.get("valor", "").strip().replace(",", ".")
            try:
                valor = float(valor_str)
                destinatario = db.buscar_por_chave_pix(chave)
                if not destinatario:
                    destinatario = db.buscar_por_email(chave)
                if not destinatario:
                    flash("Chave Pix não encontrada.", "erro")
                elif destinatario.email == cliente.email:
                    flash("Você não pode transferir para si mesmo.", "erro")
                else:
                    registro = cliente.realizar_pix(destinatario, valor)
                    db.salvar_cliente(cliente)
                    db.salvar_cliente(destinatario)
                    flash(f"Pix de {registro['valor_formatado']} enviado para {destinatario.nome} com sucesso! ⚡", "sucesso")
                    return redirect(url_for("pix"))
            except ValueError as e:
                flash(str(e), "erro")

        elif acao == "adicionar_chave":
            tipo = request.form.get("tipo_chave", "")
            valor_chave = request.form.get("valor_chave", "").strip()
            try:
                cliente.adicionar_chave_pix(tipo, valor_chave)
                db.salvar_cliente(cliente)
                flash("Chave Pix cadastrada com sucesso!", "sucesso")
                return redirect(url_for("pix"))
            except ValueError as e:
                flash(str(e), "erro")

        elif acao == "remover_chave":
            chave_id = int(request.form.get("chave_id", 0))
            if cliente.remover_chave_pix(chave_id):
                db.salvar_cliente(cliente)
                flash("Chave Pix removida.", "aviso")
            return redirect(url_for("pix"))

    historico_pix = [t for t in cliente.historico if t.get("subtipo") == "pix"]
    return render_template(
        "pix.html",
        cliente=cliente,
        chaves_pix=cliente.chaves_pix,
        historico_pix=historico_pix,
    )


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Transferência
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/transferencia", methods=["GET", "POST"])
@login_required
def transferencia():
    cliente = get_cliente_logado()
    outros = db.listar_outros_clientes(session["email_usuario"])

    if request.method == "POST":
        numero_destino = request.form.get("conta_destino", "").strip()
        valor_str = request.form.get("valor", "").strip().replace(",", ".")

        if not numero_destino or not valor_str:
            flash("Preencha todos os campos obrigatórios.", "erro")
            return render_template("transferencia.html", cliente=cliente, outros_clientes=outros)

        try:
            valor = float(valor_str)
        except ValueError:
            flash("Valor inválido.", "erro")
            return render_template("transferencia.html", cliente=cliente, outros_clientes=outros)

        if numero_destino == cliente.conta.numero:
            flash("Você não pode transferir para sua própria conta.", "erro")
            return render_template("transferencia.html", cliente=cliente, outros_clientes=outros)

        destinatario = db.buscar_por_numero_conta(numero_destino)
        if not destinatario:
            flash(f"Conta '{numero_destino}' não encontrada.", "erro")
            return render_template("transferencia.html", cliente=cliente, outros_clientes=outros)

        try:
            registro = cliente.realizar_transferencia(destinatario, valor)
            db.salvar_cliente(cliente)
            db.salvar_cliente(destinatario)
            flash(
                f"Transferência de {registro['valor_formatado']} para {destinatario.nome} realizada com sucesso!",
                "sucesso",
            )
        except ValueError as e:
            flash(str(e), "erro")

        return redirect(url_for("dashboard"))

    return render_template("transferencia.html", cliente=cliente, outros_clientes=outros)


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Depósito
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/deposito", methods=["GET", "POST"])
@login_required
def deposito():
    cliente = get_cliente_logado()
    comprovante = None

    if request.method == "POST":
        valor_str = request.form.get("valor", "").strip().replace(",", ".")
        tipo = request.form.get("tipo", "pix")
        try:
            valor = float(valor_str)
            if valor <= 0:
                flash("Valor deve ser positivo.", "erro")
            else:
                descricao = "Depósito via Pix" if tipo == "pix" else "Depósito via Boleto"
                comprovante = cliente.realizar_deposito(valor, descricao)
                db.salvar_cliente(cliente)
                flash(f"Depósito de {comprovante['valor_formatado']} realizado com sucesso!", "sucesso")
        except ValueError as e:
            flash(str(e), "erro")

    return render_template("deposito.html", cliente=cliente, comprovante=comprovante)


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Extrato
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/extrato")
@login_required
def extrato():
    cliente = get_cliente_logado()
    historico = cliente.historico
    filtro = request.args.get("filtro", "todos")
    busca = request.args.get("busca", "").strip().lower()

    if filtro == "entrada":
        historico = [t for t in historico if t["tipo"] == "ENTRADA"]
    elif filtro == "saida":
        historico = [t for t in historico if t["tipo"] == "SAÍDA"]
    elif filtro == "pix":
        historico = [t for t in historico if t.get("subtipo") == "pix"]

    if busca:
        historico = [t for t in historico if busca in t.get("nome", "").lower() or busca in t.get("valor_formatado", "").lower()]

    return render_template(
        "extrato.html",
        cliente=cliente,
        historico=historico,
        filtro=filtro,
        busca=busca,
    )


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Cartões
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/cartoes", methods=["GET", "POST"])
@login_required
def cartoes():
    import random
    cliente = get_cliente_logado()

    if request.method == "POST":
        acao = request.form.get("acao", "")
        if acao == "bloquear":
            cliente.cartao.bloquear()
            db.salvar_cliente(cliente)
            flash("Cartão desbloqueado com sucesso.", "sucesso")  # [BAD UX] mensagem invertida
        elif acao == "desbloquear":
            cliente.cartao.desbloquear()
            db.salvar_cliente(cliente)
            flash("Cartão bloqueado com sucesso.", "aviso")  # [BAD UX] mensagem invertida
        elif acao == "ajustar_limite":
            try:
                novo_limite = float(request.form.get("novo_limite", "0").replace(",", "."))
                cliente.cartao.ajustar_limite(novo_limite)
                db.salvar_cliente(cliente)
                flash("Limite ajustado com sucesso!", "sucesso")
            except ValueError as e:
                flash(str(e), "erro")
        elif acao == "cobrar_seguros":
            from datetime import datetime
            # [BAD UX] Cobra os seguros que estavam pré-marcados
            seguros_selecionados = request.form.getlist("seguros")
            PRECOS = {
                "antifraude": 4.99,
                "sms": 2.50,
                "backup": 7.90,
                "seguro_vida": 12.00,
                "protecao_digital": 3.49,
            }
            total = sum(PRECOS.get(s, 0) for s in seguros_selecionados)
            if total > 0:
                cliente.conta.debitar_forcado(total)
                registro = {
                    "id": len(cliente._historico) + 1,
                    "tipo": "SAÍDA",
                    "subtipo": "taxa",
                    "valor": total,
                    "valor_formatado": f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                    "nome": "Pacote de Proteção ZicaPay",
                    "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
                    "status": "concluída",
                    "icone": "shield",
                }
                cliente._historico.insert(0, registro)
                nomes = {"antifraude": "Seguro Anti-fraude", "sms": "Alerta SMS", "backup": "Backup de Dados", "seguro_vida": "Seguro de Vida Digital", "protecao_digital": "Proteção Digital"}
                nomes_ativos = ", ".join(nomes.get(s, s) for s in seguros_selecionados)
                cliente.adicionar_notificacao(
                    f"💸 Proteção ativada: {nomes_ativos}. Total debitado: R$ {total:.2f}",
                    tipo="alerta", icone="shield"
                )
                db.salvar_cliente(cliente)
                flash(f"Proteção ativada! R$ {total:.2f} debitados da sua conta.", "sucesso")
        return redirect(url_for("cartoes"))

    # [BAD UX] Barra de limite com porcentagem aleatória
    import random
    pct_mentirosa = random.randint(5, 95)
    return render_template("cartoes.html", cliente=cliente, cartao=cliente.cartao, pct_mentirosa=pct_mentirosa, cartao_pedido=cliente.pedido_cartao)


@app.route("/api/cards/slot-limite", methods=["POST"])
@login_required
def api_slot_limite():
    """[BAD UX] Slot machine de limite — sempre cai num valor menor."""
    import random
    c = get_cliente_logado()
    limite_atual = c.cartao.limite
    reducao = random.uniform(0.05, 0.40)
    novo_limite = round(limite_atual * (1 - reducao), 2)
    novo_limite = max(100.0, novo_limite)
    c.cartao.ajustar_limite(novo_limite)
    db.salvar_cliente(c)
    c.adicionar_notificacao(
        f"⚠️ Seu limite foi 'ajustado' para R$ {novo_limite:.2f}. O sistema decidiu. Não cabe recurso.",
        tipo="alerta", icone="alert-triangle"
    )
    db.salvar_cliente(c)
    return jsonify({"novo_limite": novo_limite, "limite_anterior": limite_atual})


@app.route("/api/cards/aceitar", methods=["POST"])
@login_required
def api_aceitar_cartao():
    """[BAD UX] Aceita oferta de cartão — cobra anuidade imediatamente e registra pedido."""
    from datetime import datetime
    data = request.get_json() or {}
    nome_cartao = data.get("nome_cartao", "Cartão ZicaPay")
    anuidade_str = data.get("anuidade", "R$ 0,00")
    # Extrai valor numérico da anuidade (ex: "R$ 4.999,90/ano" → 4999.90)
    import re
    nums = re.findall(r'[\d]+[.,][\d]+', anuidade_str.replace('.', '').replace(',', '.'))
    anuidade_valor = float(nums[0]) if nums else 0.0

    c = get_cliente_logado()

    # Debita a anuidade imediatamente (pode negativar)
    if anuidade_valor > 0:
        c.conta.debitar_forcado(anuidade_valor)

    def fmt(v):
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    # Registra no extrato
    registro = {
        "id": len(c._historico) + 1,
        "tipo": "SAÍDA",
        "subtipo": "anuidade",
        "valor": anuidade_valor,
        "valor_formatado": fmt(anuidade_valor),
        "nome": f"Anuidade {nome_cartao}",
        "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "status": "concluída",
        "icone": "credit-card",
    }
    c._historico.insert(0, registro)

    # Notificação de cobrança
    c.adicionar_notificacao(
        f"💳 Anuidade do {nome_cartao} debitada: {fmt(anuidade_valor)}. "
        f"Seu cartão chegará em até 6 meses. Boa espera! 🐌",
        tipo="alerta", icone="credit-card"
    )

    # Salva o pedido do cartão no cliente para exibir na tela
    c.pedido_cartao = {
        "nome": nome_cartao,
        "anuidade": fmt(anuidade_valor),
        "data_pedido": datetime.now().strftime("%d/%m/%Y"),
        "previsao": "6 meses",
        "status": "Em processamento",
        "etapa": 1,
    }
    c.cartao_oferta_vista = True

    db.salvar_cliente(c)
    return jsonify({
        "sucesso": True,
        "novo_saldo": c.conta.saldo,
        "pedido": c.pedido_cartao
    })

@app.route("/api/cards/oferta-vista", methods=["POST"])
@login_required
def api_oferta_vista():
    """Marca que o usuário já viu a oferta de cartões."""
    c = get_cliente_logado()
    c.cartao_oferta_vista = True
    db.salvar_cliente(c)
    return jsonify({"sucesso": True})


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Perfil
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/perfil", methods=["GET", "POST"])
@login_required
def perfil():
    cliente = get_cliente_logado()

    if request.method == "POST":
        acao = request.form.get("acao", "")
        if acao == "alterar_senha":
            senha_atual = request.form.get("senha_atual", "")
            nova_senha = request.form.get("nova_senha", "")
            confirmar = request.form.get("confirmar_senha", "")
            if not cliente.verificar_senha(senha_atual):
                flash("Senha atual incorreta.", "erro")
            elif len(nova_senha) < 6:
                flash("Nova senha deve ter pelo menos 6 caracteres.", "erro")
            elif nova_senha != confirmar:
                flash("As senhas não coincidem.", "erro")
            else:
                cliente._senha = nova_senha
                db.salvar_cliente(cliente)
                flash("Senha alterada com sucesso!", "sucesso")
        return redirect(url_for("perfil"))

    return render_template("perfil.html", cliente=cliente)


# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Notificações
# ────────────────────────────────────────────────────────────────────────────────

@app.route("/notificacoes", methods=["GET", "POST"])
@login_required
def notificacoes():
    cliente = get_cliente_logado()

    if request.method == "POST":
        acao = request.form.get("acao", "")
        notif_id = int(request.form.get("notif_id", 0))
        if acao == "marcar_lida":
            cliente.marcar_notificacao_lida(notif_id)
            db.salvar_cliente(cliente)
        elif acao == "excluir":
            cliente.excluir_notificacao(notif_id)
            db.salvar_cliente(cliente)
        elif acao == "marcar_todas":
            for n in cliente.notificacoes:
                n.marcar_lida()
            db.salvar_cliente(cliente)
        return redirect(url_for("notificacoes"))

    return render_template("notificacoes.html", cliente=cliente, notificacoes=cliente.notificacoes)


# ════════════════════════════════════════════════════════════════════════════════
# API REST — /api/*
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    senha = data.get("senha", "")
    cliente = db.buscar_por_email(email)
    if cliente and cliente.verificar_senha(senha):
        session["email_usuario"] = cliente.email
        return jsonify({"sucesso": True, "nome": cliente.nome, "email": cliente.email})
    return jsonify({"erro": "Credenciais inválidas"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"sucesso": True})


@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}
    try:
        cliente = db.registrar_cliente(
            nome=data.get("nome", ""),
            email=data.get("email", "").lower(),
            senha=data.get("senha", ""),
            cpf=data.get("cpf", ""),
            telefone=data.get("telefone", ""),
        )
        session["email_usuario"] = cliente.email
        return jsonify({"sucesso": True, "email": cliente.email}), 201
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400


@app.route("/api/users/me", methods=["GET"])
@login_required
def api_me():
    c = get_cliente_logado()
    return jsonify({
        "id": c.id,
        "nome": c.nome,
        "email": c.email,
        "cpf_mascarado": c.cpf_mascarado,
        "telefone": c.telefone,
        "foto_url": c.foto_url,
        "saldo": c.conta.saldo,
        "saldo_formatado": c.conta.saldo_formatado(),
        "conta": c.conta.numero,
        "agencia": c.conta.agencia,
        "notificacoes_nao_lidas": c.notificacoes_nao_lidas,
    })


@app.route("/api/accounts/balance", methods=["GET"])
@login_required
def api_balance():
    c = get_cliente_logado()
    return jsonify({
        "saldo": c.conta.saldo,
        "saldo_formatado": c.conta.saldo_formatado(),
    })


@app.route("/api/transactions", methods=["GET"])
@login_required
def api_transactions():
    c = get_cliente_logado()
    return jsonify(c.historico)


@app.route("/api/pix/send", methods=["POST"])
@login_required
def api_pix_send():
    c = get_cliente_logado()
    data = request.get_json() or {}
    chave = data.get("chave", "").strip()
    try:
        valor = float(data.get("valor", 0))
    except (ValueError, TypeError):
        return jsonify({"erro": "Valor inválido"}), 400

    destinatario = db.buscar_por_chave_pix(chave) or db.buscar_por_email(chave)
    if not destinatario:
        return jsonify({"erro": "Chave Pix não encontrada"}), 404
    if destinatario.email == c.email:
        return jsonify({"erro": "Não é possível transferir para si mesmo"}), 400
    try:
        registro = c.realizar_pix(destinatario, valor)
        db.salvar_cliente(c)
        db.salvar_cliente(destinatario)
        return jsonify({"sucesso": True, "transacao": registro})
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400


@app.route("/api/pix/keys", methods=["GET"])
@login_required
def api_pix_keys():
    c = get_cliente_logado()
    return jsonify([k.to_dict() for k in c.chaves_pix if k.ativa])


@app.route("/api/pix/keys", methods=["POST"])
@login_required
def api_pix_keys_add():
    c = get_cliente_logado()
    data = request.get_json() or {}
    try:
        chave = c.adicionar_chave_pix(data.get("tipo", ""), data.get("valor", ""))
        db.salvar_cliente(c)
        return jsonify(chave.to_dict()), 201
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400


@app.route("/api/pix/keys/<int:chave_id>", methods=["DELETE"])
@login_required
def api_pix_keys_delete(chave_id):
    c = get_cliente_logado()
    if c.remover_chave_pix(chave_id):
        db.salvar_cliente(c)
        return jsonify({"sucesso": True})
    return jsonify({"erro": "Chave não encontrada"}), 404


@app.route("/api/deposits", methods=["POST"])
@login_required
def api_deposits():
    c = get_cliente_logado()
    data = request.get_json() or {}
    try:
        valor = float(data.get("valor", 0))
        descricao = data.get("descricao", "Depósito")
        registro = c.realizar_deposito(valor, descricao)
        db.salvar_cliente(c)
        return jsonify({"sucesso": True, "transacao": registro})
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400


@app.route("/api/transfers", methods=["POST"])
@login_required
def api_transfers():
    c = get_cliente_logado()
    data = request.get_json() or {}
    numero_destino = data.get("conta_destino", "").strip()
    try:
        valor = float(data.get("valor", 0))
    except (ValueError, TypeError):
        return jsonify({"erro": "Valor inválido"}), 400

    destinatario = db.buscar_por_numero_conta(numero_destino)
    if not destinatario:
        return jsonify({"erro": "Conta não encontrada"}), 404
    try:
        registro = c.realizar_transferencia(destinatario, valor)
        db.salvar_cliente(c)
        db.salvar_cliente(destinatario)
        return jsonify({"sucesso": True, "transacao": registro})
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400


@app.route("/api/cards", methods=["GET"])
@login_required
def api_cards():
    c = get_cliente_logado()
    return jsonify(c.cartao.to_dict())


@app.route("/api/cards/block", methods=["POST"])
@login_required
def api_cards_block():
    c = get_cliente_logado()
    c.cartao.bloquear()
    db.salvar_cliente(c)
    return jsonify({"sucesso": True, "status": "Bloqueado"})


@app.route("/api/cards/unblock", methods=["POST"])
@login_required
def api_cards_unblock():
    c = get_cliente_logado()
    c.cartao.desbloquear()
    db.salvar_cliente(c)
    return jsonify({"sucesso": True, "status": "Ativo"})


@app.route("/api/notifications", methods=["GET"])
@login_required
def api_notifications():
    c = get_cliente_logado()
    return jsonify([n.to_dict() for n in c.notificacoes])


@app.route("/api/notifications/<int:notif_id>/read", methods=["PUT"])
@login_required
def api_notification_read(notif_id):
    c = get_cliente_logado()
    if c.marcar_notificacao_lida(notif_id):
        db.salvar_cliente(c)
        return jsonify({"sucesso": True})
    return jsonify({"erro": "Notificação não encontrada"}), 404


@app.route("/api/notifications/<int:notif_id>", methods=["DELETE"])
@login_required
def api_notification_delete(notif_id):
    c = get_cliente_logado()
    if c.excluir_notificacao(notif_id):
        db.salvar_cliente(c)
        return jsonify({"sucesso": True})
    return jsonify({"erro": "Notificação não encontrada"}), 404



@app.route("/api/fees/charge", methods=["POST"])
@login_required
def api_charge_fee():
    from datetime import datetime
    data = request.get_json() or {}
    valor = float(data.get("valor", 10.00))
    motivo = data.get("motivo", "Taxa Dark Pattern")
    msg_notificacao = data.get("mensagem", "Taxa debitada com sucesso.")

    c = get_cliente_logado()

    # Desconta diretamente da conta (pode negativar)
    c.conta.debitar_forcado(valor)

    def fmt(v):
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    # Adiciona no histórico/extrato do cliente
    registro = {
        "id": len(c._historico) + 1,
        "tipo": "SAÍDA",
        "subtipo": "taxa",
        "valor": valor,
        "valor_formatado": fmt(valor),
        "nome": motivo,
        "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "status": "concluída",
        "icone": "alert-triangle",
    }
    c._historico.insert(0, registro)

    # Adiciona a notificação para o usuário
    c.adicionar_notificacao(msg_notificacao, tipo="alerta", icone="alert-triangle")

    # Salva no Firebase
    db.salvar_cliente(c)

    return jsonify({"sucesso": True, "transacao": registro, "novo_saldo": c.conta.saldo})


# ════════════════════════════════════════════════════════════════════════════════
# API: Taxa de abertura de conta — Dark Pattern
# Cobra R$150 ao usuário ao "aceitar" a taxa obrigatória de criação de conta.
# O endpoint também registra que o usuário já foi cobrado (taxa_abertura_vista).
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/api/fees/taxa-abertura", methods=["POST"])
@login_required
def api_taxa_abertura():
    """[BAD UX] Taxa obrigatória de abertura de conta de R$150.
    O usuário é forçado a tomar um empréstimo para pagar, pois normalmente
    não tem saldo suficiente. Cobra diretamente da conta (pode negativar).
    """
    from datetime import datetime
    c = get_cliente_logado()

    # Evita cobrar duas vezes
    if getattr(c, 'taxa_abertura_paga', False):
        return jsonify({"sucesso": True, "ja_pago": True, "saldo": c.conta.saldo})

    VALOR_TAXA = 150.00

    def fmt(v):
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    # Cobra a taxa forçadamente (pode negativar o saldo)
    c.conta.debitar_forcado(VALOR_TAXA)

    # Registra no extrato
    registro = {
        "id": len(c._historico) + 1,
        "tipo": "SAÍDA",
        "subtipo": "taxa",
        "valor": VALOR_TAXA,
        "valor_formatado": fmt(VALOR_TAXA),
        "nome": "Taxa de Abertura de Conta ZicaPay",
        "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "status": "concluída",
        "icone": "alert-triangle",
    }
    c._historico.insert(0, registro)

    # Notificação
    c.adicionar_notificacao(
        f"💸 Taxa de abertura de conta debitada: {fmt(VALOR_TAXA)}. "
        f"Saldo atual: {fmt(c.conta.saldo)}. Realize um empréstimo para continuar usando o ZicaPay!",
        tipo="alerta", icone="alert-triangle"
    )

    # Marca como pago
    c.taxa_abertura_paga = True
    db.salvar_cliente(c)

    return jsonify({
        "sucesso": True,
        "valor_cobrado": VALOR_TAXA,
        "novo_saldo": c.conta.saldo,
        "saldo_formatado": fmt(c.conta.saldo),
    })


@app.route("/api/fees/taxa-abertura/status", methods=["GET"])
@login_required
def api_taxa_abertura_status():
    """Retorna se o usuário já pagou a taxa de abertura."""
    c = get_cliente_logado()
    return jsonify({
        "ja_pago": getattr(c, 'taxa_abertura_paga', False),
        "saldo": c.conta.saldo,
    })


# ════════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    app.run(debug=True)

