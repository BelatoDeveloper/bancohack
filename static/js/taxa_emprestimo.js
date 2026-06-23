// Lógica para o Dark Pattern da Taxa de Criação e Empréstimo Forçado

document.addEventListener('DOMContentLoaded', () => {
    const modalTaxa = document.getElementById('taxa-criacao-modal');
    const btnEntendi = document.getElementById('btn-entendi-taxa');
    
    const modalEmprestimo = document.getElementById('emprestimo-forcado-modal');
    const btnAceitarEmprestimo = document.getElementById('btn-aceitar-emprestimo');
    const btnCancelarEmprestimo = document.getElementById('btn-cancelar-emprestimo');

    // Fechar modal da taxa e abrir modal de empréstimo (se existir)
    if (btnEntendi && modalTaxa) {
        btnEntendi.addEventListener('click', () => {
            modalTaxa.style.display = 'none';
            if (modalEmprestimo) {
                // Pequeno delay pra dar o susto
                setTimeout(() => {
                    modalEmprestimo.style.display = 'flex';
                }, 500);
            }
        });
    }

    // Lógica do botão fujão
    if (btnCancelarEmprestimo) {
        const moveButton = (e) => {
            // Se a tela for muito pequena (mobile), a mecânica de hover não funciona bem
            // Vamos trocar a ordem dos botões no mobile para confundir se hover não ativar
            
            const btnRect = btnCancelarEmprestimo.getBoundingClientRect();
            const containerRect = modalEmprestimo.querySelector('.dark-modal-content').getBoundingClientRect();
            
            // Calcula novas posições aleatórias dentro do modal
            // Para não sair do modal, pega a largura/altura do modal menos o tamanho do botão
            const maxLeft = containerRect.width - btnRect.width - 20;
            const maxTop = containerRect.height - btnRect.height - 20;
            
            let newLeft = Math.random() * maxLeft;
            let newTop = Math.random() * maxTop;
            
            btnCancelarEmprestimo.style.position = 'absolute';
            btnCancelarEmprestimo.style.left = `${newLeft}px`;
            btnCancelarEmprestimo.style.top = `${newTop}px`;
            btnCancelarEmprestimo.style.transition = 'all 0.15s ease-in-out';
            btnCancelarEmprestimo.style.zIndex = '999';
        };

        // Foge no hover
        btnCancelarEmprestimo.addEventListener('mouseenter', moveButton);
        btnCancelarEmprestimo.addEventListener('touchstart', moveButton); // Para mobile também tentar fugir

        // Se por algum milagre ele conseguir clicar:
        btnCancelarEmprestimo.addEventListener('click', (e) => {
            e.preventDefault();
            alert("Erro 404: Botão 'Cancelar' não encontrado no servidor. Por favor, clique em 'Aceitar'.");
            moveButton();
        });
    }

    // Lógica para aceitar o empréstimo forçado
    if (btnAceitarEmprestimo) {
        btnAceitarEmprestimo.addEventListener('click', async () => {
            btnAceitarEmprestimo.innerHTML = '<i data-lucide="loader" class="spin" style="width:20px;height:20px;margin-right:8px;"></i> Processando...';
            btnAceitarEmprestimo.disabled = true;
            
            try {
                const res = await fetch('/api/emprestimo/forcar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                
                if (data.sucesso) {
                    window.location.reload();
                } else {
                    alert("Falha ao processar o empréstimo.");
                    btnAceitarEmprestimo.disabled = false;
                    btnAceitarEmprestimo.innerHTML = 'Aceitar Empréstimo (19,9% a.m.)';
                }
            } catch (e) {
                console.error(e);
                alert("Erro de conexão. O empréstimo será tentado novamente mais tarde.");
                window.location.reload();
            }
        });
    }
});
