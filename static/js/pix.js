// ================================================
// PIX.JS — Padrões de interface "ruins" para a aba Pix (V2 - UX Invertido)
// ================================================

document.addEventListener('DOMContentLoaded', function() {

  // ──────────────────────────────────────────
  // 1. ABA ENVIAR PIX
  // ──────────────────────────────────────────

  // Chave PIX: Botão Espiar
  const btnEspiar = document.getElementById('btn-espiar-chave');
  const inputChave = document.getElementById('chave_pix');
  if (btnEspiar && inputChave) {
    btnEspiar.addEventListener('mousedown', () => { inputChave.type = 'text'; });
    btnEspiar.addEventListener('mouseup', () => { inputChave.type = 'password'; });
    btnEspiar.addEventListener('mouseleave', () => { inputChave.type = 'password'; });
    btnEspiar.addEventListener('touchstart', (e) => { e.preventDefault(); inputChave.type = 'text'; });
    btnEspiar.addEventListener('touchend', (e) => { e.preventDefault(); inputChave.type = 'password'; });
  }

  // Valor PIX: Range Slider e Ajuste Fino
  const rangeValor = document.getElementById('valor-pix-range');
  const hiddenValor = document.getElementById('valor-pix');
  const displayValor = document.getElementById('valor-display');
  const btnMenos = document.getElementById('btn-menos-centavo');
  const btnMais = document.getElementById('btn-mais-centavo');

  function updateValorDisplay(val) {
    if (val < 0.01) val = 0.01;
    const maxVal = parseFloat(rangeValor.max) || 0.01;
    if (val > maxVal) val = maxVal;
    
    hiddenValor.value = val.toFixed(2);
    rangeValor.value = val.toFixed(2);
    displayValor.textContent = val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  if (rangeValor) {
    rangeValor.addEventListener('input', function() {
      updateValorDisplay(parseFloat(this.value));
    });
    
    if (btnMenos) btnMenos.addEventListener('click', () => {
      updateValorDisplay(parseFloat(hiddenValor.value) - 0.01);
    });
    
    if (btnMais) btnMais.addEventListener('click', () => {
      updateValorDisplay(parseFloat(hiddenValor.value) + 0.01);
    });
    
    // Iniciar com 0.01
    updateValorDisplay(0.01);
  }

  // Swipe to Submit (Deslize para Confirmar)
  const knob = document.getElementById('swipe-knob');
  const track = document.getElementById('swipe-track');
  const container = document.querySelector('.swipe-container');
  const swipeText = document.getElementById('swipe-text');
  const realSubmitBtn = document.getElementById('real-submit-btn');

  if (knob && container) {
    let isDragging = false;
    let startX = 0;
    
    function getOffsetLeft(elem) {
      let offsetLeft = 0;
      do {
        if (!isNaN(elem.offsetLeft)) offsetLeft += elem.offsetLeft;
      } while (elem = elem.offsetParent);
      return offsetLeft;
    }
    
    function onMove(clientX) {
      if (!isDragging) return;
      const maxSwipe = container.offsetWidth - knob.offsetWidth - 8; // 8 = padding
      let x = clientX - startX;
      if (x < 0) x = 0;
      if (x > maxSwipe) x = maxSwipe;
      
      knob.style.left = (x + 4) + 'px';
      track.style.width = (x + knob.offsetWidth / 2) + 'px';
      swipeText.style.opacity = 1 - (x / maxSwipe);
      
      if (x >= maxSwipe - 5) {
        // Chegou ao fim = Disparar Submit
        isDragging = false;
        knob.style.cursor = 'default';
        swipeText.textContent = 'Enviando...';
        swipeText.style.opacity = 1;
        realSubmitBtn.click();
      }
    }
    
    knob.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - (parseInt(knob.style.left) - 4 || 0);
      knob.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => { onMove(e.clientX); });
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        knob.style.cursor = 'grab';
        // Se soltou antes de completar, volta ao começo
        knob.style.left = '4px';
        track.style.width = '0px';
        swipeText.style.opacity = 1;
      }
    });

    // Suporte para Touch (Celulares)
    knob.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].clientX - (parseInt(knob.style.left) - 4 || 0);
    });
    document.addEventListener('touchmove', (e) => { 
      if (isDragging) e.preventDefault(); // Evita scroll
      onMove(e.touches[0].clientX); 
    }, {passive: false});
    document.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        knob.style.left = '4px';
        track.style.width = '0px';
        swipeText.style.opacity = 1;
      }
    });
  }

  // ──────────────────────────────────────────
  // 2. ABA RECEBER PIX
  // ──────────────────────────────────────────
  
  // QR Code Borrado (Blur)
  const qrBlur = document.getElementById('qr-code-blur');
  const btnSegurar = document.getElementById('btn-segurar-qr');
  
  if (qrBlur && btnSegurar) {
    btnSegurar.addEventListener('mousedown', () => { qrBlur.style.filter = 'blur(0)'; });
    btnSegurar.addEventListener('mouseup', () => { qrBlur.style.filter = 'blur(12px)'; });
    btnSegurar.addEventListener('mouseleave', () => { qrBlur.style.filter = 'blur(12px)'; });
    btnSegurar.addEventListener('touchstart', (e) => { e.preventDefault(); qrBlur.style.filter = 'blur(0)'; });
    btnSegurar.addEventListener('touchend', (e) => { e.preventDefault(); qrBlur.style.filter = 'blur(12px)'; });
  }

  // Chaves Fragmentadas (Dividir em 4 inputs para dificultar a cópia)
  const fragmentContainers = document.querySelectorAll('.fragmented-key');
  fragmentContainers.forEach(container => {
    const chaveTotal = container.dataset.chave;
    if (!chaveTotal) return;
    
    const list = container.querySelector('.fragment-list');
    const chunkSize = Math.ceil(chaveTotal.length / 4);
    
    for (let i = 0; i < 4; i++) {
      const chunk = chaveTotal.substring(i * chunkSize, (i + 1) * chunkSize);
      if (!chunk) continue;
      
      const div = document.createElement('div');
      div.style.cssText = 'display:flex; gap:8px; width: 100%;';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input';
      input.value = chunk;
      input.readOnly = true;
      input.style.cssText = 'font-family: monospace; font-size: 0.8rem; padding: 6px; text-align:center; user-select:none;';
      
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--sm btn--secondary';
      btn.style.cssText = 'padding: 6px 12px; white-space: nowrap;';
      btn.textContent = `Copiar P.${i + 1}`;
      btn.onclick = () => { window.ZicaPay.copyToClipboard(chunk, btn); };
      
      div.appendChild(input);
      div.appendChild(btn);
      list.appendChild(div);
    }
  });

  // ──────────────────────────────────────────
  // 3. ABA CHAVES PIX
  // ──────────────────────────────────────────
  
  // Slider de Tipo de Chave (Substitui Select)
  const sliderTipo = document.getElementById('tipo_chave_slider');
  const selectTipo = document.getElementById('tipo_chave');
  const labelTipo = document.getElementById('tipo_chave_label');
  
  if (sliderTipo && selectTipo) {
    const mapVal = {
      '1': { val: 'cpf', text: 'CPF' },
      '2': { val: 'email', text: 'E-mail' },
      '3': { val: 'telefone', text: 'Telefone' },
      '4': { val: 'aleatoria', text: 'Chave aleatória' }
    };
    
    sliderTipo.addEventListener('input', function() {
      const info = mapVal[this.value];
      selectTipo.value = info.val;
      labelTipo.textContent = info.text;
      
      // Dispara a função original que muda o placeholder do input de chave
      if (typeof updateKeyPlaceholder === 'function') {
        updateKeyPlaceholder(selectTipo);
      }
    });
    
    // Força sincronização inicial
    sliderTipo.dispatchEvent(new Event('input'));
  }

});
