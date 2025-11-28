import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Check, Plus, Edit2, Calculator, Trash2, DollarSign, ShoppingCart, Users, Activity, GripVertical, X, Download, Move, Maximize2, Minimize2, Palette, ArrowUpDown, Filter, ChevronDown, ShieldCheck, Cloud } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ComposedChart, BarChart, Bar, Line, Legend } from 'recharts';
import { OverviewMetricData, ChartDataPoint, Task, TaskStatus, ChannelCostData } from '../types';
import { CartesianGrid, ResponsiveContainer } from 'recharts';

interface OverviewModuleProps {
    pageTitle: string; 
    setPageTitle: (title: string) => void;
    metrics: OverviewMetricData[];
    setMetrics: React.Dispatch<React.SetStateAction<OverviewMetricData[]>>;
    chartData: ChartDataPoint[];
    setChartData: React.Dispatch<React.SetStateAction<ChartDataPoint[]>>;
    channelCostData?: ChannelCostData[];
    setChannelCostData?: React.Dispatch<React.SetStateAction<ChannelCostData[]>>;
    tasks: Task[];
    onNavigateToTasks: () => void;
}

// Helper: Export CSV
const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => typeof v === 'string' ? `"${v}"` : v).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(headers + "\n" + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const ICON_SIZE = "w-6 h-6";
const getIcon = (type: string) => {
    switch(type) {
        case 'dollar': return <DollarSign className={ICON_SIZE} />;
        case 'cart': return <ShoppingCart className={ICON_SIZE} />;
        case 'users': return <Users className={ICON_SIZE} />;
        case 'activity': return <Activity className={ICON_SIZE} />;
        default: return <DollarSign className={ICON_SIZE} />; // Default fallback
    }
};

// Professional Color Map
export const getIconColor = (type: string) => {
    switch(type) {
        case 'dollar': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
        case 'cart': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        case 'users': return 'bg-amber-50 text-amber-600 border-amber-200';
        case 'activity': return 'bg-rose-50 text-rose-600 border-rose-200';
        default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
}

// Interface for MetricCard props
interface MetricCardProps {
    data: OverviewMetricData;
    isEditing: boolean;
    isCompact: boolean;
    onChange: (id: string, field: keyof OverviewMetricData, value: any) => void;
    onDragStart?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}

// Component thẻ chỉ số (Metric Card)
const MetricCard: React.FC<MetricCardProps> = ({ 
    data, 
    isEditing, 
    isCompact,
    onChange, 
    onDragStart,
    onDrop
}) => (
    <div 
        className={`relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group
        ${isEditing ? 'cursor-move border-dashed border-slate-400 animate-pulse bg-slate-50' : ''}
        ${isCompact ? 'p-3 h-24' : 'p-5 h-36'}
        `}
        draggable={isEditing}
        onDragStart={onDragStart}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
    >
        <div className="flex justify-between items-start mb-2">
            <div className={`rounded-lg border ${isCompact ? 'p-1.5' : 'p-2'} ${getIconColor(data.iconType)}`}>
                {getIcon(data.iconType)}
            </div>
            <div className={`flex items-center font-bold rounded-full ${isCompact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} ${data.trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                 {data.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                 {data.trend}
            </div>
        </div>
        
        <div>
            {isEditing ? (
                <div className="space-y-1">
                     <input 
                        className="text-xs font-medium text-slate-400 w-full bg-transparent border-b border-slate-300 focus:outline-none"
                        value={data.title}
                        onChange={(e) => onChange(data.id, 'title', e.target.value)}
                    />
                    <input 
                        className="text-lg font-bold text-slate-800 w-full bg-transparent border-b border-slate-300 focus:outline-none"
                        value={data.value}
                        onChange={(e) => onChange(data.id, 'value', e.target.value)}
                    />
                </div>
            ) : (
                <>
                    <p className={`font-medium text-slate-500 uppercase tracking-wider ${isCompact ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>{data.title}</p>
                    <h3 className={`font-extrabold text-slate-800 tracking-tight ${isCompact ? 'text-xl' : 'text-2xl'}`}>{data.value}</h3>
                </>
            )}
        </div>

        {isEditing && (
            <div className="absolute top-1 right-1 opacity-50">
                <GripVertical className="w-4 h-4 text-slate-400" />
            </div>
        )}
    </div>
);

const OverviewModule: React.FC<OverviewModuleProps> = ({ 
    pageTitle, setPageTitle,
    metrics, setMetrics, 
    chartData, setChartData, 
    channelCostData = [], setChannelCostData,
    tasks, onNavigateToTasks 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Month Selection State
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  // Chart Customization State
  const [chartOrder, setChartOrder] = useState<['business', 'channel'] | ['channel', 'business']>(['business', 'channel']);
  const [businessChartSeriesOrder, setBusinessChartSeriesOrder] = useState(['revenue', 'marketingCost', 'ratio']);
  const [channelChartSeriesOrder, setChannelChartSeriesOrder] = useState(['revenue', 'cost', 'cpdt']); // NEW: Channel Chart Order
  
  const [chartColors, setChartColors] = useState({
      revenue: '#6366f1', // Indigo
      cost: '#f43f5e',    // Rose
      ratio: '#ef4444',   // Red
      channelRevenue: '#8b5cf6', // Violet
      channelCost: '#f43f5e',    // Rose
      channelRatio: '#ef4444'    // Red
  });

  // Custom Analysis Text State
  const [customerAnalysisText, setCustomerAnalysisText] = useState({
      newCust: '',
      oldCust: ''
  });

  // --- INITIALIZATION ---
  // Initialize selected period to the last available month if not set
  useEffect(() => {
      if (!selectedPeriod && chartData.length > 0) {
          setSelectedPeriod(chartData[chartData.length - 1].name);
      }
  }, [chartData]);


  // --- CALCULATE METRICS BASED ON SELECTION ---
  // Helper to find data for current selection
  const { currentData, prevData } = useMemo(() => {
      const currentIndex = chartData.findIndex(d => d.name === selectedPeriod);
      if (currentIndex === -1) {
          // Fallback to last item if not found
          return {
              currentData: chartData[chartData.length - 1],
              prevData: chartData.length > 1 ? chartData[chartData.length - 2] : null
          };
      }
      return {
          currentData: chartData[currentIndex],
          prevData: currentIndex > 0 ? chartData[currentIndex - 1] : null
      };
  }, [chartData, selectedPeriod]);

  // Recalculate Metrics when data changes
  useEffect(() => {
      if (!currentData) return;

      const formatCurrency = (val: number) => {
        if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' Tỷ';
        if (val >= 1000000) return (val / 1000000).toFixed(1) + ' Triệu';
        return val.toLocaleString();
      };

      const revDiff = prevData ? ((currentData.revenue - prevData.revenue) / prevData.revenue) * 100 : 0;
      const ordDiff = prevData ? ((currentData.orders - prevData.orders) / prevData.orders) * 100 : 0;
      const custDiff = prevData ? ((currentData.customers - prevData.customers) / prevData.customers) * 100 : 0;
      
      const currentRatio = currentData.revenue > 0 ? (currentData.marketingCost / currentData.revenue) * 100 : 0;
      const prevRatio = prevData && prevData.revenue > 0 ? (prevData.marketingCost / prevData.revenue) * 100 : 0;
      const ratioDiff = prevData ? currentRatio - prevRatio : 0;

      const currentAOV = currentData.orders > 0 ? currentData.revenue / currentData.orders : 0;
      const prevAOV = prevData && prevData.orders > 0 ? prevData.revenue / prevData.orders : 0;
      const aovDiff = prevAOV > 0 ? ((currentAOV - prevAOV) / prevAOV) * 100 : 0;
      
      const dailyAvg = currentData.revenue / 30; // Approximation
      const prevDailyAvg = prevData ? prevData.revenue / 30 : 0;
      const dailyDiff = prevDailyAvg > 0 ? ((dailyAvg - prevDailyAvg) / prevDailyAvg) * 100 : 0;

      // Update metrics array while preserving structure (id, iconType)
      const newMetrics = [
          {
            id: 'm1',
            title: `Doanh thu ${currentData.name}`,
            value: formatCurrency(currentData.revenue),
            trend: prevData ? `${revDiff > 0 ? '+' : ''}${revDiff.toFixed(1)}% vs tháng trước` : '-',
            trendUp: revDiff >= 0,
            color: 'bg-blue-500',
            iconType: 'dollar'
          },
          {
            id: 'm2',
            title: 'Tổng đơn hàng',
            value: `${currentData.orders} Đơn`,
            trend: prevData ? `${ordDiff > 0 ? '+' : ''}${ordDiff.toFixed(1)}% vs tháng trước` : '-',
            trendUp: ordDiff >= 0,
            color: 'bg-purple-500',
            iconType: 'cart'
          },
          {
            id: 'm3',
            title: 'Khách hàng',
            value: `${currentData.customers} Khách`,
            trend: prevData ? `${custDiff > 0 ? '+' : ''}${custDiff.toFixed(1)}% vs tháng trước` : '-',
            trendUp: custDiff >= 0,
            color: 'bg-orange-500',
            iconType: 'users'
          },
          {
            id: 'm4',
            title: 'Tỷ lệ CP/DT',
            value: `${currentRatio.toFixed(2)}%`,
            trend: prevData ? `${ratioDiff > 0 ? '+' : ''}${ratioDiff.toFixed(2)}% vs tháng trước` : '-',
            trendUp: ratioDiff < 0,
            color: 'bg-red-500',
            iconType: 'activity'
          },
          {
            id: 'm5',
            title: 'AOV (TB/Đơn)',
            value: new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(currentAOV),
            trend: prevData ? `${aovDiff > 0 ? '+' : ''}${aovDiff.toFixed(1)}% vs tháng trước` : '-',
            trendUp: aovDiff >= 0,
            color: 'bg-emerald-500',
            iconType: 'cart'
          },
          {
            id: 'm6',
            title: 'DT Trung Bình Ngày',
            value: formatCurrency(dailyAvg),
            trend: prevData ? `${dailyDiff > 0 ? '+' : ''}${dailyDiff.toFixed(1)}%` : '-',
            trendUp: dailyDiff >= 0,
            color: 'bg-indigo-500',
            iconType: 'dollar'
          }
      ] as OverviewMetricData[];

      setMetrics(newMetrics);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData, prevData]); // Recalculate when selection changes


  // Customer Analysis Vars based on Selection
  const newCustGrowth = prevData && prevData.newCustomers ? ((currentData?.newCustomers || 0) - prevData.newCustomers) / prevData.newCustomers * 100 : 0;
  const oldCustGrowth = prevData && prevData.oldCustomers ? ((currentData?.oldCustomers || 0) - prevData.oldCustomers) / prevData.oldCustomers * 100 : 0;

  useEffect(() => {
     if (!customerAnalysisText.newCust) {
         setCustomerAnalysisText(prev => ({...prev, newCust: newCustGrowth >= 0 ? "Đang tăng trưởng tốt" : "Cần đẩy mạnh tìm khách mới"}));
     }
     if (!customerAnalysisText.oldCust) {
         setCustomerAnalysisText(prev => ({...prev, oldCust: oldCustGrowth >= 0 ? "Khách quay lại ổn định" : "Cần chăm sóc lại khách cũ"}));
     }
  }, [newCustGrowth, oldCustGrowth]);


  // Backup state
  const [backupMetrics, setBackupMetrics] = useState<OverviewMetricData[]>([]);
  const [backupChartData, setBackupChartData] = useState<ChartDataPoint[]>([]);
  const [backupChannelData, setBackupChannelData] = useState<ChannelCostData[]>([]);
  const [backupAnalysisText, setBackupAnalysisText] = useState({newCust: '', oldCust: ''});
  const [backupChartColors, setBackupChartColors] = useState(chartColors);
  const [backupChartOrder, setBackupChartOrder] = useState(chartOrder);
  const [backupBusinessOrder, setBackupBusinessOrder] = useState(businessChartSeriesOrder);
  const [backupChannelOrder, setBackupChannelOrder] = useState(channelChartSeriesOrder);

  const startEditing = () => {
      setBackupMetrics(JSON.parse(JSON.stringify(metrics)));
      setBackupChartData(JSON.parse(JSON.stringify(chartData)));
      setBackupChannelData(JSON.parse(JSON.stringify(channelCostData)));
      setBackupAnalysisText({...customerAnalysisText});
      setBackupChartColors({...chartColors});
      setBackupChartOrder([...chartOrder] as any);
      setBackupBusinessOrder([...businessChartSeriesOrder]);
      setBackupChannelOrder([...channelChartSeriesOrder]);
      setIsEditing(true);
  };

  const cancelEditing = () => {
      setMetrics(backupMetrics);
      setChartData(backupChartData);
      if (setChannelCostData) setChannelCostData(backupChannelData);
      setCustomerAnalysisText(backupAnalysisText);
      setChartColors(backupChartColors);
      setChartOrder(backupChartOrder as any);
      setBusinessChartSeriesOrder(backupBusinessOrder);
      setChannelChartSeriesOrder(backupChannelOrder);
      setIsEditing(false);
  };

  const handleMetricChange = (id: string, field: keyof OverviewMetricData, value: any) => {
    setMetrics(metrics.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // --- Metric Drag and Drop ---
  const handleMetricDragStart = (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("text/metric-index", index.toString());
  };

  const handleMetricDrop = (e: React.DragEvent, dropIndex: number) => {
      const dragIndexStr = e.dataTransfer.getData("text/metric-index");
      if (!dragIndexStr) return;
      const dragIndex = parseInt(dragIndexStr);
      if (dragIndex === dropIndex) return;
      
      const newMetrics = [...metrics];
      const [removed] = newMetrics.splice(dragIndex, 1);
      newMetrics.splice(dropIndex, 0, removed);
      setMetrics(newMetrics);
  };

  // --- Chart Section Swapping ---
  const handleChartDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData("text/chart-id", id);
  };
  
  const handleChartDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/chart-id");
      if (draggedId && draggedId !== targetId) {
          // Swap logic: if ids are different, just toggle the order because we only have 2
          setChartOrder(prev => [prev[1], prev[0]] as ['business', 'channel'] | ['channel', 'business']);
      }
  };

  // --- Chart Series Reordering (Business) ---
  const handleSeriesDragStart = (e: React.DragEvent, seriesKey: string, type: 'business' | 'channel') => {
      e.dataTransfer.setData("text/series-key", seriesKey);
      e.dataTransfer.setData("text/chart-type", type);
  };

  const handleSeriesDrop = (e: React.DragEvent, targetKey: string, type: 'business' | 'channel') => {
      e.preventDefault();
      const draggedKey = e.dataTransfer.getData("text/series-key");
      const draggedType = e.dataTransfer.getData("text/chart-type");
      
      if (!draggedKey || draggedKey === targetKey || draggedType !== type) return;
      
      if (type === 'business') {
        const newOrder = [...businessChartSeriesOrder];
        const dragIndex = newOrder.indexOf(draggedKey);
        const dropIndex = newOrder.indexOf(targetKey);
        
        if (dragIndex !== -1 && dropIndex !== -1) {
            newOrder.splice(dragIndex, 1);
            newOrder.splice(dropIndex, 0, draggedKey);
            setBusinessChartSeriesOrder(newOrder);
        }
      } else {
        // Channel Chart
        const newOrder = [...channelChartSeriesOrder];
        const dragIndex = newOrder.indexOf(draggedKey);
        const dropIndex = newOrder.indexOf(targetKey);
        
        if (dragIndex !== -1 && dropIndex !== -1) {
            newOrder.splice(dragIndex, 1);
            newOrder.splice(dropIndex, 0, draggedKey);
            setChannelChartSeriesOrder(newOrder);
        }
      }
  };


  // --- Chart Data Editing ---
  const handleChartDataChange = (index: number, field: keyof ChartDataPoint, value: any) => {
    const newData = [...chartData];
    newData[index] = { ...newData[index], [field]: value };
    
    // Auto recalc customers
    if (field === 'newCustomers' || field === 'oldCustomers') {
        const newCust = field === 'newCustomers' ? value : (newData[index].newCustomers || 0);
        const oldCust = field === 'oldCustomers' ? value : (newData[index].oldCustomers || 0);
        newData[index].customers = newCust + oldCust;
    }
    setChartData(newData);
  };
  
  const addChartColumn = () => {
    setChartData([...chartData, { 
        name: 'Tháng mới', 
        revenue: 0, 
        orders: 0, 
        customers: 0, 
        marketingCost: 0, 
        newCustomers: 0, 
        oldCustomers: 0, 
        oldCustomerRevenueShare: 0 
    }]);
  };

  const removeChartColumn = (index: number) => {
    if (chartData.length <= 1) return;
    setChartData(chartData.filter((_, i) => i !== index));
  };

  // --- Channel Data Editing ---
  const handleChannelChange = (index: number, field: keyof ChannelCostData, value: any) => {
    if (!setChannelCostData) return;
    const newData = [...channelCostData];
    newData[index] = { ...newData[index], [field]: value };
    //qc Auto recalc CP/DT if revenue/cost changes
    if (field === 'revenue' || field === 'cost') {
        const revenue = field === 'revenue' ? value : newData[index].revenue;
        const cost = field === 'cost' ? value : newData[index].cost;
        newData[index].cpdt = revenue > 0 ? (cost / revenue) * 100 : 0;
    }
    setChannelCostData(newData);
  };

  const addChannelRow = () => {
      if (!setChannelCostData) return;
      setChannelCostData([...channelCostData, { name: 'Kênh mới', revenue: 0, cost: 0, cpdt: 0 }]);
  };

  const removeChannelRow = (index: number) => {
      if (!setChannelCostData || channelCostData.length <= 1) return;
      setChannelCostData(channelCostData.filter((_, i) => i !== index));
  };

  // Renderers for Chart Sections
  const renderBusinessChart = () => (
    <div 
        className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full ${isEditing ? 'cursor-move ring-2 ring-indigo-50 ring-offset-2' : ''}`}
        draggable={isEditing}
        onDragStart={(e) => handleChartDragStart(e, 'business')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleChartDrop(e, 'business')}
    >
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {isEditing && <GripVertical className="w-4 h-4 text-slate-400"/>}
                    Hiệu quả Kinh doanh
                </h3>
                <p className="text-xs text-slate-500">Kéo thả tiêu đề bên dưới để đổi thứ tự cột</p>
            </div>
            <div className="flex items-center gap-2">
                {isEditing && (
                    <div className="flex gap-2 mr-2">
                         <div className="flex flex-col items-center">
                             <input type="color" value={chartColors.revenue} onChange={(e) => setChartColors({...chartColors, revenue: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" title="Màu Doanh thu"/>
                             <span className="text-[9px] text-slate-400">Rev</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <input type="color" value={chartColors.cost} onChange={(e) => setChartColors({...chartColors, cost: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" title="Màu Chi phí"/>
                             <span className="text-[9px] text-slate-400">Cost</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <input type="color" value={chartColors.ratio} onChange={(e) => setChartColors({...chartColors, ratio: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" title="Màu Tỷ lệ"/>
                             <span className="text-[9px] text-slate-400">Ratio</span>
                         </div>
                    </div>
                )}
                <button onClick={() => downloadCSV(chartData, 'doanh_thu_chart')} className="text-slate-400 hover:text-indigo-600">
                    <Download className="w-5 h-5"/>
                </button>
            </div>
        </div>
        
        <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} 
                        tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)} 
                    />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: chartColors.ratio, fontSize: 12}} 
                        tickFormatter={(value) => `${value}%`} 
                    />
                    
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any, name: string) => [
                            name === 'Tỷ lệ CP/DT' ? `${value}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 
                            name
                        ]}
                    />
                    {/* Render Series Dynamically based on Order */}
                    {businessChartSeriesOrder.map(key => {
                        if (key === 'revenue') return <Bar key="revenue" yAxisId="left" dataKey="revenue" name="Doanh thu" fill={chartColors.revenue} radius={[4, 4, 0, 0]} barSize={24} />;
                        if (key === 'marketingCost') return <Bar key="marketingCost" yAxisId="left" dataKey="marketingCost" name="CP Marketing" fill={chartColors.cost} radius={[4, 4, 0, 0]} barSize={24} />;
                        if (key === 'ratio') return <Line key="ratio" yAxisId="right" type="monotone" dataKey={(data) => (data.revenue > 0 ? (data.marketingCost / data.revenue * 100).toFixed(2) : 0)} name="Tỷ lệ CP/DT" stroke={chartColors.ratio} strokeWidth={3} dot={{r: 4, fill: chartColors.ratio, strokeWidth: 2, stroke: '#fff'}} />;
                        return null;
                    })}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
        
        {/* Custom Draggable Legend */}
        <div className="flex justify-center gap-4 mt-2">
            {businessChartSeriesOrder.map((key) => {
                 let label = '';
                 let color = '';
                 if (key === 'revenue') { label = 'Doanh thu'; color = chartColors.revenue; }
                 if (key === 'marketingCost') { label = 'CP Marketing'; color = chartColors.cost; }
                 if (key === 'ratio') { label = 'Tỷ lệ CP/DT'; color = chartColors.ratio; }

                 return (
                     <div 
                        key={key} 
                        className="flex items-center gap-1.5 cursor-move px-2 py-1 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                        draggable
                        onDragStart={(e) => handleSeriesDragStart(e, key, 'business')}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleSeriesDrop(e, key, 'business')}
                     >
                         <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                         <span className="text-xs font-medium text-slate-600">{label}</span>
                     </div>
                 )
            })}
        </div>
    </div>
  );

  const renderChannelChart = () => (
      <div 
        className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 ${isEditing ? 'cursor-move ring-2 ring-indigo-50 ring-offset-2' : ''}`}
        draggable={isEditing}
        onDragStart={(e) => handleChartDragStart(e, 'channel')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleChartDrop(e, 'channel')}
      >
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {isEditing && <GripVertical className="w-4 h-4 text-slate-400"/>}
                    Hiệu quả Kênh Quảng Cáo
                  </h3>
                  <p className="text-xs text-slate-500">Doanh thu - Chi phí - Tỷ lệ CP/DT (Kéo thả tiêu đề để sắp xếp)</p>
              </div>
              {isEditing && (
                    <div className="flex gap-2 mr-2">
                         <div className="flex flex-col items-center">
                             <input type="color" value={chartColors.channelRevenue} onChange={(e) => setChartColors({...chartColors, channelRevenue: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" title="Màu Doanh thu"/>
                             <span className="text-[9px] text-slate-400">Rev</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <input type="color" value={chartColors.channelCost} onChange={(e) => setChartColors({...chartColors, channelCost: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" title="Màu Chi phí"/>
                             <span className="text-[9px] text-slate-400">Cost</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <input type="color" value={chartColors.channelRatio} onChange={(e) => setChartColors({...chartColors, channelRatio: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" title="Màu Tỷ lệ"/>
                             <span className="text-[9px] text-slate-400">Ratio</span>
                         </div>
                    </div>
              )}
          </div>
          <div className="h-[350px]">
             {channelCostData && channelCostData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={channelCostData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} 
                             tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)} 
                        />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: chartColors.channelRatio, fontSize: 12}} 
                             tickFormatter={(value) => `${value}%`} 
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any, name: string) => [
                                name === 'Tỷ lệ CP/DT' ? `${value}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 
                                name
                            ]}
                        />
                         {/* Render Channel Series Dynamically */}
                         {channelChartSeriesOrder.map(key => {
                            if (key === 'revenue') return <Bar key="rev" yAxisId="left" dataKey="revenue" name="Doanh thu" fill={chartColors.channelRevenue} radius={[4, 4, 0, 0]} barSize={30} />;
                            if (key === 'cost') return <Bar key="cost" yAxisId="left" dataKey="cost" name="Chi phí MKT" fill={chartColors.channelCost} radius={[4, 4, 0, 0]} barSize={30} />;
                            if (key === 'cpdt') return <Line key="ratio" yAxisId="right" type="monotone" dataKey="cpdt" name="Tỷ lệ CP/DT" stroke={chartColors.channelRatio} strokeWidth={3} dot={{r: 4, fill: chartColors.channelRatio, strokeWidth: 2, stroke: '#fff'}} />;
                            return null;
                         })}
                    </ComposedChart>
                </ResponsiveContainer>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-400 text-sm">Chưa có dữ liệu kênh quảng cáo</div>
             )}
          </div>
          
           {/* Custom Draggable Legend for Channel Chart */}
           <div className="flex justify-center gap-4 mt-2">
            {channelChartSeriesOrder.map((key) => {
                 let label = '';
                 let color = '';
                 if (key === 'revenue') { label = 'Doanh thu'; color = chartColors.channelRevenue; }
                 if (key === 'cost') { label = 'Chi phí MKT'; color = chartColors.channelCost; }
                 if (key === 'cpdt') { label = 'Tỷ lệ CP/DT'; color = chartColors.channelRatio; }

                 return (
                     <div 
                        key={key} 
                        className="flex items-center gap-1.5 cursor-move px-2 py-1 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                        draggable
                        onDragStart={(e) => handleSeriesDragStart(e, key, 'channel')}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleSeriesDrop(e, key, 'channel')}
                     >
                         <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                         <span className="text-xs font-medium text-slate-600">{label}</span>
                     </div>
                 )
            })}
        </div>
      </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Area with Month Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
         <div className="flex items-center gap-3 w-full md:w-auto">
             {isEditing ? (
                 <input 
                    className="text-2xl font-bold text-slate-800 border-b-2 border-indigo-500 focus:outline-none bg-transparent w-full"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                 />
             ) : (
                 <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{pageTitle}</h2>
             )}
         </div>

         {/* Month Selection Filter */}
         <div className="relative group">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors">
                <Filter className="w-4 h-4 text-slate-500" />
                <select 
                    className="appearance-none bg-transparent text-sm font-semibold text-slate-700 outline-none pr-6 cursor-pointer"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                    {chartData.map(d => (
                        <option key={d.name} value={d.name}>Dữ liệu: {d.name}</option>
                    ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
            {/* Tooltip for Filter */}
            <div className="absolute top-full mt-2 right-0 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Chọn tháng để xem Báo cáo Tổng quan (So sánh với tháng trước đó)
            </div>
         </div>
         
         <div className="flex gap-2 w-full md:w-auto justify-end">
             <button 
                onClick={() => setIsCompact(!isCompact)}
                className="flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
                title={isCompact ? "Chế độ rộng" : "Chế độ thu gọn"}
             >
                {isCompact ? <Maximize2 className="w-4 h-4 mr-1"/> : <Minimize2 className="w-4 h-4 mr-1"/>}
                {isCompact ? "Mở rộng" : "Thu gọn"}
             </button>

             {isEditing ? (
                 <>
                    <button 
                        onClick={cancelEditing} 
                        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-red-500"
                    >
                        <X className="w-4 h-4 mr-2" /> Hủy
                    </button>
                    <button 
                        onClick={() => setIsEditing(false)} 
                        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
                    >
                        <Check className="w-4 h-4 mr-2" /> Hoàn tất
                    </button>
                 </>
             ) : (
                 <button 
                    onClick={startEditing} 
                    className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-indigo-300"
                 >
                    <Edit2 className="w-4 h-4 mr-2" /> Tùy chỉnh
                 </button>
             )}
         </div>
      </div>

      {/* Responsive Grid for Metrics */}
      <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 transition-all duration-300 ease-in-out ${isEditing ? 'gap-6 p-4 border-2 border-dashed border-indigo-100 rounded-2xl bg-indigo-50/30' : ''}`}>
        {metrics.map((metric, idx) => (
            <MetricCard 
                key={metric.id}
                data={metric}
                isEditing={isEditing}
                isCompact={isCompact}
                onChange={handleMetricChange}
                onDragStart={(e) => handleMetricDragStart(e, idx)}
                onDrop={(e) => handleMetricDrop(e, idx)}
            />
        ))}
        
        {isEditing && (
             <div className={`hidden xl:flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-slate-400 text-xs text-center p-2 ${isCompact ? 'h-24' : 'h-36'}`}>
                <Move className="w-6 h-6 mb-1 opacity-50" />
                Kéo thả để sắp xếp
             </div>
        )}
      </div>

      {/* Charts & Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Top Chart Area (Takes 2 columns) */}
        <div className="xl:col-span-2">
            {chartOrder[0] === 'business' ? renderBusinessChart() : renderChannelChart()}
        </div>

        {/* Right Column: Customer Analysis */}
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
                 <div className="mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">Phân tích Khách hàng</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Tháng <span className="font-bold text-indigo-600">{currentData?.name}</span> so với <span className="font-bold text-slate-600">{prevData?.name || 'Trước'}</span>
                    </p>
                 </div>

                 <div className="flex-1 flex flex-col gap-4">
                    {/* New Customers Card */}
                    <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 relative overflow-hidden transition-transform hover:scale-[1.02]">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Khách Hàng Mới</p>
                                    <h3 className="text-3xl font-extrabold text-emerald-900">
                                        {currentData?.newCustomers || 0}
                                    </h3>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center ${newCustGrowth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-rose-600 border border-rose-100'}`}>
                                    {newCustGrowth >= 0 ? '+' : ''}{newCustGrowth.toFixed(1)}%
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-emerald-600/80 font-medium">
                                {isEditing ? (
                                    <input 
                                        className="w-full bg-white/50 border-b border-emerald-300 focus:outline-none text-emerald-800 px-1"
                                        value={customerAnalysisText.newCust}
                                        onChange={(e) => setCustomerAnalysisText({...customerAnalysisText, newCust: e.target.value})}
                                    />
                                ) : (
                                    customerAnalysisText.newCust
                                )}
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <Users className="w-24 h-24 text-emerald-600" />
                        </div>
                    </div>

                    {/* Old Customers Card */}
                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 relative overflow-hidden transition-transform hover:scale-[1.02]">
                        <div className="relative z-10">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Khách Hàng Cũ</p>
                                    <h3 className="text-3xl font-extrabold text-indigo-900">
                                        {currentData?.oldCustomers || 0}
                                    </h3>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center ${oldCustGrowth >= 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-rose-600 border border-rose-100'}`}>
                                    {oldCustGrowth >= 0 ? '+' : ''}{oldCustGrowth.toFixed(1)}%
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-indigo-600/80 font-medium">
                                {isEditing ? (
                                    <input 
                                        className="w-full bg-white/50 border-b border-indigo-300 focus:outline-none text-indigo-800 px-1"
                                        value={customerAnalysisText.oldCust}
                                        onChange={(e) => setCustomerAnalysisText({...customerAnalysisText, oldCust: e.target.value})}
                                    />
                                ) : (
                                    customerAnalysisText.oldCust
                                )}
                            </div>
                        </div>
                         <div className="absolute -right-4 -bottom-4 opacity-10">
                            <Check className="w-24 h-24 text-indigo-600" />
                        </div>
                    </div>

                    {/* Insight Summary */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 mt-auto">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-700">Tỷ trọng doanh thu</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span>Khách cũ</span>
                            <span className="font-bold">{currentData?.oldCustomerRevenueShare}%</span>
                        </div>
                         <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${currentData?.oldCustomerRevenueShare}%` }}></div>
                        </div>
                    </div>
                 </div>
             </div>
        </div>
      </div>
      
      {/* Bottom Chart Section */}
      <div className="mt-0">
          {chartOrder[1] === 'business' ? renderBusinessChart() : renderChannelChart()}
      </div>
      
      {/* Editable Table for Main Charts */}
      {isEditing && (
        <>
            {/* Table 1: Main Overview Data */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8 animate-in fade-in">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm flex justify-between">
                    <span>Dữ liệu chi tiết biểu đồ Hiệu quả Kinh Doanh (Tự động tính toán)</span>
                    <span className="text-xs text-slate-500 font-normal">Nhập số liệu thực tế</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500">
                                <th className="p-3">Tháng</th>
                                <th className="p-3 text-right">Doanh thu</th>
                                <th className="p-3 text-right">CP Marketing</th>
                                <th className="p-3 text-right text-red-500 font-bold bg-red-50/50">CP/DT (%)</th>
                                <th className="p-3 text-right">Đơn hàng</th>
                                <th className="p-3 text-right text-emerald-600 font-bold bg-emerald-50/50">AOV (TB/Đơn)</th>
                                <th className="p-3 text-right">Khách Mới</th>
                                <th className="p-3 text-right">Khách Cũ</th>
                                <th className="p-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {chartData.map((row, idx) => {
                                const ratio = row.revenue > 0 ? (row.marketingCost / row.revenue * 100).toFixed(2) : "0.00";
                                const aov = row.orders > 0 ? (row.revenue / row.orders).toLocaleString() : "0";
                                return (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-3">
                                            <input className="w-20 bg-transparent border-dashed border-slate-300 focus:outline-none" value={row.name} onChange={(e) => handleChartDataChange(idx, 'name', e.target.value)} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <input type="number" className="w-24 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" value={row.revenue} onChange={(e) => handleChartDataChange(idx, 'revenue', Number(e.target.value))} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <input type="number" className="w-24 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" value={row.marketingCost} onChange={(e) => handleChartDataChange(idx, 'marketingCost', Number(e.target.value))} />
                                        </td>
                                        <td className="p-3 text-right font-bold text-red-500 bg-red-50/30">
                                            {ratio}%
                                        </td>
                                        <td className="p-3 text-right">
                                            <input type="number" className="w-16 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" value={row.orders} onChange={(e) => handleChartDataChange(idx, 'orders', Number(e.target.value))} />
                                        </td>
                                        <td className="p-3 text-right font-bold text-emerald-600 bg-emerald-50/30">
                                            {aov}
                                        </td>
                                        <td className="p-3 text-right">
                                            <input type="number" className="w-16 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" value={row.newCustomers || 0} onChange={(e) => handleChartDataChange(idx, 'newCustomers', Number(e.target.value))} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <input type="number" className="w-16 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" value={row.oldCustomers || 0} onChange={(e) => handleChartDataChange(idx, 'oldCustomers', Number(e.target.value))} />
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => removeChartColumn(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                )
                            })}
                            <tr>
                                <td colSpan={9} className="p-3 text-center">
                                    <button onClick={addChartColumn} className="text-indigo-500 hover:text-indigo-700 font-medium text-xs flex items-center justify-center w-full py-2 border border-dashed border-indigo-200 rounded">
                                        <Plus className="w-3 h-3 mr-1" /> Thêm tháng mới
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table 2: Channel Cost Data Editing */}
            {setChannelCostData && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8 animate-in fade-in">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm flex justify-between">
                        <span>Dữ liệu chi tiết: Hiệu quả Kênh Quảng Cáo</span>
                        <span className="text-xs text-slate-500 font-normal">Chỉnh sửa thủ công</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500">
                                    <th className="p-3">Kênh / Tháng</th>
                                    <th className="p-3 text-right">Doanh thu</th>
                                    <th className="p-3 text-right">Chi phí MKT</th>
                                    <th className="p-3 text-right text-red-500 font-bold">CP/DT (%)</th>
                                    <th className="p-3 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {channelCostData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-3">
                                            <input 
                                                className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none" 
                                                value={row.name} 
                                                onChange={(e) => handleChannelChange(idx, 'name', e.target.value)} 
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            <input 
                                                type="number" 
                                                className="w-32 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" 
                                                value={row.revenue} 
                                                onChange={(e) => handleChannelChange(idx, 'revenue', Number(e.target.value))} 
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            <input 
                                                type="number" 
                                                className="w-32 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" 
                                                value={row.cost} 
                                                onChange={(e) => handleChannelChange(idx, 'cost', Number(e.target.value))} 
                                            />
                                        </td>
                                        <td className="p-3 text-right font-bold text-red-500">
                                            {row.cpdt.toFixed(2)}%
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => removeChannelRow(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={5} className="p-3 text-center">
                                        <button onClick={addChannelRow} className="text-indigo-500 hover:text-indigo-700 font-medium text-xs flex items-center justify-center w-full py-2 border border-dashed border-indigo-200 rounded">
                                            <Plus className="w-3 h-3 mr-1" /> Thêm kênh / tháng mới
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
      )}

      {/* Footer - Updated Text with Security Notice */}
      <footer className="mt-12 pt-8 border-t border-slate-200 text-center space-y-4">
          <div>
            <p className="text-slate-600 text-sm font-bold">
                © 2025 BizGuard Dashboard by Nguyễn Tấn Thành
            </p>
            <p className="text-slate-400 text-xs italic mt-1">
                "Quản trị hiệu quả, Tăng trưởng bền vững"
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 opacity-80">
             <div className="flex items-center text-emerald-600 gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                 <Cloud className="w-4 h-4" />
                 <span className="text-xs font-semibold">Đồng bộ đám mây</span>
             </div>
             <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
                 Đây là mô hình thử nghiệm. <br/>
                 Dữ liệu của bạn được đồng bộ với tài khoản Google/Admin.
             </p>
          </div>
      </footer>
    </div>
  );
};

export default OverviewModule;