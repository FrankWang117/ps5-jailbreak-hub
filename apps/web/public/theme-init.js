// Runs before the app styles to apply the user's theme without a light/dark flash.
(function () {
  var theme;
  try {
    theme = localStorage.getItem('ps5-hub-theme');
  } catch {
    // Storage may be blocked; the page still follows the system preference.
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }
  document.documentElement.dataset.theme = theme;
})();
