// ================================================
// CADASTRO.JS — Regras absurdas de senha no cadastro
// Além das regras, adiciona:
// - Confirmar senha que SEMPRE diz não coincidir (tentativas 1-3)
// Heurísticas de Nielsen violadas:
// - H1: Visibilidade do status
// - H4: Consistência e padrões
// - H5: Prevenção de erros
// - H9: Mensagens de erro inúteis
// ================================================

// Contador de tentativas do usuário no cadastro
let regTentativas = 0;

// Flag que controla se o cadastro foi liberado
let regLiberado = false;

// Intercepta o submit do formulário de cadastro
// O "true" no terceiro parâmetro faz capturar antes do listener original
document.getElementById('register-form').addEventListener('submit', function(e) {
  // Se já foi liberado na 4ª tentativa, deixa submeter normalmente
  if (regLiberado) return;

  // Bloqueia o envio do formulário
  e.preventDefault();

  // Pega os valores dos campos de senha
  const senha = document.getElementById('senha').value;
  const confirma = document.getElementById('confirmar_senha').value;

  // Se algum campo estiver vazio, não faz nada
  if (!senha || !confirma) return;

  // Incrementa o contador de tentativas
  regTentativas++;

  // Nas primeiras 3 tentativas, diz que as senhas não coincidem
  // mesmo que sejam idênticas — viola a H5
  if (regTentativas <= 3) {
    const erros = [
      '✗ As senhas não coincidem',      // 1ª tentativa
      '✗ Continua diferente...',         // 2ª tentativa
      '✗ Quase... mas não',              // 3ª tentativa
    ];
    const matchDiv = document.getElementById('senha-match');
    matchDiv.textContent = erros[regTentativas - 1];
    matchDiv.style.color = 'var(--danger)';
    matchDiv.style.display = 'block';
  }

  // Chama a função que exibe as regras de senha
  mostrarRegrasCadastro(senha);
}, true);

// Função principal que exibe as regras de acordo com a tentativa
function mostrarRegrasCadastro(s) {
  // Tenta pegar a div de regras, se não existir cria uma nova
  let box = document.getElementById('zica-rules-reg');
  if (!box) {
    box = document.createElement('div');
    box.id = 'zica-rules-reg';
    box.style.cssText = 'margin-top:12px;padding:12px;border-radius:12px;background:#fff3f3;border:1px solid #fca5a5;font-size:0.75rem;line-height:1.8;';
    // Insere a caixa logo abaixo do botão de criar conta
    document.getElementById('btn-register').insertAdjacentElement('afterend', box);
  }

  // Analisa o que o usuário digitou
  const len = s.length;
  const ultima = s[s.length-1] || '';
  const temNum = /\d/.test(s);
  const temMaiu = /[A-Z]/.test(s);

  // Pool de regras absurdas
  const poolCaos = [
    // Reagem ao que foi digitado
    { txt: `Mínimo 8 caracteres (você tem ${len})`, ok: len >= 8 },
    { txt: `Máximo 7 caracteres (você tem ${len})`, ok: len <= 7 },
    { txt: `Não pode terminar com "${ultima}"`, ok: false },
    { txt: `Deve ter exatamente ${len+1} caracteres (você tem ${len})`, ok: false },
    // Contraditórias entre si
    { txt: `Deve conter número`, ok: temNum },
    { txt: `Não pode conter número`, ok: !temNum },
    { txt: `Deve ter letra maiúscula`, ok: temMaiu },
    { txt: `Tudo minúsculo, por favor`, ok: !temMaiu },
    // Nonsense/culturais
    { txt: `Deve conter o ano da última Copa que o Brasil ganhou (2002)`, ok: s.includes('2002') },
    { txt: `Inclua o nome do primeiro cachorro enviado ao espaço (Laika)`, ok: s.toLowerCase().includes('laika') },
    { txt: `A senha não pode ser uma palavra que existe no dicionário`, ok: false },
    { txt: `Deve conter a capital da Austrália (dica: não é Sydney)`, ok: s.toLowerCase().includes('canberra') },
    { txt: `Não pode rimar com "desenvolvimento"`, ok: false },
    { txt: `A senha não pode ser igual à sua senha anterior`, ok: false },
    { txt: `Deve expressar um sentimento positivo`, ok: false },
  ];

  let regras, cor, titulo;

  if (regTentativas <= 2) {
    // Tentativas 1 e 2: sorteia 5 regras aleatórias do pool
    regras = poolCaos.sort(() => Math.random() - 0.5).slice(0, 5);
    cor = '#fff3f3';
    titulo = '❌ Senha recusada — corrija os requisitos:';
    box.style.background = cor;
    box.style.borderColor = '#fca5a5';
    // Chacoalha o botão
    sacudirReg(document.getElementById('btn-register'));

  } else if (regTentativas === 3) {
    // Tentativa 3: regras começam a "entrar em acordo"
    regras = [
      { txt: 'Tamanho: qualquer um serve, na verdade', ok: true },
      { txt: 'Número: recomendado... mas opcional', ok: true },
      { txt: 'Copa de 2002... tá bom, esquece', ok: true },
      { txt: 'As regras estão entrando em acordo...', ok: true },
    ];
    cor = '#fffbeb';
    titulo = '⚠️ Quase lá...';
    box.style.background = cor;
    box.style.borderColor = '#fcd34d';

  } else {
    // Tentativa 4: libera o cadastro
    regLiberado = true;
    // Esconde a mensagem de senhas não coincidem
    document.getElementById('senha-match').style.display = 'none';
    regras = [
      { txt: '✓ Senha aceita', ok: true },
      { txt: '✓ Confirmação ok', ok: true },
      { txt: '✓ As regras concordam', ok: true },
    ];
    cor = '#f0fdf4';
    titulo = '✅ Tudo certo! Criando conta...';
    box.style.background = cor;
    box.style.borderColor = '#86efac';
    // Aguarda 800ms e submete o formulário de verdade
    setTimeout(() => document.getElementById('register-form').submit(), 800);
  }

  // Renderiza as regras dentro da caixa
  box.innerHTML = `<strong style="display:block;margin-bottom:6px;">${titulo}</strong>` +
    regras.map(r => `<div style="color:${r.ok ? '#15803d' : '#dc2626'}">${r.ok ? '✓' : '✗'} ${r.txt}</div>`).join('');
}

// Efeito de chacoalhar o botão do cadastro
function sacudirReg(el) {
  const moves = ['-5px','5px','-4px','4px','0'];
  let i = 0;
  el.style.transition = 'transform 0.05s';
  const iv = setInterval(() => {
    el.style.transform = `translateX(${moves[i++]})`;
    if (i >= moves.length) { clearInterval(iv); el.style.transform = ''; }
  }, 55);
}