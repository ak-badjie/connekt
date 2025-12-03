'use client';

import { useState } from 'react';
import {
    FileText,
    Sparkles,
    Lightbulb,
    Target,
    Scale,
    FileEdit,
    FileSignature,
    Mail,
    MessageSquare,
    ListTodo,
    UserCheck,
    Users,
    HelpCircle,
    ClipboardCheck,
    Search,
    Zap,
    Crown,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

interface AITool {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: any;
    features: string[];
    useCases: string[];
    tier: 'Pro' | 'Pro Plus' | 'Connekt AI';
}

const AI_TOOLS: AITool[] = [
    // PROFILE AI
    {
        id: 'resume-parser',
        name: 'Connekt AI: Parse Your Resume',
        description: 'Automatically extract profile data from uploaded resumes. Supports PDF, DOC, and text formats.',
        category: 'Profile AI',
        tier: 'Pro',
        icon: ConnektAIIcon,
        features: ['Auto-fill profile fields', 'Extract skills & experience', 'Parse education & certifications'],
        useCases: ['Quick profile setup', 'Bulk candidate import', 'Resume screening']
    },
    {
        id: 'bio-enhancer',
        name: 'Connekt AI: Enhance Your Bio',
        description: 'Transform basic bios into compelling professional descriptions that showcase your strengths.',
        category: 'Profile AI',
        tier: 'Pro',
        icon: ConnektAIIcon,
        features: ['Professional tone', 'Highlight key strengths', 'SEO-optimized'],
        useCases: ['Profile optimization', 'Personal branding', 'Stand out to recruiters']
    },
    {
        id: 'skill-suggester',
        name: 'Connekt AI: Suggest Skills',
        description: 'Discover missing skills based on your work experience and industry trends.',
        category: 'Profile AI',
        tier: 'Pro',
        icon: ConnektAIIcon,
        features: ['Industry-relevant skills', 'Gap analysis', 'Career advancement tips'],
        useCases: ['Skill development', 'Resume completion', 'Career planning']
    },

    // RECRUITING AI
    {
        id: 'candidate-matcher',
        name: 'AI Candidate Matcher',
        description: 'Find the best candidates for your job postings with intelligent matching (0-100 score).',
        category: 'Recruiting AI',
        tier: 'Pro Plus',
        icon: Target,
        features: ['Smart ranking', 'Match score breakdown', 'Skills analysis'],
        useCases: ['Talent sourcing', 'Job posting automation', 'Candidate screening']
    },
    {
        id: 'candidate-comparator',
        name: 'AI Candidate Comparator',
        description: 'Compare multiple candidates side-by-side with detailed skills matrix and recommendations.',
        category: 'Recruiting AI',
        tier: 'Pro Plus',
        icon: Scale,
        features: ['Side-by-side comparison', 'Skills matrix', 'AI recommendations'],
        useCases: ['Shortlist evaluation', 'Final candidate selection', 'Hiring decisions']
    },
    {
        id: 'job-description-generator',
        name: 'AI Job Description Generator',
        description: 'Create compelling job postings from just a title and required skills in seconds.',
        category: 'Recruiting AI',
        tier: 'Pro',
        icon: FileEdit,
        features: ['Professional formatting', 'Inclusive language', 'SEO-optimized'],
        useCases: ['Quick job posting', 'Consistent formatting', 'Attract top talent']
    },

    // COMMUNICATION AI
    {
        id: 'contract-drafter',
        name: 'AI Contract Drafter',
        description: 'Generate legal contracts including employment agreements, NDAs, and service contracts.',
        category: 'Communication AI',
        tier: 'Connekt AI',
        icon: FileSignature,
        features: ['Multiple contract types', 'Gambian law compliance', 'Customizable terms'],
        useCases: ['Employment contracts', 'NDA generation', 'Service agreements']
    },
    {
        id: 'email-composer',
        name: 'AI Email Composer',
        description: 'Write professional emails with the perfect tone - formal, casual, or persuasive.',
        category: 'Communication AI',
        tier: 'Pro',
        icon: Mail,
        features: ['Auto subject lines', 'Tone customization', 'Grammar perfect'],
        useCases: ['Candidate outreach', 'Client communication', 'Follow-up emails']
    },
    {
        id: 'conversation-summarizer',
        name: 'AI Conversation Summarizer',
        description: 'Quickly understand long email threads with AI-powered summaries.',
        category: 'Communication AI',
        tier: 'Pro Plus',
        icon: MessageSquare,
        features: ['Thread analysis', 'Key points extraction', 'Action items'],
        useCases: ['Email management', 'Meeting prep', 'Quick catch-up']
    },

    // PROJECT AI
    {
        id: 'task-generator',
        name: 'AI Task Generator',
        description: 'Break down project descriptions into actionable tasks with priorities and estimates.',
        category: 'Project AI',
        tier: 'Pro Plus',
        icon: ListTodo,
        features: ['Smart task breakdown', 'Priority assignment', 'Time estimates'],
        useCases: ['Project planning', 'Sprint setup', 'Workflow automation']
    },
    {
        id: 'task-assignor',
        name: 'AI Task Assignor',
        description: 'Intelligently assign tasks to team members based on skills and availability.',
        category: 'Project AI',
        tier: 'Connekt AI',
        icon: UserCheck,
        features: ['Skill matching', 'Workload balancing', 'Confidence scores'],
        useCases: ['Team management', 'Resource allocation', 'Productivity optimization']
    },
    {
        id: 'team-recommender',
        name: 'AI Team Recommender',
        description: 'Build optimal project teams by matching skills to project requirements.',
        category: 'Project AI',
        tier: 'Connekt AI',
        icon: Users,
        features: ['Skill gap analysis', 'Team composition', 'Role suggestions'],
        useCases: ['Team formation', 'Project staffing', 'Cross-functional teams']
    },

    // INTERVIEW AI
    {
        id: 'interview-questions',
        name: 'AI Interview Question Generator',
        description: 'Generate tailored interview questions based on job role, skills, and experience level.',
        category: 'Interview AI',
        tier: 'Pro Plus',
        icon: HelpCircle,
        features: ['Role-specific questions', 'Skill assessment', 'Difficulty levels'],
        useCases: ['Interview prep', 'Standardized screening', 'Fair evaluations']
    },
    {
        id: 'interview-evaluator',
        name: 'AI Interview Evaluator',
        description: 'Objectively score candidate responses with detailed feedback and improvement areas.',
        category: 'Interview AI',
        tier: 'Connekt AI',
        icon: ClipboardCheck,
        features: ['Objective scoring (0-100)', 'Detailed feedback', 'Criteria matching'],
        useCases: ['Interview assessment', 'Candidate evaluation', 'Hiring consistency']
    },
    {
        id: 'reference-checker',
        name: 'AI Reference Checker',
        description: 'Analyze reference responses to identify strengths, concerns, and red flags.',
        category: 'Interview AI',
        tier: 'Connekt AI',
        icon: Search,
        features: ['Sentiment analysis', 'Red flag detection', 'Quality scoring'],
        useCases: ['Reference verification', 'Background checks', 'Risk assessment']
    }
];

const categories = ['Profile AI', 'Recruiting AI', 'Communication AI', 'Project AI', 'Interview AI'];
const tiers = ['Pro', 'Pro Plus', 'Connekt AI'];

const tierLevels: Record<string, number> = {
    'Pro': 1,
    'Pro Plus': 2,
    'Connekt AI': 3
};

export default function AIToolsCatalog() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTools = AI_TOOLS.filter(tool => {
        const matchesCategory = !selectedCategory || tool.category === selectedCategory;
        // Cumulative tier filtering: Show tools available in the selected plan
        const matchesTier = !selectedTier || tierLevels[tool.tier] <= tierLevels[selectedTier];
        const matchesSearch = !searchQuery ||
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesTier && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:via-black dark:to-teal-950">
            {/* Legendary White Header */}
            <div className="relative bg-white dark:bg-gray-900 py-20 px-6 overflow-hidden">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #008080 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Logo & Title */}
                    <div className="flex flex-col items-center text-center mb-8">
                        {/* Connekt + AI Icon Side by Side */}
                        <div className="flex items-center gap-6 mb-6">
                            {/* Connekt Text - Extra Large Teal */}
                            <h1 className="text-8xl md:text-9xl font-black text-teal-600 dark:text-teal-500 tracking-tight">
                                Connekt
                            </h1>
                            {/* Extra Large AI Icon with Continuous Animation */}
                            <div className="relative animate-pulse">
                                <div className="absolute inset-0 bg-teal-600 rounded-3xl blur-3xl opacity-30 animate-pulse"></div>
                                <div className="relative p-5 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800 rounded-3xl border-4 border-teal-600 shadow-2xl">
                                    <ConnektAIIcon className="w-36 h-36" />
                                </div>
                            </div>
                        </div>


                        {/* Powerful Slogan */}
                        <p className="text-2xl md:text-3xl font-bold text-teal-700 dark:text-teal-400 mb-3 tracking-wide">
                            Intelligence That Transforms Talent
                        </p>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
                            Harness the power of Gemini 2.5 Pro to revolutionize recruitment, unleash productivity,
                            and discover extraordinary talent in seconds
                        </p>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex flex-wrap justify-center gap-6 mt-12">
                        <div className="group relative">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                            <div className="relative px-8 py-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-teal-600 hover:border-teal-700 transition-all shadow-lg hover:shadow-xl">
                                <div className="text-4xl font-black text-teal-600 mb-1">15</div>
                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">AI Tools</div>
                            </div>
                        </div>

                        <div className="group relative">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                            <div className="relative px-8 py-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-teal-600 hover:border-teal-700 transition-all shadow-lg hover:shadow-xl">
                                <div className="text-4xl font-black text-teal-600 mb-1">5</div>
                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Categories</div>
                            </div>
                        </div>

                        <div className="group relative">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                            <div className="relative px-8 py-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-teal-600 hover:border-teal-700 transition-all shadow-lg hover:shadow-xl">
                                <div className="text-4xl font-black text-teal-600 mb-1">∞</div>
                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Possibilities</div>
                            </div>
                        </div>
                    </div>

                    {/* Powered By Badge */}
                    <div className="flex justify-center mt-8">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full shadow-xl">
                            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                            <span className="text-sm font-bold text-white">Powered by Google Gemini 2.5 Pro</span>
                            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Search & Filter */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search AI tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-4 py-2 rounded-lg transition-all ${!selectedCategory
                                    ? 'bg-teal-600 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                All Categories
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-lg transition-all ${selectedCategory === category
                                        ? 'bg-teal-600 text-white shadow-lg'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Tier Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedTier(null)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${!selectedTier
                                    ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900 shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                All Tiers
                            </button>
                            {tiers.map(tier => (
                                <button
                                    key={tier}
                                    onClick={() => setSelectedTier(tier)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${selectedTier === tier
                                        ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900 shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTools.map((tool) => {
                        const Icon = tool.icon;
                        const isConnektAI = tool.id === 'resume-parser' || tool.id === 'bio-enhancer' || tool.id === 'skill-suggester';

                        return (
                            <div
                                key={tool.id}
                                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:scale-105"
                            >
                                {/* Card Header */}
                                <div className="p-6 bg-gradient-to-br from-teal-50 to-white dark:from-teal-900/20 dark:to-gray-800">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-teal-600 rounded-xl text-white">
                                            {isConnektAI ? (
                                                <ConnektAIIcon className="w-6 h-6" />
                                            ) : (
                                                <Icon className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-semibold rounded-full">
                                                {tool.category}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${tool.tier === 'Connekt AI'
                                                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                                : tool.tier === 'Pro Plus'
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                                    : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                }`}>
                                                {tool.tier}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {tool.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {tool.description}
                                    </p>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 space-y-4">
                                    {/* Features */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                            Key Features
                                        </h4>
                                        <ul className="space-y-1">
                                            {tool.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <Crown className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Use Cases */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                            Use Cases
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {tool.useCases.map((useCase, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                                                >
                                                    {useCase}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="px-6 pb-6">
                                    <button className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                                        Try it Now
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* No Results */}
                {filteredTools.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No tools found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Try adjusting your search or filters
                        </p>
                    </div>
                )}

                {/* CTA Section */}
                <div className="mt-16 p-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl text-white text-center">
                    <Crown className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Ready to unlock all AI tools?</h2>
                    <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
                        Upgrade to Connekt AI for D15,000/month and get access to all 15 AI-powered features plus 1,000 AI requests per month.
                    </p>
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-xl font-bold hover:bg-teal-50 transition-all shadow-lg"
                    >
                        Upgrade to Connekt AI
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
