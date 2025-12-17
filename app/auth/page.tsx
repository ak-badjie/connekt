'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import ConnektMailIcon from '@/components/branding/ConnektMailIcon';
import ConnektStorageIcon from '@/components/branding/ConnektStorageIcon';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import ConnektWalletIcon from '@/components/branding/ConnektWalletIcon';
import ConnektTeamsIcon from '@/components/branding/ConnektTeamsIcon';

// ==========================================
// 0. HELPER FUNCTIONS
// ==========================================

const hexToRgb = (hex: string) => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
        : [1, 1, 1];
};

const getAnchorAndDir = (origin: string, w: number, h: number) => {
    const outside = 0.2;
    switch (origin) {
        case 'top-left': return { anchor: [0, -outside * h], dir: [0, 1] };
        case 'top-right': return { anchor: [w, -outside * h], dir: [0, 1] };
        case 'left': return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
        case 'right': return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
        case 'bottom-left': return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
        case 'bottom-center': return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
        case 'bottom-right': return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
        default: return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
    }
};

const dist = (a: { x: number, y: number }, b: { x: number, y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (distance: number, maxDist: number, minVal: number, maxVal: number) => {
    const val = maxVal - Math.abs((maxVal * distance) / maxDist);
    return Math.max(minVal, val + minVal);
};

// ==========================================
// 1. LIGHT RAYS BACKGROUND (OGL) - FIXED
// ==========================================

const LightRays = ({
    raysOrigin = 'top-center',
    raysColor = '#2dd4bf', 
    raysSpeed = 0.5,
    lightSpread = 1,
    rayLength = 1.5,
    pulsating = true,
    fadeDistance = 1.0,
    saturation = 1.0,
    followMouse = true,
    mouseInfluence = 0.2,
    noiseAmount = 0.05,
    distortion = 0.0,
    className = ''
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const uniformsRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
    const animationIdRef = useRef<number | null>(null);
    const meshRef = useRef<any>(null);
    const resizeHandlerRef = useRef<((this: Window, ev: UIEvent) => any) | null>(null);
    const followMouseRef = useRef(followMouse);
    const raysOriginRef = useRef(raysOrigin);

    // 1. Initialization
    useEffect(() => {
        if (!containerRef.current) return;

        const init = async () => {
            const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
            rendererRef.current = renderer;
            const gl = renderer.gl;
            
            gl.canvas.style.width = '100%';
            gl.canvas.style.height = '100%';
            gl.canvas.style.display = 'block';
            
            while (containerRef.current?.firstChild) {
                containerRef.current.removeChild(containerRef.current.firstChild);
            }
            containerRef.current?.appendChild(gl.canvas);

            const vert = `
                attribute vec2 position;
                varying vec2 vUv;
                void main() {
                    vUv = position * 0.5 + 0.5;
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `;

            const frag = `
                precision highp float;
                uniform float iTime;
                uniform vec2  iResolution;
                uniform vec2  rayPos;
                uniform vec2  rayDir;
                uniform vec3  raysColor;
                uniform float raysSpeed;
                uniform float lightSpread;
                uniform float rayLength;
                uniform float pulsating;
                uniform float fadeDistance;
                uniform float saturation;
                uniform vec2  mousePos;
                uniform float mouseInfluence;
                uniform float noiseAmount;
                uniform float distortion;
                varying vec2 vUv;

                float noise(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
                    vec2 sourceToCoord = coord - raySource;
                    vec2 dirNorm = normalize(sourceToCoord);
                    float cosAngle = dot(dirNorm, rayRefDirection);
                    float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
                    float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
                    float distance = length(sourceToCoord);
                    float maxDistance = iResolution.x * rayLength;
                    float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
                    float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
                    float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
                    float baseStrength = clamp((0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)), 0.0, 1.0);
                    return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
                }

                void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                    vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
                    vec2 finalRayDir = rayDir;
                    if (mouseInfluence > 0.0) {
                        vec2 mouseScreenPos = mousePos * iResolution.xy;
                        vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
                        finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
                    }
                    vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
                    vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
                    vec3 rays = (rays1 * 0.5 + rays2 * 0.4).rgb;
                    if (noiseAmount > 0.0) {
                        float n = noise(coord * 0.01 + iTime * 0.1);
                        rays *= (1.0 - noiseAmount + noiseAmount * n);
                    }
                    float brightness = 1.0 - (coord.y / iResolution.y);
                    rays.r *= 0.1 + brightness * 0.8;
                    rays.g *= 0.3 + brightness * 0.6;
                    rays.b *= 0.5 + brightness * 0.5;
                    if (saturation != 1.0) {
                        float gray = dot(rays, vec3(0.299, 0.587, 0.114));
                        rays = mix(vec3(gray), rays, saturation);
                    }
                    rays *= raysColor;

                    // Opaque, black-based output
                    fragColor = vec4(rays, 1.0);
                }

                void main() {
                    mainImage(gl_FragColor, gl_FragCoord.xy);
                }
            `;

            const uniforms = {
                iTime: { value: 0 },
                iResolution: { value: [1, 1] },
                rayPos: { value: [0, 0] },
                rayDir: { value: [0, 1] },
                raysColor: { value: hexToRgb(raysColor) },
                raysSpeed: { value: raysSpeed },
                lightSpread: { value: lightSpread },
                rayLength: { value: rayLength },
                pulsating: { value: pulsating ? 1.0 : 0.0 },
                fadeDistance: { value: fadeDistance },
                saturation: { value: saturation },
                mousePos: { value: [0.5, 0.5] },
                mouseInfluence: { value: mouseInfluence },
                noiseAmount: { value: noiseAmount },
                distortion: { value: distortion }
            };
            uniformsRef.current = uniforms;

            const geometry = new Triangle(gl);
            const program = new Program(gl, { vertex: vert, fragment: frag, uniforms });
            const mesh = new Mesh(gl, { geometry, program });
            meshRef.current = mesh;

            const updatePlacement = () => {
                if (!containerRef.current || !renderer) return;
                const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
                renderer.setSize(wCSS, hCSS);
                const dpr = renderer.dpr;
                const w = wCSS * dpr;
                const h = hCSS * dpr;
                uniforms.iResolution.value = [w, h];
                const { anchor, dir } = getAnchorAndDir(raysOriginRef.current, w, h);
                uniforms.rayPos.value = anchor;
                uniforms.rayDir.value = dir;
            };

            const loop = (t: number) => {
                if (!rendererRef.current || !uniformsRef.current || !meshRef.current) return;
                uniforms.iTime.value = t * 0.001;
                if (followMouseRef.current && uniforms.mouseInfluence.value > 0.0) {
                    smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * 0.08;
                    smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * 0.08;
                    uniforms.mousePos.value = [smoothMouseRef.current.x, smoothMouseRef.current.y];
                }
                renderer.render({ scene: mesh });
                animationIdRef.current = requestAnimationFrame(loop);
            };

            resizeHandlerRef.current = () => updatePlacement();
            window.addEventListener('resize', resizeHandlerRef.current);
            updatePlacement();
            animationIdRef.current = requestAnimationFrame(loop);
        };

        init();

        return () => {
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
            if (rendererRef.current) {
                const gl = rendererRef.current.gl;
                gl.getExtension('WEBGL_lose_context')?.loseContext();
            }
            if (resizeHandlerRef.current) window.removeEventListener('resize', resizeHandlerRef.current);
        };
    }, []); // Run Once on Mount

    // 2. Reactive Updates (THE FIX)
    // This hook listens to prop changes and pushes them to WebGL immediately
    useEffect(() => {
        if (!uniformsRef.current) return;

        followMouseRef.current = followMouse;
        raysOriginRef.current = raysOrigin;
        
        uniformsRef.current.raysColor.value = hexToRgb(raysColor);
        uniformsRef.current.raysSpeed.value = raysSpeed;
        uniformsRef.current.lightSpread.value = lightSpread;
        uniformsRef.current.rayLength.value = rayLength;
        uniformsRef.current.pulsating.value = pulsating ? 1.0 : 0.0;
        uniformsRef.current.fadeDistance.value = fadeDistance;
        uniformsRef.current.saturation.value = saturation;
        uniformsRef.current.mouseInfluence.value = mouseInfluence;
        uniformsRef.current.noiseAmount.value = noiseAmount;
        uniformsRef.current.distortion.value = distortion;
        
        // Handle Origin updates which require recalculating position
        const gl = rendererRef.current?.gl;
        if (gl) {
            const width = gl.canvas.width;
            const height = gl.canvas.height;
            const { anchor, dir } = getAnchorAndDir(raysOriginRef.current, width, height);
            uniformsRef.current.rayPos.value = anchor;
            uniformsRef.current.rayDir.value = dir;
        }

    }, [
        raysColor, raysSpeed, lightSpread, rayLength, pulsating, 
        fadeDistance, saturation, mouseInfluence, noiseAmount, 
        distortion, raysOrigin
    ]);

    // 3. Mouse Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mouseRef.current = {
                x: (e.clientX - rect.left) / rect.width,
                y: (e.clientY - rect.top) / rect.height
            };
        };
        if (followMouse) window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [followMouse]);

    return (
        <div ref={containerRef} className={`absolute inset-0 z-0 pointer-events-none ${className}`} />
    );
};

// ==========================================
// 2. TEXT PRESSURE
// ==========================================

const TextPressure = ({
    text = 'Compressa',
    fontFamily = 'Compressa VF',
    fontUrl = 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
    width = true,
    weight = true,
    italic = true,
    alpha = false,
    textColor = '#14b8a6',
    stroke = false,
    strokeColor = '#FF0000',
    minFontSize = 24
}: any) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
    const [fontSize, setFontSize] = useState(minFontSize);
    const [scaleY, setScaleY] = useState(1);
    const chars = text.split('');

    const autoAnimRef = useRef(0);

    const setSize = useCallback(() => {
        if (!containerRef.current || !titleRef.current) return;
        const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
        let newFontSize = containerW / (chars.length / 1.1);
        newFontSize = Math.max(newFontSize, minFontSize);
        setFontSize(newFontSize);
        
        requestAnimationFrame(() => {
            if (!titleRef.current) return;
            const textRect = titleRef.current.getBoundingClientRect();
            if (textRect.height > 0) {
                const yRatio = containerH / textRect.height;
                setScaleY(yRatio * 0.8);
            }
        });
    }, [chars.length, minFontSize]);

    useEffect(() => {
        setSize();
        window.addEventListener('resize', setSize);
        return () => window.removeEventListener('resize', setSize);
    }, [setSize]);

    useEffect(() => {
        let rafId: number;
        const animate = () => {
            if (!containerRef.current || !titleRef.current) return;
            autoAnimRef.current += 0.02; 
            const rect = containerRef.current.getBoundingClientRect();
            
            const normX = (Math.sin(autoAnimRef.current) + 1) / 2; 
            const virtualX = rect.left + (rect.width * normX);
            const virtualY = rect.top + (rect.height / 2);

            const titleRect = titleRef.current.getBoundingClientRect();
            const maxDist = titleRect.width / 2.5;

            spansRef.current.forEach(span => {
                if (!span) return;
                const r = span.getBoundingClientRect();
                const charCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                const d = dist({ x: virtualX, y: virtualY }, charCenter);

                const wdth = width ? Math.floor(getAttr(d, maxDist, 5, 200)) : 100;
                const wght = weight ? Math.floor(getAttr(d, maxDist, 100, 900)) : 400;
                const italVal = italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : 0;
                const alphaVal = alpha ? getAttr(d, maxDist, 0, 1).toFixed(2) : 1;

                const settings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
                if (span.style.fontVariationSettings !== settings) span.style.fontVariationSettings = settings;
                if (alpha && span.style.opacity !== alphaVal) span.style.opacity = alphaVal as string;
            });
            rafId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(rafId);
    }, [width, weight, italic, alpha]);

    const styleElement = useMemo(() => (
        <style>{`
            @font-face { font-family: '${fontFamily}'; src: url('${fontUrl}'); font-style: normal; }
            .stroke span { position: relative; color: ${textColor}; }
            .stroke span::after { content: attr(data-char); position: absolute; left: 0; top: 0; color: transparent; z-index: -1; -webkit-text-stroke-width: 2px; -webkit-text-stroke-color: ${strokeColor}; }
        `}</style>
    ), [fontFamily, fontUrl, stroke, textColor, strokeColor]);

    return (
        <div ref={containerRef} className="relative w-full h-40 md:h-64 overflow-hidden bg-transparent select-none pointer-events-none">
            {styleElement}
            <h1 ref={titleRef} className={`flex justify-between w-full h-full items-center ${stroke ? 'stroke' : ''} uppercase text-center`}
                style={{ fontFamily, fontSize, transform: `scale(1, ${scaleY})`, color: stroke ? undefined : textColor, fontWeight: 100 }}>
                {chars.map((char: string, i: number) => (
                    <span key={i} ref={el => { spansRef.current[i] = el; }} data-char={char} className="inline-block">{char}</span>
                ))}
            </h1>
        </div>
    );
};

// ==========================================
// 3. CONNEKT SVG ICON
// ==========================================

function ConnektIcon({ className = '' }: { className?: string }) {
    return (
        <div className={`${className} flex items-center justify-center`}>
            <style jsx>{`
        .briefcase-icon { width: 100%; height: 100%; display: block; overflow: visible; }
        .briefcase-path {
          fill: none; stroke: #14b8a6; stroke-width: 0.5px; stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 100; stroke-dashoffset: 100;
          animation: draw 2s ease-in-out forwards, thicken 0.5s 1.8s ease-in-out forwards;
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes thicken { from { stroke-width: 0.5px; } to { stroke-width: 2px; } }
      `}</style>
            <svg className="briefcase-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect className="briefcase-path" x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path className="briefcase-path" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
        </div>
    );
}

// ==========================================
// 4. MAIN AUTH PAGE
// ==========================================

const AuthService = {
    loginWithEmail: async (e: string, p: string) => new Promise(resolve => setTimeout(resolve, 1500)),
    registerWithEmail: async (e: string, p: string) => new Promise(resolve => setTimeout(resolve, 1500)),
    loginWithGoogle: async () => new Promise(resolve => setTimeout(resolve, 1500)),
};

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') await AuthService.loginWithEmail(formData.email, formData.password);
            else await AuthService.registerWithEmail(formData.email, formData.password);
            router.push('/onboarding');
        } catch (err: any) {
            setError('Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try { await AuthService.loginWithGoogle(); router.push('/onboarding'); }
        catch (err) { setError('Google sign in failed'); }
    };

    return (
        <div className="min-h-screen w-full relative bg-transparent overflow-hidden font-sans text-white">
            
            {/* BACKGROUND: Light Rays */}
            <LightRays
                raysColor="#14b8a6" // Teal
                raysOrigin="top-center"
                raysSpeed={0.5}
                lightSpread={0.5}     // Tweak this: Lower = tighter beams
                rayLength={10}       // Tweak this: Higher = longer rays
                mouseInfluence={1}    // Tweak this: 0.5 makes it follow mouse
                distortion={0.01}      // Tweak this: 1.0 adds wobble
            />

            {/* MAIN CONTENT CONTAINER */}
            <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row p-4 lg:p-0">

                {/* LEFT CONTENT AREA */}
                <div className="w-full lg:w-[60%] flex flex-col justify-center items-center lg:items-start lg:pl-20 xl:pl-32 pt-10 lg:pt-0 space-y-8">
                    
                    <div className="w-full max-w-2xl flex flex-col items-center gap-2 transform hover:scale-105 transition-transform duration-500">
                        <TextPressure
                            text="WELCOME!"
                            flex={true}
                            alpha={false}
                            stroke={false}
                            width={true}
                            weight={true}
                            italic={true}
                            textColor="#14b8a6"
                            minFontSize={36}
                        />

                        <div className="w-60 h-60">
                            <ConnektIcon />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 w-full max-w-xl mt-8">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-teal-400 font-bold text-lg">Core Platform</h3>
                                <ConnektIcon className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-400">User Profiles, Portfolios, Reputation Scoring, and Agency Management.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-teal-400 font-bold text-lg">ConnektAI</h3>
                                <ConnektAIIcon className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-400">Resume Parsing, Skill Gap Analysis, and Automated Recruiting.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-teal-400 font-bold text-lg">ConnektMail</h3>
                                <ConnektMailIcon className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-400">Smart inbox, follow-ups, and AI-assisted replies.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-teal-400 font-bold text-lg">ConnektStorage</h3>
                                <ConnektStorageIcon className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-400">Secure files, versioning, and fast sharing.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-teal-400 font-bold text-lg">ConnektWallet</h3>
                                <ConnektWalletIcon className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-400">Escrow payments, invoices, and global transactions.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-teal-400 font-bold text-lg">ConnektTeams</h3>
                                <ConnektTeamsIcon className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-400">Encrypted messaging, permissions, and collaboration.</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT AUTH AREA */}
                <div className="w-full lg:w-[40%] flex items-center justify-center p-6 lg:p-12">
                    
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full max-w-md relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-[2rem] blur-2xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                        
                        <div className="relative backdrop-blur-[40px] bg-white/[0.03] border border-white/20 shadow-[inset_0_0_40px_rgba(255,255,255,0.05)] rounded-[2rem] p-8 md:p-10 overflow-hidden">
                            
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold text-white mb-2 text-center">
                                    {mode === 'login' ? 'Sign In' : 'Join Connekt'}
                                </h3>
                                <p className="text-white/50 text-center mb-8 text-sm">
                                    {mode === 'login' ? 'Access your workspace' : 'Start your professional journey'}
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-teal-400 focus:border-teal-400/50 outline-none transition-all text-white placeholder-white/20"
                                                placeholder="name@connekt.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                            <input
                                                type={isPasswordVisible ? 'text' : 'password'}
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-12 pr-12 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-teal-400 focus:border-teal-400/50 outline-none transition-all text-white placeholder-white/20"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                            >
                                                {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-900/50 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? 'Enter' : 'Create Account')}
                                    </button>
                                </form>

                                <div className="my-6 flex items-center gap-3">
                                    <div className="h-px bg-white/10 flex-1" />
                                    <span className="text-xs text-white/30 uppercase">Or continue with</span>
                                    <div className="h-px bg-white/10 flex-1" />
                                </div>

                                <button
                                    onClick={handleGoogle}
                                    className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-3"
                                >
                                    <FcGoogle size={22} />
                                    <span className="text-sm">Google Account</span>
                                </button>

                                <div className="mt-8 text-center">
                                    <button
                                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                        className="text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        {mode === 'login' ? "New here? Create an account" : "Already have an account? Sign In"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}