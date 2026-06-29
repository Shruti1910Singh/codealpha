(function() {
  var saved = localStorage.getItem('cw-theme');
  if (saved === 'dark') document.body.classList.add('dark');
})();
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('cw-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}
function toggleMenu() {
  var nl = document.getElementById('nav-links');
  if (nl) nl.classList.toggle('open');
}
