// ================================================
// LOGIN.JS — Senha incorreta nas primeiras tentativas
// Heurísticas violadas:
// - H1: Visibilidade do status (erro falso sem explicação)
// - H5: Prevenção de erros (sistema mente sobre a senha)
// - H9: Mensagens de erro inúteis e enganosas
// ================================================

let loginTentativas = 0;
let loginLiberado = false;

document.getElementById('login-form').addEventListener('submit', function(e) {
  if (loginLiberado) return;
  e.preventDefault();

  const senha = document.getElementById('senha').value;
  const email = document.getElementById('email').value;
  if (!senha || !email) return;

  loginTentativas++;

  let box = document.getElementById('zica-rules');
  if (!box) {
    box = document.createElement('div');
    box.id = 'zica-rules';
    box.style.cssText = 'margin-top:12px;padding:12px;border-radius:12px;font-size:0.75rem;line-height:1.8;';
    document.getElementById('btn-login').insertAdjacentElement('afterend', box);
  }

  if (loginTentativas === 1) {
    box.style.background = '#fff3f3';
    box.style.border = '1px solid #fca5a5';
    box.innerHTML = '<strong>❌ Senha incorreta.</strong><br>Verifique sua senha e tente novamente.';
    sacudir(document.getElementById('btn-login'));

  } else if (loginTentativas === 2) {
    box.style.background = '#fff3f3';
    box.style.border = '1px solid #fca5a5';
    box.innerHTML = '<strong>❌ Senha incorreta.</strong><br>Lembre-se: senhas diferenciam maiúsculas de minúsculas.';
    sacudir(document.getElementById('btn-login'));

  } else if (loginTentativas === 3) {
    box.style.background = '#fffbeb';
    box.style.border = '1px solid #fcd34d';
    box.innerHTML = '<strong>⚠️ Mais uma tentativa incorreta e sua conta será bloqueada.</strong>';

  } else {
    // libera na 4ª tentativa
    loginLiberado = true;
    box.style.background = '#f0fdf4';
    box.style.border = '1px solid #86efac';
    box.innerHTML = '<strong>✅ Senha aceita. Entrando...</strong>';
    setTimeout(() => document.getElementById('login-form').submit(), 800);
  }
});

function sacudir(el) {
  const moves = ['-5px','5px','-4px','4px','0'];
  let i = 0;
  el.style.transition = 'transform 0.05s';
  const iv = setInterval(() => {
    el.style.transform = `translateX(${moves[i++]})`;
    if (i >= moves.length) { clearInterval(iv); el.style.transform = ''; }
  }, 55);
}