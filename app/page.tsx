'use client';

import React, { useState, useEffect, forwardRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Briefcase, Users, FileText, Calendar, Star, Code, PenTool, BarChart, Settings, ShoppingCart, Search, Film, PencilRuler, Headphones, UserPlus, FileSearch, Handshake, PlusCircle, GraduationCap, ArrowRight, Book, LineChart, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// ============= UTILITY FUNCTIONS =============
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// ============= PLACEHOLDER DATA =============
const placeholderImages = {
  heroCarousel: [
    { src: "https://picsum.photos/seed/hero1/1600/600", alt: "Hero 1", hint: "professional workspace" },
    { src: "https://picsum.photos/seed/hero2/1600/600", alt: "Hero 2", hint: "team collaboration" },
    { src: "https://picsum.photos/seed/hero3/1600/600", alt: "Hero 3", hint: "virtual assistant" },
  ],
  testimonials: [
    { seed: "person1", hint: "professional woman" },
    { seed: "person2", hint: "businessman" },
    { seed: "person3", hint: "young professional" },
    { seed: "person4", hint: "entrepreneur" },
    { seed: "person5", hint: "business owner" },
    { seed: "person6", hint: "tech professional" },
  ],
};

// ============= INLINE COMPONENTS =============

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, asChild, size = 'default', variant = 'default', ...props }, ref) => {
    const sizeClasses = {
      default: 'px-4 py-2 text-sm',
      sm: 'px-3 py-1.5 text-xs',
      lg: 'px-6 py-3 text-base',
    };

    const variantClasses = {
      default: 'bg-[#008080] hover:bg-teal-600 text-white shadow-lg transition-all',
      outline: 'border border-gray-300 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800',
      ghost: 'hover:bg-gray-100 dark:hover:bg-zinc-800',
    };

    if (asChild && React.isValidElement(children)) {
      const childProps = (children as React.ReactElement<any>).props;
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-all',
          sizeClasses[size],
          variantClasses[variant],
          className,
          childProps.className
        ),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-all disabled:opacity-50',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Card Components
const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// Input Component
const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]/30 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// Select Components
interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType>({
  open: false,
  setOpen: () => { },
});

const Select = ({ children, defaultValue, onValueChange }: { children: ReactNode; defaultValue?: string; onValueChange?: (value: string) => void }) => {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      {children}
    </SelectContext.Provider>
  );
};

const SelectTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { setOpen, open } = React.useContext(SelectContext);

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#008080]/30 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder}</span>;
};

const SelectContent = ({ children }: { children: ReactNode }) => {
  const { open } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg">
      {children}
    </div>
  );
};

const SelectItem = ({ value, children }: { value: string; children: ReactNode }) => {
  const { onValueChange } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value)}
      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer"
    >
      {children}
    </button>
  );
};

// Avatar Components
const Avatar = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
);
Avatar.displayName = 'Avatar';

const AvatarImage = forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => (
    <img ref={ref} className={cn('aspect-square h-full w-full object-cover', className)} {...props} />
  )
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700', className)}
      {...props}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

// Carousel Components
interface CarouselProps {
  children: ReactNode;
  opts?: { loop?: boolean; align?: string };
  plugins?: any[];
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const Carousel = ({ children, opts, className, onMouseEnter, onMouseLeave }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [childrenArray, setChildrenArray] = useState<ReactNode[]>([]);

  useEffect(() => {
    // Extract children from CarouselContent
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === CarouselContent) {
        setChildrenArray(React.Children.toArray(child.props.children));
      }
    });
  }, [children]);

  useEffect(() => {
    if (opts?.loop) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % childrenArray.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [opts?.loop, childrenArray.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % childrenArray.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + childrenArray.length) % childrenArray.length);
  };

  return (
    <div className={cn('relative', className)} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {childrenArray.map((child, index) => (
            <div key={index} className="min-w-full">
              {child}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-zinc-800/80 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-colors shadow-lg z-10"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-zinc-800/80 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-colors shadow-lg z-10"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};

const CarouselContent = ({ children }: { children: ReactNode }) => <>{children}</>;
const CarouselItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);
const CarouselPrevious = ({ className }: { className?: string }) => null;
const CarouselNext = ({ className }: { className?: string }) => null;

const topCategories = [
  { icon: <PenTool className="h-5 w-5" />, title: 'Creative & Design' },
  { icon: <Code className="h-5 w-5" />, title: 'Tech & Development' },
  { icon: <BarChart className="h-5 w-5" />, title: 'Marketing & Sales' },
  { icon: <Settings className="h-5 w-5" />, title: 'Admin & Support' },
  { icon: <ShoppingCart className="h-5 w-5" />, title: 'E-commerce' },
  { icon: <FileText className="h-5 w-5" />, title: 'Writing & Translation' },
  { icon: <Film className="h-5 w-5" />, title: 'Video & Animation' },
  { icon: <Headphones className="h-5 w-5" />, title: 'Customer Service' },
  { icon: <Briefcase className="h-5 w-5" />, title: 'Project Management' },
];


export default function Home() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');


  const features = [
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: 'VA Marketplace',
      description: 'Discover and hire top-tier virtual assistants with the right skills for your business needs.',
      link: '/marketplace',
    },
    {
      icon: <Briefcase className="h-8 w-8 text-accent" />,
      title: 'Dynamic Job Board',
      description: 'Post job opportunities and find the perfect virtual assistant to join your team.',
      link: '/jobs',
    },
    {
      icon: <Bot className="h-8 w-8 text-accent" />,
      title: 'AI-Powered Tools',
      description: 'Leverage our intelligent tools to streamline your hiring process, from job descriptions to interviews.',
      link: '/ai-tools',
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-accent" />,
      title: 'Learning & Training',
      description: 'Upskill with expert-led courses designed for the modern virtual assistant.',
      link: '/learning',
    },
  ];

  const popularServices = [
    { icon: <LineChart className="h-8 w-8 text-accent" />, title: 'Social Media Management', description: 'Engage your audience and grow your brand on social media.' },
    { icon: <Calendar className="h-8 w-8 text-accent" />, title: 'Executive Assistance', description: 'Get help with scheduling, email, and administrative tasks.' },
    { icon: <ShoppingCart className="h-8 w-8 text-accent" />, title: 'E-commerce Management', description: 'Manage your online store, from product listings to customer service.' },
    { icon: <PencilRuler className="h-8 w-8 text-accent" />, title: 'Content Creation', description: 'High-quality blog posts, articles, and marketing copy.' },
    { icon: <MessageSquare className="h-8 w-8 text-accent" />, title: 'Customer Support', description: 'Provide excellent support to your customers and clients.' },
    { icon: <Book className="h-8 w-8 text-accent" />, title: 'Bookkeeping', description: 'Keep your finances in order with expert bookkeeping services.' },
    { icon: <Code className="h-8 w-8 text-accent" />, title: 'Website Maintenance', description: 'Keep your website updated, secure, and running smoothly.' },
    { icon: <PenTool className="h-8 w-8 text-accent" />, title: 'Graphic Design', description: 'Stunning visuals for your brand, from logos to social posts.' },
  ];

  const howItWorksProcess = [
    {
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      title: "Create Your Profile",
      description: "Sign up as an employer or a virtual assistant and set up your profile in minutes.",
    },
    {
      icon: <FileSearch className="h-8 w-8 text-primary" />,
      title: "Post or Find Work",
      description: "Employers can post jobs, and VAs can browse listings and our marketplace.",
    },
    {
      icon: <Handshake className="h-8 w-8 text-primary" />,
      title: "Connect & Collaborate",
      description: "Use our platform to connect, manage applications, and begin working together.",
    },
  ];

  const testimonials = [
    {
      name: 'Fatou Camara',
      title: 'Marketing Director',
      quote: "CONNEKT helped us find a fantastic social media VA in just a few days. The platform is intuitive and the quality of talent is outstanding. Highly recommended!",
      avatar: `https://picsum.photos/seed/${placeholderImages.testimonials[0].seed}/100/100`,
      avatarHint: placeholderImages.testimonials[0].hint,
      rating: 5,
    },
    {
      name: 'Ousman Sallah',
      title: 'Startup Founder',
      quote: "As a small team, finding reliable help is crucial. We hired an executive assistant through CONNEKT who has been an absolute game-changer for our productivity.",
      avatar: `https://picsum.photos/seed/${placeholderImages.testimonials[1].seed}/100/100`,
      avatarHint: placeholderImages.testimonials[1].hint,
      rating: 5,
    },
    {
      name: 'Binta Jobe',
      title: 'Virtual Assistant',
      quote: "I've found my best clients through CONNEKT. It's easy to use, and I appreciate how it connects me with serious employers looking for my specific skill set.",
      avatar: `https://picsum.photos/seed/${placeholderImages.testimonials[2].seed}/100/100`,
      avatarHint: placeholderImages.testimonials[2].hint,
      rating: 5,
    },
    {
      name: 'Dawda Ceesay',
      title: 'E-commerce Store Owner',
      quote: "The AI tools for writing job descriptions saved me so much time. We found the perfect candidate to manage our Shopify store and couldn't be happier.",
      avatar: `https://picsum.photos/seed/${placeholderImages.testimonials[3].seed}/100/100`,
      avatarHint: placeholderImages.testimonials[3].hint,
      rating: 4,
    },
    {
      name: 'Adama Faye',
      title: 'Small Business Owner',
      quote: "The best platform for finding VAs. The quality is top-notch and the interface is incredibly user-friendly.",
      avatar: `https://picsum.photos/seed/${placeholderImages.testimonials[4].seed}/100/100`,
      avatarHint: placeholderImages.testimonials[4].hint,
      rating: 5,
    },
    {
      name: 'Chinedu Okoro',
      title: 'Tech Lead',
      quote: "Found a technical VA who has been invaluable to our team. A fantastic resource for specialized talent.",
      avatar: `https://picsum.photos/seed/${placeholderImages.testimonials[5].seed}/100/100`,
      avatarHint: placeholderImages.testimonials[5].hint,
      rating: 5,
    },
  ];

  const headlineText = "Africa's One-Stop VA Marketplace";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let query = `?q=${encodeURIComponent(searchTerm)}`;
    if (selectedCategory && selectedCategory !== 'all') {
      query += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    router.push(`/marketplace${query}`);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] pt-20">
      <section className="relative w-full py-6 md:py-10">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://picsum.photos/seed/business-woman/1600/900"
            alt="Background image of a professional working"
            fill
            className="object-cover"
            data-ai-hint="business woman"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <Card className="hidden md:block md:col-span-1 lg:col-span-1 p-3 bg-background/90 backdrop-blur-sm">
              <h3 className="font-semibold text-lg mb-2 px-2">Categories</h3>
              <div className="flex flex-col gap-1">
                {topCategories.map((cat) => (
                  <Link
                    key={cat.title}
                    href={`/marketplace?category=${encodeURIComponent(cat.title)}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted text-sm text-foreground"
                  >
                    {cat.icon}
                    <span>{cat.title}</span>
                  </Link>
                ))}
              </div>
            </Card>

            <div className="md:col-span-3 lg:col-span-4 relative rounded-lg overflow-hidden min-h-[50vh] flex flex-col justify-center">
              <Carousel
                opts={{ loop: true }}
                className="absolute inset-0 w-full h-full -z-10"
              >
                <CarouselContent>
                  {placeholderImages.heroCarousel.map((img, index) => (
                    <CarouselItem key={index}>
                      <Image
                        alt={img.alt}
                        className="w-full h-full object-cover"
                        fill
                        src={img.src}
                        data-ai-hint={img.hint}
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              <div className="relative p-8 md:p-12 text-white">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter font-headline mb-4 animate-fade-in">
                  {headlineText}
                </h1>
                <p className="max-w-lg text-lg text-white/90 mb-8">
                  Find and hire expert Virtual Assistants for any task, from administrative support to digital marketing.
                </p>
                <div className="bg-background/90 p-3 rounded-lg max-w-xl backdrop-blur-sm">
                  <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-grow flex items-center">
                      <Search className="h-5 w-5 text-muted-foreground mx-2" />
                      <Input
                        type="text"
                        placeholder="What service are you looking for today?"
                        className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select
                      defaultValue="all"
                      onValueChange={(value) => {
                        const category = value === 'all' ? '' : `?category=${encodeURIComponent(value)}`;
                        router.push(`/marketplace${category}`);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] bg-accent text-accent-foreground border-none hover:bg-accent/90">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {topCategories.map(cat => (
                          <SelectItem key={cat.title} value={cat.title}>{cat.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="submit" size="lg" className="w-full sm:w-auto">Search</Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-12 md:py-24 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">Why Choose CONNEKT?</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We provide the tools and community to help you succeed, whether you're hiring or looking for work.
            </p>
          </div>
          <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Link key={index} href={feature.link} className="h-full">
                <Card className="text-center h-full flex flex-col justify-center items-center p-6 hover:bg-secondary hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="p-0 items-center">
                    {feature.icon}
                    <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-2">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="popular-services" className="w-full py-12 md:py-24 lg:py-20 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">Explore Popular Services</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Get specialized VAs for any task your business needs to delegate.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularServices.map((service, index) => (
              <Link key={index} href={`/marketplace?service=${encodeURIComponent(service.title)}`} className="group">
                <Card className="bg-background h-full p-6 flex flex-col text-left hover:border-primary transition-all duration-300">
                  {service.icon}
                  <h3 className="font-headline text-xl mt-4">{service.title}</h3>
                  <p className="text-muted-foreground mt-1 flex-grow">{service.description}</p>
                  <div className="flex items-center gap-2 mt-4 text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Find VAs</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works-process" className="w-full py-12 md:py-24 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline text-primary">
              Joining and using CONNEKT is simple and straightforward.
            </h2>
          </div>
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center w-full max-w-5xl mx-auto">
            {howItWorksProcess.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center w-full md:w-1/3 px-4 py-8 md:py-0">
                {/* Connecting Lines for Desktop */}
                {index !== 0 && (
                  <div className="hidden md:block absolute top-1/2 left-0 w-1/2 h-px -translate-y-10 bg-border border-t-2 border-dashed"></div>
                )}
                {index !== howItWorksProcess.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 right-0 w-1/2 h-px -translate-y-10 bg-border border-t-2 border-dashed"></div>
                )}
                {/* Connecting Lines for Mobile */}
                {index !== howItWorksProcess.length - 1 && (
                  <div className="block md:hidden absolute top-0 left-1/2 w-px h-full -translate-x-1/2 bg-border border-l-2 border-dashed" style={{ top: '3.5rem', height: 'calc(100% - 7rem)' }}></div>
                )}

                <div className="relative z-10 w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 border-primary/20 mb-6">
                  {step.icon}
                </div>
                <h3 className="font-headline text-xl mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works-cards" className="w-full py-12 md:py-24 lg:py-20 bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline text-primary">Get Started in 3 Ways</h2>
            <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Whether you're looking to hire, find work, or simply explore, we've got a path for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col text-center items-center p-8 bg-background hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <PlusCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline">Post a Job</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0 mt-4">
                <p className="text-muted-foreground">Have a specific role to fill? Post a job and let qualified VAs come to you.</p>
              </CardContent>
              <Button asChild className="mt-6"><Link href="/jobs/create">Post a Job</Link></Button>
            </Card>
            <Card className="flex flex-col text-center items-center p-8 bg-background hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline">Hire a VA</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0 mt-4">
                <p className="text-muted-foreground">Browse our marketplace of talented VAs and find the perfect fit for your team.</p>
              </CardContent>
              <Button asChild className="mt-6"><Link href="/marketplace">Browse Marketplace</Link></Button>
            </Card>
            <Card className="flex flex-col text-center items-center p-8 bg-background hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Handshake className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline">Become a VA</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0 mt-4">
                <p className="text-muted-foreground">Join our network of skilled professionals and find your next opportunity.</p>
              </CardContent>
              <Button asChild className="mt-6"><Link href="/auth">Join as a VA</Link></Button>
            </Card>
          </div>
        </div>
      </section>

      <section id="testimonials" className="w-full py-12 md:py-24 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">What People Say About Us</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Hear from our satisfied clients and virtual assistants.
            </p>
          </div>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-4 h-full">
                    <Card className="bg-background h-full flex flex-col">
                      <CardContent className="p-8 space-y-4 text-center flex flex-col flex-grow">
                        <div className="flex justify-center mb-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-6 w-6 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-lg italic flex-grow">"{testimonial.quote}"</p>
                        <div className="flex items-center justify-center gap-4 pt-4">
                          <Avatar>
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.avatarHint} />
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 md:-left-12" />
            <CarouselNext className="-right-4 md:-right-12" />
          </Carousel>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-20 bg-primary text-primary-foreground">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
              Ready to find your perfect match?
            </h2>
            <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join our growing community of businesses and virtual assistants today. Your next great opportunity is just a click away.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
            <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/auth">
                Sign Up Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
