// Intentionally conservative browser APIs for the console-facing static page.
var checkButton = document.getElementById('check');
var result = document.getElementById('result');
if (checkButton && result) {
  checkButton.addEventListener('click', function () {
    if (result)
      result.textContent =
        '页面 JavaScript 正常。未检测型号、固件或漏洞兼容性，兼容性仍为未知。';
  });
}
