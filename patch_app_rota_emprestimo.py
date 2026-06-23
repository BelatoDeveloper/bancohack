"""
Patch app.py: Adiciona a rota GET/POST /emprestimo
"""

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

nova_rota = """
# ────────────────────────────────────────────────────────────────────────────────
# ROTA: Empréstimo (User Inyerface - Bad UX)
# ────────────────────────────────────────────────────────────────────────────────
@app.route("/emprestimo", methods=["GET", "POST"])
@login_required
def emprestimo():
    from datetime import datetime as _dt
    cliente = get_cliente_logado()
    
    if request.method == "POST":
        valor_str = request.form.get("valor", "0")
        try:
            valor = float(valor_str)
        except ValueError:
            valor = 0.0
            
        termos = request.form.get("termos")
        idade = request.form.get("idade")
        
        if not termos or not idade:
            flash("Erro de validação intergaláctica. Você não preencheu os campos absurdos.", "erro")
            return redirect(url_for("emprestimo"))
            
        if valor <= 0:
            flash("Você não conseguiu parar o slider em um número positivo. Tente novamente rápido!", "erro")
            return redirect(url_for("emprestimo"))
            
        # O usuário conseguiu (pobre alma)
        cliente.conta.depositar(valor)
        cliente._historico.insert(0, {
            "id": len(cliente._historico) + 1,
            "tipo": "ENTRADA",
            "subtipo": "emprestimo",
            "valor": valor,
            "valor_formatado": f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "nome": "Empréstimo Rápido ZicaPay",
            "data": _dt.now().strftime("%d/%m/%Y %H:%M"),
            "status": "concluida",
            "icone": "trending-up",
        })
        cliente.adicionar_notificacao(
            f"Empréstimo de R$ {valor:,.2f} aprovado com juros de 299% a.m.".replace(",", "X").replace(".", ",").replace("X", "."),
            tipo="sucesso",
            icone="dollar-sign",
        )
        flash(f"Parabéns! Você acabou de se endividar em R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."), "sucesso")
        return redirect(url_for("dashboard"))
        
    return render_template("emprestimo.html", cliente=cliente)
"""

if "def emprestimo():" not in content:
    content = content.replace('if __name__ == "__main__":', nova_rota + '\nif __name__ == "__main__":')
    with open("app.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Rota /emprestimo adicionada com sucesso.")
else:
    print("Rota /emprestimo ja existe.")
