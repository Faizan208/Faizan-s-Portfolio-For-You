/** Safe, idempotent menu installer. Run from the folder containing index.html. */
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const file=path.join(root,'index.html');
if(!fs.existsSync(file)){
  console.error('ERROR: Run this from faizan-portfolio, the folder containing index.html.');
  process.exit(1);
}
const original=fs.readFileSync(file,'utf8');
if(!original.includes('id="hero"')||!original.includes('id="featured-work"')){
  console.error('ERROR: This is not the expected homepage. No files changed.');
  process.exit(1);
}
let html=original;
if(!html.includes('css/hero-menu.css')){
  const css=/<link\b[^>]*href=["']css\/style\.css["'][^>]*>/i;
  if(!css.test(html))throw Error('Missing css/style.css reference. No files changed.');
  html=html.replace(css, found=>found+'\n  <link rel="stylesheet" href="css/hero-menu.css">');
}
if(!html.includes('id="heroPageMenu"')){
  const heading=/<h1\b[^>]*id=["']heroTitle["'][^>]*>[\s\S]*?<\/h1>/i;
  if(!heading.test(html))throw Error('Cannot find heroTitle; no files changed.');
  const nav=`
        <!-- Three-page navigation: HERO only, never a sticky whole-site navbar. -->
        <nav class="hero-page-menu" id="heroPageMenu" aria-label="Portfolio pages">
          <button class="hero-menu-toggle" type="button" id="heroMenuToggle"
            aria-label="Open page menu" aria-controls="heroMenuPanel" aria-expanded="false">
            <span>MENU</span><span class="hero-menu-lines" aria-hidden="true"><i></i><i></i></span>
          </button>
          <div class="hero-menu-panel" id="heroMenuPanel" hidden>
            <div class="hero-menu-kicker"><span>FAIZAN / PAGE INDEX</span><span>01—03</span></div>
            <a class="hero-menu-link" href="index.html" aria-current="page"><small>01</small><span>Home</span><b aria-hidden="true">↗</b></a>
            <a class="hero-menu-link" href="about.html"><small>02</small><span>About me</span><b aria-hidden="true">↗</b></a>
            <a class="hero-menu-link" href="project-inquiry.html"><small>03</small><span>Project inquiry</span><b aria-hidden="true">↗</b></a>
            <div class="hero-menu-foot">THREE PAGES. ONE STORY.</div>
          </div>
        </nav>`;
  html=html.replace(heading, match=>match+nav);
}
if(!html.includes('js/hero-menu.js')){
  if(!html.includes('</body>'))throw Error('Missing closing body tag; no files changed.');
  html=html.replace('</body>','  <script src="js/hero-menu.js" defer></script>\n</body>');
}
if(original===html){console.log('Page menu is already installed; nothing changed.');}
else{
  const backups=path.join(root,'private-voice-output');
  fs.mkdirSync(backups,{recursive:true});
  const backup=path.join(backups,'index-before-about-menu.html');
  if(!fs.existsSync(backup))fs.writeFileSync(backup,original,'utf8');
  fs.writeFileSync(file,html,'utf8');
  console.log('SUCCESS: Hero menu installed into your current index.html.');
  console.log('Backup: private-voice-output/index-before-about-menu.html');
}
