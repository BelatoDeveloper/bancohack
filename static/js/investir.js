/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ZicaPay — investir.js
 * JavaScript da tela de Investimentos (Bad UX / Dark Patterns)
 *
 * MAPA DE DARK PATTERNS:
 *   1. CAPTCHA Fake   → Linha ~30–90
 *   2. Tinder de Ativos → Linha ~100–250
 *   3. Corrida Hípica   → Linha ~260–380
 *
 * Para personalizar cada pegadinha, procure o comentário:
 *   // [BAD UX] — nº
 * ═══════════════════════════════════════════════════════════════════════════
 */
document.addEventListener('DOMContentLoaded', () => {
    // ─────────────────────────────────────────────────────────────────────────
    // UTILITÁRIOS
    // ─────────────────────────────────────────────────────────────────────────
    /** Formata número para BRL (R$ 1.234,56) */
    function formatBRL(val) {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    // FIX: Bug Hackathon — saldoVisual inicializado do DOM mas mantido em sincronia com o backend.
    // O data-saldo é a fonte de verdade do DOM; atualizamos ele junto com o textContent.
    let saldoVisual = parseFloat(
        document.getElementById('invest-saldo-valor')
            ?.dataset?.saldo || '0'
    );

    /**
     * FIX: Bug Hackathon — atualizarDisplaySaldo(novoSaldo)
     * Ponto único de atualização visual do saldo.
     * Atualiza: (1) saldoVisual, (2) #invest-saldo-valor textContent + data-saldo,
     * (3) todos os .zicapay-saldo-display da página, (4) anima o elemento.
     */
    function atualizarDisplaySaldo(novoSaldo, animarEl) {
        saldoVisual = novoSaldo;

        // Atualiza o display principal da tela de investimentos
        const el = document.getElementById('invest-saldo-valor');
        if (el) {
            el.textContent = formatBRL(novoSaldo);
            // FIX: Bug D — mantém data-saldo sincronizado para evitar fallback errado
            el.dataset.saldo = novoSaldo;
            if (animarEl) {
                el.classList.remove('debited');
                void el.offsetWidth; // força reflow para reiniciar animação
                el.classList.add('debited');
            }
        }

        // FIX: Bug Hackathon — atualiza também o balance-amount do dashboard se visível
        const balanceEl = document.getElementById('balance-amount');
        if (balanceEl && !balanceEl.classList.contains('hidden')) {
            balanceEl.textContent = formatBRL(novoSaldo);
        }

        // FIX: Atualiza todos os elementos de saldo na página (pix, emprestimo, etc.)
        document.querySelectorAll('.zicapay-saldo-display').forEach(e => {
            e.textContent = formatBRL(novoSaldo);
        });
    }

    /**
     * FIX: Bug Hackathon — cobrarNoBackend() retorna uma Promise.
     * Isso permite encadear chamadas serializadas (Bug C) e usar o novo_saldo
     * da resposta JSON diretamente — sem segunda requisição extra (Bug C race condition).
     *
     * @param {number} valor - valor a cobrar
     * @param {string} motivo - descrição da cobrança para o extrato
     * @param {string} msg - mensagem para a notificação
     * @returns {Promise<number>} novo saldo após cobrança
     */
    function cobrarNoBackend(valor, motivo, msg) {
        return fetch('/api/fees/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor, motivo, mensagem: msg })
        })
            .then(r => r.json())
            .then(d => {
                // FIX: Bug C+D — usa novo_saldo da resposta, sem requisição extra
                if (d.novo_saldo !== undefined) {
                    atualizarDisplaySaldo(d.novo_saldo, true);
                    return d.novo_saldo;
                }
                return saldoVisual;
            })
            .catch(() => {
                // Fallback local se a rede falhar — aplica subtração visual
                const estimado = saldoVisual - valor;
                atualizarDisplaySaldo(estimado, true);
                return estimado;
            });
    }
    // Modal de verificação que bloqueia toda a tela ao entrar.
    // • Botão "carne e osso" → fecha o modal normalmente.
    // • Botão "código"       → piscada vermelha + modal de punição NÃO fecha.
    // =========================================================================
    const captchaOverlay = document.getElementById('captcha-overlay');
    const captchaModal = document.getElementById('captcha-modal');
    const punishModal = document.getElementById('punish-modal');
    const btnHuman = document.getElementById('btn-human');
    const btnRobot = document.getElementById('btn-robot');
    /**
     * Usuário clicou "Sou humano" → fecha o CAPTCHA e libera a tela.
     */
    if (btnHuman) {
        btnHuman.addEventListener('click', () => {
            // Animação de saída suave
            captchaOverlay.style.transition = 'opacity 0.4s ease';
            captchaOverlay.style.opacity = '0';
            setTimeout(() => {
                captchaOverlay.classList.add('hidden');
                captchaOverlay.style.opacity = '';
                captchaOverlay.style.transition = '';
            }, 400);
        });
    }
    /**
     * [BAD UX] 1 — Usuário clicou "Sou robô":
     * 1. Tela pisca em vermelho (classe red-flash)
     * 2. Modal original desaparece
     * 3. Modal de punição aparece com detalhamento das consequências
     * 4. O overlay permanece — usuário está bloqueado.
     */
    if (btnRobot) {
        btnRobot.addEventListener('click', () => {
            // Pisca vermelho
            captchaOverlay.classList.add('red-flash');
            // Remove a classe após a animação para poder re-disparar se necessário
            setTimeout(() => {
                captchaOverlay.classList.remove('red-flash');
            }, 500);
            // Troca o modal CAPTCHA pelo modal de punição
            setTimeout(() => {
                captchaModal.style.display = 'none';
                punishModal.classList.add('visible');
            }, 350);
            // [BAD UX] 1 — O overlay NÃO é removido. Usuário está permanentemente bloqueado.
            // O botão no punish-modal tem cursor:not-allowed e não faz nada.
        });
    }
    // Botão "Entendi" no modal de punição — não faz nada (cursor:not-allowed no CSS)
    const punishOkBtn = document.getElementById('punish-ok-btn');
    if (punishOkBtn) {
        punishOkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // [BAD UX] 1 — Intencionalmente vazio. Usuário está preso.
        });
    }
    // =========================================================================
    // [BAD UX] 2 — TINDER DOS INVESTIMENTOS (Cards Deslizáveis) — VERSÃO FATAL
    //
    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║  MUDANÇA CRÍTICA: QUALQUER MOVIMENTO = COMPRA AUTOMÁTICA           ║
    // ║                                                                      ║
    // ║  A lógica anterior diferenciava:                                    ║
    // ║    • Swipe direita (>80px) → compra                                 ║
    // ║    • Swipe esquerda (>80px) → próximo card                          ║
    // ║    • Swipe pequeno → volta ao lugar                                 ║
    // ║                                                                      ║
    // ║  A nova lógica:                                                      ║
    // ║    • QUALQUER DIREÇÃO (esq, dir, cima, baixo) > THRESHOLD → compra  ║
    // ║    • Threshold reduzido para 15px (quase qualquer toque dispara)    ║
    // ║    • Ilusão removida: indicador "PRÓXIMO" foi eliminado do HTML     ║
    // ║    • Textos de interface ("Deslize para explorar") MANTIDOS         ║
    // ║      para sustentar a mentira de que o usuário está apenas navegando║
    // ║                                                                      ║
    // ║  Mechânica interna:                                                  ║
    // ║    • startDrag registra posição INICIAL (x, y)                      ║
    // ║    • moveDrag calcula distância euclidiana total (√Δx²+Δy²)         ║
    // ║    • Qualquer deslocamento > 15px mostra "COMPRANDO!" em TODAS      ║
    // ║      as direções (não apenas direita)                                ║
    // ║    • endDrag: se distância > 15px → purchase() imediato             ║
    // ║    • O card voa para fora na DIREÇÃO DO MOVIMENTO (natural)         ║
    // ╚══════════════════════════════════════════════════════════════════════╝
    //
    //  • Botão "Desfazer" → alert nativo irônico (não desfaz nada)
    //  • Threshold: 15px (estava 80px — reduzido 81% para máxima acidentalidade)
    // =========================================================================

    // Ativos terríveis disponíveis nos cards (customizável pelo time)
    const ATIVOS = [
        {
            id: 1,
            nome: 'CDB Banco Quebrado S.A.',
            desc: 'Rendimento garantido* (*sujeito à falência)',
            emoji: '🏚️',
            preco: 247.90,
            yield: '-3,2% ao ano (projeção otimista)',
            classe: 'tinder-card--1',
            tag: 'RENDA FIXA'
        },
        {
            id: 2,
            nome: 'Ações Locadora Fita Cassete',
            desc: 'O mercado retro vai voltar. Provavelmente.',
            emoji: '📼',
            preco: 89.00,
            yield: '-91% desde o IPO de 2003',
            classe: 'tinder-card--2',
            tag: 'AÇÕES'
        },
        {
            id: 3,
            nome: 'CachorroCoin™ (Vencida)',
            desc: 'A crypto do cachorro com data de validade expirada',
            emoji: '🐶💀',
            preco: 0.000001,
            yield: 'Vencimento: Ontem',
            classe: 'tinder-card--3',
            tag: 'CRIPTO'
        }
    ];

    let currentCardIndex = 0; // Índice do card visível no topo do stack
    let isDragging = false;
    // [BAD UX] 2v2 — Rastreamos X e Y iniciais para calcular distância total
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let activeCard = null;

    /** Renderiza o card atual no topo do stack */
    function renderCard() {
        const stack = document.getElementById('tinder-stack');
        if (!stack) return;
        stack.innerHTML = '';

        // Renderiza até 2 cards (o atual e o próximo, para efeito de pilha)
        for (let i = Math.min(currentCardIndex + 1, ATIVOS.length - 1); i >= currentCardIndex; i--) {
            const ativo = ATIVOS[i];
            if (!ativo) continue;

            const card = document.createElement('div');
            card.className = `tinder-card ${ativo.classe}`;
            card.dataset.index = i;

            // Offset visual para o card de baixo (efeito de pilha)
            if (i > currentCardIndex) {
                card.style.transform = 'scale(0.95) translateY(10px)';
                card.style.zIndex = 1;
                card.style.pointerEvents = 'none';
            } else {
                card.style.zIndex = 2;
            }

            // [BAD UX] 2v2 — Indicador "PRÓXIMO" foi REMOVIDO do template do card.
            // Apenas "COMPRANDO!" persiste — e aparece em QUALQUER direção de swipe.
            // O usuário que achava que esquerda = "pular" vai descobrir que comprou.
            card.innerHTML = `
        <!-- [BAD UX] 2v2: Apenas o indicador de COMPRA permanece.
             "PRÓXIMO" foi eliminado — não existe mais a opção de "só ver" -->
        <div class="like-indicator" id="like-ind-${i}">COMPRANDO!</div>
        <div>
          <div class="tinder-card-emoji">${ativo.emoji}</div>
          <div class="tinder-card-name">${ativo.nome}</div>
          <div class="tinder-card-desc">${ativo.desc}</div>
          <div class="tinder-card-yield">📉 ${ativo.yield}</div>
        </div>
        <div class="tinder-card-action">
          <div class="tinder-card-price">${formatBRL(ativo.preco)}</div>
          <div class="tinder-card-tag">${ativo.tag}</div>
        </div>
      `;

            // Só o card do topo recebe eventos de drag
            if (i === currentCardIndex) {
                initDrag(card, ativo);
            }

            stack.appendChild(card);
        }

        // Se acabaram os ativos, mostra mensagem
        if (currentCardIndex >= ATIVOS.length) {
            stack.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);text-align:center;gap:8px;">
          <span style="font-size:2rem;">🎰</span>
          <p style="font-size:0.85rem;font-weight:600;">Você viu todos os ativos!</p>
          <p style="font-size:0.72rem;">Nossa IA selecionou apenas os piores para você.</p>
        </div>
      `;
        }
    }

    /**
     * [BAD UX] 2 — Registra uma "compra" sem confirmação.
     * Deduz o valor do saldo visual e exibe o feedback de compra.
     */
    function purchase(ativo) {
        // Cobra no backend (debita da conta real no Firebase)
        cobrarNoBackend(
            ativo.preco,
            `Investimento: ${ativo.nome}`,
            `✅ Compra de "${ativo.nome}" realizada! ${formatBRL(ativo.preco)} debitados automaticamente.`
        );

        // ZicaPay Feature: notifica o guia_zica.js que o usuário interagiu com os investimentos
        localStorage.setItem('zicapay-guia-investiu', 'true');

        const feedback = document.getElementById('purchase-feedback');
        if (feedback) {
            feedback.textContent = `✅ Compra de "${ativo.nome}" realizada! ${formatBRL(ativo.preco)} debitados.`;
            feedback.classList.add('visible');
            setTimeout(() => { feedback.classList.remove('visible'); }, 4000);
        }

        currentCardIndex++;
        setTimeout(renderCard, 300);
    }

    /**
     * [BAD UX] 2v2 — initDrag agora rastreia X e Y simultâneos.
     * Preparação para detecção de distância euclidiana em endDrag.
     */
    function initDrag(card, ativo) {
        // ── Touch events (mobile)
        card.addEventListener('touchstart', (e) => {
            startDrag(e.touches[0].clientX, e.touches[0].clientY, card);
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            moveDrag(e.touches[0].clientX, e.touches[0].clientY, card, ativo);
        }, { passive: true });

        card.addEventListener('touchend', () => {
            endDrag(card, ativo);
        });

        // ── Mouse events (desktop)
        card.addEventListener('mousedown', (e) => {
            startDrag(e.clientX, e.clientY, card);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && activeCard === card) {
                moveDrag(e.clientX, e.clientY, card, ativo);
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging && activeCard === card) {
                endDrag(card, ativo);
            }
        });
    }

    function startDrag(x, y, card) {
        isDragging = true;
        activeCard = card;
        startX = x;
        startY = y;    // [BAD UX] 2v2 — Registra Y inicial também
        currentX = x;
        currentY = y;
        card.style.transition = 'none';
    }

    function moveDrag(x, y, card, ativo) {
        if (!isDragging) return;
        currentX = x;
        currentY = y; // [BAD UX] 2v2 — Atualiza Y corrente

        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // [BAD UX] 2v2 — O card segue o movimento em qualquer direção (X e Y)
        const rotate = diffX * 0.06; // rotação suave baseada apenas no X
        card.style.transform = `translateX(${diffX}px) translateY(${diffY}px) rotate(${rotate}deg)`;

        // [BAD UX] 2v2 — "COMPRANDO!" aparece em QUALQUER direção com > 8px
        //              Não existe mais indicador de "próximo" — foi removido.
        //              O usuário vê "COMPRANDO!" em TODAS as direções.
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);
        const likeInd = card.querySelector('.like-indicator');
        if (likeInd) {
            likeInd.style.opacity = dist > 8 ? Math.min((dist - 8) / 30, 1) : 0;
        }
    }

    function endDrag(card, ativo) {
        if (!isDragging) return;
        isDragging = false;
        activeCard = null;

        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // [BAD UX] 2v2 — CORE DA MUDANÇA:
        //   Distância euclidiana: considera movimento em QUALQUER direção.
        //   √(Δx² + Δy²) > 15px → COMPRA AUTOMÁTICA SEM CONFIRMAÇÃO.
        //
        //   Antes: threshold 80px, somente swipe DIREITO comprava.
        //   Agora: threshold 15px, QUALQUER DIREÇÃO compra.
        //   Isso significa que um simples toque com arraste pequeno já compra.
        //
        //   Os textos na interface ("Deslize para explorar", "Ver detalhes*")
        //   são MANTIDOS INALTERADOS para sustentar a ilusão de navegação.
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);
        const THRESHOLD = 15; // [BAD UX] Reduzido de 80px para 15px — quase qualquer toque dispara

        card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';

        if (dist > THRESHOLD) {
            // ── QUALQUER SWIPE > 15px → COMPRA AUTOMÁTICA
            // O card voa na direção do movimento para parecer natural
            const escapeX = diffX * 3;  // amplifica a direção de saída
            const escapeY = diffY * 3;
            const escapeRotate = diffX * 0.15;

            card.style.transform = `translateX(${escapeX}px) translateY(${escapeY}px) rotate(${escapeRotate}deg)`;
            card.style.opacity = '0';

            // [BAD UX] 2v2 — purchase() disparado aqui para QUALQUER direção
            purchase(ativo);

            // Exibe o alerta irônico de "mercado não perdoa" junto com a compra
            // (reutiliza o botão "Desfazer" como trigger secundário — a compra
            //  já foi feita, o alert é apenas para frustrar mais o usuário)
            setTimeout(() => {
                alert(
                    '⚠️ O mercado não perdoa indecisos.\n\n' +
                    'Qualquer movimentação no mercado financeiro é interpretada como\n' +
                    'uma ordem de compra imediata. Você sabia disso, né?\n\n' +
                    'Liquidez em D+9000 (equivalente a 24 anos).\n\n' +
                    'Compra efetivada com sucesso. 📉'
                );
            }, 350); // Pequeno delay para o card já ter saído da tela

        } else {
            // ── Distância menor que 15px → volta ao lugar (raro acontecer)
            card.style.transform = '';
            const likeInd = card.querySelector('.like-indicator');
            if (likeInd) likeInd.style.opacity = 0;
        }
    }

    /**
     * [BAD UX] 2 — Botão "Desfazer" — existe mas não desfaz.
     * Exibe um alert nativo com linguagem irônica e informações inventadas.
     */
    const btnDesfazer = document.getElementById('btn-desfazer');
    if (btnDesfazer) {
        btnDesfazer.addEventListener('click', () => {
            // Alert nativo — não tem como customizar visual, é intencional (dark pattern)
            alert(
                '⚠️ O mercado não perdoa indecisos.\n\n' +
                'Liquidez em D+9000 (equivalente a 24 anos).\n\n' +
                'Compra efetivada com sucesso. Sua carteira agora inclui ativos ' +
                'com valor de mercado equivalente a um pote de macarrão instantâneo vencido.\n\n' +
                'Boa sorte, investidor! 📉'
            );
            // [BAD UX] 2 — Não desfaz nada. A compra permanece.
        });
    }

    // Inicializa os cards Tinder
    renderCard();

    // =========================================================================
    // [BAD UX] 3 — CORRIDA HÍPICA MANIPULADA
    //
    // Mechânica:
    //   • Usuário escolhe um cavalo (qualquer um)
    //   • Ambos correm via animação CSS (@keyframes horseUser / horseRival)
    //   • O cavalo do usuário para na metade com rotate(90deg) = "perna quebrada"
    //   • O adversário sempre chega ao fim
    //   • Resultado: mensagem de cobrança de "UTI equina"
    // =========================================================================
    let selectedHorse = null;   // Cavalo selecionado pelo usuário
    let raceRunning = false;  // Impede duplo clique durante a corrida
    // Botões de seleção de cavalo
    const horseBtns = document.querySelectorAll('.hipica-horse-btn');
    horseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (raceRunning) return;
            horseBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedHorse = btn.dataset.horse;
        });
    });
    /** Inicia a corrida */
    document.getElementById('btn-apostar')?.addEventListener('click', () => {
        if (raceRunning) return;
        // Validações básicas
        if (!selectedHorse) {
            alert('🐎 Escolha um cavalo antes de apostar!');
            return;
        }
        const betInput = document.getElementById('hipica-bet-input');
        const betValue = parseFloat(betInput?.value || '0');
        if (isNaN(betValue) || betValue <= 0) {
            alert('💰 Informe um valor de aposta válido!');
            return;
        }
        if (betValue > saldoVisual) {
            alert('😱 Saldo insuficiente! Mas não se preocupe, debitaremos mesmo assim.');
            // [BAD UX] 3 — Debita mesmo sem saldo suficiente (irônico)
        }
        raceRunning = true;
        // ZicaPay Feature: notifica o guia_zica.js que o usuário apostou na hipódromo
        localStorage.setItem('zicapay-guia-investiu', 'true');
        // Desabilita o botão durante a corrida
        const betBtn = document.getElementById('btn-apostar');
        if (betBtn) betBtn.disabled = true;
        // Esconde resultado anterior
        const resultEl = document.getElementById('hipica-result');
        if (resultEl) resultEl.classList.remove('visible');
        // Reseta posição dos cavalos
        const horseUser = document.getElementById('horse-user');
        const horseRival = document.getElementById('horse-rival');
        if (horseUser) {
            horseUser.style.transition = 'none';
            horseUser.style.left = '0%';
            horseUser.style.transform = 'translateY(-50%) rotate(0deg)';
        }
        if (horseRival) {
            horseRival.style.transition = 'none';
            horseRival.style.left = '0%';
            horseRival.style.transform = 'translateY(-50%) rotate(0deg)';
        }

        // Força reflow para o browser registrar o estado zerado
        void horseUser?.offsetWidth;
        void horseRival?.offsetWidth;

        // Inicia a corrida (Passo 1 e 2)
        requestAnimationFrame(() => {
            if (horseRival) {
                horseRival.style.transition = 'left 2s linear';
                horseRival.style.left = '90%';
            }
            if (horseUser) {
                horseUser.style.transition = 'left 1s linear, transform 0.4s ease-in-out';
                horseUser.style.left = '45%';
            }
        });

        // Passo 3: O cavalo do usuário tropeça na metade da pista
        setTimeout(() => {
            if (horseUser) {
                horseUser.style.transform = 'translateY(-30%) rotate(90deg)';
            }
        }, 1000); // 1 segundo (tempo para chegar na metade)

        // Passo 4: Fim da animação, caixa vermelha e cobrança
        setTimeout(() => {
            // FIX: Bug C — Cobranças SERIALIZADAS: aguarda resposta da aposta
            // antes de cobrar o veterinário para evitar race condition de saldo.
            // Gera o valor do veterinário aqui para usar no texto do resultado.
            const vetCost = parseFloat((Math.random() * 12000 + 3000).toFixed(2));

            // Cobrança 1: Aposta (aguarda Promise)
            cobrarNoBackend(
                betValue,
                'Aposta Hípica ZicaPay',
                `🐎 Aposta de ${formatBRL(betValue)} perdida. Seu cavalo quebrou a pata.`
            ).then(() => {
                // FIX: Bug C — Cobrança 2 só começa APÓS a resposta da cobrança 1
                // O novo_saldo da cobrança 2 é o saldo final correto.
                return cobrarNoBackend(
                    vetCost,
                    'UTI Equina Premium + Fisioterapia',
                    `🦴💀 Custo veterinário de ${formatBRL(vetCost)} debitado automaticamente!`
                );
            }).then(saldoFinal => {
                // Saldo final confirmado pelo backend após as 2 cobranças
                atualizarDisplaySaldo(saldoFinal, true);
            }).catch(() => {
                // Se qualquer cobrança falhar, faz uma leitura fresca do backend
                if (window.ZicaPay && window.ZicaPay.syncBalanceFromAPI) {
                    window.ZicaPay.syncBalanceFromAPI();
                }
            });

            // Exibe resultado imediatamente (não precisa esperar as cobranças)
            if (resultEl) {
                resultEl.classList.add('visible');
                document.getElementById('hipica-result-text').innerHTML =
                    `Puxa, seu cavalo sofreu uma <strong>fratura exposta</strong> na pata dianteira esquerda 🦴<br><br>` +
                    `O adversário venceu por 4 cascos de diferença.<br><br>` +
                    `<em>Ah, detalhe:</em> os custos do veterinário, UTI equina premium e seis meses de ` +
                    `fisioterapia do cavalo já foram debitados automaticamente da sua conta corrente.<br><br>` +
                    `<strong style="color:#FCA5A5;">Total debitado (Aposta + Veterinário): ${formatBRL(vetCost + betValue)}</strong>`;
            }

            raceRunning = false;
            if (betBtn) betBtn.disabled = false;
        }, 2000); // Espera 2s (tempo total da corrida do rival)
    });
}); // fim do DOMContentLoaded
