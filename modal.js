// Metal Pseudo Modal Logic
(function() {
  function showPseudoModal() {
    if (document.getElementById('metal-pseudo-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'metal-pseudo-modal';
    modal.innerHTML = `
      <div class="metal-modal-backdrop"></div>
      <div class="metal-modal-content">
        <div class="metal-modal-title">Pseudo</div>
        <input type="text" id="metal-pseudo-input" class="metal-modal-input" maxlength="20" placeholder="Claude..." autofocus />
        <button id="metal-modal-ok" class="metal-modal-ok-btn">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    const input = document.getElementById('metal-pseudo-input');
    input.focus();
    function validate() {
      let pseudo = input.value.trim().slice(0, 20);
      if (!pseudo) {
        input.classList.add('error');
        input.focus();
        return;
      }
      localStorage.setItem('hellpseudo', pseudo);
      document.body.classList.remove('modal-open');
      modal.remove();
      // Dispatch custom event for immediate notification
      window.dispatchEvent(new CustomEvent('pseudoSet', { detail: pseudo }));
    }
    document.getElementById('metal-modal-ok').onclick = validate;
    input.onkeydown = function(e) {
      if (e.key === 'Enter') validate();
    };
    modal.addEventListener('click', function(e) {
      if (e.target.classList.contains('metal-modal-backdrop')) {
        input.focus();
      }
    });
  }
  if (!localStorage.getItem('hellpseudo')) {
    window.addEventListener('DOMContentLoaded', showPseudoModal);
  }
})();

// Band Image Modal Logic
(function() {
  let currentImageModal = null;

  window.showBandImageModal = function(band) {
    if (currentImageModal) {
      currentImageModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'metal-image-modal';
    modal.innerHTML = `
      <div class="metal-modal-backdrop"></div>
      <div class="metal-image-modal-content">
        <div class="metal-image-modal-close">✕</div>
        <div class="metal-image-modal-title">${band.name}</div>
        <div class="metal-image-modal-details">
          <div class="metal-image-modal-info">
            <span class="info-label">Stage:</span> ${band.stage}
          </div>
          <div class="metal-image-modal-info">
            <span class="info-label">Date:</span> ${band.date}
          </div>
          <div class="metal-image-modal-info">
            <span class="info-label">Time:</span> ${band.time}
          </div>
          <div class="metal-image-modal-info">
            <span class="info-label">Genre:</span> ${band.genre}
          </div>
        </div>
        <div class="metal-image-modal-img-container">
          <img src="${band.img}" alt="${band.name}" class="metal-image-modal-img" />
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    currentImageModal = modal;

    // Add close functionality
    const closeModal = () => {
      document.body.classList.remove('modal-open');
      modal.remove();
      currentImageModal = null;
    };

    modal.querySelector('.metal-image-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
      if (e.target.classList.contains('metal-modal-backdrop')) {
        closeModal();
      }
    });

    // Add escape key listener
    const escapeListener = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeListener);
      }
    };
    document.addEventListener('keydown', escapeListener);
  };
})(); 