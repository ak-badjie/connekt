'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, ChevronRight, ExternalLink } from 'lucide-react';

export default function ClientApprovalQueue() {
    // Mock data for now, would be replaced by real data from TaskService
    const [approvals] = useState([
        {
            id: 1,
            title: 'Q4 Marketing Strategy',
            client: 'Acme Corp',
            submittedDate: '2 hours ago',
            status: 'pending',
            type: 'Document'
        },
        {
            id: 2,
            title: 'Homepage Redesign Mockups',
            client: 'TechStart Inc',
            submittedDate: '5 hours ago',
            status: 'pending',
            type: 'Design'
        },
        {
            id: 3,
            title: 'Social Media Assets',
            client: 'Growth Co',
            submittedDate: '1 day ago',
            status: 'urgent',
            type: 'Assets'
        },
        {
            id: 4,
            title: 'Email Campaign Copy',
            client: 'Global Reach',
            submittedDate: '2 days ago',
            status: 'pending',
            type: 'Copy'
        }
    ]);

    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 overflow-y-auto custom-scrollbar shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle size={20} className="text-[#008080]" />
                        Client Approvals
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending client feedback</p>
                </div>
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 text-xs font-bold rounded-full">
                    {approvals.length} Pending
                </span>
            </div>

            <div className="space-y-3">
                {approvals.map((item) => (
                    <div
                        key={item.id}
                        className="group p-3 bg-white/40 dark:bg-zinc-800/40 border border-white/10 rounded-xl hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${item.status === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        {item.title}
                                    </h4>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <span className="font-medium text-[#008080]">{item.client}</span>
                                    <span>•</span>
                                    <span>{item.type}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} />
                                        {item.submittedDate}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 rounded-lg transition-colors" title="Mark Approved">
                                    <CheckCircle size={16} />
                                </button>
                                <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors" title="Reject / Request Changes">
                                    <XCircle size={16} />
                                </button>
                                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg transition-colors" title="View Details">
                                    <ExternalLink size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-[#008080] hover:bg-[#008080]/5 rounded-xl transition-colors">
                View All Approvals
                <ChevronRight size={14} />
            </button>
        </div>
    );
}
