let regTentativas = 0;
let regLiberado = false;

document.getElementById('register-form').addEventListener('submit', function(e) {
  if (regLiberado) return;
  e.preventDefault();

  const senha = document.getElementById('senha').value;
  const confirma = document.getElementById('confirmar_senha').value;
  if (!senha || !confirma) return;

  regTentativas++;

  if (regTentativas <= 3) {
    const erros = ['✗ As senhas não coincidem','✗ Continua diferente...','✗ Quase... mas não'];
    const matchDiv = document.getElementById('senha-match');
    matchDiv.textContent = erros[regTentativas - 1];
    matchDiv.style.color = 'var(--danger)';
    matchDiv.style.display = 'block';
  }

  mostrarRegrasCadastro(senha);
}, true);

function mostrarRegrasCadastro(s) {
  let box = document.getElementById('zica-rules-reg');
  if (!box) {
    box = document.createElement('div');
    box.id = 'zica-rules-reg';
    box.style.cssText = 'margin-top:12px;padding:12px;border-radius:12px;background:#fff3f3;border:1px solid #fca5a5;font-size:0.75rem;line-height:1.8;';
    document.getElementById('btn-register').insertAdjacentElement('afterend', box);
  }

  const len = s.length;
  const ultima = s[s.length-1] || '';
  const temNum = /\d/.test(s);
  const temMaiu = /[A-Z]/.test(s);

  const poolCaos = [
    { txt: `Mínimo 8 caracteres (você tem ${len})`, ok: len >= 8 },
    { txt: `Máximo 7 caracteres (você tem ${len})`, ok: len <= 7 },
    { txt: `Não pode terminar com "${ultima}"`, ok: false },
    { txt: `Deve ter exatamente ${len+1} caracteres (você tem ${len})`, ok: false },
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

  if (regTentativas <= 2) {
    regras = poolCaos.sort(() => Math.random() - 0.5).slice(0, 5);
    cor = '#fff3f3'; titulo = '❌ Senha recusada — corrija os requisitos:';
    box.style.background = cor;
    box.style.borderColor = '#fca5a5';
    sacudirReg(document.getElementById('btn-register'));
  } else if (regTentativas === 3) {
    regras = [
      { txt: 'Tamanho: qualquer um serve, na verdade', ok: true },
      { txt: 'Número: recomendado... mas opcional', ok: true },
      { txt: 'Copa de 2002... tá bom, esquece', ok: true },
      { txt: 'As regras estão entrando em acordo...', ok: true },
    ];
    cor = '#fffbeb'; titulo = '⚠️ Quase lá...';
    box.style.background = cor;
    box.style.borderColor = '#fcd34d';
  } else {
    regLiberado = true;
    document.getElementById('senha-match').style.display = 'none';
    regras = [
      { txt: '✓ Senha aceita', ok: true },
      { txt: '✓ Confirmação ok', ok: true },
      { txt: '✓ As regras concordam', ok: true },
    ];
    cor = '#f0fdf4'; titulo = '✅ Tudo certo! Criando conta...';
    box.style.background = cor;
    box.style.borderColor = '#86efac';
    setTimeout(() => document.getElementById('register-form').submit(), 800);
  }

  box.innerHTML = `<strong style="display:block;margin-bottom:6px;">${titulo}</strong>` +
    regras.map(r => `<div style="color:${r.ok ? '#15803d' : '#dc2626'}">${r.ok ? '✓' : '✗'} ${r.txt}</div>`).join('');
}

function sacudirReg(el) {
  const moves = ['-5px','5px','-4px','4px','0'];
  let i = 0;
  el.style.transition = 'transform 0.05s';
  const iv = setInterval(() => {
    el.style.transform = `translateX(${moves[i++]})`;
    if (i >= moves.length) { clearInterval(iv); el.style.transform = ''; }
  }, 55);
}