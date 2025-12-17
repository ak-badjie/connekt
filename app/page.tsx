'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { motion, useSpring, useTransform, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
// OGL Imports for DarkVeil
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';

// --- CONTEXT IMPORTS ---
import LoadingScreen from '@/components/ui/LoadingScreen';
import MetallicPaint from '@/components/ui/MetallicPaint';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useAnimation } from '@/context/AnimationContext';

// --- SLIDE IMPORTS ---
import ProfileSection from '@/components/landing/ProfileSection';
import ConnketAISection from '@/components/landing/ConnketAISection';
import KAISection from '@/components/landing/KAISection';

const SLIDES = [
    ProfileSection,
    ConnketAISection,
    KAISection,
];

const SPRING_OPTIONS = {
    stiffness: 45,
    damping: 12,
    mass: 1.2,
};

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// 1. DARK VEIL SHADER COMPONENT (INTERNAL)
// ==========================================
// ... (Keep existing Shader Code exactly as is) ...
const vertexShader = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`;

const fragmentShader = `
#ifdef GL_ES
precision lowp float;
#endif
uniform vec2 uResolution;
uniform float uTime;
uniform float uHueShift;
uniform float uNoise;
uniform float uScan;
uniform float uScanFreq;
uniform float uWarp;
#define iTime uTime
#define iResolution uResolution

vec4 buf[8];
float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}

mat3 rgb2yiq=mat3(0.299,0.587,0.114,0.596,-0.274,-0.322,0.211,-0.523,0.312);
mat3 yiq2rgb=mat3(1.0,0.956,0.621,1.0,-0.272,-0.647,1.0,-1.106,1.703);

vec3 hueShiftRGB(vec3 col,float deg){
    vec3 yiq=rgb2yiq*col;
    float rad=radians(deg);
    float cosh=cos(rad),sinh=sin(rad);
    vec3 yiqShift=vec3(yiq.x,yiq.y*cosh-yiq.z*sinh,yiq.y*sinh+yiq.z*cosh);
    return clamp(yiq2rgb*yiqShift,0.0,1.0);
}

vec4 sigmoid(vec4 x){return 1./(1.+exp(-x));}

vec4 cppn_fn(vec2 coordinate,float in0,float in1,float in2){
    buf[6]=vec4(coordinate.x,coordinate.y,0.3948333106474662+in0,0.36+in1);
    buf[7]=vec4(0.14+in2,sqrt(coordinate.x*coordinate.x+coordinate.y*coordinate.y),0.,0.);
    buf[0]=mat4(vec4(6.5404263,-3.6126034,0.7590882,-1.13613),vec4(2.4582713,3.1660357,1.2219609,0.06276096),vec4(-5.478085,-6.159632,1.8701609,-4.7742867),vec4(6.039214,-5.542865,-0.90925294,3.251348))*buf[6]+mat4(vec4(0.8473259,-5.722911,3.975766,1.6522468),vec4(-0.24321538,0.5839259,-1.7661959,-5.350116),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(0.21808943,1.1243913,-1.7969975,5.0294676);
    buf[1]=mat4(vec4(-3.3522482,-6.0612736,0.55641043,-4.4719114),vec4(0.8631464,1.7432913,5.643898,1.6106541),vec4(2.4941394,-3.5012043,1.7184316,6.357333),vec4(3.310376,8.209261,1.1355612,-1.165539))*buf[6]+mat4(vec4(5.24046,-13.034365,0.009859298,15.870829),vec4(2.987511,3.129433,-0.89023495,-1.6822904),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-5.9457836,-6.573602,-0.8812491,1.5436668);
    buf[0]=sigmoid(buf[0]);buf[1]=sigmoid(buf[1]);
    buf[2]=mat4(vec4(-15.219568,8.095543,-2.429353,-1.9381982),vec4(-5.951362,4.3115187,2.6393783,1.274315),vec4(-7.3145227,6.7297835,5.2473326,5.9411426),vec4(5.0796127,8.979051,-1.7278991,-1.158976))*buf[6]+mat4(vec4(-11.967154,-11.608155,6.1486754,11.237008),vec4(2.124141,-6.263192,-1.7050359,-0.7021966),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-4.17164,-3.2281182,-4.576417,-3.6401186);
    buf[3]=mat4(vec4(3.1832156,-13.738922,1.879223,3.233465),vec4(0.64300746,12.768129,1.9141049,0.50990224),vec4(-0.049295485,4.4807224,1.4733979,1.801449),vec4(5.0039253,13.000481,3.3991797,-4.5561905))*buf[6]+mat4(vec4(-0.1285731,7.720628,-3.1425676,4.742367),vec4(0.6393625,3.714393,-0.8108378,-0.39174938),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-1.1811101,-21.621881,0.7851888,1.2329718);
    buf[2]=sigmoid(buf[2]);buf[3]=sigmoid(buf[3]);
    buf[4]=mat4(vec4(5.214916,-7.183024,2.7228765,2.6592617),vec4(-5.601878,-25.3591,4.067988,0.4602802),vec4(-10.57759,24.286327,21.102104,37.546658),vec4(4.3024497,-1.9625226,2.3458803,-1.372816))*buf[0]+mat4(vec4(-17.6526,-10.507558,2.2587414,12.462782),vec4(6.265566,-502.75443,-12.642513,0.9112289),vec4(-10.983244,20.741234,-9.701768,-0.7635988),vec4(5.383626,1.4819539,-4.1911616,-4.8444734))*buf[1]+mat4(vec4(12.785233,-16.345072,-0.39901125,1.7955981),vec4(-30.48365,-1.8345358,1.4542528,-1.1118771),vec4(19.872723,-7.337935,-42.941723,-98.52709),vec4(8.337645,-2.7312303,-2.2927687,-36.142323))*buf[2]+mat4(vec4(-16.298317,3.5471997,-0.44300047,-9.444417),vec4(57.5077,-35.609753,16.163465,-4.1534753),vec4(-0.07470326,-3.8656476,-7.0901804,3.1523974),vec4(-12.559385,-7.077619,1.490437,-0.8211543))*buf[3]+vec4(-7.67914,15.927437,1.3207729,-1.6686112);
    buf[5]=mat4(vec4(-1.4109162,-0.372762,-3.770383,-21.367174),vec4(-6.2103205,-9.35908,0.92529047,8.82561),vec4(11.460242,-22.348068,13.625772,-18.693201),vec4(-0.3429052,-3.9905605,-2.4626114,-0.45033523))*buf[0]+mat4(vec4(7.3481627,-4.3661838,-6.3037653,-3.868115),vec4(1.5462853,6.5488915,1.9701879,-0.58291394),vec4(6.5858274,-2.2180402,3.7127688,-1.3730392),vec4(-5.7973905,10.134961,-2.3395722,-5.965605))*buf[1]+mat4(vec4(-2.5132585,-6.6685553,-1.4029363,-0.16285264),vec4(-0.37908727,0.53738135,4.389061,-1.3024765),vec4(-0.70647055,2.0111287,-5.1659346,-3.728635),vec4(-13.562562,10.487719,-0.9173751,-2.6487076))*buf[2]+mat4(vec4(-8.645013,6.5546675,-6.3944063,-5.5933375),vec4(-0.57783127,-1.077275,36.91025,5.736769),vec4(14.283112,3.7146652,7.1452246,-4.5958776),vec4(2.7192075,3.6021907,-4.366337,-2.3653464))*buf[3]+vec4(-5.9000807,-4.329569,1.2427121,8.59503);
    buf[4]=sigmoid(buf[4]);buf[5]=sigmoid(buf[5]);
    buf[6]=mat4(vec4(-1.61102,0.7970257,1.4675229,0.20917463),vec4(-28.793737,-7.1390953,1.5025433,4.656581),vec4(-10.94861,39.66238,0.74318546,-10.095605),vec4(-0.7229728,-1.5483948,0.7301322,2.1687684))*buf[0]+mat4(vec4(3.2547753,21.489103,-1.0194173,-3.3100595),vec4(-3.7316632,-3.3792162,-7.223193,-0.23685838),vec4(13.1804495,0.7916005,5.338587,5.687114),vec4(-4.167605,-17.798311,-6.815736,-1.6451967))*buf[1]+mat4(vec4(0.604885,-7.800309,-7.213122,-2.741014),vec4(-3.522382,-0.12359311,-0.5258442,0.43852118),vec4(9.6752825,-22.853785,2.062431,0.099892326),vec4(-4.3196306,-17.730087,2.5184598,5.30267))*buf[2]+mat4(vec4(-6.545563,-15.790176,-6.0438633,-5.415399),vec4(-43.591583,28.551912,-16.00161,18.84728),vec4(4.212382,8.394307,3.0958717,8.657522),vec4(-5.0237565,-4.450633,-4.4768,-5.5010443))*buf[3]+mat4(vec4(1.6985557,-67.05806,6.897715,1.9004834),vec4(1.8680354,2.3915145,2.5231109,4.081538),vec4(11.158006,1.7294737,2.0738268,7.386411),vec4(-4.256034,-306.24686,8.258898,-17.132736))*buf[4]+mat4(vec4(1.6889864,-4.5852966,3.8534803,-6.3482175),vec4(1.3543309,-1.2640043,9.932754,2.9079645),vec4(-5.2770967,0.07150358,-0.13962056,3.3269649),vec4(28.34703,-4.918278,6.1044083,4.085355))*buf[5]+vec4(6.6818056,12.522166,-3.7075126,-4.104386);
    buf[7]=mat4(vec4(-8.265602,-4.7027016,5.098234,0.7509808),vec4(8.6507845,-17.15949,16.51939,-8.884479),vec4(-4.036479,-2.3946867,-2.6055532,-1.9866527),vec4(-2.2167742,-1.8135649,-5.9759874,4.8846445))*buf[0]+mat4(vec4(6.7790847,3.5076547,-2.8191125,-2.7028968),vec4(-5.743024,-0.27844876,1.4958696,-5.0517144),vec4(13.122226,15.735168,-2.9397483,-4.101023),vec4(-14.375265,-5.030483,-6.2599335,2.9848232))*buf[1]+mat4(vec4(4.0950394,-0.94011575,-5.674733,4.755022),vec4(4.3809423,4.8310084,1.7425908,-3.437416),vec4(2.117492,0.16342592,-104.56341,16.949184),vec4(-5.22543,-2.994248,3.8350096,-1.9364246))*buf[2]+mat4(vec4(-5.900337,1.7946124,-13.604192,-3.8060522),vec4(6.6583457,31.911177,25.164474,91.81147),vec4(11.840538,4.1503043,-0.7314397,6.768467),vec4(-6.3967767,4.034772,6.1714606,-0.32874924))*buf[3]+mat4(vec4(3.4992442,-196.91893,-8.923708,2.8142626),vec4(3.4806502,-3.1846354,5.1725626,5.1804223),vec4(-2.4009497,15.585794,1.2863957,2.0252278),vec4(-71.25271,-62.441242,-8.138444,0.50670296))*buf[4]+mat4(vec4(-12.291733,-11.176166,-7.3474145,4.390294),vec4(10.805477,5.6337385,-0.9385842,-4.7348723),vec4(-12.869276,-7.039391,5.3029537,7.5436664),vec4(1.4593618,8.91898,3.5101583,5.840625))*buf[5]+vec4(2.2415268,-6.705987,-0.98861027,-2.117676);
    buf[6]=sigmoid(buf[6]);buf[7]=sigmoid(buf[7]);
    buf[0]=mat4(vec4(1.6794263,1.3817469,2.9625452,0.),vec4(-1.8834411,-1.4806935,-3.5924516,0.),vec4(-1.3279216,-1.0918057,-2.3124623,0.),vec4(0.2662234,0.23235129,0.44178495,0.))*buf[0]+mat4(vec4(-0.6299101,-0.5945583,-0.9125601,0.),vec4(0.17828953,0.18300213,0.18182953,0.),vec4(-2.96544,-2.5819945,-4.9001055,0.),vec4(1.4195864,1.1868085,2.5176322,0.))*buf[1]+mat4(vec4(-1.2584374,-1.0552157,-2.1688404,0.),vec4(-0.7200217,-0.52666044,-1.438251,0.),vec4(0.15345335,0.15196142,0.272854,0.),vec4(0.945728,0.8861938,1.2766753,0.))*buf[2]+mat4(vec4(-2.4218085,-1.968602,-4.35166,0.),vec4(-22.683098,-18.0544,-41.954372,0.),vec4(0.63792,0.5470648,1.1078634,0.),vec4(-1.5489894,-1.3075932,-2.6444845,0.))*buf[3]+mat4(vec4(-0.49252132,-0.39877754,-0.91366625,0.),vec4(0.95609266,0.7923952,1.640221,0.),vec4(0.30616966,0.15693925,0.8639857,0.),vec4(1.1825981,0.94504964,2.176963,0.))*buf[4]+mat4(vec4(0.35446745,0.3293795,0.59547555,0.),vec4(-0.58784515,-0.48177817,-1.0614829,0.),vec4(2.5271258,1.9991658,4.6846647,0.),vec4(0.13042648,0.08864098,0.30187556,0.))*buf[5]+mat4(vec4(-1.7718065,-1.4033192,-3.3355875,0.),vec4(3.1664357,2.638297,5.378702,0.),vec4(-3.1724713,-2.6107926,-5.549295,0.),vec4(-2.851368,-2.249092,-5.3013067,0.))*buf[6]+mat4(vec4(1.5203838,1.2212278,2.8404984,0.),vec4(1.5210563,1.2651345,2.683903,0.),vec4(2.9789467,2.4364579,5.2347264,0.),vec4(2.2270417,1.8825914,3.8028636,0.))*buf[7]+vec4(-1.5468478,-3.6171484,0.24762098,0.);
    buf[0]=sigmoid(buf[0]);
    return vec4(buf[0].x,buf[0].y,buf[0].z,1.);
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 uv=fragCoord/uResolution.xy*2.-1.;
    uv.y*=-1.;
    uv+=uWarp*vec2(sin(uv.y*6.283+uTime*0.5),cos(uv.x*6.283+uTime*0.5))*0.05;
    fragColor=cppn_fn(uv,0.1*sin(0.3*uTime),0.1*sin(0.69*uTime),0.1*sin(0.44*uTime));
}

void main(){
    vec4 col;mainImage(col,gl_FragCoord.xy);
    col.rgb=hueShiftRGB(col.rgb,uHueShift);
    float scanline_val=sin(gl_FragCoord.y*uScanFreq)*0.5+0.5;
    col.rgb*=1.-(scanline_val*scanline_val)*uScan;
    col.rgb+=(rand(gl_FragCoord.xy+uTime)-0.5)*uNoise;
    gl_FragColor=vec4(clamp(col.rgb,0.0,1.0),1.0);
}
`;

function DarkVeil({
  hueShift = 0,
  noiseIntensity = 0,
  scanlineIntensity = 0,
  speed = 0.5,
  scanlineFrequency = 0,
  warpAmount = 0,
  resolutionScale = 1
}: {
  hueShift?: number,
  noiseIntensity?: number,
  scanlineIntensity?: number,
  speed?: number,
  scanlineFrequency?: number,
  warpAmount?: number,
  resolutionScale?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = ref.current;
    if(!canvas) return;
    const parent = canvas.parentElement;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      canvas,
      alpha: true
    });

    const gl = renderer.gl;
    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2() },
        uHueShift: { value: hueShift },
        uNoise: { value: noiseIntensity },
        uScan: { value: scanlineIntensity },
        uScanFreq: { value: scanlineFrequency },
        uWarp: { value: warpAmount }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
        if(!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        renderer.setSize(w * resolutionScale, h * resolutionScale);
        program.uniforms.uResolution.value.set(w, h);
    };

    window.addEventListener('resize', resize);
    resize();

    const start = performance.now();
    let frame = 0;

    const loop = () => {
      program.uniforms.uTime.value = ((performance.now() - start) / 1000) * speed;
      program.uniforms.uHueShift.value = hueShift;
      program.uniforms.uNoise.value = noiseIntensity;
      program.uniforms.uScan.value = scanlineIntensity;
      program.uniforms.uScanFreq.value = scanlineFrequency;
      program.uniforms.uWarp.value = warpAmount;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [hueShift, noiseIntensity, scanlineIntensity, speed, scanlineFrequency, warpAmount, resolutionScale]);
  
  return <canvas ref={ref} className="w-full h-full block" />;
}

// ==========================================
// 2. ROTATING TEXT COMPONENT
// ==========================================
const RotatingText = forwardRef((props: any, ref) => {
  const {
    texts,
    transition = { type: 'spring', damping: 25, stiffness: 300 },
    initial = { y: '100%', opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: '-120%', opacity: 0 },
    animatePresenceMode = 'wait',
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const splitIntoCharacters = (text: string) => {
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (segment: any) => segment.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === 'characters') {
      const words = currentText.split(' ');
      return words.map((word: string, i: number) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1
      }));
    }
    if (splitBy === 'words') {
      return currentText.split(' ').map((word: string, i: number, arr: any[]) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1
      }));
    }
    if (splitBy === 'lines') {
      return currentText.split('\n').map((line: string, i: number, arr: any[]) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1
      }));
    }

    return currentText.split(splitBy).map((part: string, i: number, arr: any[]) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback(
    (index: number, totalChars: number) => {
      const total = totalChars;
      if (staggerFrom === 'first') return index * staggerDuration;
      if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
      if (staggerFrom === 'center') {
        const center = Math.floor(total / 2);
        return Math.abs(center - index) * staggerDuration;
      }
      if (staggerFrom === 'random') {
        const randomIndex = Math.floor(Math.random() * total);
        return Math.abs(randomIndex - index) * staggerDuration;
      }
      return Math.abs((staggerFrom as number) - index) * staggerDuration;
    },
    [staggerFrom, staggerDuration]
  );

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setCurrentTextIndex(newIndex);
      if (onNext) onNext(newIndex);
    },
    [onNext]
  );

  const next = useCallback(() => {
    const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback(
    (index: number) => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1));
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex);
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  );

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) {
      handleIndexChange(0);
    }
  }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset
    }),
    [next, previous, jumpTo, reset]
  );

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);

  return (
    <motion.span
      className={cn('flex flex-wrap whitespace-pre-wrap relative', mainClassName)}
      {...rest}
      layout
      transition={transition}
    >
      <span className="sr-only">{texts[currentTextIndex]}</span>
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.span
          key={currentTextIndex}
          className={cn(splitBy === 'lines' ? 'flex flex-col w-full' : 'flex flex-wrap whitespace-pre-wrap relative')}
          layout
          aria-hidden="true"
        >
          {elements.map((wordObj: any, wordIndex: number, array: any[]) => {
            const previousCharsCount = array.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0);
            return (
              <span key={wordIndex} className={cn('inline-flex', splitLevelClassName)}>
                {wordObj.characters.map((char: string, charIndex: number) => (
                  <motion.span
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(
                        previousCharsCount + charIndex,
                        array.reduce((sum, word) => sum + word.characters.length, 0)
                      )
                    }}
                    className={cn('inline-block', elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span className="whitespace-pre"> </span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});
RotatingText.displayName = 'RotatingText';

// ==========================================
// 3. METALLIC HERO ASSETS (SVG MARKUP)
// ==========================================

const CONNEKT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="100%" height="100%" fill="white" />
  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" fill="none" stroke="black" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" fill="none" stroke="black" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

const CONNEKT_WORDMARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 5 260 55" width="1000" height="250">
  <rect width="100%" height="100%" fill="white" />
  <g fill="black" stroke="black" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" paint-order="stroke fill">
    <g transform="translate(0, 0)">
      <path d="M30.15 47.63Q28.81 48.22 27.72 48.73Q26.64 49.24 24.88 49.80Q23.39 50.27 21.64 50.60Q19.90 50.93 17.80 50.93Q13.84 50.93 10.61 49.82Q7.37 48.71 4.98 46.34Q2.64 44.02 1.32 40.44Q0 36.87 0 32.13Q0 27.64 1.27 24.10Q2.54 20.56 4.93 18.12Q7.25 15.75 10.53 14.50Q13.82 13.26 17.82 13.26Q20.75 13.26 23.67 13.96Q26.59 14.67 30.15 16.46L30.15 22.19L29.79 22.19Q26.78 19.68 23.83 18.53Q20.87 17.38 17.50 17.38Q14.75 17.38 12.54 18.27Q10.33 19.17 8.59 21.04Q6.91 22.88 5.97 25.67Q5.03 28.47 5.03 32.13Q5.03 35.96 6.07 38.72Q7.10 41.48 8.74 43.21Q10.45 45.02 12.73 45.89Q15.01 46.75 17.55 46.75Q21.04 46.75 24.10 45.56Q27.15 44.36 29.81 41.97L30.15 41.97L30.15 47.63ZM64.09 18.09Q66.31 20.53 67.49 24.07Q68.68 27.61 68.68 32.10Q68.68 36.60 67.47 40.15Q66.26 43.70 64.09 46.07Q61.84 48.54 58.78 49.78Q55.71 51.03 51.78 51.03Q47.95 51.03 44.81 49.76Q41.67 48.49 39.48 46.07Q37.28 43.65 36.10 40.14Q34.91 36.62 34.91 32.10Q34.91 27.66 36.08 24.13Q37.26 20.61 39.50 18.09Q41.65 15.70 44.84 14.43Q48.02 13.16 51.78 13.16Q55.69 13.16 58.80 14.44Q61.91 15.72 64.09 18.09M63.65 32.10Q63.65 25.02 60.47 21.18Q57.30 17.33 51.81 17.33Q46.26 17.33 43.10 21.18Q39.94 25.02 39.94 32.10Q39.94 39.26 43.16 43.05Q46.39 46.85 51.81 46.85Q57.23 46.85 60.44 43.05Q63.65 39.26 63.65 32.10ZM104.08 50.27L98.10 50.27L80.86 17.75L80.86 50.27L76.34 50.27L76.34 13.92L83.84 13.92L99.56 43.60L99.56 13.92L104.08 13.92L104.08 50.27ZM141.48 50.27L135.50 50.27L118.26 17.75L118.26 50.27L113.75 50.27L113.75 13.92L121.24 13.92L136.96 43.60L136.96 13.92L141.48 13.92L141.48 50.27ZM175.10 50.27L151.15 50.27L151.15 13.92L175.10 13.92L175.10 18.21L155.98 18.21L155.98 28.17L175.10 28.17L175.10 32.47L155.98 32.47L155.98 45.97L175.10 45.97L175.10 50.27ZM211.99 50.27L205.71 50.27L191.33 34.08L187.72 37.94L187.72 50.27L182.89 50.27L182.89 13.92L187.72 13.92L187.72 32.89L205.37 13.92L211.23 13.92L195.00 31.01L211.99 50.27ZM243.33 18.21L230.35 18.21L230.35 50.27L225.51 50.27L225.51 18.21L212.52 18.21L212.52 13.92L243.33 13.92L243.33 18.21Z"/>
    </g>
  </g>
</svg>
`;

// ==========================================
// 4. MAIN TITLE COMPONENT (LOGO + TEXT)
// ==========================================
const MetallicLogoGroup = () => {
    return (
        // OUTER WRAPPER: Ensures the entire group is centered relative to the screen
        <div className="w-full flex justify-center items-center mt-10 md:mt-0">
            {/* INNER GROUP: Holds the Logo and Text together as one relative unit */}
            <div className="relative flex flex-col md:flex-row items-center justify-center">
                
                {/* SVG LOGO */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    // z-10 ensures logo sits above text if they overlap
                    className="w-24 h-24 md:w-32 md:h-32 relative shrink-0 z-10"
                >
                    <MetallicPaint
                      svg={CONNEKT_ICON_SVG}
                      className="block w-full h-full"
                    />
                </motion.div>

                {/* METALLIC TEXT */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  // UPDATED WIDTH & MARGIN:
                  // 1. Width set to `md:w-[61.5rem]` to match the SVG aspect ratio (4.72:1) at height 52.
                  //    This removes the invisible space on the right side.
                  // 2. Margin set to `md:-ml-10` to tuck the "C" next to the logo without over-shifting.
                  className="relative w-[95vw] md:w-[61.5rem] h-24 md:h-52 -mt-10 md:mt-0 md:-ml-10"
                >
                  <MetallicPaint
                    svg={CONNEKT_WORDMARK_SVG}
                    className="block w-full h-full"
                    params={{
                        speed: 0.2,   
                        liquid: 0.1,  
                        edge: 0.5,
                        patternScale: 3, 
                        refraction: 0.02
                    }}
                  />
                </motion.div>
            </div>
        </div>
    );
}

// ==========================================
// 5. MAIN LANDING PAGE
// ==========================================
export default function LandingPage() {
    // --- LOADING LOGIC ---
    const [isLoading, setIsLoading] = useState(true);
    const { hasGlobalAnimationRun, setHasGlobalAnimationRun } = useAnimation();
    
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const shouldShowLoading = useMinimumLoading(isLoading && !hasGlobalAnimationRun);

    useEffect(() => {
        if (!shouldShowLoading && !hasGlobalAnimationRun) {
            setHasGlobalAnimationRun(true);
        }
    }, [shouldShowLoading, hasGlobalAnimationRun, setHasGlobalAnimationRun]);


    // --- SCROLL JACKING LOGIC ---
    const TOTAL_INDICES = SLIDES.length + 1;
    const [activeIndex, setActiveIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollAccumulator = useRef(0);
    const springIndex = useSpring(0, SPRING_OPTIONS);

    useEffect(() => {
        springIndex.set(activeIndex);
    }, [activeIndex, springIndex]);

    const handleWheel = useCallback((e: WheelEvent) => {
        if (isScrolling) return;

        scrollAccumulator.current += e.deltaY;
        const THRESHOLD = 50; 

        if (scrollAccumulator.current > THRESHOLD) {
            if (activeIndex < TOTAL_INDICES - 1) {
                setIsScrolling(true);
                setActiveIndex(prev => prev + 1);
                scrollAccumulator.current = 0;
                setTimeout(() => setIsScrolling(false), 1000);
            } else {
                scrollAccumulator.current = THRESHOLD;
            }
        } else if (scrollAccumulator.current < -THRESHOLD) {
            if (activeIndex > 0) {
                setIsScrolling(true);
                setActiveIndex(prev => prev - 1);
                scrollAccumulator.current = 0;
                setTimeout(() => setIsScrolling(false), 1000);
            } else {
                scrollAccumulator.current = -THRESHOLD;
            }
        }
        clearTimeout((window as any).scrollTimer);
        (window as any).scrollTimer = setTimeout(() => {
            scrollAccumulator.current = 0;
        }, 100);

    }, [activeIndex, isScrolling, TOTAL_INDICES]);

    useEffect(() => {
        if (!shouldShowLoading) {
            window.addEventListener('wheel', handleWheel, { passive: false });
            return () => window.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel, shouldShowLoading]);


    // --- ANIMATION TRANSFORMS ---
    const whiteContainerY = useTransform(springIndex, [0, 1], ['100vh', '0vh']);
    const heroY = useTransform(springIndex, [0, 1], ['0vh', '20vh']);
    const heroOpacity = useTransform(springIndex, [0, 0.8], [1, 0]);
    const heroScale = useTransform(springIndex, [0, 1], [1, 0.9]);
    const internalContentY = useTransform(springIndex, 
        [1, TOTAL_INDICES - 1], 
        ['0vh', `-${(SLIDES.length - 1) * 100}vh`]
    );

    // --- RENDER ---
    if (shouldShowLoading && !hasGlobalAnimationRun) {
        return <LoadingScreen variant="default" />;
    }

    return (
        <div className="fixed inset-0 bg-black overflow-hidden font-sans text-slate-900">
            
            {/* LAYER 1: HERO SECTION */}
            <motion.div 
                style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
                className="absolute inset-0 flex flex-col items-center justify-center z-0"
            >
                {/* 
                   DARK VEIL BACKGROUND 
                */}
                <div className="absolute inset-0 z-0">
                    <DarkVeil 
                        hueShift={44}
                        noiseIntensity={0}
                        scanlineIntensity={0.3}
                        scanlineFrequency={0}
                        speed={1}
                    />
                    {/* Subtle Overlay to ensure text readability */}
                    <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                </div>
                
                <div className="relative z-10 w-full flex flex-col items-center justify-center px-4">
                    
                    {/* METALLIC LOGO + TEXT */}
                    <div className="mb-6 md:mb-12 w-full flex justify-center">
                        <MetallicLogoGroup />
                    </div>

                    {/* ROTATING SLOGAN */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 2.5 }}
                      className="relative z-10"
                    >
                      <LayoutGroup id="hero-slogan">
                        <motion.div
                          layout="position"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 text-3xl md:text-5xl font-bold tracking-tight"
                        >
                          <motion.span
                            layout="position"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            className="text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.3)] will-change-transform"
                          >
                            Scale Beyond
                          </motion.span>

                          <motion.div
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            className="bg-teal-500/15 border border-teal-400/30 backdrop-blur-md rounded-full px-6 py-2 md:py-3 shadow-[0_0_30px_rgba(20,184,166,0.12)] flex items-center justify-center min-w-[150px] will-change-transform"
                          >
                            <RotatingText
                              texts={[
                                "Yourself",
                                "Your Team",
                                "Borders",
                                "Limits"
                              ]}
                              mainClassName="text-white font-extrabold"
                              rotationInterval={3000}
                              staggerDuration={0.05}
                              transition={{ type: "spring", damping: 20, stiffness: 300 }}
                              animatePresenceMode="popLayout"
                            />
                          </motion.div>
                        </motion.div>
                      </LayoutGroup>
                    </motion.div>
                    
                    <motion.button 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 3.2 }}
                        onClick={() => setActiveIndex(1)}
                        className="mt-16 px-10 py-4 bg-teal-500 text-black text-lg rounded-full font-bold hover:scale-105 hover:bg-teal-400 hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] transition-all"
                    >
                        Start the Journey
                    </motion.button>
                </div>

                <motion.div 
                    animate={{ y: [0, 10, 0], opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-12 text-teal-500/50"
                >
                    <ChevronDown size={32} />
                </motion.div>
            </motion.div>


            {/* LAYER 2: FOREGROUND CONTENT */}
            <motion.div 
                style={{ y: whiteContainerY }}
                className="absolute inset-0 z-20"
            >
                <div className="absolute inset-0 bg-slate-50 rounded-t-[4rem] shadow-[0_-50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
                    <motion.div 
                        style={{ y: internalContentY }}
                        className="w-full h-full"
                    >
                        {SLIDES.map((Component, index) => {
                            const isVisible = activeIndex === index + 1;
                            return (
                                <div 
                                    key={index} 
                                    className="h-screen w-full flex items-center justify-center relative"
                                >
                                    <Component isVisible={isVisible} />
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}