export function NoScriptWarning() {
  const css = `
    html, body {
      height: 100vh;
      width: 100vw;
      margin: 0;
      padding: 0;
      background: #000;
    }

    noscript {
      height: 100vh;
      width: 100vw;
      display: block;
      background: #000;
      margin: 0;
      padding: 10px;
      color: #fff;
      font-family: monospace;
      font-size: 1.2em;
      box-sizing: border-box;
    }

    .bold {
      font-weight: bold;
      display: block;
    }

    p {
      display: block;
    }

    h3 {
      color: red;
    }

    a {
      color: lightblue;
    }
  `;

  return (
    <noscript>
      <style>{css}</style>

      <span className="bold">Joey de Ruiter</span>

      <h3>ERROR: No JS detected</h3>

      <p>Javascript is required for this website to work.</p>
      <p>If you&apos;re interested in my resume, you can download my CV from <a href="/assets/cv/Joey_de_Ruiter_resume.pdf" target="_blank">here</a>.</p>
    </noscript>
  );
}
