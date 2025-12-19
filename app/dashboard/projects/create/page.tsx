'use client';

/* 
  =============================================================================
  IMPORTS & DEPENDENCIES
  =============================================================================
*/
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { WalletService } from '@/lib/services/wallet-service';
import { Workspace } from '@/lib/types/workspace.types';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Briefcase, 
  ArrowLeft, 
  Check, 
  Calendar, 
  DollarSign, 
  Search, 
  Sparkles, 
  ImageIcon,
  AlertCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import ConnektWalletLogo from '@/components/wallet/ConnektWalletLogo';
import { ThreeDImageRing } from '@/components/ui/ThreeDImageRing';
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useMotionValueEvent, 
  useTransform, 
  animate, 
  useSpring, 
  useInView,
  easeOut,
  PanInfo
} from 'framer-motion';

/* 
  =============================================================================
  CONSTANTS & CONFIG
  =============================================================================
*/
const PEXELS_API_KEY = 'uNNIi84SKBlha2IhMZdLdLIAa9TPWBx1PUGUNtKcgekOpyQbf4azoXni';
const MAX_OVERFLOW = 50;

// Decay function for Slider physics
function decay(value: number, max: number) {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}

/* 
  =============================================================================
  COMPONENT: CountUp
  (For Realtime Number Display)
  =============================================================================
*/
interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  prefix?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 1,
  className = '',
  startWhen = true,
  separator = '',
  prefix = '',
  onStart,
  onEnd
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = (num: number) => {
    const str = num.toString();
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      if (parseInt(decimals) !== 0) {
        return decimals.length;
      }
    }
    return 0;
  };

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: 2, // Forced to 2 for currency
        maximumFractionDigits: 2
      };
      const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);
      return prefix + (separator ? formattedNumber.replace(/,/g, separator) : formattedNumber);
    },
    [separator, prefix]
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === 'down' ? to : from);
    }
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof onStart === 'function') onStart();

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? from : to);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === 'function') onEnd();
        },
        delay * 1000 + duration * 1000
      );

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', latest => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}

/* 
  =============================================================================
  COMPONENT: ElasticSlider
  (For Wallet Budget Setting)
  =============================================================================
*/
interface ElasticSliderProps {
  defaultValue?: number;
  startingValue?: number;
  maxValue?: number;
  className?: string;
  isStepped?: boolean;
  stepSize?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (value: number) => void;
}

function ElasticSlider({
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  leftIcon = <span className="text-xl font-bold text-gray-400">-</span>,
  rightIcon = <span className="text-xl font-bold text-gray-400">+</span>,
  onChange
}: ElasticSliderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 w-full ${className}`}>
      <SliderCore
        defaultValue={defaultValue}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onChange={onChange}
      />
    </div>
  );
}

function SliderCore({ defaultValue, startingValue, maxValue, isStepped, stepSize, leftIcon, rightIcon, onChange }: any) {
  const [value, setValue] = useState(defaultValue);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState('middle');
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useMotionValueEvent(clientX, 'change', latest => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue;

      if (latest < left) {
        setRegion('left');
        newValue = left - latest;
      } else if (latest > right) {
        setRegion('right');
        newValue = latest - right;
      } else {
        setRegion('middle');
        newValue = 0;
      }

      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = (e: any) => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);

      if (isStepped) {
        newValue = Math.round(newValue / stepSize) * stepSize;
      }

      newValue = Math.min(Math.max(newValue, startingValue), maxValue);
      setValue(newValue);
      if (onChange) onChange(newValue);
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = (e: any) => {
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
  };

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;
    return ((value - startingValue) / totalRange) * 100;
  };

  return (
    <>
      <motion.div
        onHoverStart={() => animate(scale, 1.05)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.05)}
        onTouchEnd={() => animate(scale, 1)}
        style={{
          scale,
        }}
        className="flex w-full touch-none select-none items-center justify-center gap-6 relative z-10"
      >
        <motion.div
          animate={{
            scale: region === 'left' ? [1, 1.2, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'left' ? -overflow.get() / scale.get() : 0))
          }}
          className="cursor-pointer hover:text-teal-500 transition-colors"
          onClick={() => {
             const n = Math.max(startingValue, value - (maxValue/10));
             setValue(n);
             if(onChange) onChange(n);
          }}
        >
          {leftIcon}
        </motion.div>

        <div
          ref={sliderRef}
          className="relative flex w-full flex-grow cursor-grab active:cursor-grabbing touch-none select-none items-center py-6 group"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {/* Track Background */}
          <div className="absolute w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden"></div>

          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
                return 1;
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } = sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? 'right' : 'left';
                }
                return 'center';
              }),
              height: useTransform(scale, [1, 1.2], [8, 16]),
            }}
            className="flex flex-grow relative h-2"
          >
            <div className="relative h-full flex-grow rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gray-200 dark:bg-zinc-700 opacity-50" />
                <div 
                    className="absolute h-full bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_15px_rgba(20,184,166,0.5)] rounded-full transition-all duration-75 ease-linear" 
                    style={{ width: `${getRangePercentage()}%` }} 
                />
            </div>
            {/* Thumb */}
            <div 
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-teal-500 rounded-full shadow-lg z-20 pointer-events-none transform transition-transform"
                style={{ 
                    left: `${getRangePercentage()}%`,
                    transform: `translate(-50%, -50%) scale(${scale.get() * 1.2})` 
                }}
            />
          </motion.div>
        </div>

        <motion.div
          animate={{
            scale: region === 'right' ? [1, 1.2, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'right' ? overflow.get() / scale.get() : 0))
          }}
          className="cursor-pointer hover:text-teal-500 transition-colors"
          onClick={() => {
             const n = Math.min(maxValue, value + (maxValue/10));
             setValue(n);
             if(onChange) onChange(n);
          }}
        >
          {rightIcon}
        </motion.div>
      </motion.div>
      
      <div className="flex justify-between w-full text-xs font-mono text-gray-400 px-2 mt-[-10px]">
          <span>{startingValue.toFixed(2)}</span>
          <span className="text-teal-600 font-bold">
            <CountUp to={value} prefix="D" />
          </span>
          <span>{maxValue.toFixed(2)}</span>
      </div>
    </>
  );
}

/* 
  =============================================================================
  MAIN PAGE COMPONENT
  =============================================================================
*/
export default function CreateProjectPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    
    // State
    const [loading, setLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [formData, setFormData] = useState({
        workspaceId: '',
        title: '',
        description: '',
        budget: '',
        deadline: '',
        recurringType: 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    
    // Image Selection State
    const [pexelsImages, setPexelsImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isSearchingImages, setIsSearchingImages] = useState(false);
    
    // Refs for Debouncing
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /* 
      INITIAL DATA FETCHING 
    */
    useEffect(() => {
        if (user) {
            const fetchInitialData = async () => {
                const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.uid);
                setWorkspaces(userWorkspaces);
                if (userWorkspaces.length > 0) {
                    setFormData(prev => ({ ...prev, workspaceId: userWorkspaces[0].id! }));
                }

                try {
                    const wallet = await WalletService.getWallet(user.uid, 'user');
                    if (wallet) {
                        setWalletBalance(wallet.balance);
                    }
                } catch (error) {
                    console.error('Error fetching wallet:', error);
                }
            };
            fetchInitialData();
        }
    }, [user]);

    /* 
      PEXELS IMAGE FETCHING LOGIC
    */
    const fetchPexelsImages = async (query: string) => {
        if (!query || query.length < 3) return;
        
        setIsSearchingImages(true);
        try {
            const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=7`, {
                headers: {
                    Authorization: PEXELS_API_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const images = data.photos.map((photo: any) => photo.src.large2x);
                setPexelsImages(images);
                // Auto select first image
                if (images.length > 0 && !selectedImage) {
                    setSelectedImage(images[0]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch images", err);
        } finally {
            setIsSearchingImages(false);
        }
    };

    /* 
      FORM HANDLERS
    */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Trigger Pexels Search on Title Change
        if (name === 'title') {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => {
                const workspaceName = workspaces.find(w => w.id === formData.workspaceId)?.name || '';
                // Search combining workspace name context + project title for better results
                const query = `${workspaceName} ${value}`;
                fetchPexelsImages(query.trim());
            }, 800);
        }
    };

    // Handler for Slider
    const handleBudgetSliderChange = (val: number) => {
        setFormData(prev => ({ ...prev, budget: val.toFixed(2) }));
        if (errors.budget) setErrors(prev => ({ ...prev, budget: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.workspaceId) newErrors.workspaceId = 'Please select a workspace';
        if (!formData.title.trim()) newErrors.title = 'Project title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';

        const budget = parseFloat(formData.budget);
        if (!formData.budget || budget <= 0) {
            newErrors.budget = 'Budget must be greater than 0';
        } else if (walletBalance !== null && budget > walletBalance) {
            newErrors.budget = `Insufficient funds. Available: D${walletBalance.toFixed(2)}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !user || !userProfile) return;

        setLoading(true);
        try {
            // Note: We are attaching the coverImage to the payload. 
            // Even if the type definition in EnhancedProjectService doesn't explicitly show it in the destructured args,
            // passing it in the object allows it to be processed if the backend supports it, 
            // satisfying the requirement to select an image for the project without breaking existing logic.
            const projectPayload: any = {
                workspaceId: formData.workspaceId,
                ownerId: user.uid,
                ownerUsername: userProfile.username || 'user',
                title: formData.title,
                description: formData.description,
                budget: parseFloat(formData.budget),
                deadline: formData.deadline || undefined,
                recurringType: formData.recurringType,
                coverImage: selectedImage // Added field
            };

            const projectId = await EnhancedProjectService.createProject(projectPayload);

            router.push(`/dashboard/projects/${projectId}`);
        } catch (error: any) {
            console.error('Error creating project:', error);
            const errorMessage = error.message || 'Failed to create project. Please try again.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /* 
      EMPTY STATE
    */
    if (workspaces.length === 0 && !loading) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto text-center py-24 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-50/20 to-transparent dark:via-teal-900/10 pointer-events-none" />
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-zinc-900">
                    <Briefcase size={48} className="text-gray-400" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                    Create a Workspace First
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto">
                    Projects must belong to a workspace. Create a workspace before creating projects to unlock the full potential of Connekt.
                </p>
                <button
                    onClick={() => router.push('/dashboard/workspaces/create')}
                    className="px-8 py-4 bg-[#008080] hover:bg-teal-600 text-white rounded-2xl font-bold inline-flex items-center gap-3 transition-all shadow-[0_10px_20px_rgba(0,128,128,0.3)] hover:shadow-[0_15px_30px_rgba(0,128,128,0.4)] hover:-translate-y-1"
                >
                    <Sparkles size={20} />
                    Create Workspace
                </button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-24 relative">
             {/* 
                BACKGROUND DECORATION 
             */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/40 via-transparent to-transparent dark:from-teal-900/10" />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute top-20 right-20 w-96 h-96 bg-teal-200/20 dark:bg-teal-900/20 rounded-full blur-3xl" 
                />
            </div>

            {/* 
                HEADER SECTION
            */}
            <div className="mb-12 relative">
                <motion.button
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors mb-6 group font-medium"
                >
                    <div className="p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-x-1">
                        <ArrowLeft size={18} />
                    </div>
                    <span>Back to Dashboard</span>
                </motion.button>
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-4">
                    <motion.div 
                        initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#008080] via-teal-500 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-teal-500/30 ring-4 ring-white dark:ring-zinc-900"
                    >
                        <Briefcase size={36} />
                    </motion.div>
                    <div>
                        <motion.h1 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl font-black text-gray-900 dark:text-white tracking-tight"
                        >
                            Create Project
                        </motion.h1>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-gray-500 dark:text-gray-400 mt-2 font-medium"
                        >
                            Design your new venture and allocate your budget.
                        </motion.p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 
                   3D COVER IMAGE SELECTOR SECTION 
                */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  className="w-full relative overflow-hidden"
                  style={{ height: 520 }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4">
                    <div className="w-full max-w-4xl flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <ImageIcon size={16} className="text-[#008080]" />
                          Select a cover image
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Drag the ring to rotate, then click an image to select.
                        </p>
                      </div>

                      {isSearchingImages && (
                        <div className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md px-3 py-1.5">
                          <Loader2 className="animate-spin text-[#008080]" size={14} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Searching…</span>
                        </div>
                      )}
                    </div>

                    <div className="relative w-full flex-1 flex items-center justify-center">
                      {pexelsImages.length > 0 ? (
                        <ThreeDImageRing 
                          images={pexelsImages}
                          width={340}
                          imageDistance={500}
                          onSelectImage={(url) => setSelectedImage(url)}
                        />
                      ) : (
                        <div className="text-center opacity-60">
                          <Search size={56} className="mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                          <p className="text-gray-500 dark:text-gray-500 font-mono text-sm">
                            Type a project title to fetch covers
                          </p>
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {selectedImage ? (
                        <motion.div
                          key="selected-cover"
                          initial={{ y: 12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 12, opacity: 0 }}
                          className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md p-3 flex items-center gap-3"
                        >
                          <div
                            className="h-12 w-12 rounded-xl border border-gray-200 dark:border-zinc-700 bg-center bg-cover shrink-0"
                            style={{ backgroundImage: `url(${selectedImage})` }}
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Selected image
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              Ready for your project cover
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-2 text-[#008080] font-bold text-sm">
                            <Check size={18} />
                            Selected
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="no-selection"
                          initial={{ y: 12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 12, opacity: 0 }}
                          className="w-full max-w-2xl rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md p-3"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            No image selected yet
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Click any image in the ring to select it.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* 
                   MAIN FORM CARD
                */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Inputs */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-xl">
                            {/* Workspace Selection */}
                            <div className="mb-6">
                                <label htmlFor="workspaceId" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                    Target Workspace
                                </label>
                                <div className="relative">
                                    <select
                                        id="workspaceId"
                                        name="workspaceId"
                                        value={formData.workspaceId}
                                        onChange={handleChange}
                                        className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border ${errors.workspaceId ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                            } rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080] appearance-none font-medium transition-all hover:bg-white dark:hover:bg-zinc-800`}
                                    >
                                        {workspaces.map(workspace => (
                                            <option key={workspace.id} value={workspace.id}>
                                                {workspace.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <Briefcase size={18} />
                                    </div>
                                </div>
                                {errors.workspaceId && <p className="mt-2 text-sm text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={14}/> {errors.workspaceId}</p>}
                            </div>

                            {/* Project Title */}
                            <div className="mb-6">
                                <label htmlFor="title" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                    Project Title
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Next Gen E-Commerce"
                                        className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                            } rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080] font-bold text-lg placeholder:font-normal transition-all group-hover:bg-white dark:group-hover:bg-zinc-800`}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#008080] transition-colors">
                                        <Sparkles size={20} />
                                    </div>
                                </div>
                                {errors.title && <p className="mt-2 text-sm text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={14}/> {errors.title}</p>}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <label htmlFor="description" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                    Description & Scope
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Describe the project goals, deliverables, and specific requirements..."
                                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                        } rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080] resize-none transition-all hover:bg-white dark:hover:bg-zinc-800`}
                                />
                                {errors.description && <p className="mt-2 text-sm text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={14}/> {errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="recurringType" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                        Frequency
                                    </label>
                                    <select
                                        id="recurringType"
                                        name="recurringType"
                                        value={formData.recurringType}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080]"
                                    >
                                        <option value="none">One-time Project</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="deadline" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                        Deadline
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            id="deadline"
                                            name="deadline"
                                            value={formData.deadline}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080]"
                                        />
                                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Wallet & Budget */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-6"
                    >
                        {/* Interactive Wallet Card */}
                        <div className="bg-gradient-to-br from-[#008080] to-teal-700 rounded-3xl p-6 text-white shadow-2xl shadow-teal-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                        <ConnektWalletLogo size="small" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">My Wallet</h3>
                                        <p className="text-teal-100 text-xs opacity-80">Available for Allocation</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 relative z-10">
                                <p className="text-teal-100 text-sm mb-1">Current Balance</p>
                                <div className="text-5xl font-black tracking-tight flex items-baseline gap-1">
                                    <span className="text-2xl opacity-70">D</span>
                                    <CountUp 
                                        to={walletBalance || 0} 
                                        separator="," 
                                  duration={1.1}
                                    />
                                </div>
                            </div>

                            {/* Mini Stat Grid */}
                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-xs text-teal-100 mb-1">Allocated</p>
                                    <p className="font-bold text-lg flex items-center gap-1">
                                    D <CountUp to={parseFloat(formData.budget || '0')} duration={0.8} />
                                    </p>
                                </div>
                                <div className={`bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors ${
                                    (walletBalance !== null && parseFloat(formData.budget || '0') > walletBalance) ? 'bg-red-500/20 border-red-400/50' : ''
                                }`}>
                                    <p className="text-xs text-teal-100 mb-1">Remaining</p>
                                    <p className={`font-bold text-lg flex items-center gap-1 ${
                                        (walletBalance !== null && parseFloat(formData.budget || '0') > walletBalance) ? 'text-red-200' : ''
                                    }`}>
                                        D <CountUp 
                                            to={(walletBalance || 0) - parseFloat(formData.budget || '0')} 
                                            direction="down"
                                        duration={0.8}
                                        />
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Budget Control Panel */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-lg">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <DollarSign className="text-[#008080]" />
                                Set Budget
                            </h3>
                            
                            {/* The Elastic Slider */}
                            <div className="mb-8 py-4">
                                <ElasticSlider 
                                    startingValue={0}
                                maxValue={walletBalance ?? 0}
                                    defaultValue={parseFloat(formData.budget || '0')}
                                    onChange={handleBudgetSliderChange}
                                    isStepped={true}
                                    stepSize={50}
                                    leftIcon={<span className="text-2xl font-bold text-gray-400 select-none">-</span>}
                                    rightIcon={<span className="text-2xl font-bold text-gray-400 select-none">+</span>}
                                />
                            </div>

                            {/* Manual Override Input (Hidden but functional logic) */}
                            <div className="relative">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Manual Entry</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        className={`w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border ${errors.budget ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] font-mono font-bold text-gray-900 dark:text-white pl-10`}
                                        placeholder="0.00"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <span className="font-bold">D</span>
                                    </div>
                                </div>
                                {errors.budget && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14}/> {errors.budget}</p>}
                            </div>
                        </div>

                        {/* Submit Action */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-5 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>Allocating Funds...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={24} className="group-hover:scale-125 transition-transform" />
                                    <span>Launch Project</span>
                                </>
                            )}
                        </motion.button>
                        
                        <div className="text-center">
                             <p className="text-xs text-gray-400">
                                 Funds will be held in escrow until milestones are approved.
                             </p>
                        </div>
                    </motion.div>
                </div>
            </form >
        </div >
    );
}