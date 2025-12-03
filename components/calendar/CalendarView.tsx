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

import { ScheduleMeetingModal } from './ScheduleMeetingModal';

export function CalendarView({ agencyId }: { agencyId?: string }) {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch tasks based on context (Agency or User)
                let tasks: Task[] = [];
                if (agencyId) {
                    tasks = await TaskService.getAgencyTasks(agencyId);
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

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <p className="text-sm text-gray-500">Manage your schedule and meetings</p>
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
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#008080] text-white rounded-xl hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={20} />
                        <span className="font-bold text-sm">New Event</span>
                    </button>
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
                    <div className="grid grid-cols-7 gap-4 auto-rows-fr flex-1">
                        {days.map((day, i) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const dayEvents = getEventsForDay(day);
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={i}
                                    onClick={() => onDateClick(day)}
                                    className={`min-h-[100px] p-3 rounded-2xl border transition-all cursor-pointer relative group ${isSelected
                                        ? 'border-[#008080] bg-teal-50/50 dark:bg-teal-900/10 ring-2 ring-[#008080]/20'
                                        : 'border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                                        } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate
                                            ? 'bg-[#008080] text-white'
                                            : isSelected ? 'text-[#008080]' : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {format(day, dateFormat)}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="w-2 h-2 rounded-full bg-[#008080]"></span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map((event, idx) => (
                                            <div
                                                key={idx}
                                                className={`text-[10px] px-2 py-1 rounded-md truncate font-medium ${event.type === 'meeting'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    }`}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[10px] text-gray-400 pl-1">
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="w-80 border-l border-gray-200 dark:border-zinc-800 p-6 bg-gray-50/50 dark:bg-zinc-900/50 overflow-y-auto">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {format(selectedDate, "EEEE, MMMM do")}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {getEventsForDay(selectedDate).length} events scheduled
                    </p>

                    <div className="space-y-4">
                        {getEventsForDay(selectedDate).length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No events for this day</p>
                                <button className="mt-4 text-[#008080] text-xs font-bold hover:underline">
                                    + Add Event
                                </button>
                            </div>
                        ) : (
                            getEventsForDay(selectedDate).map(event => (
                                <div key={event.id} className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`p-2 rounded-lg ${event.type === 'meeting'
                                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                                            }`}>
                                            {event.type === 'meeting' ? <Video size={18} /> : <AlertCircle size={18} />}
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">
                                            {format(event.date, 'h:mm a')}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{event.title}</h4>

                                    {event.type === 'deadline' && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${event.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                event.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {event.priority || 'Normal'}
                                            </span>
                                            <span className="text-[10px] text-gray-500 capitalize">{event.status}</span>
                                        </div>
                                    )}

                                    {event.type === 'meeting' && (
                                        <button className="w-full mt-3 py-2 bg-[#008080] text-white text-xs font-bold rounded-lg hover:bg-teal-600 transition-colors">
                                            Join Meeting
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>


            <ScheduleMeetingModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                selectedDate={selectedDate}
            />
        </div >
    );
}
