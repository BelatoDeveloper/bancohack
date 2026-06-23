/**
 * ============================================================
 * darkPopups.js — Lógica dos 3 Pop-ups Dark UX
 * ============================================================
 *
 * DEPENDÊNCIA: popupsConfig.js deve ser carregado ANTES deste arquivo.
 * Acesso à config: window.DARK_POPUPS_CONFIG (definido em popupsConfig.js)
 *
 * Estrutura:
 *   1. Sistema de Fila (evita sobreposição de popups)
 *   2. Utilitário: botaoFujao() — função compartilhada de fuga do cursor
 *   3. Pop-up 1 — "O Mestre da Fuga" (gatilho: scroll)
 *   4. Pop-up 2 — "O Refém Intelectual" (gatilho: submit do Pix)
 *   5. Pop-up 3 — "A Roleta da Recusa" (gatilho: navegação para /cartoes)
 *   6. Inicialização (DOMContentLoaded)
 */

(function () {
  'use strict';

  // Atalho para a configuração global — tudo vem daqui, nada hardcoded abaixo
  var CFG = window.DARK_POPUPS_CONFIG;

  // ==========================================================================
  // 1. SISTEMA DE FILA — evita que 2 popups apareçam ao mesmo tempo
  // ==========================================================================

  /*
   * FilaPopups: gerencia qual popup está visível no momento.
   *
   * Como funciona:
   *   - Quando um popup quer aparecer, chama FilaPopups.adicionar(fn)
   *   - Se nenhum popup está ativo, ele abre imediatamente
   *   - Se já tem um popup ativo, o novo entra na fila e espera
   *   - Quando um popup fecha, o próximo da fila é chamado automaticamente
   */
  var FilaPopups = {
    fila: [],          // array de funções de abertura pendentes
    aberto: false,     // flag: tem popup na tela agora?

    /**
     * adicionar(fn): enfileira um popup para abertura.
     * @param {Function} fn - função que exibe o popup
     */
    adicionar: function (fn) {
      this.fila.push(fn);
      this.processar();
    },

    /**
     * processar(): verifica se pode abrir o próximo popup da fila.
     * Chamado ao adicionar um popup e ao fechar um popup.
     */
    processar: function () {
      // Se tem popup aberto ou a fila está vazia, não faz nada
      if (this.aberto || this.fila.length === 0) return;

      // Marca como aberto e executa o próximo da fila
      this.aberto = true;
      var proximo = this.fila.shift(); // remove e retorna o primeiro da fila
      proximo();
    },

    /**
     * liberar(): marca o popup atual como fechado e processa o próximo.
     * Deve ser chamado sempre que um popup é fechado.
     */
    liberar: function () {
      this.aberto = false;
      var self = this;
      // Pequeno delay entre popups para não parecer abrupto
      setTimeout(function () {
        self.processar();
      }, CFG.fila.intervaloMinimo);
    },
  };

  // ==========================================================================
  // 2. UTILITÁRIO: botaoFujao() — função compartilhada de fuga do cursor
  // ==========================================================================

  /*
   * botaoFujao(elemento, config, onClique):
   *
   * Faz um elemento HTML fugir do cursor do mouse quando este se aproxima.
   * Também se move autonomamente a cada config.intervaloMovimentoAutonomo ms
   * (garante experiência em mobile, onde não existe cursor).
   *
   * MELHORIA #3: Além do mousemove, adicionamos:
   *   - setInterval de movimento autônomo (configurável)
   *   - touchstart/touchmove para fuga em telas touch
   *
   * @param {HTMLElement} elemento   - o elemento que vai fugir
   * @param {Object}      config     - { distanciaFuga, margem, intervaloMovimentoAutonomo }
   * @param {Function}    onClique   - callback chamado SE o usuário conseguir clicar
   *
   * Retorna uma função limpar() que cancela TODOS os listeners e o setInterval.
   */
  function botaoFujao(elemento, config, onClique) {
    // Distância (px) que ativa a fuga por cursor/toque
    var dist = config.distanciaFuga || 80;
    // Margem mínima das bordas da tela (px)
    var margem = config.margem || 20;
    // Intervalo do movimento autônomo (ms) — vem da config
    var intervaloAuto = config.intervaloMovimentoAutonomo || 2000;

    /**
     * fugirDePonto(pontX, pontY):
     * Função central de cálculo de fuga — usada tanto pelo mousemove
     * quanto pelo touchmove. Calcula a posição oposta ao ponto dado
     * e aplica ao elemento.
     */
    function fugirDePonto(pontX, pontY) {
      var rect = elemento.getBoundingClientRect();

      // Centro atual do elemento na viewport
      var centroX = rect.left + rect.width / 2;
      var centroY = rect.top + rect.height / 2;

      // Distância euclidiana entre o ponto e o centro do elemento
      var deltaX = pontX - centroX;
      var deltaY = pontY - centroY;
      var distancia = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Só foge se o ponto estiver dentro da zona de fuga
      if (distancia < dist && distancia > 0) {
        var fatorFuga = dist * 1.5; // distância de escape

        // Nova posição: oposta ao ponto, a partir do centro atual
        var novoX = centroX - (deltaX / distancia) * fatorFuga;
        var novoY = centroY - (deltaY / distancia) * fatorFuga;

        // Limita para não sair da viewport
        novoX = Math.max(margem, Math.min(window.innerWidth - rect.width - margem, novoX));
        novoY = Math.max(margem, Math.min(window.innerHeight - rect.height - margem, novoY));

        elemento.style.left = novoX + 'px';
        elemento.style.top = novoY + 'px';
        elemento.style.right = 'auto';
        elemento.style.bottom = 'auto';
      }
    }

    /**
     * moverParaPontoAleatorio():
     * Reposiciona o botão em um ponto aleatório da viewport.
     * Chamado pelo setInterval do movimento autônomo (mobile + desktop).
     */
    function moverParaPontoAleatorio() {
      var rect = elemento.getBoundingClientRect();
      var largura = window.innerWidth;
      var altura = window.innerHeight;

      // Gera coordenadas aleatórias dentro dos limites seguros
      var novoX = margem + Math.random() * (largura - rect.width - margem * 2);
      var novoY = margem + Math.random() * (altura - rect.height - margem * 2);

      elemento.style.left = novoX + 'px';
      elemento.style.top = novoY + 'px';
      elemento.style.right = 'auto';
      elemento.style.bottom = 'auto';
    }

    // ── Handler: mousemove (desktop) ───────────────────────────────────────
    function handleMouseMove(e) {
      fugirDePonto(e.clientX, e.clientY);
    }

    // ── Handler: touchstart/touchmove (mobile) ────────────────────────────
    // Usa o primeiro toque para calcular a posição e acionar a fuga.
    function handleTouch(e) {
      if (e.touches && e.touches.length > 0) {
        fugirDePonto(e.touches[0].clientX, e.touches[0].clientY);
      }
    }

    // Registra os listeners de cursor e toque
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouch, { passive: true });
    document.addEventListener('touchmove', handleTouch, { passive: true });

    // ── Movimento autônomo: setInterval que move o botão periodicamente ──
    // Funciona em mobile mesmo sem qualquer interação do usuário.
    // A primeira execução começa imediatamente (sem delay inicial).
    var idIntervalAuto = setInterval(moverParaPontoAleatorio, intervaloAuto);

    // Se foi passado um callback de clique, adiciona o listener
    if (onClique) {
      elemento.addEventListener('click', function (e) {
        // Usuário conseguiu clicar — para tudo e chama o callback
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchstart', handleTouch);
        document.removeEventListener('touchmove', handleTouch);
        clearInterval(idIntervalAuto);
        onClique(e);
      });
    }

    // Retorna função de limpeza: remove TODOS os listeners e o interval
    return function limpar() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('touchmove', handleTouch);
      clearInterval(idIntervalAuto);
    };
  }

  // ==========================================================================
  // 3. POP-UP 1 — "O Mestre da Fuga"
  // ==========================================================================

  var popup1 = (function () {
    var cfg = CFG.popup1;         // config específica do popup 1
    var jaExibido = false;        // flag: popup já foi mostrado nesta sessão?
    var limparFuga = null;        // função de limpeza do botão fujão
    var contagemFugas = 0;        // quantas vezes o texto de recusa fugiu
    var contagemCliques = 0;      // cliques no botão de desafio

    /**
     * posicionarRecusa(): posiciona o texto de recusa no canto inferior-direito.
     * Chamado ao inicializar e ao "resetar" a posição.
     */
    function posicionarRecusaInicial() {
      var recusa = document.getElementById('dp1-recusa');
      if (!recusa) return;
      // Posição inicial: canto inferior direito do banner
      recusa.style.position = 'absolute';
      recusa.style.bottom = '8px';
      recusa.style.right = '12px';
      recusa.style.left = 'auto';
      recusa.style.top = 'auto';
    }

    /**
     * mostrarDesafio(): substitui o botão de recusa pelo mini-desafio
     * de cliques múltiplos. Chamado após maxFugas tentativas.
     */
    function mostrarDesafio() {
      var recusa = document.getElementById('dp1-recusa');
      var desafio = document.getElementById('dp1-desafio');
      var textoBotao = document.getElementById('dp1-texto-desafio');
      var contador = document.getElementById('dp1-contador');

      // Esconde o texto de recusa e mostra o desafio
      if (recusa) recusa.style.display = 'none';
      if (desafio) desafio.style.display = 'block';

      // Preenche o texto do botão com o número de cliques da config
      var textoFinal = cfg.textoBotaoDesafio.replace('{N}', cfg.cliquesNecessarios);
      if (textoBotao) textoBotao.textContent = textoFinal;

      // Reinicia o contador visual
      contagemCliques = 0;
      if (contador) contador.textContent = cfg.cliquesNecessarios;
    }

    /**
     * registrarCliqueDesafio(): chamado a cada clique no botão de desafio.
     * Decrementa o contador. Ao atingir zero, cobra a taxa e fecha o popup.
     */
    function registrarCliqueDesafio() {
      contagemCliques++;
      var restantes = cfg.cliquesNecessarios - contagemCliques;
      var contador = document.getElementById('dp1-contador');

      // Atualiza o contador visual com animação de bounce
      if (contador) {
        contador.textContent = Math.max(0, restantes);
        contador.classList.remove('dp-bounce');
        void contador.offsetHeight; // força reflow para reiniciar a animação
        contador.classList.add('dp-bounce');
      }

      // Verifica se o desafio foi completado
      if (contagemCliques >= cfg.cliquesNecessarios) {
        // Simula cobrança da taxa: mostra mensagem por 2s e fecha
        var msg = cfg.mensagemTaxaCobranca.replace('{TAXA}', cfg.taxaCobranca);
        var desafio = document.getElementById('dp1-desafio');
        if (desafio) {
          desafio.innerHTML = '<p style="color:#FFA500;font-size:0.8rem;font-weight:700;">' + msg + '</p>';
        }
        // Fecha o popup após 2,5 segundos
        setTimeout(function () {
          fechar();
        }, 2500);
      }
    }

    /**
     * fechar(): fecha o popup 1 e libera a fila.
     */
    function fechar() {
      var overlay = document.getElementById('dp1-overlay');
      if (overlay) overlay.classList.remove('dp-ativo');
      if (limparFuga) limparFuga(); // remove listener de fuga
      FilaPopups.liberar();
    }

    /**
     * abrir(): exibe o banner do popup 1.
     * Chamado pela fila quando for a vez do popup 1.
     */
    function abrir() {
      if (!cfg.ativo) { FilaPopups.liberar(); return; }

      var overlay = document.getElementById('dp1-overlay');
      if (!overlay) { FilaPopups.liberar(); return; }

      // Preenche os textos dinâmicos do banner via config
      var el = function (id) { return document.getElementById(id); };
      if (el('dp1-titulo')) el('dp1-titulo').textContent = cfg.tituloBanner;
      if (el('dp1-subtitulo')) el('dp1-subtitulo').textContent = cfg.subtituloBanner;
      if (el('dp1-btn-principal')) el('dp1-btn-principal').textContent = cfg.textoBotaoPrincipal;
      if (el('dp1-recusa')) el('dp1-recusa').textContent = cfg.textoRecusa;

      // Reseta estado interno
      contagemFugas = 0;
      contagemCliques = 0;
      if (el('dp1-desafio')) el('dp1-desafio').style.display = 'none';
      if (el('dp1-recusa')) el('dp1-recusa').style.display = '';
      posicionarRecusaInicial();

      // Exibe o overlay
      overlay.classList.add('dp-ativo');

      // Configura o botão principal (redireciona para a URL de investimentos)
      var btnPrincipal = el('dp1-btn-principal');
      if (btnPrincipal) {
        btnPrincipal.onclick = function () {
          fechar();
          window.location.href = cfg.urlDestinoBotaoPrincipal;
        };
      }

      // ── Lógica de fuga do texto de recusa ──────────────────────────────
      var recusa = el('dp1-recusa');
      if (recusa) {
        // Remove listeners anteriores substituindo por um novo elemento
        var novoRecusa = recusa.cloneNode(true);
        recusa.parentNode.replaceChild(novoRecusa, recusa);
        var recusaAtual = novoRecusa;

        // Adiciona a lógica de fuga ao texto de recusa
        // O texto de recusa está dentro do banner (#dp1-banner) — posição absolute
        recusaAtual.addEventListener('mouseenter', function () {
          if (contagemFugas < cfg.maxFugas) {
            // Ainda pode fugir: calcula nova posição aleatória dentro do banner
            contagemFugas++;
            var banner = document.getElementById('dp1-banner');
            if (!banner) return;

            var bRect = banner.getBoundingClientRect();
            var rRect = recusaAtual.getBoundingClientRect();

            // Posição aleatória dentro do banner (com margem)
            var margemInterna = 8;
            var maxLeft = banner.offsetWidth - rRect.width - margemInterna * 2;
            var maxTop = banner.offsetHeight - rRect.height - margemInterna * 2;

            var novoLeft = margemInterna + Math.random() * Math.max(0, maxLeft - 30);
            var novoTop = margemInterna + Math.random() * Math.max(0, maxTop - 20);

            // Aplica nova posição
            recusaAtual.style.right = 'auto';
            recusaAtual.style.bottom = 'auto';
            recusaAtual.style.left = novoLeft + 'px';
            recusaAtual.style.top = novoTop + 'px';

          } else {
            // Chegou ao limite de fugas: para e mostra o desafio
            mostrarDesafio();
          }
        });
      }

      // Configura o botão de desafio
      var btnDesafio = el('dp1-btn-desafio');
      if (btnDesafio) {
        btnDesafio.onclick = registrarCliqueDesafio;
      }
    }

    /**
     * inicializarGatilho(): registra o listener de scroll que dispara o popup.
     * Chamado uma única vez no DOMContentLoaded.
     */
    function inicializarGatilho() {
      if (!cfg.ativo) return;

      // Só ativa na página do dashboard (verifica se existe o balance-card)
      if (!document.querySelector('.balance-card') && !document.getElementById('balance-amount')) return;

      function verificarScroll() {
        if (jaExibido) {
          // Se já foi exibido, remove o listener para economizar recursos
          window.removeEventListener('scroll', verificarScroll);
          return;
        }

        // Porcentagem do scroll atual em relação à altura total da página
        var scrollAtual = window.scrollY || document.documentElement.scrollTop;
        var alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
        var porcentagem = alturaTotal > 0 ? scrollAtual / alturaTotal : 0;

        // Dispara quando atinge o threshold configurado (ex: 0.4 = 40%)
        if (porcentagem >= cfg.scrollThreshold) {
          jaExibido = true;
          FilaPopups.adicionar(abrir);
        }
      }

      window.addEventListener('scroll', verificarScroll, { passive: true });
    }

    // Expõe apenas a função de inicialização (interface pública)
    return { inicializar: inicializarGatilho };
  })();

  // ==========================================================================
  // 4. POP-UP 2 — "O Refém Intelectual"
  // ==========================================================================

  var popup2 = (function () {
    var cfg = CFG.popup2;
    var timerCaptcha = null;
    var segundosCaptcha = 0;

    function fechar() {
      var overlay = document.getElementById('dp2-overlay');
      if (overlay) overlay.classList.remove('dp-ativo');
      if (timerCaptcha) {
        clearInterval(timerCaptcha);
        timerCaptcha = null;
      }
      FilaPopups.liberar();
    }

    function mostrarUltimato() {
      var captchaArea = document.getElementById('dp2-captcha-area');
      var ultimato = document.getElementById('dp2-ultimato');
      if (captchaArea) captchaArea.style.display = 'none';
      if (ultimato) ultimato.style.display = 'block';
    }

    function iniciarTimer() {
      segundosCaptcha = cfg.tempoCaptcha;
      var barra = document.getElementById('dp2-timer-barra-fill');
      var textoTimer = document.getElementById('dp2-timer-texto');

      if (barra) {
        barra.style.width = '100%';
        barra.classList.remove('dp-critico');
      }
      if (textoTimer) textoTimer.textContent = segundosCaptcha + 's restantes';

      timerCaptcha = setInterval(function () {
        segundosCaptcha--;
        var porcento = (segundosCaptcha / cfg.tempoCaptcha) * 100;
        if (barra) barra.style.width = Math.max(0, porcento) + '%';
        if (textoTimer) textoTimer.textContent = Math.max(0, segundosCaptcha) + 's restantes';
        if (segundosCaptcha <= 5 && barra) barra.classList.add('dp-critico');
        if (segundosCaptcha <= 0) {
          clearInterval(timerCaptcha);
          timerCaptcha = null;
          mostrarUltimato();
        }
      }, 1000);
    }

    /**
     * tocarSomPagamento(): sintetiza o som "cha-ching" via Web Audio API.
     *
     * Por que Web Audio API em vez de <audio>?
     *   - Não depende de nenhum arquivo de som externo no servidor.
     *   - Funciona em qualquer navegador moderno (Chrome, Firefox, Safari, Edge).
     *   - O som é gerado na hora com osciladores, como um sintetizador.
     *   - Como é disparado a partir de um clique do usuário, está dentro
     *     das políticas de autoplay — nenhum bloqueio de áudio.
     *
     * Como funciona:
     *   1. Cria um AudioContext (o "motor" de áudio do browser)
     *   2. Cria um GainNode (controla o volume geral)
     *   3. Toca dois osciladores em sequência: nota grave (o "cha") +
     *      nota aguda (o "ching") — simulando caixa registradora
     *   4. Usa envelope de volume (attack rápido + decay) para soar natural
     *      em vez de um bipe quadrado e agressivo
     */
    function tocarSomPagamento() {
      var cfgSom = cfg.somPagamento;
      // Se o som estiver desativado na config, sai imediatamente
      if (!cfgSom || !cfgSom.ativo) return;

      // Tenta criar o AudioContext — pode falhar em ambientes muito restritos
      try {
        // AudioContext é compatível com todos os browsers modernos
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return; // browser antigo sem suporte

        var ctx = new AudioCtx();

        /**
         * tocarNota(frequencia, inicioSeg, duracaoSeg):
         * Toca uma única nota com envelope suave (attack/decay).
         *
         * @param {number} frequencia  - Hz da nota (ex: 800 = nota grave)
         * @param {number} inicioSeg   - quando começa, em segundos a partir de agora
         * @param {number} duracaoSeg  - quanto tempo dura a nota (em segundos)
         */
        function tocarNota(frequencia, inicioSeg, duracaoSeg) {
          // Oscilador: gera a onda sonora na frequência desejada
          var osc = ctx.createOscillator();
          osc.type = 'sine'; // sine = tom puro, suave — melhor que 'square' (agressivo)
          osc.frequency.setValueAtTime(frequencia, ctx.currentTime + inicioSeg);

          // GainNode: envelope de volume para a nota individual
          var gain = ctx.createGain();
          var tInicio = ctx.currentTime + inicioSeg;
          var tFim = tInicio + duracaoSeg;

          // Attack quase instantâneo: sobe de 0 para volume configurado em 5ms
          gain.gain.setValueAtTime(0, tInicio);
          gain.gain.linearRampToValueAtTime(cfgSom.volume, tInicio + 0.005);

          // Decay: cai gradualmente até 0 ao final da nota
          gain.gain.linearRampToValueAtTime(0, tFim);

          // Conecta oscilador → gain → saída de áudio (speakers/fone)
          osc.connect(gain);
          gain.connect(ctx.destination);

          // Inicia e para no tempo calculado
          osc.start(tInicio);
          osc.stop(tFim);
        }

        // Converte ms para segundos (AudioContext usa segundos)
        var nota1Dur = (cfgSom.duracaoNota1 || 120) / 1000;
        var nota2Dur = (cfgSom.duracaoNota2 || 200) / 1000;
        var delayEntre = (cfgSom.delayEntreNotas || 80) / 1000;

        // Toca nota 1 imediatamente (o "cha")
        tocarNota(cfgSom.nota1Hz || 800, 0, nota1Dur);

        // Toca nota 2 após o delay (o "ching")
        tocarNota(cfgSom.nota2Hz || 1200, nota1Dur + delayEntre, nota2Dur);

        // AudioContext se auto-fecha quando as notas terminam
        // (o GC cuida disso — não precisamos fechar manualmente)

      } catch (e) {
        // Se Web Audio falhar por qualquer motivo, falha silenciosamente
        // O popup continua funcionando normalmente, só sem som
        console.warn('[ZicaPay] Web Audio API indisponível:', e.message);
      }
    }

    /**
     * animarPixVoando(): mostra a tela de "pagamento confirmado" com
     * animação visual (emoji voando) + som de caixa registradora,
     * e fecha o popup após cfg.duracaoAnimacaoPagamento ms.
     *
     * Chamado quando o usuário clica em "Pagar a Taxa de Desinteresse".
     *
     * Por que o truque do reflow (void offsetHeight)?
     *   Quando mudamos display de 'none' para 'flex' e em seguida
     *   adicionamos uma classe com animation, o browser pode otimizar
     *   as duas operações em um único paint — ignorando o estado
     *   "sem animação" e pulando direto para o estado final.
     *   O void offsetHeight força o browser a CALCULAR o layout antes
     *   de adicionar a classe, garantindo que a animação sempre
     *   rode do início (frame 0%) em vez de aparecer já no final.
     */
    function animarPixVoando() {
      var ultimato = document.getElementById('dp2-ultimato');
      var pixVoando = document.getElementById('dp2-pix-voando');
      var pixEmoji = document.getElementById('dp2-pix-emoji');
      var msgEl = document.getElementById('dp2-msg-pix');

      // Esconde o ultimato
      if (ultimato) ultimato.style.display = 'none';

      if (pixVoando && pixEmoji) {
        // Passo 1: remove qualquer estado de animação anterior
        // (caso o popup seja aberto mais de uma vez na sessão)
        pixEmoji.classList.remove('dp-animar');

        // Passo 2: torna o container visível (display:flex para o layout centralizar)
        pixVoando.style.display = 'flex';

        // Passo 3: força o browser a recalcular o layout ANTES de adicionar
        // a classe de animação — o "truque do reflow".
        // void: descarta o valor retornado (evita lint warning de "unused expression")
        void pixEmoji.offsetHeight;

        // Passo 4: adiciona a classe que dispara a animation CSS
        // Agora o browser tem certeza que estamos no frame 0% da animação
        pixEmoji.classList.add('dp-animar');

        // Preenche a mensagem irônica com o valor da taxa da config
        if (msgEl) {
          msgEl.textContent = cfg.mensagemPosPagamento.replace('{TAXA}', cfg.taxaDesinteresse);
        }
      }

      // ── Dispara o som de pagamento ────────────────────────────────────────
      // Chamado IMEDIATAMENTE, no mesmo momento em que a animação visual começa.
      // Como é disparado a partir do clique no botão, o browser permite o áudio
      // (política de autoplay: o usuário interagiu com a página).
      tocarSomPagamento();

      // ── Fecha o popup após a animação completa ────────────────────────────
      // Lê o tempo do config — padrão 3500ms para dar tempo de ver + ouvir.
      setTimeout(function () {
        fechar();
      }, cfg.duracaoAnimacaoPagamento || 3500);
    }

    function animarLinkedIn() {
      var sim = document.getElementById('dp2-linkedin-sim');
      if (sim) {
        sim.style.display = 'block';
        sim.textContent = cfg.textoLinkedIn;
      }
      setTimeout(function () { fechar(); }, 4000);
    }

    function abrir() {
      if (!cfg.ativo) { FilaPopups.liberar(); return; }
      var overlay = document.getElementById('dp2-overlay');
      if (!overlay) { FilaPopups.liberar(); return; }

      var captchaArea = document.getElementById('dp2-captcha-area');
      var ultimato = document.getElementById('dp2-ultimato');
      var pixVoando = document.getElementById('dp2-pix-voando');
      var linkedinSim = document.getElementById('dp2-linkedin-sim');
      var input = document.getElementById('dp2-input-captcha');

      if (captchaArea) captchaArea.style.display = 'block';
      if (ultimato) ultimato.style.display = 'none';
      if (pixVoando) pixVoando.style.display = 'none';
      if (linkedinSim) linkedinSim.style.display = 'none';
      if (input) input.value = '';

      // Remove a classe de animação do emoji — garante estado limpo na reabertura
      // (sem isso, o emoji poderia estar no estado "final" da animação anterior:
      // posição deslocada + transparente — e não apareceria corretamente)
      var pixEmoji = document.getElementById('dp2-pix-emoji');
      if (pixEmoji) pixEmoji.classList.remove('dp-animar');


      var el = function (id) { return document.getElementById(id); };
      if (el('dp2-titulo-cdb')) el('dp2-titulo-cdb').textContent = cfg.tituloCDB;
      if (el('dp2-subtitulo-cdb')) el('dp2-subtitulo-cdb').textContent = cfg.subtituloCDB;
      if (el('dp2-rodape-cdb')) el('dp2-rodape-cdb').textContent = cfg.rodapeCDB;
      if (el('dp2-pergunta')) el('dp2-pergunta').textContent = cfg.perguntaCaptcha;
      if (input) input.placeholder = cfg.placeholderCaptcha;
      if (el('dp2-btn-investir')) el('dp2-btn-investir').textContent = cfg.botaoUltimato1;
      if (el('dp2-btn-linkedin')) el('dp2-btn-linkedin').textContent = cfg.botaoUltimato2;
      if (el('dp2-btn-pagar')) el('dp2-btn-pagar').textContent = cfg.botaoUltimato3 + ' (' + cfg.taxaDesinteresse + ')';

      overlay.classList.add('dp-ativo');
      iniciarTimer();
    }

    function configurarBotoes() {
      var btnInvestir = document.getElementById('dp2-btn-investir');
      var btnLinkedIn = document.getElementById('dp2-btn-linkedin');
      var btnPagar = document.getElementById('dp2-btn-pagar');

      if (btnInvestir) {
        btnInvestir.addEventListener('click', function () {
          fechar();
          window.location.href = '/pix';
        });
      }
      if (btnLinkedIn) btnLinkedIn.addEventListener('click', animarLinkedIn);
      if (btnPagar) btnPagar.addEventListener('click', animarPixVoando);
    }

    /**
     * inicializarGatilho(): detecta se entramos na página de Pix
     * (pela existência do formulário) e dispara o popup direto,
     * sem esperar nenhum submit.
     */
    function inicializarGatilho() {
      if (!cfg.ativo) return;

      var form = document.getElementById(cfg.formPixId);
      if (!form) return; // não é a página de Pix

      configurarBotoes();

      setTimeout(function () {
        FilaPopups.adicionar(abrir);
      }, cfg.delayEntrada || 0);
    }

    return { inicializar: inicializarGatilho };
  })();

  // ==========================================================================
  // 5. POP-UP 3 — "A Roleta da Recusa"
  // ==========================================================================

  var popup3 = (function () {
    var cfg = CFG.popup3;
    var nivelAtual = 0;          // índice do nível atual (0 a 5)
    var limparFuga = null;       // função de limpeza do botão fujão (nível 6)
    var girando = false;         // flag: roleta está animando?
    var aceitando = false;       // flag: chamada de aceitar em andamento?

    /**
     * fechar(): fecha o popup 3, limpa listeners e libera a fila.
     * O usuário SÓ chega aqui se conseguir clicar no botão fujão do nível 6.
     */
    function fechar() {
      var overlay = document.getElementById('dp3-overlay');
      var btnFujao = document.getElementById('dp3-btn-sem-cartao');

      if (overlay) overlay.classList.remove('dp-ativo');
      if (btnFujao) {
        btnFujao.classList.remove('dp-ativo');
        btnFujao.style.left = '';
        btnFujao.style.top = '';
      }
      if (limparFuga) {
        limparFuga();
        limparFuga = null;
      }
      FilaPopups.liberar();
      window.location.href = '/cartoes';
    }

    /**
     * aceitarCartao(): chamado quando o usuário clica em "QUERO ESTE CARTÃO!".
     * 1. Chama /api/cards/aceitar para debitar a anuidade
     * 2. Salva no localStorage para suprimir o popup nas próximas visitas
     * 3. Mostra tela de confirmação com os detalhes do "golpe"
     * 4. Redireciona para /cartoes após alguns segundos
     */
    function aceitarCartao() {
      if (aceitando) return;
      aceitando = true;

      var nivel = cfg.niveis[nivelAtual];
      var botoes = document.getElementById('dp3-botoes-wrapper');
      var confirmacao = document.getElementById('dp3-confirmacao');
      var confTitulo = document.getElementById('dp3-confirmacao-titulo');
      var confTexto = document.getElementById('dp3-confirmacao-texto');
      var confAviso = document.getElementById('dp3-confirmacao-aviso');
      var slotContainer = document.getElementById('dp3-slot-container');

      // Esconde os botões enquanto processa
      if (botoes) botoes.style.opacity = '0.4';

      // Chama a API para debitar a anuidade
      fetch('/api/cards/aceitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nivel.nome,
          anuidade: nivel.anuidade,
        }),
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        // Salva no localStorage para não mostrar o popup de novo
        var mesesEntrega = Math.floor(Math.random() * 4) + 3; // 3 a 6 meses
        localStorage.setItem('zicapay_cartao_aceito', JSON.stringify({
          nome: nivel.nome,
          anuidade: nivel.anuidade,
          meses: mesesEntrega,
          data: new Date().toLocaleDateString('pt-BR'),
        }));

        // Esconde o slot container e botões, mostra confirmação
        if (slotContainer) slotContainer.style.display = 'none';
        if (botoes) botoes.style.display = 'none';
        if (confirmacao) confirmacao.style.display = 'block';

        // Preenche os textos de confirmação
        if (confTitulo) confTitulo.textContent = '🎉 ' + nivel.nome + ' solicitado!';
        if (confTexto) {
          confTexto.innerHTML =
            '<strong>Anuidade debitada:</strong> ' + nivel.anuidade + '<br>' +
            '<strong>Prazo de entrega:</strong> ' + mesesEntrega + ' meses úteis<br>' +
            '<strong>Entrega via:</strong> Sedex Não-Rastreável® ZicaPay';
        }
        if (confAviso) {
          confAviso.textContent =
            'Em caso de não recebimento, taxa de re-emissão de R$ 189,90. ' +
            'O valor da anuidade nao e reembolsavel. Obrigado por confiar no ZicaPay!';
        }

        // Redireciona para /cartoes após 4 segundos
        setTimeout(function() {
          var overlay = document.getElementById('dp3-overlay');
          if (overlay) overlay.classList.remove('dp-ativo');
          FilaPopups.liberar();
          window.location.href = '/cartoes';
        }, 4500);
      })
      .catch(function() {
        // Mesmo se a API falhar, salva localmente e mostra confirmação
        aceitando = false;
        if (botoes) botoes.style.opacity = '1';
      });
    }

    /**
     * atualizarIndicadorNiveis(): atualiza as bolinhas indicadoras de nível.
     * Bolinha verde = nível atual, cinza escuro = passado, cinza = futuro.
     */
    function atualizarIndicadorNiveis() {
      var dots = document.querySelectorAll('.dp3-nivel-dot');
      dots.forEach(function (dot, i) {
        dot.classList.remove('dp-atual', 'dp-passado');
        if (i === nivelAtual) {
          dot.classList.add('dp-atual');
        } else if (i < nivelAtual) {
          dot.classList.add('dp-passado');
        }
      });
    }

    /**
     * mostrarNivel(n): anima a roleta e exibe as informações do nível n.
     * A animação simula um slot machine girando.
     * @param {number} n - índice do nível (0 a 5)
     */
    function mostrarNivel(n) {
      if (girando) return; // evita duplo clique durante animação
      girando = true;

      var nivel = cfg.niveis[n];
      var container = document.getElementById('dp3-slot-container');
      var emoji = document.getElementById('dp3-card-emoji');
      var nome = document.getElementById('dp3-card-nome');
      var anuidade = document.getElementById('dp3-card-anuidade');
      var humilhacao = document.getElementById('dp3-card-humilhacao');
      var btnRecusar = document.getElementById('dp3-btn-recusar');
      var btnFujao = document.getElementById('dp3-btn-sem-cartao');
      var carteiraVazia = document.getElementById('dp3-carteira-vazia');
      var nivelTexto = document.getElementById('dp3-nivel-texto');

      // ── BUG FIX #1 — Esconde AMBOS os botões antes de começar o giro ────
      // Garante que nenhum botão fica visível durante a animação da roleta.
      // Eles só voltam a aparecer dentro do setTimeout, após os dados serem
      // preenchidos na tela — exatamente quando devem ser clicados.
      if (btnRecusar) btnRecusar.style.display = 'none';
      if (btnFujao) btnFujao.classList.remove('dp-ativo');

      // Atualiza o texto de nível no cabeçalho (ex: "Nível 2 de 6")
      if (nivelTexto) nivelTexto.textContent = 'Nível ' + (n + 1) + ' de ' + cfg.niveis.length;

      // Inicia a animação de giro no emoji
      if (emoji) emoji.classList.add('dp-girando');

      // Durante a animação, embaralha emojis rapidamente (efeito slot machine)
      var emojisSlot = ['💳', '🎰', '💎', '🥇', '🏦', '💸', '🎢', '⭐'];
      var idxEmoji = 0;
      var intervalEmoji = setInterval(function () {
        if (emoji) emoji.textContent = emojisSlot[idxEmoji % emojisSlot.length];
        idxEmoji++;
      }, 80); // troca de emoji a cada 80ms — efeito de roleta

      // Após a duração configurada, para a animação e mostra o nível real
      setTimeout(function () {
        clearInterval(intervalEmoji);
        girando = false;

        if (emoji) {
          emoji.classList.remove('dp-girando');
          emoji.textContent = nivel.emoji;
        }

        // Preenche as informações do nível atual
        if (nome) nome.textContent = nivel.nome;
        if (anuidade) {
          anuidade.textContent = nivel.anuidade;
          anuidade.style.color = nivel.corDestaque;
        }
        if (humilhacao) humilhacao.textContent = nivel.humilhacao;

        // ── MELHORIA #4 — Visual de cartão realista ──────────────────────
        // Atualiza o número do cartão (4 dígitos finais aleatórios por revelação)
        var numFinal = document.getElementById('dp3-card-numero');
        if (numFinal) {
          // Gera 4 dígitos aleatórios para simular o número final do cartão
          var digitos = Math.floor(1000 + Math.random() * 9000);
          numFinal.textContent = '•••• •••• •••• ' + digitos;
        }

        // Cor de destaque aplicada ao chip (identidade visual por nível)
        var chip = document.getElementById('dp3-card-chip');
        if (chip) chip.style.borderColor = nivel.corDestaque;

        // Fundo do container — agora fixo em verde (identidade do app)
        // A cor de destaque do nível ainda diferencia visualmente no texto
        if (container) {
          container.style.background = 'linear-gradient(135deg, #0E9F4B 0%, #0a7a39 100%)';
        }

        // Atualiza o indicador de nível
        atualizarIndicadorNiveis();

        // ── Lógica especial do nível 6 (degrau final) ─────────────────────
        if (nivel.carteiraVazia) {
          // Mostra a carteira vazia piscando em vermelho
          if (carteiraVazia) carteiraVazia.classList.add('dp-ativo');

          // Nenhum botão de recusa normal — esconde e mostra o fujão
          if (btnRecusar) btnRecusar.style.display = 'none';

          if (btnFujao) {
            // Posiciona o botão fujão inicialmente abaixo do modal
            var modalRect = document.getElementById('dp3-modal').getBoundingClientRect();
            btnFujao.style.left = (modalRect.left + modalRect.width / 2 - 80) + 'px';
            btnFujao.style.top = (modalRect.bottom - 50) + 'px';
            btnFujao.textContent = nivel.textoBotaoFinal;
            btnFujao.classList.add('dp-ativo');

            // Ativa a lógica de fuga do cursor + movimento autônomo
            // usando a função utilitária botaoFujao() (shared utility)
            limparFuga = botaoFujao(
              btnFujao,
              cfg.botaoFujao,
              function () {
                // Usuário conseguiu clicar no botão fugão — fecha o popup
                fechar();
              }
            );
          }

        } else {
          // Nível normal: remove carteira vazia e botão fujão
          if (carteiraVazia) carteiraVazia.classList.remove('dp-ativo');
          if (btnFujao) btnFujao.classList.remove('dp-ativo');

          // ── BUG FIX #2 — Habilita o botão de recusa com delay ──────────
          // NÃO mostra o botão imediatamente após revelar o cartão.
          // Aguarda cfg.delayHabilitarBotaoRecusa ms, que força o usuário a
          // ler a "humilhação" antes de poder recusar — e elimina o bug de
          // double-click, pois o botão fica invisível durante o delay.
          // A verificação !girando garante que o nível não avançou em paralelo.
          setTimeout(function () {
            if (!girando && btnRecusar) {
              btnRecusar.style.display = 'block';
              btnRecusar.textContent = nivel.textoRecusa;
            }
          }, cfg.delayHabilitarBotaoRecusa || 1500);
        }


      }, cfg.duracaoRoleta);
    }

    /**
     * avancarNivel(): avança para o próximo nível e gira a roleta.
     * Chamado quando o usuário clica no botão de recusa.
     *
     * BUG FIX #2: Além da flag 'girando' em mostrarNivel(),
     * avancarNivel() agora também verifica 'girando' ANTES de incrementar
     * nivelAtual. Isso impede que cliques rápidos avançcem o contador interno
     * mesmo quando a animação ainda está rodando.
     */
    function avancarNivel() {
      // BUG FIX #2a: bloqueia se a roleta ainda está girando
      if (girando) return;

      if (nivelAtual < cfg.niveis.length - 1) {
        nivelAtual++;
        mostrarNivel(nivelAtual);
      }
    }

    /**
     * abrir(): exibe o popup 3 começando pelo nível 1.
     * Chamado pela fila quando for a vez do popup 3.
     */
    function abrir() {
      if (!cfg.ativo) { FilaPopups.liberar(); return; }

      var overlay = document.getElementById('dp3-overlay');
      if (!overlay) { FilaPopups.liberar(); return; }

      // Reseta para o nível inicial
      nivelAtual = 0;
      if (limparFuga) { limparFuga(); limparFuga = null; }

      // Exibe o overlay
      overlay.classList.add('dp-ativo');

      // Inicia com o nível 1 (gira a roleta)
      mostrarNivel(0);
    }

    /**
     * configurarBotoes(): registra listeners do botão de recusa e do botão aceitar.
     * Chamado uma vez — os botões são os mesmos durante toda a sequência de níveis.
     */
    function configurarBotoes() {
      var btnRecusar = document.getElementById('dp3-btn-recusar');
      if (btnRecusar) {
        btnRecusar.addEventListener('click', avancarNivel);
      }
      var btnAceitar = document.getElementById('dp3-btn-aceitar');
      if (btnAceitar) {
        btnAceitar.addEventListener('click', aceitarCartao);
      }
    }

    /**
     * inicializarGatilho(): intercepta cliques em links que levam para /cartoes.
     *
     * Estratégia: usa event delegation no document com capture:true.
     * Ao clicar em qualquer elemento que corresponda ao seletor de gatilho,
     * cancela a navegação e abre o popup.
     */
    function inicializarGatilho() {
      if (!cfg.ativo) return;

      // Configura os botões internos do popup (feito uma única vez)
      configurarBotoes();

      /*
       * Event delegation com capture:true:
       * - 'capture:true' garante que capturamos o evento antes de qualquer
       *   handler de navegação padrão do browser ou do app.js
       * - SE o usuário já aceitou um cartão (localStorage), deixa navegar normalmente.
       */
      document.addEventListener('click', function (e) {
        var alvo = e.target;
        while (alvo && alvo !== document) {
          var href = alvo.getAttribute ? alvo.getAttribute('href') : null;
          var id = alvo.id;

          var eGatilho = (href && href.includes('/cartoes')) ||
            (id === 'action-cartoes') ||
            (id === 'nav-cartoes');

          if (eGatilho) {
            // ── Se já aceitou um cartão, NÃO mostra o popup — navega direto ──
            // Usa window.ZICAPAY_ESTADO (injetado pelo Flask) em vez de localStorage,
            // eliminando state leakage entre contas no mesmo browser.
            var temPedido = window.ZICAPAY_ESTADO && window.ZICAPAY_ESTADO.cartaoPedido;
            if (temPedido) {
              // Tem pedido server-side: navega diretamente sem popup
              return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            FilaPopups.adicionar(abrir);
            return;
          }
          alvo = alvo.parentElement;
        }
      }, true); // capture:true — intercepta antes da navegação
    }

    return { inicializar: inicializarGatilho };
  })();

  // ==========================================================================
  // 6. INICIALIZAÇÃO — DOMContentLoaded
  // ==========================================================================

  /*
   * Aguarda o DOM estar completamente carregado antes de inicializar.
   * Todos os popups registram seus gatilhos aqui.
   * Os elementos HTML dos popups (overlays, modais) são gerados em base.html.
   */
  document.addEventListener('DOMContentLoaded', function () {
    // Inicializa cada popup — apenas registra gatilhos, não abre nada ainda
    popup1.inicializar();
    popup2.inicializar();
    popup3.inicializar();
  });

})(); // IIFE — encapsula tudo para não poluir o escopo global
