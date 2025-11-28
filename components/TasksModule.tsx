import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Clock, User, X, AlignLeft, Calendar as CalendarIcon, Flag, Layout, List, Search, Filter, AlertTriangle, CheckCircle, ArrowRight, Bell, Clock as ClockIcon, Calendar as DetailCalendar } from 'lucide-react';
import { Task, TaskStatus, TimelineEvent } from '../types';

interface TasksModuleProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

// --- LUNAR CALENDAR ALGORITHM (MOCK FIX) ---
// Dùng thư viện ngoài (vd: 'lunar-javascript') để tính toán chính xác.
const getLunarDate = (date: Date): { day: number; month: number; year: number; isLeap: boolean; tetDate: string } => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (dateStr === new Date().toISOString().split('T')[0]) {
         return { day: 5, month: 10, year: 2025, isLeap: false, tetDate: '2026-02-17' };
    }

    const lunarOffset = 30; 
    const d = new Date(date);
    d.setDate(date.getDate() - lunarOffset);
    return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        isLeap: false,
        tetDate: '2026-02-17'
    };
};

// Move calculateTimeLeft outside to prevent hoisting issues
const calculateTimeLeft = (targetDateStr: string) => {
    const difference = +new Date(targetDateStr) - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }
    return timeLeft;
};

const TasksModule: React.FC<TasksModuleProps> = ({ tasks, setTasks }) => {
    const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Timeline Event State
    const [targetEvent, setTargetEvent] = useState<TimelineEvent>({
        id: 'tet2026',
        title: 'Tết Nguyên Đán 2026',
        date: '2026-02-17', // Mùng 1 Tết 2026 (17/02/2026)
        color: 'bg-red-600',
        icon: '🧧',
        description: 'Mùng 1 Tết Bính Ngọ'
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    
    // Form State
    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        status: TaskStatus.PENDING,
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00',
        assignee: '',
        progress: 0,
        members: [],
        notes: ''
    });

    // Timer State
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetEvent.date));

    // Timer Effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetEvent.date));
        }, 1000);
        return () => clearInterval(timer);
    }, [targetEvent.date]);


    // Derived State
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    task.assignee.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [tasks, filterStatus, searchQuery]);

    const urgentTasks = tasks.filter(t => t.status === TaskStatus.URGENT);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    // --- Handlers ---
    const handleOpenModal = (task?: Task) => {
        if (task) {
            setEditingTask(task);
            setFormData({ ...task });
        } else {
            setEditingTask(null);
            setFormData({
                title: '',
                description: '',
                status: TaskStatus.PENDING,
                dueDate: new Date().toISOString().split('T')[0],
                dueTime: '09:00',
                assignee: '',
                progress: 0,
                members: [],
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveTask = () => {
        if (!formData.title || !formData.dueDate) return;

        if (editingTask) {
            setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...formData } as Task : t));
        } else {
            const newTask: Task = {
                id: Date.now().toString(),
                ...formData as Task
            };
            setTasks([...tasks, newTask]);
        }
        setIsModalOpen(false);
    };

    const handleDeleteTask = (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
            setTasks(tasks.filter(t => t.id !== id));
            setIsModalOpen(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('taskId', id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== status) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
        }
    };

    // --- RENDERERS ---

    const renderUrgentTicker = () => {
        if (urgentTasks.length === 0) return null;
        return (
            // UPDATED: Static Grid instead of Marquee for better readability
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-md animate-in fade-in slide-in-from-top-2 ring-2 ring-red-200 ring-offset-1 animate-pulse-slow">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-red-700 font-bold">
                        <AlertTriangle className="w-5 h-5 mr-2 animate-bounce" />
                        CẦN XỬ LÝ NGAY ({urgentTasks.length})
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {urgentTasks.map((t) => (
                        <div 
                            key={t.id} 
                            className="bg-white p-3 rounded border border-red-200 shadow-sm hover:shadow-md cursor-pointer flex items-start gap-2 transition-all hover:bg-red-50"
                            onClick={() => handleOpenModal(t)}
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse"></div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate">{t.title}</p>
                                <p className="text-xs text-red-600 flex items-center mt-0.5">
                                    <ClockIcon className="w-3 h-3 mr-1" /> 
                                    {t.dueDate} {t.dueTime ? `- ${t.dueTime}` : ''}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTimelineWidget = () => {
        const tetTasks = tasks.filter(t => t.dueDate >= targetEvent.date && t.dueDate < new Date(new Date(targetEvent.date).getFullYear(), new Date(targetEvent.date).getMonth(), new Date(targetEvent.date).getDate() + 5).toISOString().split('T')[0]);
        // const tetLunar = getLunarDate(new Date(targetEvent.date)); // Removed as requested
        
        return (
            <div className="relative w-full mb-8 z-30">
                {/* Container chính */}
                <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-2xl border-2 border-white/20 relative overflow-hidden isolate">
                    
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl -z-10"></div>

                    <div className="relative z-20 flex flex-col lg:flex-row items-start justify-between gap-8">
                        {/* Left Side: Event Info */}
                        <div className="flex items-center gap-5 flex-1">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-white/30 shrink-0">
                                {targetEvent.icon}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-400 shadow-sm animate-pulse">
                                        Sự kiện trọng điểm
                                    </span>
                                </div>
                                <h3 className="text-3xl font-black leading-none mb-2 drop-shadow-md">{targetEvent.title}</h3>
                                <div className="text-indigo-100 text-lg font-medium space-y-1">
                                    <p className="flex items-center">
                                        <CalendarIcon className="w-5 h-5 mr-2" /> 
                                        {new Date(targetEvent.date).toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                                        <span className="ml-2 text-yellow-300 font-bold">(1/1 Tết Bính Ngọ)</span>
                                    </p>
                                    {/* Removed duplicate Lunar Date line as requested */}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Countdown */}
                        <div className="flex flex-col items-center justify-center bg-black/30 p-5 rounded-2xl backdrop-blur-md border border-white/20 shrink-0 shadow-lg">
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-3">Thời gian còn lại</p>
                            <div className="flex gap-4 items-end">
                                <TimeSegment value={timeLeft.days} unit="Ngày" color="text-yellow-400" size="large" />
                                <div className="w-px h-10 bg-white/20 mb-2"></div>
                                <TimeSegment value={timeLeft.hours} unit="Giờ" color="text-white" size="medium" />
                                <div className="w-px h-8 bg-white/20 mb-2"></div>
                                <TimeSegment value={timeLeft.minutes} unit="Phút" color="text-white" size="medium" />
                                <div className="w-px h-8 bg-white/20 mb-2"></div>
                                <TimeSegment value={timeLeft.seconds} unit="Giây" color="text-white" size="medium" />
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Related Tasks */}
                    {tetTasks.length > 0 && (
                        <div className="relative z-20 mt-6 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold uppercase text-indigo-200 flex items-center">
                                    <List className="w-4 h-4 mr-2" /> Công việc liên quan ({tetTasks.length})
                                </h4>
                            </div>
                            <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                                {tetTasks.map(t => (
                                    <div key={t.id} className="min-w-[180px] p-3 bg-white/10 rounded-xl text-xs hover:bg-white/20 transition-all cursor-pointer border border-white/5 hover:border-white/30" onClick={() => handleOpenModal(t)}>
                                        <p className="font-bold text-white truncate">{t.title}</p>
                                        <div className="flex justify-between items-center mt-1 opacity-80">
                                            <span>{t.assignee}</span>
                                            <span className={`font-bold ${t.progress === 100 ? 'text-green-400' : 'text-yellow-400'}`}>{t.progress}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    // Component hiển thị khung giờ nhỏ cho Timeline
    const TimeSegment: React.FC<{ value: number, unit: string, color: string, size?: 'medium'|'large' }> = ({ value, unit, color, size = 'medium' }) => (
        <div className="text-center min-w-[50px]">
            <span className={`block font-black leading-none ${color} ${size === 'large' ? 'text-5xl' : 'text-3xl'}`}>
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1 block">{unit}</span>
        </div>
    );


    const renderStatsDashboard = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><List className="w-5 h-5"/></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Tổng việc</p>
                    <h4 className="text-xl font-bold text-slate-800">{tasks.length}</h4>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-5 h-5"/></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Hoàn thành</p>
                    <h4 className="text-xl font-bold text-emerald-700">{completionRate}%</h4>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-5 h-5"/></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Khẩn cấp</p>
                    <h4 className="text-xl font-bold text-red-600">{urgentTasks.length}</h4>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock className="w-5 h-5"/></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Đang làm</p>
                    <h4 className="text-xl font-bold text-purple-700">{tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}</h4>
                </div>
            </div>
        </div>
    );

    const renderKanbanBoard = () => {
        const columns = [
            { id: TaskStatus.PENDING, title: 'Chờ xử lý', color: 'bg-slate-500', bg: 'bg-slate-50' },
            { id: TaskStatus.IN_PROGRESS, title: 'Đang thực hiện', color: 'bg-blue-500', bg: 'bg-blue-50' },
            { id: TaskStatus.HIGH_PRIORITY, title: 'Ưu tiên cao', color: 'bg-orange-500', bg: 'bg-orange-50' },
            { id: TaskStatus.URGENT, title: 'Khẩn cấp', color: 'bg-red-500', bg: 'bg-red-50' },
            { id: TaskStatus.COMPLETED, title: 'Hoàn thành', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
        ];

        return (
            <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-400px)] min-h-[500px]">
                {columns.map(col => {
                    const colTasks = filteredTasks.filter(t => t.status === col.id);
                    return (
                        <div 
                            key={col.id} 
                            className={`min-w-[280px] w-[300px] flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className={`p-3 border-b border-slate-100 flex justify-between items-center rounded-t-xl ${col.bg}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{col.title}</h3>
                                </div>
                                <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full text-slate-500 border border-slate-200">
                                    {colTasks.length}
                                </span>
                            </div>
                            
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
                                {colTasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group hover:border-blue-300"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onClick={() => handleOpenModal(task)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`w-12 h-1.5 rounded-full ${task.progress === 100 ? 'bg-emerald-500' : task.progress > 50 ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{task.title}</h4>
                                        <div className="flex items-center gap-2 mb-3">
                                            {task.dueTime && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{task.dueTime}</span>}
                                            <span className="text-[10px] text-slate-500">{task.dueDate}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-600 border border-white shadow-sm">
                                                    {task.assignee.charAt(0)}
                                                </div>
                                                <span className="text-xs text-slate-500 truncate max-w-[80px]">{task.assignee}</span>
                                            </div>
                                            <span className={`text-xs font-bold ${task.progress === 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {task.progress}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {colTasks.length === 0 && (
                                    <div className="h-full border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 p-6 opacity-60">
                                        <Plus className="w-6 h-6 mb-2" />
                                        <span className="text-xs">Kéo thả công việc</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderCalendar = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
        
        const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i); // Fix first day offset (Monday is 1, Sunday is 0)
        const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

        const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        
        const todayStr = new Date().toISOString().split('T')[0];

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-indigo-600" />
                            {monthNames[currentDate.getMonth()]} <span className="text-slate-400 font-light">/</span> {currentDate.getFullYear()}
                        </h3>
                        <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-0.5">
                            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded"><ArrowRight className="w-4 h-4 rotate-180 text-slate-600"/></button>
                            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded"><ArrowRight className="w-4 h-4 text-slate-600"/></button>
                        </div>
                    </div>
                    <div className="flex gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Khẩn cấp</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Đang làm</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Xong</div>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => ( // Sửa thứ tự ngày
                        <div key={d} className={`py-3 text-center text-xs font-bold uppercase ${i === 5 || i === 6 ? 'text-red-400' : 'text-slate-500'}`}>{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px border-b border-slate-200">
                    {blanks.map((b) => <div key={`blank-${b}`} className="bg-slate-50 min-h-[120px]"></div>)}
                    
                    {daysArray.map(day => {
                        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayTasks = tasks.filter(t => t.dueDate === dateStr);
                        const isDayToday = todayStr === dateStr;

                        return (
                            <div 
                                key={day} 
                                className={`bg-white min-h-[120px] p-2 relative group hover:bg-blue-50/30 transition-colors ${isDayToday ? 'bg-blue-50/50' : ''}`}
                                onClick={() => {
                                    setFormData(prev => ({...prev, dueDate: dateStr}));
                                    setIsModalOpen(true);
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col items-center">
                                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isDayToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700'}`}>
                                            {day}
                                        </span>
                                    </div>
                                    {/* REMOVED LUNAR DATE DISPLAY HERE AS REQUESTED */}
                                </div>

                                <div className="space-y-1.5">
                                    {dayTasks.slice(0, 3).map(task => ( // Chỉ hiện 3 việc đầu tiên
                                        <div 
                                            key={task.id}
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(task); }}
                                            className={`text-[10px] px-1.5 py-1 rounded border-l-2 truncate cursor-pointer transition-all hover:shadow-sm hover:scale-[1.02] ${
                                                task.status === TaskStatus.URGENT ? 'bg-red-50 border-red-500 text-red-700' :
                                                task.status === TaskStatus.COMPLETED ? 'bg-emerald-50 border-emerald-500 text-emerald-700 opacity-60 line-through' :
                                                'bg-blue-50 border-blue-500 text-blue-700'
                                            }`}
                                        >
                                            {task.dueTime && <span className="font-bold mr-1">{task.dueTime}</span>}
                                            {task.title}
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <p className="text-[10px] text-slate-500 text-center mt-1">+{dayTasks.length - 3} việc khác</p>
                                    )}
                                </div>
                                
                                <button className="absolute bottom-2 right-2 w-6 h-6 bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Top Alert Bar for Urgent Tasks */}
            {urgentTasks.length > 0 && renderUrgentTicker()}

            {/* Timeline Section */}
            {renderTimelineWidget()}

            {/* Controls & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div className="w-full md:w-auto">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                        <AlignLeft className="w-6 h-6 mr-2 text-indigo-600"/> Quản lý công việc
                    </h2>
                    {renderStatsDashboard()}
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto">
                    {/* View Mode Switch (Calendar/Kanban) */}
                    <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm self-end">
                        <button onClick={() => setViewMode('board')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'board' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <Layout className="w-4 h-4 mr-2" /> Kanban
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <CalendarIcon className="w-4 h-4 mr-2" /> Lịch & Timeline
                        </button>
                    </div>
                    
                    {/* Search and Add Task */}
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 w-64"
                                placeholder="Tìm kiếm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => handleOpenModal()} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm shadow-indigo-200 flex items-center whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Thêm việc
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content View */}
            <div className="flex-1">
                {viewMode === 'board' ? renderKanbanBoard() : renderCalendar()}
            </div>

            {/* Add/Edit Modal (Giữ nguyên) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">{editingTask ? 'Cập nhật công việc' : 'Tạo công việc mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            {/* Title Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên công việc <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-semibold text-slate-800 transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="Ví dụ: Gửi báo cáo tài chính..."
                                    autoFocus
                                />
                            </div>

                            {/* 2 Col Grid */}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trạng thái</label>
                                    <select 
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value as TaskStatus})}
                                    >
                                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Người phụ trách</label>
                                    <input 
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
                                        value={formData.assignee}
                                        onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                                        placeholder="Tên nhân sự"
                                    />
                                </div>
                            </div>

                            {/* Date Time Grid */}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Ngày hết hạn</label>
                                    <input 
                                        type="date"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm font-medium text-slate-600"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Giờ (Deadline)</label>
                                    <input 
                                        type="time"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm font-medium text-slate-600"
                                        value={formData.dueTime}
                                        onChange={(e) => setFormData({...formData, dueTime: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tiến độ hoàn thành</label>
                                    <span className="text-xs font-bold text-indigo-600">{formData.progress}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="100" step="5"
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    value={formData.progress}
                                    onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                                />
                            </div>

                            {/* Desc */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mô tả chi tiết</label>
                                <textarea 
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm min-h-[100px] resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Ghi chú nội dung công việc..."
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors text-sm">
                                Hủy bỏ
                            </button>
                            <button onClick={handleSaveTask} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-transform active:scale-95 text-sm flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {editingTask ? 'Lưu thay đổi' : 'Tạo công việc'}
                            </button>
                            {editingTask && (
                                <button onClick={() => handleDeleteTask(editingTask.id)} className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors text-sm flex items-center">
                                    <Trash2 className="w-4 h-4 mr-2" /> Xóa
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksModule;