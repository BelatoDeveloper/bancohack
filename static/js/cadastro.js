// ================================================
// CADASTRO.JS — Dark Pattern: Regra dos 3 Cliques + Regras Absurdas de Senha
// ZicaPay Feature: 3-click rule no cadastro com mensagens motivacionais irônicas
//
// Heurísticas de Nielsen violadas:
// - H1: Visibilidade do status (requisitos mudam a cada clique)
// - H4: Consistência e padrões (regras se contradizem)
// - H5: Prevenção de erros (sistema cria erros ativamente)
// - H9: Mensagens de erro inúteis e humilhantes
// ================================================

// ZicaPay Feature: contador de cliques — formulário só é enviado no 3º clique
let clickCount = 0;

// ZicaPay Feature: flag que controla quando o cadastro foi liberado
let regLiberado = false;

// ZicaPay Feature: intercepta o submit do formulário de cadastro
// O terceiro argumento 'true' usa event capture (roda antes de outros listeners)
document.getElementById('register-form').addEventListener('submit', function(e) {
  // Se já liberado no 3º clique, deixa submeter normalmente
  if (regLiberado) return;

  // Bloqueia o envio do formulário
  e.preventDefault();

  // Pega os valores dos campos de senha
  const senha = document.getElementById('senha').value;
  const confirma = document.getElementById('confirmar_senha').value;

  // Se algum campo estiver vazio, não faz nada
  if (!senha || !confirma) return;

  // ZicaPay Feature: incrementa o contador a cada clique frustrado
  clickCount++;

  // ZicaPay Feature: exibe ou atualiza a mensagem motivacional irônica
  // próxima aos requisitos de senha
  atualizarMensagemInsistencia(clickCount);

  // Também chama a função de regras absurdas de senha (mantida do original)
  mostrarRegrasCadastro(senha);
}, true);

// ─────────────────────────────────────────────────────────────────────────────
// ZicaPay Feature: Mensagens motivacionais irônicas a cada clique frustrado
// ─────────────────────────────────────────────────────────────────────────────
function atualizarMensagemInsistencia(clique) {
  // Obtém ou cria o elemento de mensagem de insistência
  let msgEl = document.getElementById('msg-insistencia');
  if (!msgEl) {
    msgEl = document.createElement('p');
    msgEl.id = 'msg-insistencia';
    msgEl.style.cssText = [
      'font-size:0.72rem',
      'font-weight:700',
      'text-align:center',
      'margin-top:8px',
      'padding:6px 10px',
      'border-radius:8px',
      'letter-spacing:0.04em',
      'transition:all 0.3s ease'
    ].join(';');

    // Insere próximo aos requisitos de senha (acima do botão de criar conta)
    const btnRegister = document.getElementById('btn-register');
    if (btnRegister) btnRegister.insertAdjacentElement('beforebegin', msgEl);
  }

  // ZicaPay Feature: mensagens específicas por número de clique
  if (clique === 1) {
    // Após o 1º clique frustrado
    msgEl.textContent = 'LEMBRE-SE DE SER INSISTENTE';
    msgEl.style.color = '#b45309';
    msgEl.style.background = '#fffbeb';
    msgEl.style.border = '1px solid #fcd34d';

  } else if (clique === 2) {
    // Após o 2º clique frustrado
    msgEl.textContent = 'TENTAR NOVAMENTE É UMA VIRTUDE';
    msgEl.style.color = '#7c3aed';
    msgEl.style.background = '#f5f3ff';
    msgEl.style.border = '1px solid #c4b5fd';

  } else if (clique >= 3) {
    // ZicaPay Feature: 3º clique — mensagem final + libera o formulário
    msgEl.textContent = 'LEMBRE-SE QUE ESSE BOTÃO DE CRIAR CONTA É BEM CLICÁVEL';
    msgEl.style.color = '#15803d';
    msgEl.style.background = '#f0fdf4';
    msgEl.style.border = '1px solid #86efac';

    // Libera o cadastro no próximo tick para garantir que a mensagem apareça primeiro
    regLiberado = true;

    // Oculta a mensagem de senhas não coincidem
    const matchDiv = document.getElementById('senha-match');
    if (matchDiv) matchDiv.style.display = 'none';

    // Atualiza a caixa de regras para mostrar sucesso
    let box = document.getElementById('zica-rules-reg');
    if (box) {
      box.style.background = '#f0fdf4';
      box.style.borderColor = '#86efac';
      box.innerHTML = '<strong style="display:block;margin-bottom:6px;">✅ Tudo certo! Criando conta...</strong>' +
        '<div style="color:#15803d">✓ Senha aceita</div>' +
        '<div style="color:#15803d">✓ Confirmação ok</div>' +
        '<div style="color:#15803d">✓ As regras concordam</div>';
    }

    // Aguarda 800ms e submete o formulário de verdade
    setTimeout(() => document.getElementById('register-form').submit(), 800);
    return; // Não continua para a lógica de erros abaixo
  }

  // Nas tentativas 1 e 2: mostra que as senhas "não coincidem"
  if (clique <= 2) {
    const erros = [
      '✗ As senhas não coincidem',   // 1ª tentativa
      '✗ Continua diferente...',      // 2ª tentativa
    ];
    const matchDiv = document.getElementById('senha-match');
    if (matchDiv) {
      matchDiv.textContent = erros[clique - 1];
      matchDiv.style.color = 'var(--danger)';
      matchDiv.style.display = 'block';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Função de regras absurdas de senha (lógica original mantida intacta)
// Chamada a partir do listener de submit acima
// ─────────────────────────────────────────────────────────────────────────────
function mostrarRegrasCadastro(s) {
  // Só exibe regras nos primeiros 2 cliques (no 3º já liberamos)
  if (clickCount > 2) return;

  // Obtém ou cria a div de regras
  let box = document.getElementById('zica-rules-reg');
  if (!box) {
    box = document.createElement('div');
    box.id = 'zica-rules-reg';
    box.style.cssText = 'margin-top:12px;padding:12px;border-radius:12px;background:#fff3f3;border:1px solid #fca5a5;font-size:0.75rem;line-height:1.8;';
    // Insere abaixo do botão de criar conta
    document.getElementById('btn-register').insertAdjacentElement('afterend', box);
  }

  // Analisa o que o usuário digitou
  const len = s.length;
  const ultima = s[s.length - 1] || '';
  const temNum = /\d/.test(s);
  const temMaiu = /[A-Z]/.test(s);

  // Pool de regras absurdas (contradizem-se entre si)
  const poolCaos = [
    { txt: `Mínimo 8 caracteres (você tem ${len})`, ok: len >= 8 },
    { txt: `Máximo 7 caracteres (você tem ${len})`, ok: len <= 7 },
    { txt: `Não pode terminar com "${ultima}"`, ok: false },
    { txt: `Deve ter exatamente ${len + 1} caracteres (você tem ${len})`, ok: false },
    { txt: `Deve conter número`, ok: temNum },
    { txt: `Não pode conter número`, ok: !temNum },
    { txt: `Deve ter letra maiúscula`, ok: temMaiu },
    { txt: `Tudo minúsculo, por favor`, ok: !temMaiu },
    { txt: `Deve conter o ano da última Copa que o Brasil ganhou (2002)`, ok: s.includes('2002') },
    { txt: `Inclua o nome do primeiro cachorro enviado ao espaço (Laika)`, ok: s.toLowerCase().includes('laika') },
    { txt: `A senha não pode ser uma palavra que existe no dicionário`, ok: false },
    { txt: `Deve conter a capital da Austrália (dica: não é Sydney)`, ok: s.toLowerCase().includes('canberra') },
    { txt: `Não pode rimar com "desenvolvimento"`, ok: false },
    { txt: `A senha não pode ser igual à sua senha anterior`, ok: false },
    { txt: `Deve expressar um sentimento positivo`, ok: false },
  ];

  let regras, cor, titulo;

  if (clickCount <= 2) {
    // Tentativas 1 e 2: sorteia 5 regras aleatórias do pool
    regras = poolCaos.sort(() => Math.random() - 0.5).slice(0, 5);
    cor = '#fff3f3';
    titulo = '❌ Senha recusada — corrija os requisitos:';
    box.style.background = cor;
    box.style.borderColor = '#fca5a5';
    // Chacoalha o botão
    sacudirReg(document.getElementById('btn-register'));
  }

  // Renderiza as regras dentro da caixa
  box.innerHTML = `<strong style="display:block;margin-bottom:6px;">${titulo}</strong>` +
    regras.map(r => `<div style="color:${r.ok ? '#15803d' : '#dc2626'}">${r.ok ? '✓' : '✗'} ${r.txt}</div>`).join('');
}

// Efeito de chacoalhar o botão do cadastro
function sacudirReg(el) {
  const moves = ['-5px', '5px', '-4px', '4px', '0'];
  let i = 0;
  el.style.transition = 'transform 0.05s';
  const iv = setInterval(() => {
    el.style.transform = `translateX(${moves[i++]})`;
    if (i >= moves.length) { clearInterval(iv); el.style.transform = ''; }
  }, 55);
}