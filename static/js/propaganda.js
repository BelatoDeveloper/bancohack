/**
 * ============================================================
 * propaganda.js — Lógica do Dark Pattern de Propaganda
 * ============================================================
 *
 * OBJETIVO EDUCACIONAL (Bad UX / Dark Patterns):
 * Este arquivo implementa um padrão de dark UX onde o usuário é
 * forçado a assistir 30 segundos de vídeo antes de ver o saldo.
 *
 * Dark Patterns implementados neste arquivo:
 *   1. "Forced Action"  — forçar o usuário a executar uma ação
 *      (assistir vídeo) para acessar informação que deveria ser livre.
 *   2. "Trick Question" — botão "Pular" que parece funcional mas
 *      reinicia o vídeo e penaliza o usuário.
 *   3. "Confirmshaming" — texto do alerta que culpa e envergonha o
 *      usuário por tentar pular ("voce aceitou os termos...").
 *
 * ──────────────────────────────────────────────────────────────
 * PERSONALIZACAO — altere as constantes abaixo para customizar:
 * ──────────────────────────────────────────────────────────────
 */

// ── CONSTANTES DE PERSONALIZACAO ─────────────────────────────────────────────

/**
 * CAMINHO_DO_VIDEO: Caminho/URL do arquivo de vídeo mp4 a ser exibido.
 *
 * Como usar:
 *   - Video local na pasta static: '/static/videos/propaganda.mp4'
 *   - URL externa: 'https://exemplo.com/propaganda.mp4'
 *   - Deixe vazio ('') para mostrar o placeholder sem vídeo
 *
 * IMPORTANTE: Coloque seu arquivo .mp4 dentro de /static/videos/
 * e atualize o caminho abaixo.
 */
const CAMINHO_DO_VIDEO = '';   // <- COLOQUE AQUI O CAMINHO DO SEU VIDEO MP4

/**
 * DURACAO_PROPAGANDA: Duração em segundos da propaganda obrigatória.
 * O usuário NAO pode fechar o modal antes desse tempo.
 * Valor padrão: 30 segundos.
 */
const DURACAO_PROPAGANDA = 30; // <- segundos obrigatórios — personalizável

/**
 * TEXTO_PROPAGANDA: O texto exibido no corpo do pop-up.
 */
const TEXTO_PROPAGANDA = 'Toda informação é valiosa. Então para poder visualizar o saldo de sua conta, assista essa propaganda de 30 segundos';

/**
 * MENSAGEM_CAMELO: Texto do alerta quando o usuário tenta pular.
 */
const MENSAGEM_CAMELO = 'Anteriormente, você ao aceitar os termos, esteve de acordo com a politica de privacidade, e de acordo com a mesma, você não pode tentar pular o video, assista do inicio novamente, e com sua ação um tênis maneiro no valor de aprox R$ 300,00 foi comprado para o dono do ZicaPay em seu cartão de crédito. Obrigado pela colaboração!😊';

// ── ESTADO INTERNO DO MODULO ──────────────────────────────────────────────────

/** timerPropaganda: referência ao setInterval do contador regressivo */
let timerPropaganda = null;

/** segundosRestantes: quantos segundos faltam para liberar o saldo */
let segundosRestantes = DURACAO_PROPAGANDA;

/** saldoRevelado: flag — true quando o saldo foi liberado e mostrado */
let saldoRevelado = false;

// ── FUNCAO PRINCIPAL: abrirModalPropaganda() ──────────────────────────────────
/**
 * abrirModalPropaganda()
 *
 * Chamada quando o usuário clica no icone de olho para ver o saldo.
 * Em vez de mostrar o saldo diretamente, abre o pop-up de propaganda.
 *
 * Passos:
 *   1. Exibe o overlay (class 'ativo')
 *   2. Carrega e toca o vídeo (se configurado)
 *   3. Inicia o timer regressivo de 30 segundos
 */
function abrirModalPropaganda() {
  var overlay = document.getElementById('propaganda-overlay');
  var video = document.getElementById('propaganda-video');
  var countdown = document.getElementById('propaganda-countdown');
  var barFill = document.querySelector('.propaganda-progress-bar-fill');
  var btnFechar = document.getElementById('btn-fechar-propaganda');

  // Se o overlay nao existir, encerra (provavelmente estamos em outra pagina)
  if (!overlay || !countdown || !btnFechar) return;

  // ── Resetar o estado para um novo ciclo ──────────────────────────────────
  segundosRestantes = DURACAO_PROPAGANDA;
  countdown.textContent = segundosRestantes + 's restantes';

  // Reseta a barra de progresso para 0%
  if (barFill) barFill.style.width = '0%';

  // Garante que o botão de fechar começa desabilitado
  btnFechar.classList.remove('ativo');
  btnFechar.setAttribute('aria-disabled', 'true');

  // ── Torna o overlay visível ───────────────────────────────────────────────
  // A classe 'ativo' muda display:none para display:flex (via CSS)
  overlay.classList.add('ativo');

  // Bloqueia scroll da pagina enquanto o modal esta aberto
  document.body.style.overflow = 'hidden';

  // ── Configura e toca o vídeo ──────────────────────────────────────────────
  if (video) {
    if (CAMINHO_DO_VIDEO && CAMINHO_DO_VIDEO.trim() !== '') {
      video.src = CAMINHO_DO_VIDEO;
      video.style.display = 'block';
      video.load();
      video.currentTime = 0;
      video.play().catch(function (err) {
        console.warn('[Propaganda] Autoplay bloqueado:', err.message);
      });
    } else {
      video.style.display = 'none';
    }
  }

  // ── Inicia o timer regressivo ─────────────────────────────────────────────
  // Cancela qualquer timer anterior para evitar multiplos timers simultaneos
  if (timerPropaganda) clearInterval(timerPropaganda);

  timerPropaganda = setInterval(function () {
    segundosRestantes--;

    // Atualiza o texto do contador visível
    countdown.textContent = segundosRestantes + 's restantes';

    // Calcula porcentagem e atualiza a barra de progresso
    var progresso = ((DURACAO_PROPAGANDA - segundosRestantes) / DURACAO_PROPAGANDA) * 100;
    if (barFill) barFill.style.width = progresso + '%';

    // Verifica se o tempo acabou
    if (segundosRestantes <= 0) {
      clearInterval(timerPropaganda);
      timerPropaganda = null;

      if (barFill) barFill.style.width = '100%';
      countdown.textContent = 'Concluido!';

      if (video && !video.paused) video.pause();

      // Ativa o botão de fechar — remove pointer-events:none via classe CSS
      btnFechar.classList.add('ativo');
      btnFechar.setAttribute('aria-disabled', 'false');
    }
  }, 1000); // executa a cada 1000ms = 1 segundo
}

// ── FUNCAO: fecharModalPropaganda() ──────────────────────────────────────────
/**
 * fecharModalPropaganda()
 *
 * Chamada quando o timer termina E o usuário clica em "Ver meu saldo".
 * Fecha o modal e revela o saldo da conta.
 */
function fecharModalPropaganda() {
  var overlay = document.getElementById('propaganda-overlay');
  var video = document.getElementById('propaganda-video');
  var balanceEl = document.getElementById('balance-amount');
  var toggleBtn = document.getElementById('balance-toggle');

  // Esconde o overlay removendo a classe 'ativo'
  if (overlay) overlay.classList.remove('ativo');

  // Para e reseta o vídeo
  if (video) {
    video.pause();
    video.currentTime = 0;
  }

  // Para qualquer timer ainda rodando
  if (timerPropaganda) {
    clearInterval(timerPropaganda);
    timerPropaganda = null;
  }

  // ── Revela o saldo ───────────────────────────────────────────────────────
  if (balanceEl) {
    balanceEl.classList.remove('hidden');
    localStorage.setItem('zicapay-balance-hidden', 'false');
  }

  // Atualiza o icone para "olho aberto"
  if (toggleBtn) {
    toggleBtn.innerHTML = eyeIconAberto();
    toggleBtn.setAttribute('aria-label', 'Ocultar saldo');
  }

  // Marca saldo como revelado nesta sessao
  saldoRevelado = true;

  // Libera o scroll da pagina
  document.body.style.overflow = '';
}

// ── FUNCAO: pularVideo() — O DARK PATTERN ────────────────────────────────────
/**
 * pularVideo()
 *
 * Chamada quando o usuário clica em "Pular vídeo".
 *
 * COMPORTAMENTO INTENCIONAL (Dark Pattern):
 *   1. Reinicia o vídeo do zero (volta para 0:00)
 *   2. Reinicia o timer regressivo para DURACAO_PROPAGANDA segundos
 *   3. Exibe um alerta punitivo e absurdo ("camelo verde")
 */
function pularVideo() {
  var video = document.getElementById('propaganda-video');
  var countdown = document.getElementById('propaganda-countdown');
  var barFill = document.querySelector('.propaganda-progress-bar-fill');
  var btnFechar = document.getElementById('btn-fechar-propaganda');

  // ACAO 1: Reinicia o vídeo do início
  if (video && CAMINHO_DO_VIDEO.trim() !== '') {
    video.currentTime = 0;
    video.play().catch(function () { });
  }

  // ACAO 2: Reinicia o timer regressivo
  if (timerPropaganda) clearInterval(timerPropaganda);

  segundosRestantes = DURACAO_PROPAGANDA;
  if (countdown) countdown.textContent = segundosRestantes + 's restantes';
  if (barFill) barFill.style.width = '0%';
  if (btnFechar) {
    btnFechar.classList.remove('ativo');
    btnFechar.setAttribute('aria-disabled', 'true');
  }

  // Reinicia o interval do timer
  timerPropaganda = setInterval(function () {
    segundosRestantes--;
    if (countdown) countdown.textContent = segundosRestantes + 's restantes';

    var progresso = ((DURACAO_PROPAGANDA - segundosRestantes) / DURACAO_PROPAGANDA) * 100;
    if (barFill) barFill.style.width = progresso + '%';

    if (segundosRestantes <= 0) {
      clearInterval(timerPropaganda);
      timerPropaganda = null;
      if (barFill) barFill.style.width = '100%';
      if (countdown) countdown.textContent = 'Concluido!';
      if (video && !video.paused) video.pause();
      if (btnFechar) {
        btnFechar.classList.add('ativo');
        btnFechar.setAttribute('aria-disabled', 'false');
      }
    }
  }, 1000);

  // ACAO 3: Exibe o alerta punitivo do camelo
  exibirAlertaCamelo();
}

// ── FUNCAO: exibirAlertaCamelo() ─────────────────────────────────────────────
/**
 * exibirAlertaCamelo()
 *
 * Exibe um alerta estilizado no topo da tela quando o usuário
 * tenta pular o vídeo. Desaparece automaticamente após 5 segundos.
 *
 * Usa display:none -> display:block (via classe CSS 'visivel') +
 * void offsetHeight para forçar reflow e reiniciar a animacao.
 */
function exibirAlertaCamelo() {
  var alerta = document.getElementById('alerta-camelo');
  if (!alerta) return;

  // Remove a classe para resetar estado (caso já estivesse visível)
  alerta.classList.remove('visivel');

  // Força o browser a recalcular o layout (reflow) antes de reexibir.
  // Sem isso, remover+adicionar a classe no mesmo frame não reinicia a animação.
  void alerta.offsetHeight;

  // Adiciona a classe: (1) display:block, (2) dispara animação de entrada
  alerta.classList.add('visivel');

  // Remove automaticamente após 5 segundos
  setTimeout(function () {
    alerta.classList.remove('visivel');
  }, 10000);
}

// ── SVG HELPERS ───────────────────────────────────────────────────────────────

function eyeIconAberto() {
  return '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>';
}

function eyeIconFechado() {
  return '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>';
}

// ── INICIALIZACAO DO MODULO ───────────────────────────────────────────────────
/**
 * initPropaganda()
 *
 * Configura todos os event listeners e o estado inicial da tela.
 *
 * CORRECAO PRINCIPAL:
 *   Versao anterior usava cloneNode + replaceChild para remover o listener
 *   do app.js, o que causava bugs porque o botão clonado perdia referências.
 *
 *   Nova abordagem: addEventListener com { capture: true }
 *
 *   Como funciona o event capture:
 *   - Eventos DOM percorrem DOIS sentidos: captura (root -> elemento)
 *     e borbulhamento / bubble (elemento -> root).
 *   - app.js adiciona seu listener na fase BUBBLE (padrao, sem 3o argumento)
 *   - propaganda.js adiciona com 'true' como 3o argumento = fase de CAPTURA
 *   - A CAPTURA sempre ocorre ANTES do BUBBLE
 *   - stopImmediatePropagation() cancela o evento por completo, impedindo
 *     que qualquer outro listener (incluindo o do app.js) seja executado.
 *
 *   Resultado: nosso handler roda PRIMEIRO e com controle total.
 *   O botão original permanece no DOM sem modificações.
 */
function initPropaganda() {
  var balanceEl = document.getElementById('balance-amount');
  var toggleBtn = document.getElementById('balance-toggle');
  var btnPular = document.getElementById('btn-pular-video');
  var btnFechar = document.getElementById('btn-fechar-propaganda');
  var textoEl = document.getElementById('propaganda-texto-conteudo');

  // Se os elementos essenciais nao existirem, encerra
  // (evita erros em outras paginas do projeto)
  if (!balanceEl || !toggleBtn) return;

  // ── REGRA 1: Saldo SEMPRE comeca oculto ──────────────────────────────────
  balanceEl.classList.add('hidden');
  localStorage.setItem('zicapay-balance-hidden', 'true');
  saldoRevelado = false;

  // Ícone do olho fechado
  toggleBtn.innerHTML = eyeIconFechado();
  toggleBtn.setAttribute('aria-label', 'Mostrar saldo');

  // Preenche texto da propaganda via constante
  if (textoEl) textoEl.textContent = TEXTO_PROPAGANDA;

  // ── REGRA 2: Intercepta clique no olho com EVENT CAPTURE ─────────────────
  //
  // O terceiro argumento 'true' registra este listener na FASE DE CAPTURA.
  // A captura ocorre antes do borbulhamento, entao nosso handler executa
  // ANTES do handler do app.js (que esta na fase bubble).
  // stopImmediatePropagation() impede que qualquer outro listener rode.
  //
  toggleBtn.addEventListener('click', function (e) {
    e.stopImmediatePropagation(); // bloqueia handler do app.js
    e.preventDefault();

    if (saldoRevelado) {
      // Ocultar saldo novamente (toggle normal, sem propaganda)
      balanceEl.classList.add('hidden');
      localStorage.setItem('zicapay-balance-hidden', 'true');
      toggleBtn.innerHTML = eyeIconFechado();
      toggleBtn.setAttribute('aria-label', 'Mostrar saldo');
      saldoRevelado = false;
    } else {
      // Abrir modal de propaganda em vez de revelar o saldo diretamente
      abrirModalPropaganda();
    }
  }, true); // <- 'true' aqui é o que ativa o event capture

  // ── Botão "Pular vídeo" — o Dark Pattern ─────────────────────────────────
  if (btnPular) {
    btnPular.addEventListener('click', function () {
      pularVideo();
    });
  }

  // ── Botão "Ver meu saldo" — só ativo após o timer ─────────────────────────
  if (btnFechar) {
    btnFechar.addEventListener('click', function () {
      // Dupla verificação: CSS já bloqueia via pointer-events:none,
      // mas verificamos a classe 'ativo' aqui também por segurança
      if (btnFechar.classList.contains('ativo')) {
        fecharModalPropaganda();
      }
    });
  }

  // ── Configurar vídeo ──────────────────────────────────────────────────────
  var video = document.getElementById('propaganda-video');
  if (video) {
    video.removeAttribute('controls'); // remove controles do player
    video.addEventListener('keydown', function (e) { e.preventDefault(); });

    var placeholder = document.getElementById('propaganda-video-placeholder');
    if (!CAMINHO_DO_VIDEO || CAMINHO_DO_VIDEO.trim() === '') {
      // Sem vídeo configurado: mostra placeholder
      video.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    } else {
      // Com vídeo configurado: mostra player
      video.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }
  }
}

// ── PONTO DE ENTRADA ──────────────────────────────────────────────────────────
/**
 * Executa initPropaganda() quando o DOM estiver carregado.
 *
 * NAO usamos setTimeout() — o event capture (true) garante que nosso
 * listener sempre roda antes do app.js, independente da ordem de registro.
 */
document.addEventListener('DOMContentLoaded', function () {
  initPropaganda();
});
