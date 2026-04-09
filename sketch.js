let imgImage1RemovebgPreview;
let scratchLayer;
let particles = [];
let floatingParticles = [];
let instructionAlpha = 255;
let isMobile = false;
let cnv;
let imageDisplayWidth;
let imageDisplayHeight;
let scratchTotalPixels = 0;
let revealTriggered = false;
let scratchOpacity = 255;
let scratchSize = 120;
let floatingParticleCount = 8;

const SCRATCH_REVEAL_RATIO = 0.65;
const COLOR_BG = 10;
const MOBILE_BREAKPOINT = 767;

function getViewportSize() {
  const viewport = window.visualViewport;
  const viewportWidth = viewport
    ? viewport.width
    : document.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = viewport
    ? viewport.height
    : document.documentElement.clientHeight || window.innerHeight;

  return {
    width: Math.max(320, Math.round(viewportWidth)),
    height: Math.max(320, Math.round(viewportHeight))
  };
}

function preload() {
  imgImage1RemovebgPreview = loadImage('photo_Robin.png');
}

function setup() {
  const viewport = getViewportSize();

  cnv = createCanvas(viewport.width, viewport.height);
  pixelDensity(1);
  imageMode(CENTER);
  updateDeviceProfile();
  updateImageDimensions();

  cnv.elt.style.touchAction = 'none';
  cnv.elt.addEventListener(
    'touchmove',
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );

  createScratchLayer();
  drawPremiumSilhouette();
  resetFloatingParticles();
}

function updateDeviceProfile() {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  isMobile = hasTouch && width <= MOBILE_BREAKPOINT;
  scratchSize = isMobile ? 88 : 120;
  floatingParticleCount = isMobile ? 5 : 8;
  frameRate(isMobile ? 60 : 120);
}

function createScratchLayer() {
  scratchLayer = createGraphics(width, height);
  scratchLayer.pixelDensity(1);
  scratchLayer.imageMode(CENTER);
}

function resetFloatingParticles() {
  floatingParticles = [];
  for (let i = 0; i < floatingParticleCount; i++) {
    floatingParticles.push(new FloatingParticle());
  }
}

function updateImageDimensions() {
  const safePadding = max(24, min(width, height) * (isMobile ? 0.08 : 0.12));
  const maxWidth = max(160, width - safePadding * 2);
  const maxHeight = max(160, height - safePadding * 2);
  const scale = min(
    maxWidth / imgImage1RemovebgPreview.width,
    maxHeight / imgImage1RemovebgPreview.height
  );

  imageDisplayWidth = imgImage1RemovebgPreview.width * scale;
  imageDisplayHeight = imgImage1RemovebgPreview.height * scale;
}

function drawPremiumSilhouette() {
  scratchLayer.clear();
  scratchLayer.image(
    imgImage1RemovebgPreview,
    width / 2,
    height / 2,
    imageDisplayWidth,
    imageDisplayHeight
  );

  const ctx = scratchLayer.drawingContext;
  ctx.globalCompositeOperation = 'source-in';

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1e1b4b');
  gradient.addColorStop(1, '#0f172a');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  scratchLayer.loadPixels();
  scratchTotalPixels = 0;

  for (let i = 0; i < scratchLayer.pixels.length; i += 4) {
    if (scratchLayer.pixels[i + 3] > 10) {
      scratchTotalPixels++;
    }
  }
}

function draw() {
  background(COLOR_BG);
  image(imgImage1RemovebgPreview, width / 2, height / 2, imageDisplayWidth, imageDisplayHeight);

  if (revealTriggered) {
    scratchOpacity = lerp(scratchOpacity, 0, 0.04);
  }

  if (scratchOpacity > 1) {
    const pulseFactor = 1 + sin(frameCount * 0.05) * 0.05;
    const effectiveOpacity = scratchOpacity * pulseFactor;

    push();
    tint(255, effectiveOpacity);
    image(scratchLayer, width / 2, height / 2);
    pop();
  }

  if (!isMobile && mouseIsPressed && !revealTriggered) {
    scratchAtPointer(mouseX, mouseY);
    instructionAlpha = lerp(instructionAlpha, 0, 0.1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].finished()) {
      particles.splice(i, 1);
    }
  }

  for (const floatingParticle of floatingParticles) {
    floatingParticle.update();
    floatingParticle.display();
  }

  displayUI();

  if (!isMobile) {
    drawCursor();
  }
}

function scratchAtPointer(pointerX, pointerY) {
  if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY)) {
    return;
  }

  scratchLayer.push();
  scratchLayer.erase(255, 255);
  scratchLayer.noStroke();
  scratchLayer.ellipse(pointerX, pointerY, scratchSize, scratchSize);
  scratchLayer.noErase();
  scratchLayer.pop();

  if (frameCount % 3 === 0) {
    particles.push(new Spark(pointerX, pointerY));
  }

  if (frameCount % (isMobile ? 8 : 15) === 0) {
    checkScratchProgress();
  }
}

function scratchFromTouches() {
  if (touches.length === 0) {
    scratchAtPointer(mouseX, mouseY);
    return;
  }

  for (const touch of touches) {
    scratchAtPointer(touch.x, touch.y);
  }
}

function checkScratchProgress() {
  scratchLayer.loadPixels();
  let remaining = 0;

  for (let i = 0; i < scratchLayer.pixels.length; i += 16) {
    if (scratchLayer.pixels[i + 3] > 10) {
      remaining++;
    }
  }

  const scratched = 1 - remaining / (scratchTotalPixels / 4);

  if (!revealTriggered && scratched >= SCRATCH_REVEAL_RATIO) {
    revealTriggered = true;
    instructionAlpha = 0;
  }
}

function displayUI() {
}

function drawCursor() {
  const cursorSize = max(30, scratchSize * 0.35);

  push();
  translate(mouseX, mouseY);
  noFill();
  stroke(255, 80);
  strokeWeight(1);
  ellipse(0, 0, cursorSize, cursorSize);
  fill(255, 120);
  noStroke();
  ellipse(0, 0, 4, 4);
  pop();
}

class FloatingParticle {
  constructor() {
    this.reset();
  }

  reset() {
    const radiusX = imageDisplayWidth / 2 + random(0, 12);
    const radiusY = imageDisplayHeight / 2 + random(0, 12);

    this.angle = random(TWO_PI);
    this.x = width / 2 + cos(this.angle) * radiusX;
    this.y = height / 2 + sin(this.angle) * radiusY;
    this.direction = this.angle + random(-PI / 2, PI / 2);
    this.speed = random(isMobile ? 0.8 : 1, isMobile ? 2.2 : 3);
    this.alpha = 255;
    this.size = random(2, 5);
    this.col = random() > 0.5 ? color(168, 85, 247) : color(45, 212, 191);
  }

  update() {
    this.x += cos(this.direction) * this.speed;
    this.y += sin(this.direction) * this.speed;
    this.alpha -= 3;

    if (this.alpha <= 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.reset();
    }
  }

  display() {
    push();
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = this.col;
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    ellipse(this.x, this.y, this.size);
    pop();
  }
}

class Spark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1.5, 1.5);
    this.vy = random(-2, -0.5);
    this.alpha = 255;
    this.size = random(1, 3);
    this.col = random() > 0.5 ? color(168, 85, 247) : color(45, 212, 191);
  }

  finished() {
    return this.alpha < 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }

  display() {
    push();
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = this.col;
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    ellipse(this.x, this.y, this.size);
    pop();
  }
}

function touchStarted() {
  if (!revealTriggered) {
    scratchFromTouches();
    instructionAlpha = lerp(instructionAlpha, 0, 0.1);
  }

  return false;
}

function touchMoved() {
  if (!revealTriggered) {
    scratchFromTouches();
    instructionAlpha = lerp(instructionAlpha, 0, 0.1);
  }

  return false;
}

function touchEnded() {
  return false;
}

function windowResized() {
  const viewport = getViewportSize();

  resizeCanvas(viewport.width, viewport.height);
  updateDeviceProfile();
  updateImageDimensions();
  createScratchLayer();
  drawPremiumSilhouette();
  scratchOpacity = 255;
  instructionAlpha = 255;
  revealTriggered = false;
  particles = [];
  resetFloatingParticles();
}
