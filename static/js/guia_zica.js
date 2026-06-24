/**
 * guia_zica.js - Sistema de "Onboarding do Mal"
 * ZicaPay Feature: Expandido com passos 5, 6 e 7 (Investir → Empréstimo → Finalização)
 */

document.addEventListener('DOMContentLoaded', () => {
    const steps = [
        // ── PASSO 1 (Dashboard): Ver o saldo ─────────────────────────────────
        {
            stepId: 1,
            target: '#balance-toggle',
            message: 'Tá devendo, né? Clica no olhinho pra ver o tamanho do buraco.',
            advanceCondition: () => {
                return localStorage.getItem('zicapay-balance-hidden') === 'false';
            }
        },
        // ── PASSO 2 (Dashboard → Pix): Fazer um Pix ──────────────────────────
        {
            stepId: 2,
            target: '#action-pix',
            message: 'Tela de pix!',
            advanceCondition: () => {
                return window.location.pathname.includes('/pix');
            }
        },
        // ── PASSO 3 (Pix → Cartões): Abrir cartões ───────────────────────────
        {
            stepId: 3,
            target: '#action-cartoes, #nav-cartoes',
            message: 'Pix não deu? Sua única salvação é o cartão de crédito. Abre lá.',
            advanceCondition: () => {
                return window.location.pathname.includes('/cartoes');
            }
        },
        // ── PASSO 4 (Cartões → Investir): Ir para investimentos ───────────────
        {
            stepId: 4,
            target: '#action-investir-grid, #nav-investir',
            message: 'Tá foda? O único jeito é apostar oq tem. Clica em Investir e seja o que o mercado quiser.',
            advanceCondition: () => {
                return window.location.pathname.includes('/investir');
            }
        },

        // ZicaPay Feature: PASSO 5 (Tela de Investir) ─────────────────────────
        // Alvo: Tinder de ações ou Corrida de Cavalos
        // Avança quando o usuário realiza uma das ações (swipe ou aposta)
        {
            stepId: 5,
            target: '#tinder-section, #hipica-section',
            message: 'O dinheiro não some sozinho! Interaja com os cards ou aposte no cavalo com a perna quebrada e ajude a gente a zerar seu patrimônio.',
            advanceCondition: () => {
                // O investir.js seta 'zicapay-guia-investiu' quando o usuário age
                return localStorage.getItem('zicapay-guia-investiu') === 'true';
            }
        },

        // ZicaPay Feature: PASSO 6 (Dashboard após perder dinheiro) ───────────
        // Pede para voltar ao menu e ir para Empréstimos
        {
            stepId: 6,
            target: '#action-emprestimos-grid',
            message: 'Ficou no vermelho de vez? clique em Empréstimos e pegue um dinheiro com juros de agiota pra cobrir o rombo.',
            advanceCondition: () => {
                return window.location.pathname.includes('/emprestimo');
            }
        },

        // ZicaPay Feature: PASSO 7 (Finalização no Dashboard) ────────────────
        // Mensagem final de cumplicidade — encerra o guia permanentemente
        {
            stepId: 7,
            target: '.balance-card',
            message: 'AGORA VOCÊ JÁ SABE USAR O ZICAPAY, E É NOSSO CÚMPLICE CASO A CASA CAIA',
            advanceCondition: () => {
                // Este passo encerra após 4 segundos automaticamente
                return localStorage.getItem('zicapay-guia-concluido') === 'true';
            }
        }
    ];

    let currentStepIndex = parseInt(localStorage.getItem('guiaZicaStep')) || 0;

    function initGuia() {
        if (currentStepIndex >= steps.length) return;

        if (currentStepIndex === 0) {
            if (!window.location.pathname.endsWith('/dashboard') && window.location.pathname !== '/') {
                return;
            }
        }

        // ZicaPay Feature: passo 6 só aparece no dashboard (após retornar dos investimentos)
        if (currentStepIndex === 5) { // stepId 6 = index 5
            if (!window.location.pathname.endsWith('/dashboard') && window.location.pathname !== '/') {
                return;
            }
        }

        // ZicaPay Feature: passo 7 só aparece no dashboard
        if (currentStepIndex === 6) { // stepId 7 = index 6
            if (!window.location.pathname.endsWith('/dashboard') && window.location.pathname !== '/') {
                return;
            }
        }

        renderStep();
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'guia-zica-tooltip animate-guia-bounce';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    function renderStep() {
        // Pula passos cujas condições já foram atendidas
        while (currentStepIndex < steps.length && steps[currentStepIndex].advanceCondition()) {
            currentStepIndex++;
            localStorage.setItem('guiaZicaStep', currentStepIndex);
        }

        if (currentStepIndex >= steps.length) {
            tooltip.style.display = 'none';
            return;
        }

        const step = steps[currentStepIndex];
        let targetEl = document.querySelector(step.target);

        if (!targetEl) return;

        // ZicaPay Feature: passo 7 tem comportamento especial de encerramento
        const isFinalStep = (step.stepId === 7);

        tooltip.innerHTML = `
            <div class="guia-zica-content">
                <span class="guia-zica-msg">${step.message}</span>
                ${isFinalStep ? '<button id="guia-fechar-btn" style="margin-top:8px;background:#21C25E;color:#fff;border:none;padding:6px 16px;border-radius:8px;font-size:0.75rem;cursor:pointer;font-weight:700;">Entendi!</button>' : ''}
            </div>
            <div class="guia-zica-emoji" id="guia-emoji">👇</div>
        `;
        tooltip.style.display = 'flex';

        // ZicaPay Feature: no passo final, botão "Entendi!" encerra o guia permanentemente
        if (isFinalStep) {
            const btnFechar = document.getElementById('guia-fechar-btn');
            if (btnFechar) {
                btnFechar.addEventListener('click', () => {
                    encerrarGuia();
                });
            }
            // Também encerra automaticamente após 8 segundos
            setTimeout(() => {
                if (!localStorage.getItem('zicapay-guia-concluido')) {
                    encerrarGuia();
                }
            }, 8000);
        }

        const updatePosition = () => {
            if (!document.body.contains(targetEl)) {
                tooltip.style.display = 'none';
                return;
            }
            tooltip.style.display = 'flex';

            // Oculta o tooltip se algum popup modal estiver aberto para não sobrepor
            const isAnyModalOpen = document.querySelector('#propaganda-overlay.ativo, #taxa-abertura-overlay.ativo, .dp-overlay.dp-ativo');
            if (isAnyModalOpen) {
                tooltip.style.visibility = 'hidden';
            } else {
                tooltip.style.visibility = 'visible';
            }

            const rect = targetEl.getBoundingClientRect();

            // Tenta colocar acima primeiro
            let isAbove = true;
            let topPos = rect.top - tooltip.offsetHeight - 25;

            // Se sair por cima, põe embaixo
            if (topPos < 10) {
                topPos = rect.bottom + 25;
                isAbove = false;
            }

            let leftPos = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);

            // Restringe para não sair das laterais
            if (leftPos < 10) leftPos = 10;
            if (leftPos + tooltip.offsetWidth > window.innerWidth - 10) {
                leftPos = window.innerWidth - tooltip.offsetWidth - 10;
            }

            tooltip.style.left = `${leftPos}px`;
            tooltip.style.top = `${topPos}px`;

            // Atualiza a posição do emoji para apontar corretamente
            const emoji = document.getElementById('guia-emoji');
            if (emoji) {
                const emojiLeft = rect.left + (rect.width / 2) - leftPos;
                emoji.style.left = `${emojiLeft}px`;
                emoji.style.transform = 'translateX(-50%)';

                if (!isAbove) {
                    emoji.textContent = '👆';
                    emoji.style.bottom = 'auto';
                    emoji.style.top = '-25px';
                } else {
                    emoji.textContent = '👇';
                    emoji.style.bottom = '-25px';
                    emoji.style.top = 'auto';
                }
            }
        };

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        // Timeout para dar tempo de renderizar o HTML antes de calcular as dimensões
        setTimeout(updatePosition, 50);

        const checkInterval = setInterval(() => {
            updatePosition(); // atualiza a visibilidade em caso de popups abrindo

            if (step.advanceCondition()) {
                clearInterval(checkInterval);
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
                tooltip.style.display = 'none';

                currentStepIndex++;
                localStorage.setItem('guiaZicaStep', currentStepIndex);

                renderStep();
            }
        }, 100);

        // Avança nos passos que dependem de navegação ao clicar no alvo
        targetEl.addEventListener('click', () => {
            if (step.stepId === 2 || step.stepId === 3 || step.stepId === 4 || step.stepId === 6) {
                currentStepIndex++;
                localStorage.setItem('guiaZicaStep', currentStepIndex);
                tooltip.style.display = 'none';
            }
        });
    }

    // ZicaPay Feature: encerra o guia permanentemente
    function encerrarGuia() {
        localStorage.setItem('zicapay-guia-concluido', 'true');
        localStorage.setItem('guiaZicaStep', steps.length.toString());
        tooltip.style.transition = 'opacity 0.4s ease';
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.display = 'none';
            tooltip.style.opacity = '';
            tooltip.style.transition = '';
        }, 400);
    }

    // [BUGFIX] Sincronia: O Guia não deve aparecer por cima do Captcha.
    // Verifica se o modal de Captcha está visível na tela de investimentos.
    const captchaOverlay = document.getElementById('captcha-overlay');
    if (captchaOverlay && !captchaOverlay.classList.contains('hidden')) {
        const style = window.getComputedStyle(captchaOverlay);
        if (style.display !== 'none') {
            // Se estiver visível, aguarda o clique no botão de humano
            const btnHuman = document.getElementById('btn-human');
            if (btnHuman) {
                btnHuman.addEventListener('click', () => {
                    // Aguarda 450ms para garantir que a animação de fade-out do modal terminou
                    setTimeout(initGuia, 450);
                }, { once: true });
                return; // Impede a inicialização imediata
            }
        }
    }

    // Inicialização normal se não houver captcha bloqueando
    initGuia();
});
