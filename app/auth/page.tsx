'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import ConnektMailIcon from '@/components/branding/ConnektMailIcon';
import ConnektStorageIcon from '@/components/branding/ConnektStorageIcon';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import ConnektWalletIcon from '@/components/branding/ConnektWalletIcon';
import ConnektTeamsIcon from '@/components/branding/ConnektTeamsIcon';
import { AuthService } from '@/lib/services/auth-service';

// ==========================================
// 0. HELPER FUNCTIONS
// ==========================================

const hexToRgb = (hex: string) => {
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
// 1. LIGHT RAYS BACKGROUND (OGL)
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
    }, []);

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
        const gl = rendererRef.current?.gl;
        if (gl) {
            const width = gl.canvas.width;
            const height = gl.canvas.height;
            const { anchor, dir } = getAnchorAndDir(raysOriginRef.current, width, height);
            uniformsRef.current.rayPos.value = anchor;
            uniformsRef.current.rayDir.value = dir;
        }
    }, [raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, mouseInfluence, noiseAmount, distortion, raysOrigin]);

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
// 1.5 NEW LIQUID GLASS SURFACE (CSS ONLY)
// ==========================================

const GlassSurface = ({
    children,
    className = '',
    intensity = 'medium', // low, medium, high
    style = {}
}: any) => {
    
    // Maps for different glass intensities
    const intensities = {
        low: 'backdrop-blur-md bg-white/5 border-white/10',
        medium: 'backdrop-blur-xl bg-white/10 border-white/20',
        high: 'backdrop-blur-3xl bg-white/15 border-white/30',
    };

    return (
        <div 
            className={`
                relative overflow-hidden
                ${intensities[intensity] || intensities.medium}
                border
                shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
                ${className}
            `}
            style={{
                ...style,
                // The "Liquid" magic: subtle gradient + inner highlights
                boxShadow: `
                    0 8px 32px 0 rgba(0, 0, 0, 0.36), 
                    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.2)
                `,
            }}
        >
            {/* Subtle Noise Texture for realism */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
            
            {/* Liquid Shine Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Content */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
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

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [error, setError] = useState('');

    const signupPhrases = useMemo(
        () => [
            'Start your professional journey',
            'Build your portfolio and reputation',
            'Find projects that match your skills',
            'Collaborate with teams and agencies',
            'Let AI accelerate your workflow'
        ],
        []
    );

    const [phraseIndex, setPhraseIndex] = useState(0);
    const [typed, setTyped] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (mode !== 'signup') return;

        const full = signupPhrases[phraseIndex] ?? '';
        const nextText = isDeleting ? full.slice(0, Math.max(0, typed.length - 1)) : full.slice(0, typed.length + 1);
        const isDoneTyping = !isDeleting && nextText.length === full.length;
        const isDoneDeleting = isDeleting && nextText.length === 0;

        const baseDelay = isDeleting ? 28 : 36;
        const pauseDelay = isDoneTyping ? 900 : isDoneDeleting ? 320 : 0;

        const id = window.setTimeout(() => {
            setTyped(nextText);

            if (isDoneTyping) setIsDeleting(true);
            if (isDoneDeleting) {
                setIsDeleting(false);
                setPhraseIndex((i) => (i + 1) % signupPhrases.length);
            }
        }, baseDelay + pauseDelay);

        return () => window.clearTimeout(id);
    }, [mode, isDeleting, phraseIndex, signupPhrases, typed.length, typed, setTyped]);

    // 3D Tilt (mouse-driven)
    const tiltRef = useRef<HTMLDivElement>(null);
    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);
    const rotateX = useSpring(useTransform(tiltY, [-0.5, 0.5], [10, -10]), { stiffness: 220, damping: 18, mass: 0.6 });
    const rotateY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-12, 12]), { stiffness: 220, damping: 18, mass: 0.6 });
    const cardScale = useSpring(0.9, { stiffness: 220, damping: 18, mass: 0.6 });

    const onTiltMove = (e: React.MouseEvent) => {
        const el = tiltRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        tiltX.set(x);
        tiltY.set(y);
    };

    const onTiltLeave = () => {
        tiltX.set(0);
        tiltY.set(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') await AuthService.loginWithEmail(formData.email, formData.password);
            else await AuthService.registerWithEmail(formData.email, formData.password);
            router.push('/onboarding');
        } catch (err: any) {
            const code = err?.code as string | undefined;
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') setError('Invalid email or password');
            else if (code === 'auth/user-not-found') setError('No account found for that email');
            else if (code === 'auth/email-already-in-use') setError('That email is already in use');
            else if (code === 'auth/weak-password') setError('Password is too weak');
            else setError('Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        setLoading(true);
        try {
            await AuthService.loginWithGoogle();
            router.push('/onboarding');
        } catch (err: any) {
            setError('Google sign in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative bg-transparent overflow-hidden font-sans text-white">
            
            {/* BACKGROUND: Light Rays */}
            <LightRays
                raysColor="#14b8a6" // Teal
                raysOrigin="top-center"
                raysSpeed={0.5}
                lightSpread={0.5}     
                rayLength={10}       
                mouseInfluence={1}    
                distortion={0.01}      
            />

            {/* MAIN CONTENT CONTAINER */}
            <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row p-4 lg:p-0">

                {/* LEFT CONTENT AREA (Unchanged) */}
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

                {/* RIGHT AUTH AREA - FIXED */}
                <div className="w-full lg:w-[40%] flex items-center justify-center p-6 lg:p-12">
                    
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="w-full max-w-[420px]"
                        style={{ perspective: 1200 }}
                    >
                        <motion.div
                            ref={tiltRef}
                            onMouseMove={onTiltMove}
                            onMouseLeave={onTiltLeave}
                            style={{ rotateX, rotateY, scale: cardScale, transformStyle: 'preserve-3d' as any }}
                            className="will-change-transform"
                        >
                            <GlassSurface
                                intensity="high"
                                className="rounded-[32px] p-8 md:p-10 border-white/20"
                            >
                                {/* Switcher (Login/Signup) */}
                                <div className="flex items-center justify-center mb-8">
                                    <div className="relative flex p-1 rounded-full bg-black/20 backdrop-blur-md border border-white/5 shadow-inner">
                                        <div 
                                            className={`absolute inset-y-1 rounded-full bg-teal-500/20 border border-teal-500/30 transition-all duration-300 ease-out`}
                                            style={{
                                                width: 'calc(50% - 4px)',
                                                left: mode === 'login' ? '4px' : '50%'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMode('login')}
                                            className={`relative z-10 w-32 h-9 rounded-full text-xs font-bold tracking-widest transition-colors duration-300 ${mode === 'login' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                                        >
                                            SIGN IN
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode('signup')}
                                            className={`relative z-10 w-32 h-9 rounded-full text-xs font-bold tracking-widest transition-colors duration-300 ${mode === 'signup' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                                        >
                                            SIGN UP
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-3xl font-bold text-white mb-2 text-center drop-shadow-md">
                                    {mode === 'login' ? 'Sign In' : 'Join Connekt'}
                                </h3>
                                <div className="text-teal-100/60 text-center mb-8 text-sm min-h-[20px] font-medium tracking-wide">
                                    {mode === 'login' ? (
                                        'Access your workspace'
                                    ) : (
                                        <span>
                                            {typed}
                                            <span className="inline-block w-[2px] h-[14px] bg-teal-400 ml-1 translate-y-[2px] animate-pulse"></span>
                                        </span>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Email Input */}
                                    <div className="space-y-1.5 group">
                                        <label className="text-[11px] font-bold text-teal-100/40 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-teal-400">Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-black/20 rounded-xl blur-[1px]" />
                                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14 transition-all duration-300 group-focus-within:bg-white/10 group-focus-within:border-teal-500/50 group-focus-within:shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                                                <Mail className="text-white/40 group-focus-within:text-teal-400 transition-colors mr-3" size={18} />
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-transparent outline-none text-white placeholder-white/20 font-medium"
                                                    placeholder="name@connekt.com"
                                                    autoComplete="email"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Input */}
                                    <div className="space-y-1.5 group">
                                        <label className="text-[11px] font-bold text-teal-100/40 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-teal-400">Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-black/20 rounded-xl blur-[1px]" />
                                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14 transition-all duration-300 group-focus-within:bg-white/10 group-focus-within:border-teal-500/50 group-focus-within:shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                                                <Lock className="text-white/40 group-focus-within:text-teal-400 transition-colors mr-3" size={18} />
                                                <input
                                                    type={isPasswordVisible ? 'text' : 'password'}
                                                    required
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="w-full bg-transparent outline-none text-white placeholder-white/20 font-medium"
                                                    placeholder="••••••••"
                                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                                    className="text-white/40 hover:text-white transition-colors p-2 -mr-2"
                                                >
                                                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-200 text-sm text-center font-medium backdrop-blur-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Submit Button - Liquid Metal Look */}
                                    <button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="relative w-full h-14 rounded-xl overflow-hidden group outline-none"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-300 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                        
                                        {/* Glossy sheen overlay */}
                                        <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
                                        
                                        <div className="relative z-10 flex items-center justify-center gap-2 text-white font-bold text-base tracking-wide uppercase shadow-sm">
                                            {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? 'Enter Connekt' : 'Create Account')}
                                        </div>
                                    </button>
                                </form>

                                <div className="my-8 flex items-center gap-4">
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
                                    <span className="text-[10px] font-bold text-teal-100/30 uppercase tracking-widest">Or continue with</span>
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
                                </div>

                                <button 
                                    onClick={handleGoogle} 
                                    disabled={loading} 
                                    className="w-full h-12 relative flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 group outline-none"
                                >
                                    <FcGoogle size={20} className="filter drop-shadow-md group-hover:scale-110 transition-transform" />
                                    <span className="text-white/80 font-medium text-sm">Google Account</span>
                                </button>
                                
                            </GlassSurface>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}