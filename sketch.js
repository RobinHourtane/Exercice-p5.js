// --- VARIABLES GLOBALES ---
let imgImage1RemovebgPreview;
let scratchLayer;
let particles = [];
let floatingParticles = []; // Particules flottantes autour de la zone
let instructionAlpha = 255;
let isMobile = false;
let cnv;
let imageDisplayWidth;
let imageDisplayHeight;
let scratchTotalPixels = 0;
let revealTriggered = false;
let scratchOpacity = 255; // Pour l'effet de fondu à la fin

// --- PARAMÈTRES PREMIUM ---
const SCRATCH_SIZE = 120; // Un peu plus grand pour un grattage fluide
const SCRATCH_REVEAL_RATIO = 0.65; // Révélation un peu plus tôt pour éviter la frustration
const COLOR_BG = 10;

// Charge l'image avant le démarrage du programme
function preload() {
  imgImage1RemovebgPreview = loadImage('photo_Robin.png');
}

// Initialise le canvas, les paramètres et les éléments graphiques
function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  frameRate(120); // Augmenté à 120 FPS pour une fluidité maximale du curseur
  imageMode(CENTER);
  
  isMobile = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && width < 767;
  updateImageDimensions();
  
  cnv.elt.style.touchAction = 'none';
  cnv.elt.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });

  scratchLayer = createGraphics(windowWidth, windowHeight);
  drawPremiumSilhouette();

  // Génère les particules flottantes autour de la zone
  for (let i = 0; i < 8; i++) {
    floatingParticles.push(new FloatingParticle());
  }
}

// Calcule les dimensions d'affichage de l'image pour qu'elle s'adapte à la fenêtre
function updateImageDimensions() {
  let scale = min(width / imgImage1RemovebgPreview.width, height / imgImage1RemovebgPreview.height);
  imageDisplayWidth = imgImage1RemovebgPreview.width * scale;
  imageDisplayHeight = imgImage1RemovebgPreview.height * scale;
}

// Crée la couche de grattage avec un dégradé élégant sur la forme de l'image
function drawPremiumSilhouette() {
  scratchLayer.clear();
  
  // 1. Dessiner l'image qui servira de masque
  scratchLayer.imageMode(CENTER);
  scratchLayer.image(imgImage1RemovebgPreview, width / 2, height / 2, imageDisplayWidth, imageDisplayHeight);
  
  // 2. Appliquer un dégradé élégant uniquement SUR la forme de l'image (Méthode Pro)
  let ctx = scratchLayer.drawingContext;
  ctx.globalCompositeOperation = 'source-in';
  
  let gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1e1b4b'); // Violet très très sombre
  gradient.addColorStop(1, '#0f172a'); // Bleu ardoise très sombre
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.globalCompositeOperation = 'source-over'; // Reset

  // Calculer la zone à gratter initiale
  scratchLayer.loadPixels();
  scratchTotalPixels = 0;
  for (let i = 0; i < scratchLayer.pixels.length; i += 4) {
    if (scratchLayer.pixels[i + 3] > 10) scratchTotalPixels++;
  }
}

// Fonction principale appelée à chaque frame pour dessiner l'animation
function draw() {
  background(COLOR_BG);

  // L'image de base (La photo révélée)
  image(imgImage1RemovebgPreview, width / 2, height / 2, imageDisplayWidth, imageDisplayHeight);

  // Gestion de la couche à gratter et de son fondu de disparition
  if (revealTriggered) {
    scratchOpacity = lerp(scratchOpacity, 0, 0.04); // Fondu en douceur
  }

  if (scratchOpacity > 1) {
    // Ajout d'une pulsation pour simuler une brillance de la forme elle-même
    let pulseFactor = 1 + sin(frameCount * 0.05) * 0.1; // Pulsation subtile
    let effectiveOpacity = scratchOpacity * pulseFactor;
    push();
    tint(255, effectiveOpacity);
    image(scratchLayer, width / 2, height / 2);
    pop();
  }

  if (mouseIsPressed && !revealTriggered) {
    scratch();
    instructionAlpha = lerp(instructionAlpha, 0, 0.1);
  }

  // Particules premium (Étincelles)
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].finished()) particles.splice(i, 1);
  }

  // Particules flottantes autour de la zone pour attirer l'attention
  for (let fp of floatingParticles) {
    fp.update();
    fp.display();
  }

  displayUI();

  if (!isMobile) drawCursor();
}

// Effectue le grattage à la position de la souris et génère des particules
function scratch() {
  scratchLayer.push();
  scratchLayer.erase(255, 255); // Effacement doux (anti-aliasing natif)
  scratchLayer.noStroke();
  scratchLayer.ellipse(mouseX, mouseY, SCRATCH_SIZE, SCRATCH_SIZE);
  scratchLayer.noErase();
  scratchLayer.pop();

  // Apparition d'étincelles
  if (frameCount % 3 === 0) {
    particles.push(new Spark(mouseX, mouseY));
  }

  // Optimisation : On ne vérifie les pixels que toutes les 15 frames pour préserver le framerate
  if (frameCount % 15 === 0) {
    checkScratchProgress();
  }
}

// Vérifie le pourcentage de la zone grattée et déclenche la révélation si nécessaire
function checkScratchProgress() {
  scratchLayer.loadPixels();
  let remaining = 0;
  // Optimisation : on saute des pixels pour compter beaucoup plus vite
  for (let i = 0; i < scratchLayer.pixels.length; i += 16) {
    if (scratchLayer.pixels[i + 3] > 10) {
      remaining++;
    }
  }
  
  // Total divisé par 4 car on vérifie 1 pixel sur 4 (16 octets)
  let scratched = 1 - (remaining / (scratchTotalPixels / 4));
  
  if (!revealTriggered && scratched >= SCRATCH_REVEAL_RATIO) {
    revealTriggered = true;
    instructionAlpha = 0;
  }
}

// Affiche l'interface utilisateur, comme le texte d'instruction
function displayUI() {
  if (instructionAlpha > 1 && !revealTriggered) {
    push();
    textAlign(CENTER, CENTER);
    textFont('Inter, system-ui, sans-serif'); 
    textStyle(BOLD);
    textSize(14); // Plus petit, plus raffiné
    letterSpacing = 2; // Simulé : on peut aussi espacer manuellement si besoin
    
    fill(255, instructionAlpha * 0.7);
    text("DÉCOUVREZ-MOI", width / 2, height - 80);
    
    // Ligne décorative minimaliste
    stroke(255, instructionAlpha * 0.2);
    strokeWeight(1);
    line(width/2 - 30, height - 60, width/2 + 30, height - 60);
    pop();
  }
}

// Dessine le curseur personnalisé pour indiquer la zone de grattage
function drawCursor() {
  push();
  translate(mouseX, mouseY);
  noFill();
  stroke(255, 80); // Contour très léger
  strokeWeight(1);
  ellipse(0, 0, 40, 40);
  fill(255, 120);
  noStroke();
  ellipse(0, 0, 4, 4); // Point central minimaliste
  pop();
}

// --- CLASSE FLOATING PARTICLE (Particules flottantes autour de la zone) ---
// Classe pour créer des particules qui pulsent sur le contour de la forme pour simuler une brillance
class FloatingParticle {
  constructor() {
    this.angle = random(TWO_PI);
    this.radiusOffset = random(5, 15); // Distance fixe du contour
    this.pulseSpeed = random(0.05, 0.1); // Vitesse de pulsation
    this.baseAlpha = random(100, 200);
    this.alpha = this.baseAlpha;
    this.size = random(2, 5);
    this.col = random() > 0.5 ? color(168, 85, 247) : color(45, 212, 191); // Violet ou cyan
  }
  
  update() {
    // Pulsation de l'alpha pour un effet de "battement"
    this.alpha = this.baseAlpha + sin(frameCount * this.pulseSpeed) * 50;
    this.alpha = constrain(this.alpha, 50, 255);
  }
  
  display() {
    // Position fixe sur le contour de la forme
    let radiusX = imageDisplayWidth / 2 + this.radiusOffset;
    let radiusY = imageDisplayHeight / 2 + this.radiusOffset;
    let x = width / 2 + cos(this.angle) * radiusX;
    let y = height / 2 + sin(this.angle) * radiusY;
    push();
    // Effet de lueur pour la brillance
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = this.col;
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    ellipse(x, y, this.size);
    pop();
  }
}

// --- CLASSE SPARK (Étincelles au lieu de poussière) ---
// Classe pour créer et gérer les particules d'étincelles lors du grattage
class Spark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1.5, 1.5);
    this.vy = random(-2, -0.5); // Flotte vers le haut
    this.alpha = 255;
    this.size = random(1, 3);
    // Couleurs de ton site : Cyan ou Violet
    this.col = random() > 0.5 ? color(168, 85, 247) : color(45, 212, 191);
  }
  
  finished() { return this.alpha < 0; }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }
  
  display() {
    push();
    // Effet de lueur (glow)
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = this.col;
    
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    ellipse(this.x, this.y, this.size);
    pop();
  }
}

// Gère le redimensionnement de la fenêtre en ajustant le canvas et les éléments
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateImageDimensions();
  drawPremiumSilhouette();
  revealTriggered = false; // Permet de regratter si on redimensionne
  scratchOpacity = 255;
  // Régénère les particules flottantes
  floatingParticles = [];
  for (let i = 0; i < 8; i++) {
    floatingParticles.push(new FloatingParticle());
  }
}