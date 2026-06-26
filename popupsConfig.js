/**
 * ============================================================
 * popupsConfig.js — Arquivo de Configuração Centralizado
 * ============================================================
 *
 * PROPÓSITO: Centralizar TODOS os textos, valores, tempos e flags
 * dos 3 pop-ups de dark UX. Nada está hardcoded nos componentes.
 * Edite aqui para mudar qualquer coisa sem tocar na lógica.
 *
 * COMO USAR:
 *   - Altere qualquer propriedade abaixo para personalizar
 *   - Use as flags "ativo: true/false" para ligar/desligar cada popup
 *   - Não altere os nomes das chaves (ex: "popup1") — o código depende deles
 */

window.DARK_POPUPS_CONFIG = {

  // =========================================================================
  // POP-UP 1 — "O Mestre da Fuga" (Banner de Investimento com botão fujão)
  // =========================================================================
  popup1: {
    ativo: true, // <- true = ativado | false = desativado

    // GATILHO DE SCROLL:
    // Percentual da altura da página para disparar o popup (0.0 a 1.0)
    // Ex: 0.4 = quando o usuário rola 40% da página
    scrollThreshold: 0.4,

    // Textos do banner
    tituloBanner: "OPORTUNIDADE EXCLUSIVA",
    subtituloBanner: "Transforme seu dinheiro em muito mais dinheiro!",
    textoBotaoPrincipal: "SIM! QUERO SER BILIONÁRIO AGORA!",
    // FIX: Bug Hackathon — corrigido: era '/pix', mas deve ser '/investir'
    urlDestinoBotaoPrincipal: "/investir", // redireciona para a tela de Investimentos

    // Texto minúsculo de recusa (o que foge do cursor)
    textoRecusa: "Não, prefiro continuar pobre",

    // Quantas vezes o botão de recusa foge antes de parar e mostrar o desafio
    // Após esse número de fugas, o mini-desafio é ativado
    maxFugas: 5,

    // Mini-desafio: quantos cliques necessários para "quebrar a preguiça"
    cliquesNecessarios: 7,
    textoBotaoDesafio: "Clique {N} vezes para quebrar a preguiça financeira!",
    // {N} será substituído pelo número de cliques necessários

    // Taxa cobrada ao completar o desafio (só visual/satírico)
    taxaCobranca: "R$ 1,99",
    mensagemTaxaCobranca: "Taxa de Motivação Financeira de {TAXA} debitada. Você está pronto para enriquecer! 🤑",
    // {TAXA} será substituído pelo valor da taxa
  },

  // =========================================================================
  // POP-UP 2 — "O Refém Intelectual" (CDB com captcha histórico)
  // =========================================================================
  popup2: {
    ativo: true, // <- true = ativado | false = desativado

    // GATILHO: intercepta o submit do form de envio de Pix
    // ID do formulário na página pix.html
    formPixId: "form-enviar-pix",
    delayEntrada: 600,

    // Cabeçalho corporativo do popup
    tituloCDB: "Oferta Exclusiva — CDB ZicaPay Premium",
    subtituloCDB: "Rendimento garantido de -2% ao ano 🎉",
    rodapeCDB: "*Rendimento negativo garantido. Sim, você perde dinheiro. É exclusivo.",

    // Pergunta do captcha histórico (editável!)
    perguntaCaptcha: "Para confirmar que você é um investidor inteligente, digite os imperadores romanos do século III em ordem alfabética:",
    placeholderCaptcha: "Aureliano, Caracala, Diocleciano...",

    // Tempo em segundos para responder o captcha antes do "ultimato"
    tempoCaptcha: 15,

    // Textos dos 3 botões do ultimato (mostrados quando o tempo esgota)
    botaoUltimato1: "😔 Desculpe, vou investir agora!",
    botaoUltimato2: "💼 Postar meu fracasso no LinkedIn",
    botaoUltimato3: "💸 Pagar a Taxa de Desinteresse",

    // Valor da "taxa de desinteresse" (só visual)
    taxaDesinteresse: "R$ 10,00",

    // Mensagem irônica após o "pagamento" da taxa
    mensagemPosPagamento: "Pix de {TAXA} confirmado! ZicaPay agradece sua contribuição para o nosso fundo de aposentadoria antecipada. 🏖️",

    // Texto da animação de LinkedIn (simulado)
    textoLinkedIn: "Publicando: 'Hoje aprendi que não estou pronto para investir. Grato pela jornada. #Crescimento #Mindset #ZicaPay'",

    // ── Animação de pagamento ────────────────────────────────────────────────
    // Tempo (ms) que o popup aguarda antes de fechar após a animação do Pix.
    // Deve ser >= duração da animação CSS do emoji (definida em darkPopups.css).
    // Sugestão: 3500ms para o usuário ver + ouvir o feedback completo.
    duracaoAnimacaoPagamento: 3500,

    // ── Som de pagamento (Web Audio API — sem arquivos externos) ────────────
    // Sintetizado com osciladores: simula um "cha-ching" de caixa registradora.
    // Para desativar o som, mude 'ativo' para false.
    somPagamento: {
      ativo: true,
      // Volume geral (0.0 a 1.0)
      volume: 0.4,
      // Frequência das notas do "cha-ching" (Hz): duas notas em sequência
      // Nota 1: tom mais grave (o "cha"), Nota 2: tom mais agudo (o "ching")
      nota1Hz: 800,
      nota2Hz: 1200,
      // Duração de cada nota (ms)
      duracaoNota1: 120,
      duracaoNota2: 200,
      // Delay entre as duas notas (ms)
      delayEntreNotas: 80,
    },
  },


  // =========================================================================
  // POP-UP 3 — "A Roleta da Recusa" (Slot machine de cartões de crédito)
  // =========================================================================
  popup3: {
    ativo: true, // <- true = ativado | false = desativado

    // GATILHO: intercepta cliques em links/botões que vão para /cartoes
    // Seletor CSS dos elementos que disparam o popup
    seletorGatilho: "a[href*='/cartoes'], #action-cartoes, #nav-cartoes",

    // Duração da animação da roleta girando (em ms)
    duracaoRoleta: 2000,

    // BUG FIX #2 — Delay (ms) após revelar o cartão antes de habilitar o botão de recusa.
    // Impede cliques rápidos consecutivos que descompassam o nível visual do nível interno.
    // Sugestão: 1500 a 2000ms para dar tempo de ler a humilhação do cartão.
    delayHabilitarBotaoRecusa: 1800,

    // Array de 6 níveis de cartão (ordem decrescente de luxo)
    // Cada nível tem: nome, anuidade, humilhacao, textoRecusa
    niveis: [
      {
        nivel: 1,
        emoji: '<i class="ph ph-diamond"></i>',
        nome: "Black Diamante Eterno",
        anuidade: "R$ 4.999,90/ano",
        humilhacao: "Você é exatamente o tipo de cliente que merece exclusividade. Recusar isso é quase um insulto ao seu próprio potencial.",
        textoRecusa: "Não mereço tanta exclusividade",
        corFundo: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        corDestaque: "#FFD700",
      },
      {
        nivel: 2,
        emoji: '<i class="ph ph-medal" style="color:#C0C0C0"></i>',
        nome: "Platina Prestígio",
        anuidade: "R$ 2.499,90/ano",
        humilhacao: "Tudo bem, ninguém é perfeito. Ainda dá pra impressionar no jantar de família.",
        textoRecusa: "Minha família não precisa saber",
        corFundo: "linear-gradient(135deg, #2c3e50 0%, #3d5a6e 100%)",
        corDestaque: "#C0C0C0",
      },
      {
        nivel: 3,
        emoji: '<i class="ph ph-medal" style="color:#FFD700"></i>',
        nome: "Gold Esperançoso",
        anuidade: "R$ 999,90/ano",
        humilhacao: "Gold é pra quem tem fé no próprio futuro financeiro. Você tem fé, não tem?",
        textoRecusa: "Minha fé está em falta",
        corFundo: "linear-gradient(135deg, #3d2b00 0%, #6b4c00 100%)",
        corDestaque: "#FFA500",
      },
      {
        nivel: 4,
        emoji: '<i class="ph ph-ticket"></i>',
        nome: "Prata 'Pelo Menos Você Tentou'",
        anuidade: "R$ 399,90/ano",
        humilhacao: "Esse aqui é bem mais em conta. Quase todo mundo consegue pagar isso. Quase.",
        textoRecusa: "Sou o 'quase' da estatística",
        corFundo: "linear-gradient(135deg, #2d3436 0%, #636e72 100%)",
        corDestaque: "#b2bec3",
      },
      {
        nivel: 5,
        emoji: '<i class="ph ph-battery-warning-vertical"></i>',
        nome: "Básico 'Modo Sobrevivência'",
        anuidade: "R$ 99,90/ano",
        humilhacao: "Sem benefícios, sem milhas, sem brilho. Mas é um cartão. Isso já é alguma coisa, né?",
        textoRecusa: "Nem isso eu mereço",
        corFundo: "linear-gradient(135deg, #1e272e 0%, #485460 100%)",
        corDestaque: "#4a4a6a",
      },
      {
        nivel: 6,
        emoji: '<i class="ph ph-wallet"></i>',
        nome: "Modo Pedestre Financeiro",
        anuidade: "R$ 0,00",
        humilhacao: "Parabéns. Você optou oficialmente por viver sem crédito, sem pontos, sem futuro.",
        textoRecusa: null, // Nível 6: sem botão de recusa normal — aparece o botão fujão
        textoBotaoFinal: "Continuar sem cartão",
        corFundo: "linear-gradient(135deg, #1a0000 0%, #3d0000 100%)",
        corDestaque: "#ff4444",
        carteiraVazia: true, // Flag especial: mostra animação de carteira vazia piscando
      },
    ],

    // Configurações do botão fujão do nível 6
    // (reutiliza a função utilitária de fuga do cursor)
    botaoFujao: {
      // Distância mínima em pixels para o cursor acionar a fuga
      distanciaFuga: 80,
      // Duração da animação de fuga (em ms)
      duracaoAnimacao: 200,
      // Margem mínima das bordas da tela para o botão não sair da viewport (px)
      margem: 20,
      // MELHORIA #3 — Intervalo (ms) do movimento autônomo.
      // O botão se reposiciona sozinho a cada X ms, independente do cursor.
      // Isso garante que em mobile (sem cursor) o usuário ainda precise "caçar" o botão.
      // Sugestão: 2000ms. Para desativar, use um valor muito alto (ex: 999999).
      intervaloMovimentoAutonomo: 1000,
    },
  },

  // =========================================================================
  // SISTEMA DE FILA — evita sobreposição de popups
  // =========================================================================
  fila: {
    // Tempo mínimo entre popups (em ms) — evita dois popups ao mesmo tempo
    intervaloMinimo: 500,
  },
};
