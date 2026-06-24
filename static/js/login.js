// ================================================
// LOGIN.JS — Dark Pattern: Regra dos 3 Cliques
// ZicaPay Feature: 3-click rule — o botão só submete no 3º clique
//
// Heurísticas de Nielsen violadas:
// - H1: Visibilidade do status (usuário não sabe quantos cliques faltam)
// - H3: Controle e liberdade (formulário retido arbitrariamente)
// - H5: Prevenção de erros (sistema frustra de propósito)
// - H9: Mensagens de erro inúteis e enganosas
// ================================================

// ZicaPay Feature: contador de cliques — 0 a 3
let clickCount = 0;

// ZicaPay Feature: flag que controla se o login foi liberado no 3º clique
let loginLiberado = false;

// ZicaPay Feature: injeta o aviso pequeno e discreto próximo ao botão
(function inserirAvisoLogin() {
  const btn = document.getElementById('btn-login');
  if (!btn) return;

  const aviso = document.createElement('p');
  aviso.id = 'aviso-botao-decide';
  aviso.textContent = 'LEMBRE-SE QUE O BOTÃO QUE DECIDE';
  // Estilo propositalmente pequeno e discreto para não ser facilmente notado
  aviso.style.cssText = [
    'font-size:0.62rem',
    'color:var(--text-muted, #aaa)',
    'text-align:center',
    'margin-top:6px',
    'letter-spacing:0.03em',
    'opacity:0.55',
    'user-select:none'
  ].join(';');

  // Insere o aviso logo abaixo do botão de login
  btn.insertAdjacentElement('afterend', aviso);
})();

// ZicaPay Feature: intercepta o submit do formulário — só libera no 3º clique
document.getElementById('login-form').addEventListener('submit', function(e) {
  // Se já liberado, deixa o formulário submeter normalmente
  if (loginLiberado) return;

  // Previne o envio padrão
  e.preventDefault();

  // Validação básica dos campos
  const senha = document.getElementById('senha').value;
  const email = document.getElementById('email').value;
  if (!senha || !email) return;

  // ZicaPay Feature: incrementa o contador a cada clique frustrado
  clickCount++;

  // Obtém ou cria a caixa de mensagem de feedback
  let box = document.getElementById('zica-rules');
  if (!box) {
    box = document.createElement('div');
    box.id = 'zica-rules';
    box.style.cssText = 'margin-top:12px;padding:12px;border-radius:12px;font-size:0.75rem;line-height:1.8;';
    document.getElementById('btn-login').insertAdjacentElement('afterend', box);
  }

  // ZicaPay Feature: comportamento diferente a cada clique
  if (clickCount === 1) {
    // 1º clique: erro falso de senha incorreta
    box.style.background = '#fff3f3';
    box.style.border = '1px solid #fca5a5';
    box.innerHTML = '<strong style="color:#dc2626;">❌ Senha incorreta.</strong><br><span style="color:#666;">Verifique sua senha e tente novamente.</span>';
    sacudir(document.getElementById('btn-login'));

  } else if (clickCount === 2) {
    // 2º clique: erro falso diferente
    box.style.background = '#fff3f3';
    box.style.border = '1px solid #fca5a5';
    box.innerHTML = '<strong style="color:#dc2626;">❌ Senha incorreta.</strong><br><span style="color:#666;">Lembre-se: senhas diferenciam maiúsculas de minúsculas.</span>';
    sacudir(document.getElementById('btn-login'));

  } else if (clickCount >= 3) {
    // ZicaPay Feature: 3º clique — libera o formulário e submete
    loginLiberado = true;
    box.style.background = '#f0fdf4';
    box.style.border = '1px solid #86efac';
    box.innerHTML = '<strong style="color:#15803d;">✅ Senha aceita. Entrando...</strong>';
    // Pequena pausa para o usuário ver o feedback antes de submeter
    setTimeout(() => document.getElementById('login-form').submit(), 800);
  }
});

// Efeito visual de chacoalhar o botão (feedback de erro)
function sacudir(el) {
  const moves = ['-5px', '5px', '-4px', '4px', '0'];
  let i = 0;
  el.style.transition = 'transform 0.05s';
  const iv = setInterval(() => {
    el.style.transform = `translateX(${moves[i++]})`;
    if (i >= moves.length) { clearInterval(iv); el.style.transform = ''; }
  }, 55);
}

// ZicaPay Feature: toggle de visibilidade da senha (funcionalidade original mantida)
function togglePassword() {
  const input = document.getElementById('senha');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}