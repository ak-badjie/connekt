'use client';

export default function ProjectProgress() {
    const projects = [
        { name: 'Website Redesign', progress: 75, color: 'teal' },
        { name: 'Mobile App', progress: 45, color: 'orange' },
        { name: 'API Integration', progress: 90, color: 'green' },
    ];

    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Project Progress</h3>
                <button className="text-xs text-[#008080] hover:underline font-medium">See All</button>
            </div>
            <div className="space-y-6">
                {projects.map((project, i) => (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</p>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{project.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${project.color === 'teal' ? 'bg-[#008080]' :
                                        project.color === 'orange' ? 'bg-orange-500' :
                                            'bg-green-500'
                                    }`}
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
