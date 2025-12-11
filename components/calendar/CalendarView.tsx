'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/lib/services/task-service';
import { MeetingService } from '@/lib/services/meeting-service';
import { Task } from '@/lib/types/workspace.types';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Video, Clock, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'meeting' | 'deadline' | 'task';
    status?: string;
    priority?: string;
}

import { CreateEventModal } from './CreateEventModal';
import { VideoConferenceOverlay } from '../conference/VideoConferenceOverlay';

export function CalendarView({ agencyId }: { agencyId?: string }) {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [activeMeeting, setActiveMeeting] = useState<CalendarEvent | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch tasks based on context (Agency or User)
                let tasks: Task[] = [];
                if (agencyId) {
                    // TODO: Implement getAgencyTasks method
                    tasks = [];
                } else {
                    tasks = await TaskService.getUserTasks(user.uid);
                }

                const mappedEvents: CalendarEvent[] = tasks
                    .filter(t => t.timeline?.dueDate) // Only tasks with due dates
                    .map(t => ({
                        id: t.id!,
                        title: t.title,
                        date: (t.timeline?.dueDate as any) instanceof Date ? (t.timeline.dueDate as any) :
                            (t.timeline?.dueDate as any)?.toDate ? (t.timeline?.dueDate as any).toDate() :
                                new Date(t.timeline?.dueDate as any),
                        type: 'deadline',
                        status: t.status,
                        priority: t.priority
                    }));

                // Fetch meetings for the user (meetings are usually user-centric, but could be agency-wide later)
                // For now, we still fetch user's meetings as they are the viewer
                const meetings = await MeetingService.getUpcomingMeetings(user.uid);

                const mappedMeetings: CalendarEvent[] = meetings.map(m => ({
                    id: m.id,
                    title: m.title,
                    date: new Date(m.startTime),
                    type: 'meeting',
                    status: m.status
                }));

                setEvents([...mappedEvents, ...mappedMeetings]);
            } catch (error) {
                console.error('Error fetching calendar events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [user, agencyId]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const onDateClick = (day: Date) => {
        setSelectedDate(day);
    };

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(event.date, day));
    };

    const handleJoinMeeting = (event: CalendarEvent) => {
        setActiveMeeting(event);
        setIsVideoOpen(true);
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1, 
            transition: { staggerChildren: 0.03 } 
        }
    };

    const dayVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-xl">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <div>
                    <motion.h2 
                        key={currentDate.toString()}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
                    >
                        {format(currentDate, "MMMM yyyy")}
                    </motion.h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your schedule and meetings</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-all shadow-sm">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 text-sm font-medium hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-all">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-all shadow-sm">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-2xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 font-bold"
                    >
                        <Plus size={20} />
                        <span>Create Event</span>
                    </motion.button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-4">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-sm font-bold text-gray-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-7 gap-3 auto-rows-fr flex-1"
                    >
                        {days.map((day, i) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const dayEvents = getEventsForDay(day);
                            const isTodayDate = isToday(day);

                            return (
                                <motion.div
                                    key={i}
                                    variants={dayVariants}
                                    whileHover={{ scale: 1.02, zIndex: 10 }}
                                    onClick={() => onDateClick(day)}
                                    className={`relative min-h-[120px] p-4 rounded-3xl border transition-all cursor-pointer group 
                                        ${isSelected
                                            ? 'border-[#008080] bg-teal-50/50 dark:bg-teal-900/10 ring-4 ring-[#008080]/10'
                                            : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-xl dark:hover:bg-zinc-800/50'
                                        } ${!isCurrentMonth ? 'opacity-30 grayscale' : ''}`}
                                >
                                    {/* Date Number */}
                                    <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-2 
                                        ${isTodayDate
                                            ? 'bg-[#008080] text-white shadow-md shadow-teal-500/30'
                                            : 'text-gray-500'}`}>
                                        {format(day, dateFormat)}
                                    </span>

                                    {/* Event Dots/Pills */}
                                    <div className="space-y-1.5">
                                        {dayEvents.slice(0, 3).map((event, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                key={idx}
                                                className={`text-[10px] px-2 py-1 rounded-md truncate font-bold flex items-center gap-1
                                                    ${event.type === 'meeting'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}
                                            >
                                                {event.type === 'meeting' && <Video size={10} />}
                                                {event.title}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Sidebar Details */}
                <div className="w-96 border-l border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 overflow-y-auto">
                    <motion.h3 
                        key={selectedDate.toString()}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-xl font-bold text-gray-900 dark:text-white mb-6"
                    >
                        {format(selectedDate, "EEEE, MMMM do")}
                    </motion.h3>
                    <div className="space-y-4">
                        <AnimatePresence mode='popLayout'>
                            {getEventsForDay(selectedDate).length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-10 text-gray-400"
                                >
                                    <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No events for this day</p>
                                    <button 
                                        onClick={() => setIsScheduleModalOpen(true)}
                                        className="mt-4 text-[#008080] text-xs font-bold hover:underline"
                                    >
                                        + Add Event
                                    </button>
                                </motion.div>
                            ) : (
                                getEventsForDay(selectedDate).map((event) => (
                                    <motion.div
                                        key={event.id}
                                        layout
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`p-2.5 rounded-xl ${event.type === 'meeting'
                                                ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300'
                                                : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                                                }`}>
                                                {event.type === 'meeting' ? <Video size={20} /> : <AlertCircle size={20} />}
                                            </div>
                                            <span className="text-xs font-bold bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded-md text-gray-500">
                                                {format(event.date, 'h:mm a')}
                                            </span>
                                        </div>
                                        
                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{event.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Team Design Sync • Project Alpha</p>

                                        {event.type === 'meeting' && (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleJoinMeeting(event)}
                                                className="w-full py-2.5 bg-[#008080] text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 group"
                                            >
                                                <Video size={16} className="group-hover:animate-pulse" />
                                                Join Meeting
                                            </motion.button>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>


            <CreateEventModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                selectedDate={selectedDate}
                agencyId={agencyId}
            />

            <VideoConferenceOverlay 
                isOpen={isVideoOpen}
                onClose={() => setIsVideoOpen(false)}
                meetingTitle={activeMeeting?.title || "Team Meeting"}
                participants={[
                    { id: '1', name: 'You', isMuted: false },
                    { id: '2', name: 'Sarah Connor', isMuted: true },
                    { id: '3', name: 'John Doe', isMuted: false }
                ]}
            />
        </div >
    );
}
