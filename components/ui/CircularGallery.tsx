// @ts-nocheck

'use client';

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { mat4, vec4 } from 'gl-matrix';
import { useEffect, useMemo, useRef } from 'react';

type GalleryItem = {
  id?: string;
  userId?: string;
  image: string;
  name?: string;
  title?: string;
  text?: string;
  role?: string;
  subTitle?: string;
  subtitle?: string;
  onClick?: (item: GalleryItem) => void;
  [key: string]: any;
};

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as T;
}

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: any) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key !== 'constructor' && typeof instance[key] === 'function') {
      instance[key] = instance[key].bind(instance);
    }
  });
}

function createTextTexture(
  gl: any,
  text: string,
  font = 'bold 30px sans-serif',
  color = 'white',
  align: 'left' | 'center' | 'right' = 'left'
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to get 2D context');
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(parseInt(font, 10) * 1.2);
  const padX = 28;
  const padY = 18;
  canvas.width = textWidth + padX * 2;
  canvas.height = textHeight + padY * 2;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = align;
  context.clearRect(0, 0, canvas.width, canvas.height);

  const x = align === 'left' ? padX : align === 'right' ? canvas.width - padX : canvas.width / 2;
  context.fillText(text, x, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  gl: any;
  plane: any;
  renderer: any;
  text: string;
  textColor: string;
  font: string;
  y: number;
  heightFactor: number;
  align: 'left' | 'center' | 'right';
  marginXFactor: number;
  mesh: any;

  constructor({
    gl,
    plane,
    renderer,
    text,
    textColor = '#ffffff',
    font = '700 26px sans-serif',
    y = 0,
    heightFactor = 0.1,
    align = 'left',
    marginXFactor = 0.06
  }: {
    gl: any;
    plane: any;
    renderer: any;
    text: string;
    textColor?: string;
    font?: string;
    y?: number;
    heightFactor?: number;
    align?: 'left' | 'center' | 'right';
    marginXFactor?: number;
  }) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.y = y;
    this.heightFactor = heightFactor;
    this.align = align;
    this.marginXFactor = marginXFactor;
    this.createMesh();
  }
  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor, this.align);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * this.heightFactor;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    const marginX = this.plane.scale.x * this.marginXFactor;
    if (this.align === 'left') {
      this.mesh.position.x = -this.plane.scale.x * 0.5 + textWidth * 0.5 + marginX;
    } else if (this.align === 'right') {
      this.mesh.position.x = this.plane.scale.x * 0.5 - textWidth * 0.5 - marginX;
    } else {
      this.mesh.position.x = 0;
    }
    this.mesh.position.y = this.y;
    this.mesh.setParent(this.plane);
  }
}

class Media {
  extra: number;
  geometry: any;
  gl: any;
  image: string;
  index: number;
  length: number;
  renderer: any;
  scene: any;
  screen: any;
  titleText: string;
  subtitleText?: string;
  viewport: any;
  bend: number;
  textColor: string;
  borderRadius: number;
  font: string;
  plane: any;
  program: any;
  title: any;
  subtitle?: any;
  width: number;
  widthTotal: number;
  x: number;
  padding: number;
  speed: number;
  isBefore: boolean;
  isAfter: boolean;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    title,
    subtitle,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font
  }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.titleText = title;
    this.subtitleText = subtitle;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uOverlayStrength;
        uniform float uOverlayHeight;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);

          // Bottom tint for text readability (fade out before ~3/8 height)
          float overlay = smoothstep(uOverlayHeight, 0.0, vUv.y);
          float overlayAlpha = overlay * uOverlayStrength;
          color.rgb = mix(color.rgb, vec3(0.0), overlayAlpha);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          // Smooth antialiasing for edges
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
        uOverlayStrength: { value: 0.65 },
        uOverlayHeight: { value: 0.375 }
      },
      transparent: true
    });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }
  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }
  createTitle() {
    const baseY = -this.plane.scale.y * 0.5;
    const titleY = baseY + this.plane.scale.y * 0.14;
    const subtitleY = baseY + this.plane.scale.y * 0.075;

    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.titleText,
      textColor: this.textColor,
      font: this.font,
      y: titleY,
      heightFactor: 0.09,
      align: 'left'
    });

    if (this.subtitleText) {
      this.subtitle = new Title({
        gl: this.gl,
        plane: this.plane,
        renderer: this.renderer,
        text: this.subtitleText,
        textColor: 'rgba(255,255,255,0.85)',
        font: '600 16px sans-serif',
        y: subtitleY,
        heightFactor: 0.06,
        align: 'left'
      });
    }
  }
  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }
  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  container: any;
  scrollSpeed: number;
  scroll: any;
  onCheckDebounce: any;
  renderer: any;
  gl: any;
  camera: any;
  scene: any;
  screen: any;
  viewport: any;
  planeGeometry: any;
  mediasImages: GalleryItem[];
  medias: any[];
  raf: number;
  isDown: boolean;
  start: number;
  onItemClick?: (item: GalleryItem, index: number) => void;
  clickThresholdPx: number;
  clickMaxDurationMs: number;
  originalItems: GalleryItem[];
  downX: number;
  downY: number;
  downAt: number;
  moved: boolean;

  constructor(
    container,
    {
      items,
      bend,
      textColor = '#ffffff',
      borderRadius = 0,
      font = 'bold 30px Figtree',
      scrollSpeed = 2,
      scrollEase = 0.05,
      onItemClick,
      clickThresholdPx = 6,
      clickMaxDurationMs = 320
    } = {}
  ) {
    document.documentElement.classList.remove('no-js');
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onItemClick = onItemClick;
    this.clickThresholdPx = clickThresholdPx;
    this.clickMaxDurationMs = clickMaxDurationMs;
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }
  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }
  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }
  createScene() {
    this.scene = new Transform();
  }
  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100
    });
  }
  createMedias(items: GalleryItem[] | undefined, bend = 1, textColor: string, borderRadius: number, font: string) {
    const defaultItems = [
      { image: `https://picsum.photos/seed/1/800/600?grayscale`, text: 'Bridge' },
      { image: `https://picsum.photos/seed/2/800/600?grayscale`, text: 'Desk Setup' },
      { image: `https://picsum.photos/seed/3/800/600?grayscale`, text: 'Waterfall' },
      { image: `https://picsum.photos/seed/4/800/600?grayscale`, text: 'Strawberries' },
      { image: `https://picsum.photos/seed/5/800/600?grayscale`, text: 'Deep Diving' },
      { image: `https://picsum.photos/seed/16/800/600?grayscale`, text: 'Train Track' },
      { image: `https://picsum.photos/seed/17/800/600?grayscale`, text: 'Santorini' },
      { image: `https://picsum.photos/seed/8/800/600?grayscale`, text: 'Blurry Lights' },
      { image: `https://picsum.photos/seed/9/800/600?grayscale`, text: 'New York' },
      { image: `https://picsum.photos/seed/10/800/600?grayscale`, text: 'Good Boy' },
      { image: `https://picsum.photos/seed/21/800/600?grayscale`, text: 'Coastline' },
      { image: `https://picsum.photos/seed/12/800/600?grayscale`, text: 'Palm Trees' }
    ];
    const galleryItems: GalleryItem[] = items && items.length ? items : (defaultItems as any);
    this.originalItems = galleryItems;
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => {
      const title = data.name || data.title || data.text || 'Member';
      const subtitle = data.role || data.subTitle || data.subtitle || '';
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        title,
        subtitle,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font
      });
    });
  }
  onTouchDown(e: any) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;

    this.downX = e.touches ? e.touches[0].clientX : e.clientX;
    this.downY = e.touches ? e.touches[0].clientY : e.clientY;
    this.downAt = performance.now();
    this.moved = false;
  }
  onTouchMove(e: any) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    if (!this.moved) {
      const dx = Math.abs(x - this.downX);
      const dy = Math.abs(y - this.downY);
      if (dx > this.clickThresholdPx || dy > this.clickThresholdPx) this.moved = true;
    }
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }
  onTouchUp() {
    this.isDown = false;
    this.onCheck();

    const duration = performance.now() - (this.downAt || 0);
    if (!this.moved && duration <= this.clickMaxDurationMs) {
      this.handleClick();
    }
  }
  onWheel(e) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }
  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  getActiveItem() {
    if (!this.medias || !this.medias[0] || !this.originalItems || this.originalItems.length === 0) return null;
    const width = this.medias[0].width;
    const idx = Math.round(Math.abs(this.scroll.current) / width) % this.originalItems.length;
    const item = this.originalItems[idx];
    return { index: idx, item };
  }

  handleClick() {
    const active = this.getActiveItem();
    if (!active) return;

    if (typeof this.onItemClick === 'function') {
      this.onItemClick(active.item, active.index);
      return;
    }

    if (active.item?.onClick) {
      active.item.onClick(active.item);
    }
  }
  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }
  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('mousewheel', this.boundOnWheel);
    window.addEventListener('wheel', this.boundOnWheel);
    window.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    window.addEventListener('touchstart', this.boundOnTouchDown);
    window.addEventListener('touchmove', this.boundOnTouchMove);
    window.addEventListener('touchend', this.boundOnTouchUp);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    window.removeEventListener('mousewheel', this.boundOnWheel);
    window.removeEventListener('wheel', this.boundOnWheel);
    window.removeEventListener('mousedown', this.boundOnTouchDown);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    window.removeEventListener('touchstart', this.boundOnTouchDown);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

// ==========================================
// RING GALLERY (PROFILE CARDS)
// ==========================================

const ringVertexShader = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpeed;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // subtle distortion on drag
    p.z += sin(p.x * 2.0 + uTime) * (uSpeed * 0.04);
    p.y += cos(p.x * 1.0 + uTime) * (uSpeed * 0.02);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const ringFragmentShader = `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(tMap, vUv);
    gl_FragColor = vec4(color.rgb, color.a * uAlpha);
  }
`;

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const sw = iw * scale;
  const sh = ih * scale;
  const sx = (w - sw) / 2;
  const sy = (h - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh);
}

function makeProfileCardCanvas(params: {
  img?: HTMLImageElement;
  title: string;
  subTitle: string;
  width?: number;
  height?: number;
  radius?: number;
}) {
  const width = params.width ?? 1024;
  const height = params.height ?? 1365; // ~0.75 aspect
  const radius = params.radius ?? 44;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  if (params.img) {
    drawCoverImage(ctx, params.img, width, height);
  }

  // bottom tint gradient: fade out before ~3/8 height
  const tintHeight = Math.floor(height * 0.375);
  const g = ctx.createLinearGradient(0, height, 0, height - tintHeight);
  g.addColorStop(0, 'rgba(0,0,0,0.78)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, height - tintHeight, width, tintHeight);

  const title = params.title || 'Member';
  const subTitle = params.subTitle || '';

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;

  const padX = Math.floor(width * 0.07);
  const titleY = height - Math.floor(height * 0.10);
  const subY = height - Math.floor(height * 0.06);

  ctx.fillStyle = 'rgba(255,255,255,0.98)';
  ctx.font = '800 64px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText(title, padX, titleY);

  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.font = '700 34px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText(subTitle, padX, subY);

  // rounded mask
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const octx = out.getContext('2d');
  if (!octx) return canvas;

  octx.clearRect(0, 0, width, height);
  octx.save();
  octx.beginPath();
  octx.moveTo(radius, 0);
  octx.lineTo(width - radius, 0);
  octx.quadraticCurveTo(width, 0, width, radius);
  octx.lineTo(width, height - radius);
  octx.quadraticCurveTo(width, height, width - radius, height);
  octx.lineTo(radius, height);
  octx.quadraticCurveTo(0, height, 0, height - radius);
  octx.lineTo(0, radius);
  octx.quadraticCurveTo(0, 0, radius, 0);
  octx.closePath();
  octx.clip();
  octx.drawImage(canvas, 0, 0);
  octx.restore();

  return out;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function CircularGallery({
  items,
  height = 640,
  className,
  cardWidth = 4.2,
  cardHeight = 5.6,
  radius = 9,
  autoRotateSpeed = 0.0012
}: {
  items?: GalleryItem[];
  height?: number;
  className?: string;
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  autoRotateSpeed?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizedItems = useMemo(() => {
    const list = (items || []).filter(Boolean);
    // Ensure uniqueness by userId when present (avoids duplicates)
    const uniq = new Map<string, GalleryItem>();
    list.forEach((it) => {
      const key = it.userId || it.id || `${it.title || it.name || it.image}`;
      if (!uniq.has(key)) uniq.set(key, it);
    });
    return Array.from(uniq.values()).map(it => ({
      ...it,
      title: it.title || it.name || it.text || 'Member',
      subTitle: it.subTitle || it.subtitle || it.role || it.type || ''
    }));
  }, [items]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!normalizedItems.length) return;

    const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    // Mount canvas
    el.innerHTML = '';
    el.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.z = 15;
    const scene = new Transform();

    const geometry = new Plane(gl, {
      width: cardWidth,
      height: cardHeight,
      widthSegments: 20,
      heightSegments: 20
    });

    const meshes: Mesh[] = [];
    const total = normalizedItems.length;
    const angleStep = (Math.PI * 2) / total;

    // Animation state
    let rotation = 0;
    let targetRotation = 0;
    let lastTime = 0;

    // Interaction state
    let isDown = false;
    let startX = 0;
    let lastX = 0;
    let velocity = 0;
    let moved = false;
    let suppressClickUntil = 0;

    const getMat = (m: any) => (m && (m.elements || m)) as Float32Array;

    const pickClosestItemIndex = (clientX: number, clientY: number): number | null => {
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const proj = getMat((camera as any).projectionMatrix);
      const view = getMat((camera as any).viewMatrix);
      if (!proj || !view) return null;

      const pv = mat4.create();
      mat4.multiply(pv, proj as any, view as any);

      let bestIdx: number | null = null;
      let bestScore = Infinity;

      (scene as any).updateMatrixWorld?.();
      (camera as any).updateMatrixWorld?.();

      for (const mesh of meshes) {
        (mesh as any).updateMatrixWorld?.();
        const world = getMat((mesh as any).worldMatrix);
        if (!world) continue;

        const wp = vec4.fromValues(0, 0, 0, 1);
        vec4.transformMat4(wp, wp, world as any);

        const clip = vec4.create();
        vec4.transformMat4(clip, wp, pv as any);
        if (clip[3] === 0) continue;

        const ndcX = clip[0] / clip[3];
        const ndcY = clip[1] / clip[3];
        const ndcZ = clip[2] / clip[3];

        if (ndcZ < -1 || ndcZ > 1) continue;

        const sx = (ndcX * 0.5 + 0.5) * rect.width;
        const sy = (-ndcY * 0.5 + 0.5) * rect.height;

        const dx = sx - x;
        const dy = sy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Prefer near-center hits; small depth bias to favor front cards
        const depthBias = Math.max(0, (ndcZ + 1) * 20);
        const score = dist + depthBias;

        if (score < bestScore) {
          bestScore = score;
          bestIdx = (mesh as any).itemIndex ?? null;
        }
      }

      if (bestIdx === null) return null;
      if (bestScore > 180) return null;
      return bestIdx;
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      isDown = true;
      moved = false;
      startX = (e as any).clientX || (e as any).touches?.[0]?.clientX;
      lastX = startX;
      el.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDown) return;
      const x = (e as any).clientX || (e as any).touches?.[0]?.clientX;
      if (typeof x !== 'number') return;
      if (Math.abs(x - startX) > 6) moved = true;
      const delta = x - lastX;
      velocity = delta * 0.005;
      targetRotation += velocity;
      lastX = x;
    };

    const onUp = () => {
      isDown = false;
      el.style.cursor = 'grab';
      if (moved) suppressClickUntil = Date.now() + 250;
    };

    const onClick = (e: MouseEvent) => {
      if (Date.now() < suppressClickUntil) return;
      const idx = pickClosestItemIndex(e.clientX, e.clientY);
      if (idx === null) return;
      const item = normalizedItems[idx];
      item?.onClick?.(item);
    };

    // Create meshes + textures
    normalizedItems.forEach((item, i) => {
      const texture = new Texture(gl, { generateMipmaps: true });
      const placeholder = makeProfileCardCanvas({
        title: item.title || 'Member',
        subTitle: item.subTitle || '',
        width: 1024,
        height: 1365,
        radius: 44
      });
      texture.image = placeholder as any;

      const program = new Program(gl, {
        vertex: ringVertexShader,
        fragment: ringFragmentShader,
        uniforms: {
          tMap: { value: texture },
          uTime: { value: 0 },
          uSpeed: { value: 0 },
          uAlpha: { value: 1 }
        },
        transparent: true
      });

      const mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);

      const angle = i * angleStep;
      (mesh as any).initialAngle = angle;
      (mesh as any).itemIndex = i;

      mesh.position.x = Math.sin(angle) * radius;
      mesh.position.z = Math.cos(angle) * radius - 5;
      mesh.rotation.y = angle;

      meshes.push(mesh);

      // Load image and bake overlay
      if (item.image) {
        loadImage(item.image)
          .then((img) => {
            const canvas = makeProfileCardCanvas({
              img,
              title: item.title || 'Member',
              subTitle: item.subTitle || '',
              width: 1024,
              height: 1365,
              radius: 44
            });
            texture.image = canvas as any;
            (texture as any).needsUpdate = true;
          })
          .catch(() => {
            // keep placeholder
          });
      }
    });

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / h });
    };

    let rafId = 0;
    const update = (t: number) => {
      rafId = requestAnimationFrame(update);
      const time = t * 0.001;
      const dt = time - lastTime;
      lastTime = time;

      if (!isDown) {
        targetRotation += autoRotateSpeed;
        velocity *= 0.95;
        targetRotation += velocity;
      }

      rotation += (targetRotation - rotation) * 0.1;

      meshes.forEach((mesh) => {
        const angle = (mesh as any).initialAngle + rotation;
        mesh.position.x = Math.sin(angle) * radius;
        mesh.position.z = Math.cos(angle) * radius - 5;
        mesh.rotation.y = angle;

        mesh.program.uniforms.uTime.value = time;
        mesh.program.uniforms.uSpeed.value = Math.abs(velocity) * 120;

        // Fade out back items
        const dist = mesh.position.z;
        let alpha = (dist + 10) / 10;
        alpha = Math.max(0.18, Math.min(1, alpha));
        mesh.program.uniforms.uAlpha.value = alpha;
      });

      renderer.render({ scene, camera });
    };

    el.style.cursor = 'grab';
    window.addEventListener('resize', resize);
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('touchstart', onDown, { passive: true } as any);
    el.addEventListener('touchmove', onMove, { passive: true } as any);
    window.addEventListener('touchend', onUp);
    el.addEventListener('click', onClick);

    resize();
    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('touchstart', onDown as any);
      el.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('touchend', onUp);
      el.removeEventListener('click', onClick);
      if (rafId) cancelAnimationFrame(rafId);
      try {
        gl.canvas.remove();
      } catch {
        // ignore
      }
    };
  }, [normalizedItems, radius, cardWidth, cardHeight, autoRotateSpeed]);

  return (
    <div
      ref={containerRef}
      className={className || 'w-full overflow-hidden rounded-3xl'}
      style={{ height }}
    />
  );
}
