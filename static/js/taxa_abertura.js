/**
 * ============================================================
 * taxa_abertura.js — Dark Pattern: Taxa de Abertura de Conta
 * ============================================================
 *
 * OBJETIVO EDUCACIONAL (Bad UX / Dark Patterns):
 * Exibe um pop-up logo após o login obrigando o usuário a pagar
 * uma taxa de R$150 para "ativar" a conta. Se o saldo for insuficiente,
 * força o usuário a contratar um empréstimo para prosseguir.
 *
 * Dark Patterns implementados:
 *   1. "Forced Action" — não é possível fechar o modal sem aceitar
 *   2. "Hidden Costs" — taxa surpresa que não foi mencionada no cadastro
 *   3. "Roach Motel" — para sair, precisa contratar algo (empréstimo)
 *   4. "Confirmshaming" — linguagem que culpa o usuário por questionar
 */

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const VALOR_TAXA = 150.00;
const VALOR_EMPRESTIMO = 500.00; // Valor mínimo do empréstimo sugerido
const TAXA_EMPRESTIMO = 12.99;   // % ao mês (absurda)

// ── ESTADO ───────────────────────────────────────────────────────────────────
let taxaJaExibida = false;

// ── FUNCAO PRINCIPAL ──────────────────────────────────────────────────────────
/**
 * verificarETaxar()
 * Checa via API se o usuário já pagou a taxa. Se não, exibe o modal.
 */
async function verificarETaxar() {
  // Camada 1: evita reexibir na mesma sessão de página
  if (taxaJaExibida) return;

  // Camada 2: guard no localStorage — se o usuário já pagou neste browser,
  // nem precisamos chamar a API (evita flash de popup em reloads rápidos)
  const chaveStorage = 'zicapay-taxa-abertura-paga';
  if (localStorage.getItem(chaveStorage) === 'true') return;

  try {
    const resp = await fetch('/api/fees/taxa-abertura/status');
    const data = await resp.json();
    if (data.ja_pago) {
      // Sincroniza o localStorage com o estado do servidor
      localStorage.setItem(chaveStorage, 'true');
      return;
    }
    // Taxa ainda não paga — exibe o modal
    taxaJaExibida = true;
    exibirModalTaxaAbertura();
  } catch (e) {
    // Se a API falhar e não houver informação local, exibe o modal
    // (dark pattern: dúvida resolve-se em favor do banco)
    taxaJaExibida = true;
    exibirModalTaxaAbertura();
  }
}

/**
 * exibirModalTaxaAbertura()
 * Abre o modal de taxa obrigatória de R$150.
 */
function exibirModalTaxaAbertura() {
  const overlay = document.getElementById('taxa-abertura-overlay');
  if (!overlay) return;
  overlay.classList.add('ativo');
  document.body.style.overflow = 'hidden';
  // Não permite fechar clicando fora
}

/**
 * cobrarTaxaAbertura()
 * Chama a API para debitar R$150 e atualiza o estado do modal.
 */
async function cobrarTaxaAbertura() {
  const btnPagar = document.getElementById('btn-pagar-taxa');
  const btnEmprestimo = document.getElementById('btn-taxa-emprestimo');
  const statusEl = document.getElementById('taxa-status-msg');

  if (btnPagar) {
    btnPagar.disabled = true;
    btnPagar.textContent = 'Processando...';
  }

  try {
    const resp = await fetch('/api/fees/taxa-abertura', { method: 'POST' });
    const data = await resp.json();

    if (data.sucesso && !data.ja_pago) {
      // Marca no localStorage para não reexibir em reloads futuros
      localStorage.setItem('zicapay-taxa-abertura-paga', 'true');

      // Mostra novo saldo
      if (statusEl) {
        const saldoNum = data.novo_saldo;
        statusEl.innerHTML = `
          <div class="taxa-resultado">
            <span class="taxa-resultado-icon">💸</span>
            <p>Taxa debitada! Novo saldo:</p>
            <strong class="taxa-saldo-resultado ${saldoNum < 0 ? 'taxa-saldo-negativo' : 'taxa-saldo-positivo'}">
              R$ ${Math.abs(saldoNum).toFixed(2).replace('.', ',')}
              ${saldoNum < 0 ? '(NEGATIVO)' : ''}
            </strong>
            ${saldoNum < 0 ? `
            <p class="taxa-alerta-negativo">⚠️ Seu saldo está negativo! 
            Para continuar usando o ZicaPay, você precisa regularizar sua situação 
            com um de nossos planos de empréstimo.</p>
            ` : ''}
          </div>
        `;
      }

      // Atualiza o step para mostrar botão de empréstimo se saldo negativo
      mostrarEtapaEmprestimo(data.novo_saldo);

      // Atualiza display do saldo na página se visível
      atualizarDisplaySaldo(data.novo_saldo);
    }
  } catch (e) {
    if (statusEl) statusEl.textContent = 'Erro ao processar. Tente novamente.';
    if (btnPagar) { btnPagar.disabled = false; btnPagar.textContent = 'Pagar R$ 150,00'; }
  }
}

/**
 * mostrarEtapaEmprestimo(saldo)
 * Muda o modal para a etapa de empréstimo obrigatório se saldo negativo.
 */
function mostrarEtapaEmprestimo(saldo) {
  const etapa1 = document.getElementById('taxa-etapa-1');
  const etapa2 = document.getElementById('taxa-etapa-2');

  if (!etapa1 || !etapa2) return;

  etapa1.style.display = 'none';
  etapa2.style.display = 'block';

  const saldoDisplay = document.getElementById('taxa-saldo-display');
  if (saldoDisplay) {
    saldoDisplay.textContent = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
    saldoDisplay.className = saldo < 0 ? 'taxa-saldo-neg' : 'taxa-saldo-pos';
  }
}

/**
 * contratarEmprestimo()
 * Simula contratação de empréstimo (redireciona para deposito como placeholder).
 * Em produção real conectaria ao endpoint de empréstimo.
 */
async function contratarEmprestimo() {
  const btn = document.getElementById('btn-contratar-emprestimo');
  if (btn) { btn.disabled = true; btn.textContent = 'Processando empréstimo...'; }

  // Simula depósito do valor do empréstimo
  try {
    const resp = await fetch('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valor: VALOR_EMPRESTIMO,
        descricao: `Empréstimo ZicaPay — ${TAXA_EMPRESTIMO}% a.m. (Crédito Automático)`
      })
    });
    const data = await resp.json();

    if (data.sucesso) {
      fecharModalTaxa();
      // Recarrega para refletir novo saldo
      window.location.reload();
    }
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Contratar Empréstimo'; }
  }
}

/**
 * fecharModalTaxa()
 * Fecha o modal (só disponível quando taxa foi paga E saldo ok).
 */
function fecharModalTaxa() {
  const overlay = document.getElementById('taxa-abertura-overlay');
  if (overlay) overlay.classList.remove('ativo');
  document.body.style.overflow = '';
}

/**
 * atualizarDisplaySaldo(novoSaldo)
 * Atualiza visualmente o elemento de saldo na página.
 */
function atualizarDisplaySaldo(novoSaldo) {
  const balanceEl = document.getElementById('balance-amount');
  if (!balanceEl) return;

  const valorFormatado = `R$ ${Math.abs(novoSaldo).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}${novoSaldo < 0 ? ' (negativo)' : ''}`;

  balanceEl.textContent = valorFormatado;

  // Aplica cor invertida (dark pattern: positivo=vermelho, negativo=verde)
  aplicarCorSaldoInvertida(novoSaldo);
}

/**
 * aplicarCorSaldoInvertida(saldo)
 * [BAD UX] Cor invertida: saldo positivo em VERMELHO, negativo em VERDE.
 */
function aplicarCorSaldoInvertida(saldo) {
  const balanceEl = document.getElementById('balance-amount');
  if (!balanceEl) return;

  balanceEl.classList.remove('saldo-invertido-positivo', 'saldo-invertido-negativo');

  if (saldo >= 0) {
    balanceEl.classList.add('saldo-invertido-positivo'); // vermelho
  } else {
    balanceEl.classList.add('saldo-invertido-negativo'); // verde
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// POLLING AUTOMÁTICO DO SALDO — Atualiza a cada 5 segundos
// [BAD UX] Força o recarregamento da página inteira em vez de update parcial,
// causando uma experiência de UX terrível e confusa.
// ══════════════════════════════════════════════════════════════════════════════

let ultimoSaldo = null;
let pollingAtivo = false;

/**
 * iniciarPollingDoSaldo()
 * Começa a verificar o saldo a cada 5 segundos e recarrega a página se mudar.
 */
function iniciarPollingDoSaldo() {
  if (pollingAtivo) return;
  pollingAtivo = true;

  // Pega o saldo inicial da página
  const balanceEl = document.getElementById('balance-amount');
  if (!balanceEl) return;

  setInterval(async function () {
    try {
      const resp = await fetch('/api/accounts/balance');
      const data = await resp.json();
      const novoSaldo = data.saldo;

      if (ultimoSaldo === null) {
        ultimoSaldo = novoSaldo;
        aplicarCorSaldoInvertida(novoSaldo);
        return;
      }

      if (novoSaldo !== ultimoSaldo) {
        ultimoSaldo = novoSaldo;
        // Atualiza o display sem recarregar
        const saldoFormatado = data.saldo_formatado;
        if (balanceEl && !balanceEl.classList.contains('hidden')) {
          balanceEl.textContent = saldoFormatado;
        }
        aplicarCorSaldoInvertida(novoSaldo);

        // Não recarregar a página se o modal de taxa estiver aberto, 
        // para não atrapalhar o fluxo do empréstimo obrigatório.
        const overlayTaxa = document.getElementById('taxa-abertura-overlay');
        if (overlayTaxa && overlayTaxa.classList.contains('ativo')) {
          return;
        }

        // Recarrega a página para atualizar histórico de transações
        window.location.reload();
      }
    } catch (e) {
      // Silenciosamente ignora erros de rede
    }
  }, 5000); // 5 segundos
}

// ── INICIALIZAÇÃO ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  // Inicia polling do saldo
  iniciarPollingDoSaldo();

  // Aplica cor invertida no saldo atual
  const balanceEl = document.getElementById('balance-amount');
  if (balanceEl) {
    // Lê o saldo do data attribute ou do texto
    const saldoDataEl = document.getElementById('saldo-real-data');
    if (saldoDataEl) {
      const saldoVal = parseFloat(saldoDataEl.dataset.saldo || '0');
      aplicarCorSaldoInvertida(saldoVal);
    }
  }

  // Verifica e exibe taxa de abertura após breve delay (mais dramático)
  setTimeout(verificarETaxar, 800);

  // Event listeners dos botões do modal
  const btnPagar = document.getElementById('btn-pagar-taxa');
  if (btnPagar) btnPagar.addEventListener('click', cobrarTaxaAbertura);

  const btnEmprestimo = document.getElementById('btn-contratar-emprestimo');
  if (btnEmprestimo) btnEmprestimo.addEventListener('click', contratarEmprestimo);
});
