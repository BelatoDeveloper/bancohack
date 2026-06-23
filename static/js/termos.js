/**
 * ============================================================================
 * termos.js — ZicaPay "Scroll of Doom"
 * Lógica maldosa dos checkboxes + validação agressiva de erro
 *
 * ESTRUTURA DO ARQUIVO:
 * 1. Estado global e seletores
 * 2. Configuração dos checkboxes especiais (inicialização)
 * 3. CB4  — "Aqui primeiro!" (deve ser marcado antes dos outros)
 * 4. CB7  — "Não marque este" (resiste às marcações, cede no 2º clique)
 * 5. CB12 — "Ladrão de foco" (sobe scroll ao ser marcado)
 * 6. CB16 — "O Invertido" (desmarca outro aleatório ao ser marcado)
 * 7. CB19 — "Relâmpago" (timer regressivo para confirmar)
 * 8. Atualização do progresso (contador + barra)
 * 9. Botão "desmarcar tudo" (verde, mas faz coisa ruim)
 * 10. Botão "pronto" (vermelho, mas avança) + validação
 * 11. Animação de erro agressiva
 * 12. Inicialização
 *
 * PARA ADICIONAR NOVO CHECKBOX ESPECIAL:
 * a) Adicione o HTML no termos.html com data-special="meu-tipo"
 * b) Crie uma função configurarCheckboxMeuTipo() aqui
 * c) Chame-a em inicializar() abaixo
 * ============================================================================
 */

'use strict';

// ════════════════════════════════════════════════════════════════════════════
// 1. ESTADO GLOBAL E SELETORES
// ════════════════════════════════════════════════════════════════════════════

/** Estado do checkbox especial CB4 — controla se foi marcado "primeiro" */
const ESTADO = {
  cb4MarcadoPrimeiro: false,      // true quando CB4 foi o primeiro a ser marcado
  cb7Tentativas: 0,               // quantas vezes o usuário tentou marcar CB7
  cb7Confirmado: false,           // true quando CB7 foi marcado de forma "mágica"
  cb19Timer: null,                // referência do setTimeout do relâmpago
  cb19Confirmado: false,          // true quando o usuário confirmou no prazo
  erroAtivo: false,               // impede múltiplos overlays de erro
  totalObrigatorios: 20,          // total de checkboxes que devem ser marcados
};

/** Pega todos os checkboxes obrigatórios de uma vez */
const pegarTodosCbs = () =>
  Array.from(document.querySelectorAll('.termos-cb[data-required="true"]'));

/** Pega apenas os checkboxes marcados */
const pegarMarcados = () => pegarTodosCbs().filter(cb => cb.checked);

/** Pega checkboxes marcados excluindo os "especiais problemáticos" */
const pegarMarcadosNormais = () =>
  pegarMarcados().filter(cb => cb.id !== 'cb4' && cb.id !== 'cb7');

// Referências aos elementos da UI
const scrollContainer = document.getElementById('scroll-doom');
const cbCount = document.getElementById('cb-count');
const progressoFill = document.getElementById('progresso-fill');
const progressoEmoji = document.getElementById('progresso-emoji');
const erroOverlay = document.getElementById('erro-overlay');
const erroMensagem = document.getElementById('erro-mensagem');
const erroFaltam = document.getElementById('erro-faltam');


// ════════════════════════════════════════════════════════════════════════════
// 2. CONFIGURAÇÃO DOS CHECKBOXES ESPECIAIS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Ponto de entrada para configurar todos os comportamentos anômalos.
 * Adicione novas chamadas aqui ao criar novos checkboxes especiais.
 */
function configurarCheckboxesEspeciais() {
  configurarCheckboxPrimeiro();   // CB4
  configurarCheckboxNaoMarcar();  // CB7
  configurarCheckboxScroll();     // CB12
  configurarCheckboxInvertido();  // CB16
  configurarCheckboxRelampa();    // CB19
}


// ════════════════════════════════════════════════════════════════════════════
// 3. CB4 — "AQUI PRIMEIRO!"
//
// REGRA: O usuário DEVE marcar o CB4 antes de qualquer outro checkbox.
// COMPORTAMENTO: se outro checkbox for marcado antes do CB4:
//   → O item marcado é desmarcado imediatamente com uma animação de shake.
//   → Um aviso inline aparece: "Marque o item 4 PRIMEIRO!"
//
// Se o usuário tentar avançar sem ter marcado o CB4 antes dos outros:
//   → Todos os checkboxes são desmarcados com efeito cascata.
//
// PARA MODIFICAR: altere a mensagem em 'avisoMsg' abaixo.
// ════════════════════════════════════════════════════════════════════════════

function configurarCheckboxPrimeiro() {
  const cb4 = document.getElementById('cb4');

  // Quando CB4 é marcado: registra que foi marcado "primeiro"
  // (não importa a ordem real, só serve para liberar os outros)
  cb4.addEventListener('change', function () {
    if (this.checked) {
      ESTADO.cb4MarcadoPrimeiro = true;
      // Flash de sucesso no wrapper
      const wrapper = document.getElementById('cb4-wrapper');
      wrapper.classList.add('success-flash');
      setTimeout(() => wrapper.classList.remove('success-flash'), 600);
    } else {
      // Se desmarcar o CB4, revoga a permissão e desmarca todos os outros
      ESTADO.cb4MarcadoPrimeiro = false;
      pegarTodosCbs().forEach(cb => {
        if (cb.id !== 'cb4') cb.checked = false;
      });
      atualizarProgresso();
    }
  });

  // Intercepta TODOS os outros checkboxes para verificar se CB4 foi marcado antes
  pegarTodosCbs().forEach(cb => {
    if (cb.id === 'cb4') return; // pula o próprio CB4

    cb.addEventListener('change', function (e) {
      // Se CB4 ainda não foi marcado e o usuário tenta marcar outro:
      if (!ESTADO.cb4MarcadoPrimeiro && this.checked) {
        e.preventDefault();
        this.checked = false; // reverte

        // Anima o item com shake para indicar "não pode ainda"
        const item = this.closest('.checkbox-item');
        item.classList.add('shake');
        setTimeout(() => item.classList.remove('shake'), 500);

        // Mostra aviso inline temporário
        mostrarAvisoInline(item, '⚠️ Marque o item 4 PRIMEIRO antes de qualquer outro!');

        // Sobe o scroll para mostrar o CB4
        const cb4Wrapper = document.getElementById('cb4-wrapper');
        cb4Wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

/**
 * Exibe uma mensagem de aviso inline abaixo de um checkbox-item.
 * Remove automaticamente após 2.5 segundos.
 * @param {HTMLElement} item - O .checkbox-item onde o aviso será inserido
 * @param {string} msg - Texto do aviso
 */
function mostrarAvisoInline(item, msg) {
  // Remove aviso anterior se existir
  const existente = item.querySelector('.aviso-inline');
  if (existente) existente.remove();

  const aviso = document.createElement('span');
  aviso.className = 'aviso-inline';
  aviso.textContent = msg;
  item.appendChild(aviso);

  setTimeout(() => {
    if (aviso.parentNode) aviso.remove();
  }, 2500);
}


// ════════════════════════════════════════════════════════════════════════════
// 4. CB7 — "NÃO MARQUE ESTE"
//
// REGRA: O checkbox pede para NÃO ser marcado, mas é obrigatório para avançar.
// COMPORTAMENTO:
//   - 1ª tentativa de marcar: desmarca e mostra aviso ("Você não pode marcar!")
//   - 2ª tentativa de marcar: desmarca de novo e mostra "Tentei te avisar..."
//   - Após 1.5s: marca SOZINHO com uma mensagem "Ok, você ganhou. Marquei pra você."
//
// PARA MODIFICAR: altere o número de tentativas em ESTADO.cb7Tentativas,
// ou mude os textos dos avisos abaixo.
// ════════════════════════════════════════════════════════════════════════════

function configurarCheckboxNaoMarcar() {
  const cb7 = document.getElementById('cb7');
  const wrapper = document.getElementById('cb7-wrapper');

  // Inicializa o estado se ainda não existir (caso não esteja declarado em outro lugar)
  if (typeof ESTADO === 'undefined') {
    window.ESTADO = { cb7Tentativas: 0, cb7Confirmado: false };
  }

  cb7.addEventListener('change', function (e) {
    // 1. LÓGICA DO BLOQUEIO FINAL (Impede de desmarcar)
    if (ESTADO.cb7Confirmado) {
      // Se o usuário tentar desmarcar (this.checked === false), nós forçamos a voltar para true
      if (!this.checked) {
        this.checked = true;

        // Efeito visual de negação e mensagem irônica
        wrapper.classList.add('shake');
        setTimeout(() => wrapper.classList.remove('shake'), 500);
        mostrarAvisoInline(wrapper, '🔒 Tarde demais! Agora vai ficar marcado pra sempre! ou você pode desmarcar tudo 😈');
      }
      return; // Sai da função
    }

    // 2. LÓGICA DAS TENTATIVAS INICIAIS
    if (this.checked) {
      this.checked = false; // Desmarca imediatamente nas primeiras tentativas
      ESTADO.cb7Tentativas++;

      if (ESTADO.cb7Tentativas === 1) {
        // Primeira tentativa: aviso simples
        wrapper.classList.add('shake');
        setTimeout(() => wrapper.classList.remove('shake'), 500);
        mostrarAvisoInline(wrapper, '🚫 Você não pode marcar este! É proibido!');

      } else if (ESTADO.cb7Tentativas >= 2) {
        // Segunda tentativa: aviso de rendição + marca sozinho após delay
        wrapper.classList.add('shake');
        setTimeout(() => wrapper.classList.remove('shake'), 500);
        mostrarAvisoInline(wrapper, '😤 Tentei te avisar... aguarda 1 segundo...');

        // Marca sozinho após 1.5s e trava
        setTimeout(() => {
          if (!ESTADO.cb7Confirmado) {
            ESTADO.cb7Confirmado = true;
            cb7.checked = true; // Marca de verdade

            wrapper.classList.add('success-flash');
            setTimeout(() => wrapper.classList.remove('success-flash'), 600);

            // Avisa que agora o caminho não tem volta
            mostrarAvisoInline(wrapper, '✅ Ok, você ganhou. Marquei sozinho. E agora NÃO DÁ PRA TIRAR.');

            // Chama a função global que atualiza a barra de progresso / validação
            if (typeof atualizarProgresso === 'function') {
              atualizarProgresso();
            }
          }
        }, 1500);
      }
    }
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 5. CB12 — "LADRÃO DE FOCO" (scroll ao topo)
//
// REGRA: Ao marcar o CB12, o scroll do container vai automaticamente
//        de volta ao topo, obrigando o usuário a rolar tudo de novo.
//
// PARA MODIFICAR: altere o delay antes do scroll em setTimeout abaixo.
// ════════════════════════════════════════════════════════════════════════════

function configurarCheckboxScroll() {
  const cb12 = document.getElementById('cb12');
  const wrapper = document.getElementById('cb12-wrapper');

  cb12.addEventListener('change', function () {
    if (this.checked) {
      // Aviso antes de subir
      mostrarAvisoInline(wrapper, '📜 Voltando ao início... boa rolagem!');

      // Pequena pausa para o usuário perceber o que vai acontecer
      setTimeout(() => {
        // Sobe o scroll do container de volta ao topo
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 800);
    }
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 6. CB16 — "O INVERTIDO" (roleta do caos)
//
// REGRA: Ao marcar o CB16, um checkbox ALEATÓRIO entre os já marcados
//        é automaticamente desmarcado.
// EXCEÇÕES: Não desmarca o próprio CB16, nem o CB4 (para não bagunçar a lógica).
//
// PARA MODIFICAR: adicione mais IDs em 'excluidos' para proteger outros checkboxes.
// ════════════════════════════════════════════════════════════════════════════

function configurarCheckboxInvertido() {
  const cb16 = document.getElementById('cb16');
  const wrapper = document.getElementById('cb16-wrapper');

  cb16.addEventListener('change', function () {
    if (this.checked) {
      // IDs que não podem ser desmarcados pela roleta
      const excluidos = ['cb4', 'cb7', 'cb16'];

      // Pega todos os checkboxes marcados (exceto os protegidos)
      const candidatos = pegarMarcados().filter(cb => !excluidos.includes(cb.id));

      if (candidatos.length > 0) {
        // Escolhe um aleatório
        const vitima = candidatos[Math.floor(Math.random() * candidatos.length)];
        vitima.checked = false;

        // Anima o item que foi desmarcado
        const itemVitima = vitima.closest('.checkbox-item');
        itemVitima.classList.add('shake');
        setTimeout(() => itemVitima.classList.remove('shake'), 500);

        // Aviso no wrapper do CB16
        mostrarAvisoInline(
          wrapper,
          `🎲 Roleta decidiu! O item #${vitima.id.replace('cb', '')} foi desmarcado. Boa sorte!`
        );

        atualizarProgresso();
      } else {
        // Sem vítimas disponíveis
        mostrarAvisoInline(wrapper, '🎲 Sorte! Não havia nada para desmarcar... desta vez.');
      }
    }
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 7. CB19 — "RELÂMPAGO" (timer regressivo)
//
// REGRA: Após marcar o CB19, aparece um botão "CONFIRMAR AGORA!" e
//        um contador regressivo de 4 segundos.
//        Se o usuário não clicar no botão de confirmação a tempo,
//        o checkbox se desmarca automaticamente.
//
// PARA MODIFICAR: altere TEMPO_RELAMPA para mudar o tempo em segundos.
// ════════════════════════════════════════════════════════════════════════════

const TEMPO_RELAMPA = 4; // segundos para confirmar

function configurarCheckboxRelampa() {
  const cb19 = document.getElementById('cb19');
  const wrapper = document.getElementById('cb19-wrapper');
  const btnConfirmar = document.getElementById('cb19-confirm');
  const counterSpan = document.getElementById('cb19-counter');

  cb19.addEventListener('change', function () {
    if (this.checked && !ESTADO.cb19Confirmado) {
      // Inicia o processo de contagem regressiva
      iniciarTimerRelampa(cb19, wrapper, btnConfirmar, counterSpan);
    } else if (!this.checked) {
      // Se desmarcar manualmente, cancela o timer
      cancelarTimerRelampa(btnConfirmar, counterSpan);
    }
  });

  // Botão de confirmação dentro do prazo
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', function () {
      // Usuário confirmou a tempo!
      ESTADO.cb19Confirmado = true;
      cancelarTimerRelampa(btnConfirmar, counterSpan);
      mostrarAvisoInline(wrapper, '⚡ Confirmado no prazo! Ufa!');
      cb19.checked = true; // garante que está marcado
      atualizarProgresso();
    });
  }
}

/**
 * Inicia o countdown do relâmpago.
 * Atualiza o contador a cada segundo e desmarca se expirar.
 */
function iniciarTimerRelampa(cb19, wrapper, btnConfirmar, counterSpan) {
  // Mostra o botão de confirmação
  if (btnConfirmar) btnConfirmar.style.display = 'block';

  let tempoRestante = TEMPO_RELAMPA;
  if (counterSpan) counterSpan.textContent = tempoRestante;

  // Cancela timer anterior se existir
  if (ESTADO.cb19Timer) clearInterval(ESTADO.cb19Timer);

  ESTADO.cb19Timer = setInterval(() => {
    tempoRestante--;
    if (counterSpan) counterSpan.textContent = tempoRestante;

    if (tempoRestante <= 0) {
      // Tempo esgotado! Desmarca.
      clearInterval(ESTADO.cb19Timer);
      ESTADO.cb19Timer = null;
      ESTADO.cb19Confirmado = false;

      cb19.checked = false;
      if (btnConfirmar) btnConfirmar.style.display = 'none';
      if (counterSpan) counterSpan.textContent = TEMPO_RELAMPA;

      // Shake + aviso
      wrapper.classList.add('shake');
      setTimeout(() => wrapper.classList.remove('shake'), 500);
      mostrarAvisoInline(wrapper, '⏰ Tempo esgotado! Marque novamente e confirme RÁPIDO!');

      atualizarProgresso();
    }
  }, 1000);
}

/** Cancela o timer do relâmpago e esconde o botão de confirmação */
function cancelarTimerRelampa(btnConfirmar, counterSpan) {
  if (ESTADO.cb19Timer) {
    clearInterval(ESTADO.cb19Timer);
    ESTADO.cb19Timer = null;
  }
  if (btnConfirmar) btnConfirmar.style.display = 'none';
  if (counterSpan) counterSpan.textContent = TEMPO_RELAMPA;
}


// ════════════════════════════════════════════════════════════════════════════
// 8. ATUALIZAÇÃO DO PROGRESSO
//
// Atualiza o contador "X/20 termos aceitos" e a barra de progresso.
// Chamada após qualquer mudança de estado de checkbox.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Recalcula e atualiza o contador + barra de progresso visual.
 * Também muda o emoji conforme o progresso.
 *
 * EMOJIS DE PROGRESSO (para customizar, altere o array 'emojis' abaixo):
 * 0-4: 😐 | 5-9: 😰 | 10-14: 😤 | 15-18: 😅 | 19: 🏁 | 20: 🎉
 */
function atualizarProgresso() {
  const total = ESTADO.totalObrigatorios;
  const marcados = pegarMarcados().length;
  const percentual = (marcados / total) * 100;

  // Atualiza texto do contador
  if (cbCount) cbCount.textContent = marcados;

  // Atualiza barra de progresso
  if (progressoFill) {
    progressoFill.style.width = percentual + '%';

    // Remove classes anteriores
    progressoFill.classList.remove('quase', 'completo');

    if (percentual >= 100) {
      progressoFill.classList.add('completo');
    } else if (percentual >= 80) {
      progressoFill.classList.add('quase');
    }
  }

  // Atualiza emoji de progresso
  if (progressoEmoji) {
    const emojis = ['😐', '😰', '😤', '😅', '🏁'];
    let emojiIdx = Math.floor(marcados / (total / emojis.length));
    if (emojiIdx >= emojis.length) emojiIdx = emojis.length - 1;
    progressoEmoji.textContent = marcados >= total ? '🎉' : emojis[emojiIdx];
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 9. BOTÃO "DESMARCAR TUDO" (verde, dark pattern)
//
// Esta função é chamada pelo botão VERDE "desmarcar tudo".
// Ela DESMARCA todos os checkboxes — ação destrutiva com cor positiva.
// É um dark pattern clássico de UI enganosa.
//
// PARA MODIFICAR: adicione lógica aqui se quiser animar o processo.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Desmarca todos os checkboxes e reseta os estados especiais.
 * Chamada pelo botão VERDE (propositalmente enganoso).
 */
function desmarcarTudo() {
  // Desmarca todos
  pegarTodosCbs().forEach((cb, i) => {
    // Pequeno delay em cascata para efeito visual
    setTimeout(() => {
      cb.checked = false;
    }, i * 30);
  });

  // Reseta estados especiais
  ESTADO.cb4MarcadoPrimeiro = false;
  ESTADO.cb7Tentativas = 0;
  ESTADO.cb7Confirmado = false;
  ESTADO.cb19Confirmado = false;

  // Cancela timer do relâmpago se ativo
  const btnConfirmar = document.getElementById('cb19-confirm');
  const counterSpan = document.getElementById('cb19-counter');
  cancelarTimerRelampa(btnConfirmar, counterSpan);

  // Atualiza progresso após o delay total da animação
  setTimeout(() => atualizarProgresso(), ESTADO.totalObrigatorios * 30 + 50);
}


// ════════════════════════════════════════════════════════════════════════════
// 10. BOTÃO "PRONTO" (vermelho, dark pattern) + VALIDAÇÃO
//
// Validação que ocorre ao clicar no botão vermelho "pronto".
// Se nem todos os checkboxes estiverem marcados, exibe o erro agressivo.
// Se tudo estiver marcado, redireciona para a página de cadastro.
//
// PARA MODIFICAR:
// - Altere a URL de redirecionamento em 'urlDestino' abaixo.
// - Adicione regras extras de validação antes da verificação principal.
// ════════════════════════════════════════════════════════════════════════════

/**
 * URL para onde o usuário vai após aceitar todos os termos.
 * Altere para a rota correta do seu fluxo.
 *
 * PARA MODIFICAR: troque '/cadastro' pela rota de destino desejada.
 */
const URL_DESTINO_APOS_TERMOS = '/cadastro';

/**
 * Valida se todos os checkboxes foram marcados e avança ou mostra erro.
 * Chamada pelo botão VERMELHO "pronto".
 */
function validarEAvancar() {
  const todos = pegarTodosCbs();
  const marcados = todos.filter(cb => cb.checked);
  const faltando = todos.length - marcados.length;

  if (faltando > 0) {
    // Não está completo: mostra erro agressivo
    mostrarErroAgressivo(marcados.length, todos.length);

    // Destaca visualmente os checkboxes não marcados
    destacarNaoMarcados(todos);

  } else {
    // Tudo marcado! Avança para a próxima tela.
    // Por ora redireciona para o cadastro.
    // Para integrar com backend, substitua pelo submit de um formulário.
    window.location.href = URL_DESTINO_APOS_TERMOS;
  }
}

/**
 * Adiciona classe de erro visual nos checkboxes não marcados.
 * Remove automaticamente após 3 segundos.
 * @param {HTMLInputElement[]} todos - Todos os checkboxes
 */
function destacarNaoMarcados(todos) {
  todos.forEach(cb => {
    if (!cb.checked) {
      const item = cb.closest('.checkbox-item');
      if (item) {
        item.classList.add('erro-item');
        setTimeout(() => item.classList.remove('erro-item'), 3000);
      }
    }
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 11. ANIMAÇÃO DE ERRO AGRESSIVA
//
// Exibe um overlay fullscreen com texto gigante e animações.
// Some automaticamente após DURACAO_ERRO milissegundos.
//
// PARA MODIFICAR:
// - Altere DURACAO_ERRO para mudar quanto tempo fica visível.
// - Altere os icones em ICONES_ERRO para variar as caras de erro.
// - O visual do overlay está em termos.css → .erro-overlay
// ════════════════════════════════════════════════════════════════════════════

/** Duração do overlay de erro em milissegundos */
const DURACAO_ERRO = 3000; // 3 segundos

/** Ícones que rotacionam a cada exibição de erro */
const ICONES_ERRO = ['💀', '😱', '🚨', '❌', '😤', '🤬'];
let _erroIconeIdx = 0;

/**
 * Exibe a animação de erro agressiva cobrindo toda a tela.
 * @param {number} marcados - Quantidade de checkboxes marcados
 * @param {number} total    - Total de checkboxes obrigatórios
 */
function mostrarErroAgressivo(marcados, total) {
  // Previne múltiplos overlays ao mesmo tempo
  if (ESTADO.erroAtivo) return;
  ESTADO.erroAtivo = true;

  const overlay = document.getElementById('erro-overlay');
  const iconEl = document.getElementById('erro-icone');
  const faltamEl = document.getElementById('erro-faltam');

  // Atualiza conteúdo dinâmico
  if (iconEl) {
    iconEl.textContent = ICONES_ERRO[_erroIconeIdx % ICONES_ERRO.length];
    _erroIconeIdx++;
  }
  if (faltamEl) {
    faltamEl.textContent = `${marcados}`;
  }

  // Exibe o overlay
  if (overlay) {
    overlay.classList.add('ativo'); // Mostra via classe CSS

    // Vibração do dispositivo (se suportado)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }

    // Remove após DURACAO_ERRO milissegundos
    setTimeout(() => {
      overlay.classList.remove('ativo'); // Esconde via classe CSS
      ESTADO.erroAtivo = false;

      // Scroll até o primeiro checkbox não marcado após o erro sumir
      const primeiroPendente = pegarTodosCbs().find(cb => !cb.checked);
      if (primeiroPendente && scrollContainer) {
        const itemPendente = primeiroPendente.closest('.checkbox-item');
        if (itemPendente) {
          itemPendente.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, DURACAO_ERRO);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 12. INICIALIZAÇÃO
//
// Conecta todos os listeners de atualização de progresso e
// configura os checkboxes especiais.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Inicializa toda a lógica da tela de termos.
 * Chamada uma vez quando o DOM carrega.
 */
function inicializar() {
  // Configura os checkboxes especiais com suas lógicas malignas
  configurarCheckboxesEspeciais();

  // Conecta o listener de progresso em todos os checkboxes normais.
  // Os especiais chamam atualizarProgresso() internamente quando necessário.
  pegarTodosCbs().forEach(cb => {
    cb.addEventListener('change', atualizarProgresso);
  });

  // Fecha o overlay de erro ao clicar nele (para não prender o usuário)
  const overlay = document.getElementById('erro-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      if (ESTADO.erroAtivo) {
        overlay.classList.remove('ativo');
        ESTADO.erroAtivo = false;
      }
    });
  }

  // Inicializa a barra de progresso com 0
  atualizarProgresso();

  // Expõe funções no escopo global para os onclick do HTML
  window.desmarcarTudo = desmarcarTudo;
  window.validarEAvancar = validarEAvancar;
}

// Garante que o DOM esteja carregado antes de inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
