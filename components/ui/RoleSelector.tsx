'use client';

import React, { useEffect, useRef, useState } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';

// ==========================================
// SHADERS & CLASSES
// ==========================================

const discVertShaderSource = `#version 300 es
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;
in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;
out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;
void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);
    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }
    worldPosition.xyz = radius * normalize(worldPosition.xyz);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}`;

const discFragShaderSource = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;
out vec4 outColor;
in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;
void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;
    
    // Fix Aspect Ratio mapping
    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 1.0;
    float scale = max(imageAspect / containerAspect, containerAspect / imageAspect);
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * scale + 0.5;
    st = clamp(st, 0.0, 1.0);
    st = st * cellSize + cellOffset;
    
    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}`;

class Face {
    constructor(public a: number, public b: number, public c: number) {}
}

class Vertex {
    position: vec3;
    normal: vec3;
    uv: vec2;
    constructor(x: number, y: number, z: number) {
        this.position = vec3.fromValues(x, y, z);
        this.normal = vec3.create();
        this.uv = vec2.create();
    }
}

class Geometry {
    vertices: Vertex[] = [];
    faces: Face[] = [];

    addVertex(...args: number[]) {
        for (let i = 0; i < args.length; i += 3) {
            this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2]));
        }
        return this;
    }

    addFace(...args: number[]) {
        for (let i = 0; i < args.length; i += 3) {
            this.faces.push(new Face(args[i], args[i + 1], args[i + 2]));
        }
        return this;
    }

    get lastVertex() { return this.vertices[this.vertices.length - 1]; }

    subdivide(divisions = 1) {
        const midPointCache: Record<string, number> = {};
        let f = this.faces;
        for (let div = 0; div < divisions; ++div) {
            const newFaces = new Array(f.length * 4);
            f.forEach((face, ndx) => {
                const mAB = this.getMidPoint(face.a, face.b, midPointCache);
                const mBC = this.getMidPoint(face.b, face.c, midPointCache);
                const mCA = this.getMidPoint(face.c, face.a, midPointCache);
                const i = ndx * 4;
                newFaces[i + 0] = new Face(face.a, mAB, mCA);
                newFaces[i + 1] = new Face(face.b, mBC, mAB);
                newFaces[i + 2] = new Face(face.c, mCA, mBC);
                newFaces[i + 3] = new Face(mAB, mBC, mCA);
            });
            f = newFaces;
        }
        this.faces = f;
        return this;
    }

    spherize(radius = 1) {
        this.vertices.forEach(vertex => {
            vec3.normalize(vertex.normal, vertex.position);
            vec3.scale(vertex.position, vertex.normal, radius);
        });
        return this;
    }

    get data() {
        return {
            vertices: new Float32Array(this.vertices.flatMap(v => Array.from(v.position))),
            indices: new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c])),
            normals: new Float32Array(this.vertices.flatMap(v => Array.from(v.normal))),
            uvs: new Float32Array(this.vertices.flatMap(v => Array.from(v.uv)))
        };
    }

    getMidPoint(ndxA: number, ndxB: number, cache: Record<string, number>) {
        const cacheKey = ndxA < ndxB ? `k_${ndxB}_${ndxA}` : `k_${ndxA}_${ndxB}`;
        if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) return cache[cacheKey];
        const a = this.vertices[ndxA].position;
        const b = this.vertices[ndxB].position;
        const ndx = this.vertices.length;
        cache[cacheKey] = ndx;
        this.addVertex((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5);
        return ndx;
    }
}

class IcosahedronGeometry extends Geometry {
    constructor() {
        super();
        const t = Math.sqrt(5) * 0.5 + 0.5;
        this.addVertex(-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1)
            .addFace(0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1);
    }
}

class DiscGeometry extends Geometry {
    constructor(steps = 4, radius = 1) {
        super();
        steps = Math.max(4, steps);
        const alpha = (2 * Math.PI) / steps;
        this.addVertex(0, 0, 0);
        this.lastVertex.uv[0] = 0.5; this.lastVertex.uv[1] = 0.5;
        for (let i = 0; i < steps; ++i) {
            const x = Math.cos(alpha * i);
            const y = Math.sin(alpha * i);
            this.addVertex(radius * x, radius * y, 0);
            this.lastVertex.uv[0] = x * 0.5 + 0.5;
            this.lastVertex.uv[1] = y * 0.5 + 0.5;
            if (i > 0) this.addFace(0, i, i + 1);
        }
        this.addFace(0, steps, 1);
    }
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}

function createProgram(gl: WebGL2RenderingContext, shaderSources: string[], transformFeedbackVaryings: any, attribLocations: Record<string, number>) {
    const program = gl.createProgram();
    if (!program) return null;
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
        const shader = createShader(gl, type, shaderSources[ndx]);
        if (shader) gl.attachShader(program, shader);
    });
    if (attribLocations) {
        for (const attrib in attribLocations) gl.bindAttribLocation(program, attribLocations[attrib], attrib);
    }
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
}

function makeVertexArray(gl: WebGL2RenderingContext, bufLocNumElmPairs: any[], indices: Uint16Array) {
    const va = gl.createVertexArray();
    gl.bindVertexArray(va);
    for (const [buffer, loc, numElem] of bufLocNumElmPairs) {
        if (loc === -1) continue;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, numElem, gl.FLOAT, false, 0, 0);
    }
    if (indices) {
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }
    gl.bindVertexArray(null);
    return va;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    const dpr = Math.min(2, window.devicePixelRatio);
    const displayWidth = Math.round(canvas.clientWidth * dpr);
    const displayHeight = Math.round(canvas.clientHeight * dpr);
    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (needResize) { canvas.width = displayWidth; canvas.height = displayHeight; }
    return needResize;
}

function makeBuffer(gl: WebGL2RenderingContext, sizeOrData: any, usage: number) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buf;
}

function createAndSetupTexture(gl: WebGL2RenderingContext, minFilter: number, magFilter: number, wrapS: number, wrapT: number) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    return texture;
}

class ArcballControl {
    canvas: HTMLCanvasElement;
    updateCallback: (deltaTime: number) => void;
    isPointerDown = false;
    orientation = quat.create();
    pointerRotation = quat.create();
    rotationVelocity = 0;
    rotationAxis = vec3.fromValues(1, 0, 0);
    snapDirection = vec3.fromValues(0, 0, -1);
    snapTargetDirection: vec3 | null = null;
    pointerPos = vec2.create();
    previousPointerPos = vec2.create();
    _rotationVelocity = 0;
    _combinedQuat = quat.create();

    constructor(canvas: HTMLCanvasElement, updateCallback: (dt: number) => void) {
        this.canvas = canvas;
        this.updateCallback = updateCallback || (() => null);

        const setPointerFromEvent = (e: PointerEvent) => {
            // Prefer offsetX/offsetY (already canvas-local). Fallback to bounding rect.
            const anyEvent = e as unknown as { offsetX?: number; offsetY?: number };
            if (typeof anyEvent.offsetX === 'number' && typeof anyEvent.offsetY === 'number') {
                vec2.set(this.pointerPos, anyEvent.offsetX, anyEvent.offsetY);
                return;
            }
            const rect = canvas.getBoundingClientRect();
            vec2.set(this.pointerPos, e.clientX - rect.left, e.clientY - rect.top);
        };

        canvas.addEventListener('pointerdown', e => {
            canvas.setPointerCapture?.(e.pointerId);
            setPointerFromEvent(e);
            vec2.copy(this.previousPointerPos, this.pointerPos);
            this.isPointerDown = true;
        });
        canvas.addEventListener('pointerup', e => {
            this.isPointerDown = false;
            canvas.releasePointerCapture?.(e.pointerId);
        });
        canvas.addEventListener('pointercancel', e => {
            this.isPointerDown = false;
            canvas.releasePointerCapture?.(e.pointerId);
        });
        canvas.addEventListener('pointerleave', () => { this.isPointerDown = false; });
        canvas.addEventListener('pointermove', e => {
            if (!this.isPointerDown) return;
            setPointerFromEvent(e);
        });
        canvas.style.touchAction = 'none';
    }

    update(deltaTime: number, targetFrameDuration = 16) {
        const timeScale = deltaTime / targetFrameDuration + 0.00001;
        let angleFactor = timeScale;
        let snapRotation = quat.create();

        if (this.isPointerDown) {
            const midPointerPos = vec2.sub(vec2.create(), this.pointerPos, this.previousPointerPos);
            vec2.scale(midPointerPos, midPointerPos, 0.3 * timeScale);
            if (vec2.sqrLen(midPointerPos) > 0.1) {
                vec2.add(midPointerPos, this.previousPointerPos, midPointerPos);
                const a = vec3.normalize(vec3.create(), this.#project(midPointerPos));
                const b = vec3.normalize(vec3.create(), this.#project(this.previousPointerPos));
                vec2.copy(this.previousPointerPos, midPointerPos);
                angleFactor *= 5 / timeScale;
                this.quatFromVectors(a, b, this.pointerRotation, angleFactor);
            } else {
                quat.slerp(this.pointerRotation, this.pointerRotation, quat.create(), 0.3 * timeScale);
            }

            // Subtle magnetic pull toward the nearest snap target (only when already close)
            if (this.snapTargetDirection) {
                const sqrDist = vec3.squaredDistance(this.snapTargetDirection, this.snapDirection);
                const t = Math.max(0, Math.min(1, 1 - sqrDist / 0.15));
                const magnetStrength = 0.08 * t * t;
                if (magnetStrength > 0) {
                    this.quatFromVectors(this.snapTargetDirection, this.snapDirection, snapRotation, magnetStrength * timeScale);
                }
            }
        } else {
            // Dampen residual pointer-driven rotation faster after release
            quat.slerp(this.pointerRotation, this.pointerRotation, quat.create(), 0.2 * timeScale);
            if (this.snapTargetDirection) {
                const sqrDist = vec3.squaredDistance(this.snapTargetDirection, this.snapDirection);
                // Stronger snap for an elastic "magnetic" feel
                angleFactor *= 0.85 * Math.max(0.12, 1 - sqrDist * 10);
                this.quatFromVectors(this.snapTargetDirection, this.snapDirection, snapRotation, angleFactor);
            }
        }

        const combinedQuat = quat.multiply(quat.create(), snapRotation, this.pointerRotation);
        this.orientation = quat.multiply(quat.create(), combinedQuat, this.orientation);
        quat.normalize(this.orientation, this.orientation);
        quat.slerp(this._combinedQuat, this._combinedQuat, combinedQuat, 0.8 * timeScale);
        quat.normalize(this._combinedQuat, this._combinedQuat);

        const rad = Math.acos(this._combinedQuat[3]) * 2.0;
        const s = Math.sin(rad / 2.0);
        let rv = 0;
        if (s > 0.000001) {
            rv = rad / (2 * Math.PI);
            this.rotationAxis[0] = this._combinedQuat[0] / s;
            this.rotationAxis[1] = this._combinedQuat[1] / s;
            this.rotationAxis[2] = this._combinedQuat[2] / s;
        }

        this._rotationVelocity += (rv - this._rotationVelocity) * (0.5 * timeScale);
        this.rotationVelocity = this._rotationVelocity / timeScale;
        this.updateCallback(deltaTime);
    }

    quatFromVectors(a: vec3, b: vec3, out: quat, angleFactor = 1) {
        const axis = vec3.cross(vec3.create(), a, b);
        vec3.normalize(axis, axis);
        const d = Math.max(-1, Math.min(1, vec3.dot(a, b)));
        const angle = Math.acos(d) * angleFactor;
        quat.setAxisAngle(out, axis, angle);
    }

    #project(pos: vec2) {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const s = Math.max(w, h) - 1;
        const x = (2 * pos[0] - w - 1) / s;
        const y = (2 * pos[1] - h - 1) / s;
        let z = 0;
        const xySq = x * x + y * y;
        if (xySq <= 2) z = Math.sqrt(4 - xySq);
        else z = 4 / Math.sqrt(xySq);
        return vec3.fromValues(-x, y, z);
    }
}

class InfiniteGridMenu {
    canvas: HTMLCanvasElement;
    items: any[];
    onActiveItemChange: (idx: number) => void;
    onMovementChange: (isMoving: boolean) => void;
    gl: WebGL2RenderingContext | null = null;
    camera: any;
    SPHERE_RADIUS = 2;
    instancePositions: vec3[] = [];
    control: ArcballControl;
    lastTime = 0;
    discProgram: WebGLProgram | null = null;
    discLocations: any;
    discGeo: DiscGeometry | null = null;
    discVAO: WebGLVertexArrayObject | null = null;
    discInstances: any;
    tex: WebGLTexture | null = null;
    atlasSize = 1;
    DISC_INSTANCE_COUNT = 0;

    constructor(canvas: HTMLCanvasElement, items: any[], onActiveItemChange: any, onMovementChange: any, onInit: any) {
        this.canvas = canvas;
        this.items = items;
        this.onActiveItemChange = onActiveItemChange;
        this.onMovementChange = onMovementChange;
        this.camera = {
            matrix: mat4.create(), near: 0.1, far: 40, fov: Math.PI / 4, aspect: 1,
            position: vec3.fromValues(0, 0, 3), up: vec3.fromValues(0, 1, 0),
            matrices: { view: mat4.create(), projection: mat4.create() }
        };
        this.control = new ArcballControl(this.canvas, dt => this.#onControlUpdate(dt));
        this.#init(onInit);
    }

    resize() {
        const gl = this.gl;
        if (gl && resizeCanvasToDisplaySize(this.canvas)) gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        if (gl) this.#updateProjectionMatrix(gl);
    }

    run(time = 0) {
        const deltaTime = Math.min(32, time - (this.lastTime || 0));
        this.lastTime = time;
        this.#animate(deltaTime);
        this.#render();
        requestAnimationFrame(t => this.run(t));
    }

    #init(onInit: any) {
        this.gl = this.canvas.getContext('webgl2', { antialias: true, alpha: false });
        const gl = this.gl;
        if (!gl) return;

        this.discProgram = createProgram(gl, [discVertShaderSource, discFragShaderSource], null, {
            aModelPosition: 0, aModelNormal: 1, aModelUvs: 2, aInstanceMatrix: 3
        });
        
        if (!this.discProgram) return;

        this.discLocations = {
            aModelPosition: 0, aModelUvs: 2, aInstanceMatrix: 3,
            uWorldMatrix: gl.getUniformLocation(this.discProgram, 'uWorldMatrix'),
            uViewMatrix: gl.getUniformLocation(this.discProgram, 'uViewMatrix'),
            uProjectionMatrix: gl.getUniformLocation(this.discProgram, 'uProjectionMatrix'),
            uCameraPosition: gl.getUniformLocation(this.discProgram, 'uCameraPosition'),
            uRotationAxisVelocity: gl.getUniformLocation(this.discProgram, 'uRotationAxisVelocity'),
            uTex: gl.getUniformLocation(this.discProgram, 'uTex'),
            uItemCount: gl.getUniformLocation(this.discProgram, 'uItemCount'),
            uAtlasSize: gl.getUniformLocation(this.discProgram, 'uAtlasSize')
        };

        this.discGeo = new DiscGeometry(56, 1);
        const buffers = this.discGeo.data;
        this.discVAO = makeVertexArray(gl, [
            [makeBuffer(gl, buffers.vertices, gl.STATIC_DRAW), 0, 3],
            [makeBuffer(gl, buffers.uvs, gl.STATIC_DRAW), 2, 2]
        ], buffers.indices);

        const icoGeo = new IcosahedronGeometry();
        icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS);
        this.instancePositions = icoGeo.vertices.map(v => v.position);
        this.DISC_INSTANCE_COUNT = this.instancePositions.length;

        this.discInstances = {
            matricesArray: new Float32Array(this.DISC_INSTANCE_COUNT * 16),
            matrices: Array.from({ length: this.DISC_INSTANCE_COUNT }, (_, i) => 
                new Float32Array(this.DISC_INSTANCE_COUNT * 16 * 4).subarray(i*16, (i+1)*16)),
            buffer: gl.createBuffer()
        };
        
        gl.bindVertexArray(this.discVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.discInstances.matricesArray.byteLength, gl.DYNAMIC_DRAW);
        for (let j = 0; j < 4; ++j) {
            const loc = 3 + j;
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, j * 16);
            gl.vertexAttribDivisor(loc, 1);
        }

        this.#initTexture();
        this.#updateCameraMatrix();
        this.#updateProjectionMatrix(gl);
        this.resize();
        if (onInit) onInit(this);
    }

    #initTexture() {
        const gl = this.gl;
        if (!gl) return;
        this.tex = createAndSetupTexture(gl, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        const atlasSize = Math.ceil(Math.sqrt(this.items.length));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const cellSize = 512;
        canvas.width = canvas.height = atlasSize * cellSize;

        Promise.all(this.items.map(item => new Promise<HTMLImageElement>(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.src = item.image;
        }))).then(images => {
            images.forEach((img, i) => {
                ctx.drawImage(img, (i % atlasSize) * cellSize, Math.floor(i / atlasSize) * cellSize, cellSize, cellSize);
            });
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            gl.generateMipmap(gl.TEXTURE_2D);
            this.atlasSize = atlasSize;
        });
    }

    #animate(deltaTime: number) {
        const gl = this.gl;
        if (!gl) return;
        this.control.update(deltaTime, 1000 / 60);

        // Calculate positions based on rotation
        const positions = this.instancePositions.map(p =>
            vec3.transformQuat(vec3.create(), p, this.control.orientation)
        );

        const scale = 0.25;
        const SCALE_INTENSITY = 0.6;

        positions.forEach((p, i) => {
            // Calculate scale based on Z-depth (closer items are larger)
            const s = (Math.abs(p[2]) / this.SPHERE_RADIUS) * SCALE_INTENSITY + (1 - SCALE_INTENSITY);
            const finalScale = s * scale;

            const matrix = mat4.create();

            // 1. Translate to the inverse of the position
            mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), p)));

            // 2. Orient to face the center
            mat4.multiply(matrix, matrix, mat4.targetTo(mat4.create(), [0, 0, 0], p, [0, 1, 0]));

            // 3. Apply scale
            mat4.multiply(matrix, matrix, mat4.fromScaling(mat4.create(), [finalScale, finalScale, finalScale]));

            // 4. Push out to sphere radius
            mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [0, 0, -this.SPHERE_RADIUS]));

            const arr = new Float32Array(this.discInstances.matricesArray.buffer, i * 64, 16);
            arr.set(matrix);
        });
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray);
    }

    #render() {
        const gl = this.gl;
        if (!gl) return;
        gl.useProgram(this.discProgram);
        gl.enable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(this.discLocations.uWorldMatrix, false, mat4.create());
        gl.uniformMatrix4fv(this.discLocations.uViewMatrix, false, this.camera.matrices.view);
        gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix, false, this.camera.matrices.projection);
        gl.uniform4f(this.discLocations.uRotationAxisVelocity, 
            this.control.rotationAxis[0], this.control.rotationAxis[1], this.control.rotationAxis[2], 
            this.control.rotationVelocity * 1.1);
        gl.uniform1i(this.discLocations.uItemCount, this.items.length);
        gl.uniform1i(this.discLocations.uAtlasSize, this.atlasSize || 1);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);

        gl.bindVertexArray(this.discVAO);
        gl.drawElementsInstanced(gl.TRIANGLES, (this.discGeo as Geometry).faces.length * 3, gl.UNSIGNED_SHORT, 0, this.DISC_INSTANCE_COUNT);
    }

    #updateCameraMatrix() {
        mat4.targetTo(this.camera.matrix, this.camera.position, [0, 0, 0], this.camera.up);
        mat4.invert(this.camera.matrices.view, this.camera.matrix);
    }

    #updateProjectionMatrix(gl: WebGL2RenderingContext) {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;

        // Calculate FOV dynamically to fit sphere nicely
        const height = this.SPHERE_RADIUS * 0.35;
        const distance = Math.max(0.0001, this.camera.position[2]);

        if (this.camera.aspect > 1) {
            this.camera.fov = 2 * Math.atan(height / distance);
        } else {
            this.camera.fov = 2 * Math.atan(height / this.camera.aspect / distance);
        }

        mat4.perspective(this.camera.matrices.projection, this.camera.fov, this.camera.aspect, this.camera.near, this.camera.far);
    }

    #onControlUpdate(deltaTime: number) {
        const invQ = quat.conjugate(quat.create(), this.control.orientation);
        const nt = vec3.transformQuat(vec3.create(), this.control.snapDirection, invQ);
        let maxD = -Infinity;
        let idx = 0;
        this.instancePositions.forEach((p, i) => {
            const d = vec3.dot(nt, p);
            if (d > maxD) {
                maxD = d;
                idx = i;
            }
        });

        // Always compute snap target (unit vector) so the menu can "magnet" toward center.
        const snapTarget = vec3.transformQuat(vec3.create(), this.instancePositions[idx], this.control.orientation);
        vec3.normalize(snapTarget, snapTarget);
        this.control.snapTargetDirection = snapTarget;

        const isMoving = this.control.isPointerDown || Math.abs(this.control.rotationVelocity) > 0.01;
        this.onMovementChange(isMoving);

        // Only change the active item once the interaction has settled.
        if (!this.control.isPointerDown && Math.abs(this.control.rotationVelocity) < 0.01) {
            this.onActiveItemChange(idx % this.items.length);
        }
        
        let targetZ = this.control.isPointerDown ? 3 + this.control.rotationVelocity * 80 + 2.5 : 3;
        this.camera.position[2] += (targetZ - this.camera.position[2]) * 0.1;
        this.#updateCameraMatrix();
    }
}

// ==========================================
// REACT COMPONENT
// ==========================================

export interface RoleItem {
    image: string;
    title: string;
    description: string;
    value?: string;
    link?: string;
}

interface RoleSelectorProps {
    items: RoleItem[];
    onSelect: (index: number) => void;
    className?: string; // Added className prop
}

export function RoleSelector({ items, onSelect, className }: RoleSelectorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeItem, setActiveItem] = useState(items[0]);
    const [isMoving, setIsMoving] = useState(false);
    const sketchRef = useRef<any>(null); // Type as any for brevity, or use the class type

    useEffect(() => {
        const canvas = canvasRef.current;
        // ... [Keep instantiation logic same as before] ...
        if (canvas) {
             // Assuming InfiniteGridMenu is defined above as in previous file
             sketchRef.current = new InfiniteGridMenu(
                canvas, 
                items, 
                (idx: number) => { 
                    const item = items[idx % items.length];
                    setActiveItem(item);
                    onSelect(idx % items.length);
                }, 
                setIsMoving, 
                (sk: any) => sk.run()
            );
        }

        const resize = () => sketchRef.current?.resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [items, onSelect]);

    return (
        // CHANGED: Use className prop and remove fixed height/width constraints if passed
        <div className={`relative overflow-hidden bg-black ${className || 'w-full h-[500px] rounded-3xl border border-zinc-800'}`}>
            <canvas 
                ref={canvasRef} 
                className="w-full h-full cursor-grab active:cursor-grabbing outline-none block" 
            />
            
            {activeItem && (
                <>
                    {/* Title */}
                    <h2 className={`
                        select-none absolute font-black text-4xl md:text-8xl text-white mix-blend-difference z-10
                        left-[50%] top-[45%] transform -translate-x-1/2 -translate-y-1/2 text-center w-full
                        transition-all ease-[cubic-bezier(0.25,0.1,0.25,1.0)] pointer-events-none
                        ${isMoving ? 'opacity-0 scale-90 blur-sm duration-150' : 'opacity-100 scale-100 blur-0 duration-500'}
                    `}>
                        {activeItem.title}
                    </h2>

                    {/* Description */}
                    <p className={`
                        select-none absolute text-xl md:text-2xl text-teal-400 font-bold bg-black/60 px-6 py-2 rounded-full backdrop-blur-md z-10
                        left-[50%] top-[60%] transform -translate-x-1/2 -translate-y-1/2 text-center
                        transition-all ease-[cubic-bezier(0.25,0.1,0.25,1.0)] pointer-events-none
                        ${isMoving ? 'opacity-0 translate-y-4 duration-150' : 'opacity-100 translate-y-0 duration-500'}
                    `}>
                        {activeItem.description}
                    </p>
                </>
            )}
            
            <div className="absolute top-8 left-0 right-0 text-center text-zinc-500 text-xs font-mono uppercase tracking-widest pointer-events-none z-20 mix-blend-difference">
                Drag to Rotate • Center to Select
            </div>
        </div>
    );
}