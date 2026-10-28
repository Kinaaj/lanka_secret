// Synchronizace hover efektů
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('mainContainer');
  const blueSection = document.getElementById('blueSection');
  const redSection = document.getElementById('redSection');

  if (!container) return;

  // Modrá strana
  if (blueSection) {
    blueSection.addEventListener('mouseenter', () => container.classList.add('active-blue'));
    blueSection.addEventListener('mouseleave', () => container.classList.remove('active-blue'));
  }

  // Červená strana
  if (redSection) {
    redSection.addEventListener('mouseenter', () => container.classList.add('active-red'));
    redSection.addEventListener('mouseleave', () => container.classList.remove('active-red'));
  }
});
