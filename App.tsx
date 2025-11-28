import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Briefcase, DollarSign, BarChart2, Menu, X, Bell, Clock, CheckCircle, AlertTriangle, LogOut, User as UserIcon, RefreshCw, Database, ShieldAlert, Copy, UserCheck } from 'lucide-react';
import OverviewModule from './components/OverviewModule';
import TasksModule from './components/TasksModule';
import MarketingModule from './components/MarketingModule';
import FinancialModule from './components/FinancialModule';
import ProfileModule from './components/ProfileModule';
import AIChatAssistant from './components/AIChatAssistant';
import LoginPage from './components/LoginPage';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
    // Admin Data
    ADMIN_TASKS, ADMIN_ADS_DATA, ADMIN_OVERVIEW_METRICS, ADMIN_CHART_DATA, ADMIN_CHANNEL_COST_DATA, ADMIN_FINANCIAL_ANALYSIS, ADMIN_FINANCIALS,
    // Sample Data
    SAMPLE_TASKS, SAMPLE_ADS_DATA, SAMPLE_OVERVIEW_METRICS, SAMPLE_CHART_DATA, SAMPLE_CHANNEL_COST_DATA, SAMPLE_FINANCIAL_ANALYSIS, SAMPLE_FINANCIALS,
    INITIAL_PROFILE_DATA
} from './constants';
import { Task, AdCampaignData, OverviewMetricData, ChartDataPoint, FinancialItem, GlobalUIConfig, ChannelCostData, FinancialAnalysisData, TaskStatus, ProfileData } from './types';

const ADMIN_EMAIL = 'admin@bizguard.com';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [permissionError, setPermissionError] = useState(false); 

    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'marketing' | 'financial' | 'profile'>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [uiConfig, setUiConfig] = useState<GlobalUIConfig>({
        overviewTitle: 'Tổng quan Công ty',
        marketingTitle: 'Facebook ADS thống kê 📊',
        financialTitle: 'Bảng Chi Phí & Doanh Thu'
    });

    const [tasks, setTasks] = useState<Task[]>([]);
    const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetricData[]>([]);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [channelCostData, setChannelCostData] = useState<ChannelCostData[]>([]);
    const [marketingData, setMarketingData] = useState<AdCampaignData[]>([]);
    const [marketingAnalysis, setMarketingAnalysis] = useState<any>({});
    const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]); 
    const [financialAnalysis, setFinancialAnalysis] = useState<FinancialAnalysisData>({ optimizationSuggestion: '', costWarning: '' });
    const [profileData, setProfileData] = useState<ProfileData>(INITIAL_PROFILE_DATA);

    // 1. Listen for Auth Changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setDataLoading(true);
                setPermissionError(false); 
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        console.log("Loading data from Firestore...");
                        const data = docSnap.data();
                        
                        if (data.uiConfig) setUiConfig(data.uiConfig);
                        
                        setTasks(data.tasks && data.tasks.length > 0 ? data.tasks : []);
                        setOverviewMetrics(data.overviewMetrics && data.overviewMetrics.length > 0 ? data.overviewMetrics : []);
                        setChartData(data.chartData && data.chartData.length > 0 ? data.chartData : []);
                        setChannelCostData(data.channelCostData && data.channelCostData.length > 0 ? data.channelCostData : []);
                        setMarketingData(data.marketingData && data.marketingData.length > 0 ? data.marketingData : []);
                        setMarketingAnalysis(data.marketingAnalysis || {});
                        setFinancialItems(data.financialItems && data.financialItems.length > 0 ? data.financialItems : []);
                        setFinancialAnalysis(data.financialAnalysis || { optimizationSuggestion: '', costWarning: '' });
                        if (data.profileData) setProfileData(data.profileData);

                        if (!data.tasks || data.tasks.length === 0) {
                            console.warn("Found user but data is empty. Re-initializing...");
                            await initializeData(currentUser);
                        }

                    } else {
                        await initializeData(currentUser);
                    }
                } catch (error: any) {
                    console.error("Error fetching data:", error);
                    if (error.code === 'permission-denied' || error.message.includes('permission')) {
                        setPermissionError(true);
                    }
                } finally {
                    setDataLoading(false);
                }
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper to Initialize/Reset Data
    const initializeData = async (currentUser: User) => {
        console.log("Initializing/Resetting data for:", currentUser.email);
        let initialData;

        if (currentUser.email === ADMIN_EMAIL) {
            console.log("Loading ADMIN Default Data");
            initialData = {
                tasks: ADMIN_TASKS,
                overviewMetrics: ADMIN_OVERVIEW_METRICS,
                chartData: ADMIN_CHART_DATA,
                channelCostData: ADMIN_CHANNEL_COST_DATA,
                marketingData: ADMIN_ADS_DATA,
                marketingAnalysis: {
                    warning: 'Tỷ lệ chi phí/doanh thu tăng vọt lên 115.05%. Chiến dịch đang LỖ.',
                    loss: 'Giảm 56% khách hàng mới. Cần xem lại target audience hoặc creative.',
                    action1: 'Tắt ngay nhóm Ads có CPL thấp nhưng CR thấp.',
                    action2: 'Chạy chiến dịch Loyalty cho 103 khách cũ để gỡ lại doanh thu.',
                    action3: 'Tăng AOV bằng combo sản phẩm. Target: 1.000.000đ/đơn.'
                },
                financialItems: ADMIN_FINANCIALS,
                financialAnalysis: ADMIN_FINANCIAL_ANALYSIS,
                profileData: INITIAL_PROFILE_DATA
            };
        } else {
            console.log("Loading SAMPLE FMCG Data");
            initialData = {
                tasks: SAMPLE_TASKS,
                overviewMetrics: SAMPLE_OVERVIEW_METRICS,
                chartData: SAMPLE_CHART_DATA,
                channelCostData: SAMPLE_CHANNEL_COST_DATA,
                marketingData: SAMPLE_ADS_DATA,
                marketingAnalysis: {
                    warning: 'Chi phí tiếp thị đang chiếm 15% doanh thu, cao hơn mức trung bình ngành (10-12%).',
                    loss: 'Doanh thu kênh siêu thị giảm nhẹ 5% do cạnh tranh giá.',
                    action1: 'Tối ưu ngân sách Digital, tập trung vào TikTok Shop.',
                    action2: 'Triển khai chương trình khuyến mãi mua 2 tặng 1 để đẩy hàng tồn.',
                    action3: 'Mở rộng kênh phân phối đại lý tỉnh.'
                },
                financialItems: SAMPLE_FINANCIALS,
                financialAnalysis: SAMPLE_FINANCIAL_ANALYSIS,
                profileData: INITIAL_PROFILE_DATA
            };
        }

        setTasks(initialData.tasks);
        setOverviewMetrics(initialData.overviewMetrics);
        setChartData(initialData.chartData);
        setChannelCostData(initialData.channelCostData);
        setMarketingData(initialData.marketingData);
        setMarketingAnalysis(initialData.marketingAnalysis);
        setFinancialItems(initialData.financialItems);
        setFinancialAnalysis(initialData.financialAnalysis);
        setProfileData(initialData.profileData);

        try {
            const docRef = doc(db, "users", currentUser.uid);
            await setDoc(docRef, {
                ...initialData,
                uiConfig,
                email: currentUser.email,
                role: currentUser.email === ADMIN_EMAIL ? 'admin' : 'user',
                lastUpdated: new Date().toISOString()
            });
            console.log("Data successfully initialized in Firestore");
        } catch (e: any) {
            console.error("Failed to initialize data in Firestore", e);
            if (e.code === 'permission-denied') {
                setPermissionError(true);
            }
        }
    };

    // 2. Save Data to Firestore (Debounced)
    useEffect(() => {
        if (!user || dataLoading || permissionError) return;

        if (tasks.length === 0 && financialItems.length === 0 && marketingData.length === 0) {
            return;
        }

        const saveData = async () => {
            try {
                const docRef = doc(db, "users", user.uid);
                await setDoc(docRef, {
                    uiConfig,
                    tasks,
                    overviewMetrics,
                    chartData,
                    channelCostData,
                    marketingData,
                    marketingAnalysis,
                    financialItems,
                    financialAnalysis,
                    profileData,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
                console.log("Auto-save: Data synced to Firestore");
            } catch (error: any) {
                console.error("Error saving data:", error);
                if (error.code === 'permission-denied') {
                    console.warn("Background save failed due to permissions");
                }
            }
        };

        const timeoutId = setTimeout(saveData, 4000); 
        return () => clearTimeout(timeoutId);
    }, [user, dataLoading, permissionError, uiConfig, tasks, overviewMetrics, chartData, channelCostData, marketingData, marketingAnalysis, financialItems, financialAnalysis, profileData]);


    // ... (Notifications & Handlers - Kept same) ...
    const [dueTask, setDueTask] = useState<Task | null>(null);
    const notificationSound = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    useEffect(() => {
        const checkDueTasks = () => {
            const now = new Date();
            const currentTime = now.getTime();
            const todayStr = now.toISOString().split('T')[0];
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            const currentTimeStr = `${currentHours}:${currentMinutes}`;

            tasks.forEach(task => {
                if (task.status === TaskStatus.COMPLETED) return;

                if (task.dueDate === todayStr && task.dueTime === currentTimeStr) {
                    if (!task.remindAt || task.remindAt <= currentTime) {
                        if (dueTask?.id !== task.id) {
                            triggerAlert(task);
                        }
                    }
                }
                if (task.remindAt && task.remindAt <= currentTime && task.remindAt > currentTime - 60000) {
                     if (dueTask?.id !== task.id) {
                        triggerAlert(task);
                    }
                }
            });
        };

        const triggerAlert = (task: Task) => {
            setDueTask(task);
            notificationSound.current?.play().catch(e => console.log("Audio play failed", e));
        };

        const interval = setInterval(checkDueTasks, 30000);
        return () => clearInterval(interval);
    }, [tasks, dueTask]);

    const handleSnooze = (minutes: number) => {
        if (dueTask) {
            const remindTime = new Date().getTime() + minutes * 60000;
            const updatedTasks = tasks.map(t => t.id === dueTask.id ? { ...t, remindAt: remindTime } : t);
            setTasks(updatedTasks);
            setDueTask(null);
        }
    };

    const handleDismiss = () => {
        if (dueTask) {
             const updatedTasks = tasks.map(t => t.id === dueTask.id ? { ...t, remindAt: new Date().getTime() + 24 * 60 * 60 * 1000 } : t);
             setTasks(updatedTasks);
             setDueTask(null);
        }
    };

    const handleCompleteFromAlert = () => {
        if (dueTask) {
            const updatedTasks = tasks.map(t => t.id === dueTask.id ? { ...t, status: TaskStatus.COMPLETED } : t);
            setTasks(updatedTasks);
            setDueTask(null);
        }
    };

    const urgentCount = tasks.filter(t => t.status === TaskStatus.URGENT).length;

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setTasks([]);
            setOverviewMetrics([]);
            setChartData([]);
            setMarketingData([]);
            setFinancialItems([]);
        } catch (error) {
            console.error("Logout Error", error);
        }
    };

    const handleResetData = async () => {
        if (confirm("CẢNH BÁO: Hành động này sẽ xóa toàn bộ dữ liệu hiện tại trên Cloud và khôi phục về mặc định ban đầu. Bạn có chắc chắn không?")) {
            setDataLoading(true);
            if (user) await initializeData(user);
            setTimeout(() => {
                setDataLoading(false);
                alert("Đã khôi phục dữ liệu gốc thành công!");
            }, 1000);
        }
    }

    const handleCopyRules = () => {
        const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;
        navigator.clipboard.writeText(rules);
        alert("Đã copy Rules vào clipboard!");
    }

    // -- RENDER LOGIC --

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    if (permissionError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-100 animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Chưa cấu hình quyền truy cập Database</h2>
                        <p className="text-slate-500 mt-2">
                            Ứng dụng đã kết nối Firebase nhưng bị chặn truy cập dữ liệu do <b>Firestore Security Rules</b> chưa được thiết lập.
                        </p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4 mb-6 relative group border border-slate-700">
                        <div className="absolute top-3 right-3">
                            <button onClick={handleCopyRules} className="text-xs text-slate-400 hover:text-white flex items-center bg-white/10 px-2 py-1 rounded transition-colors">
                                <Copy className="w-3 h-3 mr-1" /> Copy
                            </button>
                        </div>
                        <div className="text-xs font-mono text-slate-500 mb-2 border-b border-slate-700 pb-2">Firestore Rules</div>
                        <pre className="text-green-400 text-sm overflow-x-auto font-mono leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
                        </pre>
                    </div>

                    <div className="space-y-4 text-sm text-slate-600 mb-8 bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <p className="font-bold text-blue-800 flex items-center"><Database className="w-4 h-4 mr-2"/> Hướng dẫn khắc phục:</p>
                        <ol className="list-decimal pl-5 space-y-2 marker:text-blue-500">
                            <li>Truy cập <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Firebase Console</a>.</li>
                            <li>Chọn dự án <b>bizguard-app</b> {'>'} Chọn <b>Firestore Database</b> ở menu trái.</li>
                            <li>Nếu chưa tạo Database, bấm <b>Create Database</b> (Chọn location gần nhất, vd: <i>nam5 (us-central)</i> hoặc <i>asia-southeast1</i>).</li>
                            <li>Chuyển sang tab <b>Rules</b>.</li>
                            <li>Xóa hết nội dung cũ, dán đoạn mã ở trên vào và bấm <b>Publish</b>.</li>
                        </ol>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleLogout} className="flex-1 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                            Đăng xuất
                        </button>
                        <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                            Đã cập nhật xong, Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (dataLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 font-medium animate-pulse">Đang đồng bộ dữ liệu...</p>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': 
                return <OverviewModule 
                    pageTitle={uiConfig.overviewTitle}
                    setPageTitle={(t) => setUiConfig({...uiConfig, overviewTitle: t})}
                    metrics={overviewMetrics} 
                    setMetrics={setOverviewMetrics}
                    chartData={chartData}
                    setChartData={setChartData}
                    channelCostData={channelCostData}
                    setChannelCostData={setChannelCostData}
                    tasks={tasks}
                    onNavigateToTasks={() => setActiveTab('tasks')}
                />;
            case 'tasks': 
                return <TasksModule tasks={tasks} setTasks={setTasks} />;
            case 'marketing': 
                return <MarketingModule 
                    pageTitle={uiConfig.marketingTitle}
                    setPageTitle={(t) => setUiConfig({...uiConfig, marketingTitle: t})}
                    data={marketingData} 
                    setData={setMarketingData} 
                    analysis={marketingAnalysis}
                    setAnalysis={setMarketingAnalysis}
                />;
            case 'financial': 
                return <FinancialModule 
                    pageTitle={uiConfig.financialTitle}
                    setPageTitle={(t) => setUiConfig({...uiConfig, financialTitle: t})}
                    items={financialItems}
                    setItems={setFinancialItems}
                    analysis={financialAnalysis}
                    setAnalysis={setFinancialAnalysis}
                />;
            case 'profile':
                return <ProfileModule data={profileData} setData={setProfileData} />;
            default: 
                return <OverviewModule 
                    pageTitle={uiConfig.overviewTitle}
                    setPageTitle={(t) => setUiConfig({...uiConfig, overviewTitle: t})}
                    metrics={overviewMetrics} 
                    setMetrics={setOverviewMetrics}
                    chartData={chartData}
                    setChartData={setChartData}
                    channelCostData={channelCostData}
                    setChannelCostData={setChannelCostData}
                    tasks={tasks}
                    onNavigateToTasks={() => setActiveTab('tasks')}
                />;
        }
    };

    const NavItem = ({ id, icon, label, badge }: { id: typeof activeTab, icon: React.ReactNode, label: string, badge?: number }) => (
        <button
            onClick={() => {
                setActiveTab(id);
                setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group relative
                ${activeTab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'}
            `}
        >
            <span className={`mr-3 ${activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>{icon}</span>
            <span className="font-medium">{label}</span>
            {badge ? (
                <span className="absolute right-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {badge}
                </span>
            ) : null}
        </button>
    );

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
            {/* Alert Popup */}
            {dueTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-bounce-in">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 rounded-full p-3 shadow-lg ring-4 ring-white">
                            <Bell className="w-8 h-8 text-white animate-swing" />
                        </div>
                        <div className="mt-6 text-center">
                            <h3 className="text-xl font-bold text-slate-800 mb-1">Nhắc nhở Công việc!</h3>
                            <p className="text-sm text-slate-500">Đã đến giờ thực hiện công việc này</p>
                        </div>
                        
                        <div className="my-6 bg-red-50 p-4 rounded-xl border border-red-100 text-left">
                            <h4 className="font-bold text-red-700 text-lg mb-1">{dueTask.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-red-600/80 mb-2">
                                <Clock className="w-4 h-4" /> {dueTask.dueTime} - {dueTask.dueDate}
                            </div>
                            <p className="text-sm text-slate-600 bg-white/50 p-2 rounded border border-red-100">{dueTask.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleSnooze(5)} className="col-span-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm">
                                5 phút nữa
                            </button>
                            <button onClick={() => handleSnooze(30)} className="col-span-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm">
                                30 phút nữa
                            </button>
                            <button onClick={handleCompleteFromAlert} className="col-span-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-transform active:scale-95">
                                <CheckCircle className="w-5 h-5" /> Đã hoàn thành
                            </button>
                            <button onClick={handleDismiss} className="col-span-2 mt-2 text-xs text-slate-400 hover:text-slate-600 underline">
                                Bỏ qua / Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant */}
            <AIChatAssistant 
                activeTab={activeTab}
                overviewMetrics={overviewMetrics}
                chartData={chartData}
                channelCostData={channelCostData}
                marketingData={marketingData}
                financialItems={financialItems}
                financialAnalysis={financialAnalysis}
                onUpdateOverview={(newData) => {
                    setChartData(prevData => {
                        let updatedData = [...prevData];
                        newData.forEach(newItem => {
                            const existingIndex = updatedData.findIndex(item => item.name.toLowerCase() === newItem.name.toLowerCase());
                            if (existingIndex !== -1) updatedData[existingIndex] = { ...updatedData[existingIndex], ...newItem };
                            else updatedData.push(newItem);
                        });
                        return updatedData;
                    });
                }}
                onUpdateChannelCost={setChannelCostData}
                onUpdateMarketing={setMarketingData}
                onUpdateFinancial={setFinancialItems}
                onUpdateFinancialAnalysis={setFinancialAnalysis}
                onUpdateUI={(newConfig) => setUiConfig(prev => ({ ...prev, ...newConfig }))}
            />

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">SB</div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">BizGuard</h1>
                        </div>
                        <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-200">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-white shadow-sm">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || 'Người dùng'}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                {user.email === ADMIN_EMAIL && <span className="text-[10px] text-white bg-indigo-500 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        <NavItem id="overview" icon={<LayoutDashboard className="w-5 h-5" />} label="Tổng quan" />
                        <NavItem id="tasks" icon={<Briefcase className="w-5 h-5" />} label="Công việc" badge={urgentCount > 0 ? urgentCount : undefined} />
                        <div className="pt-4 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quản lý</p>
                            <div className="space-y-2">
                                <NavItem id="marketing" icon={<BarChart2 className="w-5 h-5" />} label="Marketing & Ads" />
                                <NavItem id="financial" icon={<DollarSign className="w-5 h-5" />} label="Tài chính & PnL" />
                            </div>
                        </div>
                        <div className="pt-4 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cá nhân</p>
                            <NavItem id="profile" icon={<UserCheck className="w-5 h-5" />} label="Hồ sơ cá nhân" />
                        </div>
                    </nav>

                    <div className="p-4 border-t border-slate-100 space-y-2">
                        {/* Nút Reset Dữ Liệu (Chỉ Admin) */}
                        {user.email === ADMIN_EMAIL && (
                            <button 
                                onClick={handleResetData}
                                className="w-full flex items-center justify-center gap-2 p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium border border-dashed border-orange-200"
                            >
                                <Database className="w-4 h-4" /> Khôi phục Dữ liệu Gốc
                            </button>
                        )}
                        
                        {/* Nút Đăng Xuất */}
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-sm font-bold shadow-md">
                            <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
                    <button className="lg:hidden p-2 -ml-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1 flex justify-end lg:justify-between items-center">
                            <h2 className="hidden lg:block text-lg font-semibold text-slate-700 capitalize">
                                {activeTab === 'overview' ? uiConfig.overviewTitle : 
                                    activeTab === 'tasks' ? 'Quản lý công việc' :
                                    activeTab === 'marketing' ? uiConfig.marketingTitle : 
                                    activeTab === 'financial' ? uiConfig.financialTitle : 'Hồ sơ năng lực'}
                            </h2>
                            <div className="flex items-center space-x-4">
                                <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold border border-green-200">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Cloud Sync Active
                                </span>
                            </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto h-full">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;