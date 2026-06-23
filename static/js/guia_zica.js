/**
 * guia_zica.js - Sistema de "Onboarding do Mal"
 */

document.addEventListener('DOMContentLoaded', () => {
    const steps = [
        {
            stepId: 1,
            target: '#balance-toggle',
            message: 'Tá devendo, né? Clica no olhinho pra ver o tamanho do buraco.',
            advanceCondition: () => {
                return localStorage.getItem('zicapay-balance-hidden') === 'false';
            }
        },
        {
            stepId: 2,
            target: '#action-pix',
            message: 'Se vira aí e faz um Pix pra pagar essa dívida.',
            advanceCondition: () => {
                return window.location.pathname.includes('/pix');
            }
        },
        {
            stepId: 3,
            target: '#action-cartoes, #nav-cartoes',
            message: 'Pix não deu? Sua única salvação é o cartão de crédito. Abre lá.',
            advanceCondition: () => {
                return window.location.pathname.includes('/cartoes');
            }
        },
        {
            stepId: 4,
            target: '#action-investir, #nav-investir',
            message: 'Ficou no vermelho de vez? O único jeito é apostar o resto. Clica em Investir e seja o que o mercado quiser.',
            advanceCondition: () => {
                return window.location.pathname.includes('/investir');
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

        renderStep();
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'guia-zica-tooltip animate-guia-bounce';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    function renderStep() {
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

        tooltip.innerHTML = `
            <div class="guia-zica-content">
                <span class="guia-zica-msg">${step.message}</span>
            </div>
            <div class="guia-zica-emoji" id="guia-emoji">👇</div>
        `;
        tooltip.style.display = 'flex';

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
                // A posição left do emoji deve ser o centro do alvo menos o leftPos do tooltip
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
        
        targetEl.addEventListener('click', () => {
            if (step.stepId === 2 || step.stepId === 3 || step.stepId === 4) {
                currentStepIndex++;
                localStorage.setItem('guiaZicaStep', currentStepIndex);
                tooltip.style.display = 'none';
            }
        });
    }

    initGuia();
});
