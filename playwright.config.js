/* Um arquivo, um navegador, nenhum servidor: o painel e uma pagina estatica e o teste
   a abre por file://. Qualquer coisa alem disto seria cerimonia sem medicao. */
module.exports = {
  testDir: './testes',
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { viewport: {width: 1280, height: 900} },
  projects: [{name:'chromium', use:{browserName:'chromium'}}],
};
