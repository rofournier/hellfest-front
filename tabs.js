// Gestion de l'onglet actif selon la page

document.addEventListener('DOMContentLoaded', function () {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const path = window.location.pathname;
  tabButtons.forEach(btn => btn.classList.remove('active'));
  if (path.endsWith('apero.html')) {
    document.querySelector('.tab-btn[data-tab="apero"]').classList.add('active');
  } else {
    document.querySelector('.tab-btn[data-tab="home"]').classList.add('active');
  }
  // Ajoute la redirection simple sur clic
  document.querySelector('.tab-btn[data-tab="home"]').onclick = () => { window.location.href = 'index.html'; };
  document.querySelector('.tab-btn[data-tab="apero"]').onclick = () => { window.location.href = 'apero.html'; };
}); 