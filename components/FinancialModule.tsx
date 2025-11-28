
import React, { useState, useEffect } from 'react';
import { FinancialItem, FinancialAnalysisData } from '../types';
import { INITIAL_FINANCIALS } from '../constants';
import { RefreshCw, Plus, X, Edit2, Check, Ban, Calendar, GripVertical, Download, Lightbulb, AlertTriangle, Trash2, Bot, Target, Scale, Info, Clock, ArrowDownUp } from 'lucide-react';

interface FinancialModuleProps {
    pageTitle: string;
    setPageTitle: (title: string) => void;
    items: FinancialItem[];
    setItems: React.Dispatch<React.SetStateAction<FinancialItem[]>>;
    analysis: FinancialAnalysisData;
    setAnalysis: React.Dispatch<React.SetStateAction<FinancialAnalysisData>>;
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


// Helper Component: Input số có định dạng dấu phẩy (1,000,000)
const CurrencyInput = ({ 
    value, 
    onChange, 
    className, 
    placeholder,
    isBold = false
}: { 
    value: number, 
    onChange: (val: number) => void, 
    className?: string, 
    placeholder?: string,
    isBold?: boolean
}) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        setDisplayValue(value === 0 ? '' : new Intl.NumberFormat('en-US').format(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/,/g, '');
        if (!isNaN(Number(val))) {
            onChange(Number(val));
        }
    };

    return (
        <input 
            type="text"
            className={`${className} ${isBold ? 'font-bold' : ''}`}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
        />
    );
};

interface MetricConfig {
    title: string;
    subtitle: string;
    explanation: string;
}

const FinancialModule: React.FC<FinancialModuleProps> = ({ 
    pageTitle, setPageTitle,
    items, setItems,
    analysis, setAnalysis
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Fully Customizable Metric Cards Config (Title, Subtitle, Explanation)
  const [metricConfig, setMetricConfig] = useState<Record<string, MetricConfig>>({
      revenue: {
          title: 'Doanh thu dự kiến',
          subtitle: 'Thực hiện: 100%',
          explanation: 'Tổng doanh thu dự kiến từ tất cả các nguồn bán hàng.'
      },
      daily: {
          title: 'Bình Quân Ngày',
          subtitle: 'Hiệu suất ngày',
          explanation: 'Công thức: Tổng doanh thu / 30 ngày. Chỉ số giúp đánh giá hiệu suất bán hàng hàng ngày.'
      },
      breakeven: {
          title: 'Điểm Hòa Vốn',
          subtitle: 'Cần đạt mức này để không lỗ',
          explanation: 'Điểm Hòa Vốn = Định phí / (1 - (Biến phí / Doanh thu)). Đây là mức doanh thu tối thiểu cần đạt để không bị lỗ.'
      },
      profit: {
          title: 'Lợi nhuận ròng',
          subtitle: 'Margin',
          explanation: 'Lợi Nhuận Ròng = Doanh Thu - (Biến Phí + Định Phí). Số tiền thực tế còn lại. Biên LN = (LN / DT) * 100.'
      },
      time: {
          title: 'Thời gian hòa vốn',
          subtitle: 'Rủi ro thấp',
          explanation: 'Thời gian hòa vốn (Ngày) = (Điểm Hòa Vốn / Doanh Thu) * 30. Số ngày cần làm việc để bù đắp chi phí trong tháng.'
      }
  });

  // Layout Order State: 'ai' = AI Analysis, 'table' = P&L Table
  const [layoutOrder, setLayoutOrder] = useState<string[]>(['ai', 'table']);

  // Backup state for Cancel functionality
  const [backupItems, setBackupItems] = useState<FinancialItem[]>([]);
  const [backupConfig, setBackupConfig] = useState<Record<string, MetricConfig>>({});
  const [backupLayout, setBackupLayout] = useState<string[]>([]);

  // Init Data if Empty
  useEffect(() => {
    if (items.length === 0) {
        setItems(INITIAL_FINANCIALS);
    }
  }, [items.length, setItems]);

  const startEditing = () => {
    setBackupItems(JSON.parse(JSON.stringify(items)));
    setBackupConfig(JSON.parse(JSON.stringify(metricConfig)));
    setBackupLayout([...layoutOrder]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setItems(backupItems);
    setMetricConfig(backupConfig);
    setLayoutOrder(backupLayout);
    setIsEditing(false);
  };

  const updateItem = (id: string, field: keyof FinancialItem, value: any) => {
      setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // NEW: Update Value based on Percentage input
  const updateItemByPercentage = (id: string, newPercentage: number) => {
      const revenueItem = items.find(i => i.type === 'revenue');
      const totalRevenue = revenueItem ? revenueItem.value : 0;
      
      const newValue = totalRevenue > 0 ? Math.round(totalRevenue * (newPercentage / 100)) : 0;
      
      setItems(items.map(i => i.id === id ? { ...i, value: newValue, percentage: newPercentage } : i));
  };

  // NEW: Update Percentage based on Value input
  const updateItemByValue = (id: string, newValue: number) => {
      const revenueItem = items.find(i => i.type === 'revenue');
      const totalRevenue = revenueItem ? revenueItem.value : 0;
      
      const newPercentage = totalRevenue > 0 ? (newValue / totalRevenue) * 100 : 0;
      
      setItems(items.map(i => i.id === id ? { ...i, value: newValue, percentage: newPercentage } : i));
  };

  const updateMetricConfig = (key: string, field: keyof MetricConfig, value: string) => {
      setMetricConfig(prev => ({
          ...prev,
          [key]: { ...prev[key], [field]: value }
      }));
  };

  const removeItem = (id: string) => {
      setItems(items.filter(i => i.id !== id));
  };

  const addItem = (type: 'fixed' | 'variable') => {
      const newItem: FinancialItem = {
          id: Date.now().toString(),
          name: 'Khoản mục mới',
          value: 0,
          type: type,
          isEditable: true,
          percentage: 0,
          note: ''
      };
      setItems([...items, newItem]);
  };

  // Calculations
  const revenueItem = items.find(i => i.type === 'revenue');
  const totalRevenue = revenueItem ? revenueItem.value : 0;
  const dailyAverage = totalRevenue / 30; // 30 Days avg
  
  useEffect(() => {
    if (totalRevenue > 0) {
        setItems(prevItems => prevItems.map(item => {
             // Skip revenue item itself
             if (item.type === 'revenue') return item;
             
             // If item has a valid percentage, recalculate value
             if ((item.type === 'variable' || item.type === 'fixed') && item.percentage !== undefined) {
                 const newVal = Math.round(totalRevenue * (item.percentage / 100));
                 if (newVal !== item.value) {
                     return { ...item, value: newVal };
                 }
             }
             return item;
        }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRevenue]); // Depend on totalRevenue

  const fixedCosts = items.filter(i => i.type === 'fixed');
  const variableCosts = items.filter(i => i.type === 'variable');
  
  const totalFixed = fixedCosts.reduce((acc, i) => acc + i.value, 0);
  const totalVariable = variableCosts.reduce((acc, i) => acc + i.value, 0);
  const totalCost = totalFixed + totalVariable;
  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
  // Break-even Analysis
  const contributionMarginRatio = totalRevenue > 0 ? (totalRevenue - totalVariable) /totalRevenue : 0;
  const breakEvenPoint = contributionMarginRatio > 0 ? totalFixed / contributionMarginRatio : 0;
  const daysToBreakEven = totalRevenue > 0 ? (breakEvenPoint / totalRevenue) * 30 : 0;

  // --- DRAG AND DROP HANDLERS FOR ROWS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('text/financial-id', id);
      e.stopPropagation(); // Prevent section drag
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetType: 'variable' | 'fixed', targetId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = e.dataTransfer.getData('text/financial-id');
      if (!draggedId) return;

      const draggedItem = items.find(i => i.id === draggedId);
      if (!draggedItem || draggedItem.type === 'revenue') return;

      let newItems = [...items];
      const draggedIndex = newItems.findIndex(i => i.id === draggedId);
      newItems.splice(draggedIndex, 1);
      const updatedItem = { ...draggedItem, type: targetType };

      if (targetId) {
          const targetIndex = newItems.findIndex(i => i.id === targetId);
          if (targetIndex !== -1) {
              newItems.splice(targetIndex, 0, updatedItem);
          } else {
              newItems.push(updatedItem);
          }
      } else {
          newItems.push(updatedItem);
      }
      setItems(newItems);
  };

  // --- DRAG AND DROP HANDLERS FOR SECTIONS ---
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
      e.dataTransfer.setData('text/section-id', sectionId);
  };

  const handleSectionDrop = (e: React.DragEvent, targetSection: string) => {
      e.preventDefault();
      const draggedSection = e.dataTransfer.getData('text/section-id');
      if (draggedSection && draggedSection !== targetSection) {
          // Swap logic for 2 items
          setLayoutOrder(prev => {
              return draggedSection === 'ai' ? ['ai', 'table'] : ['table', 'ai'];
          });
          // If current order is ['ai', 'table'] and we drag 'ai' to 'table', we want to swap -> ['table', 'ai']
          // Actually, simply swapping works best.
          setLayoutOrder(prev => {
              const newOrder = [...prev];
              const dragIndex = newOrder.indexOf(draggedSection);
              const dropIndex = newOrder.indexOf(targetSection);
              if (dragIndex !== -1 && dropIndex !== -1) {
                  [newOrder[dragIndex], newOrder[dropIndex]] = [newOrder[dropIndex], newOrder[dragIndex]];
              }
              return newOrder;
          });
      }
  };

  const renderAISection = () => (
    <div 
        className={`bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden border border-slate-800 shadow-xl group transition-transform ${isEditing ? 'cursor-move ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        draggable={isEditing}
        onDragStart={(e) => handleSectionDragStart(e, 'ai')}
        onDragOver={handleDragOver}
        onDrop={(e) => handleSectionDrop(e, 'ai')}
    >
         <div className="relative z-10 flex flex-col md:flex-row gap-6">
            <div className="flex-1 md:max-w-xs">
                 <div className="flex items-center gap-2 mb-3">
                     <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/50">
                        <Bot className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg leading-tight">AI Financial Analyst</h3>
                        <p className="text-xs text-indigo-300">Đánh giá dữ liệu thời gian thực</p>
                     </div>
                 </div>
                 <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                     Hệ thống tự động phát hiện các điểm bất thường trong chi phí và đề xuất tối ưu ngay khi bạn nhập liệu.
                 </p>
            </div>

            <div className="flex-1 space-y-3">
                 {/* Optimization Tip */}
                 <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex gap-4 hover:bg-white/15 transition-colors">
                     <Lightbulb className="w-6 h-6 text-yellow-400 shrink-0 mt-1" />
                     <div className="w-full">
                         <p className="text-xs font-bold text-yellow-400 uppercase mb-1 tracking-wider">Gợi ý Tối ưu Chi phí</p>
                         {isEditing ? (
                            <textarea 
                                className="w-full bg-transparent text-sm text-white focus:outline-none border-b border-dashed border-white/30 min-h-[60px]"
                                value={analysis.optimizationSuggestion}
                                onChange={(e) => setAnalysis({...analysis, optimizationSuggestion: e.target.value})}
                            />
                         ) : (
                             <p className="text-sm font-medium leading-relaxed">{analysis.optimizationSuggestion}</p>
                         )}
                     </div>
                 </div>
                 
                 {/* Cost Warning */}
                 <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 flex gap-4 hover:bg-red-500/20 transition-colors">
                     <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                     <div className="w-full">
                         <p className="text-xs font-bold text-red-400 uppercase mb-1 tracking-wider">Cảnh báo Rủi ro</p>
                          {isEditing ? (
                            <textarea 
                                className="w-full bg-transparent text-sm text-white focus:outline-none border-b border-dashed border-white/30 min-h-[60px]"
                                value={analysis.costWarning}
                                onChange={(e) => setAnalysis({...analysis, costWarning: e.target.value})}
                            />
                         ) : (
                             <p className="text-sm font-medium leading-relaxed">{analysis.costWarning}</p>
                         )}
                     </div>
                 </div>
            </div>
         </div>
         {/* Deco */}
         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
         {isEditing && <div className="absolute top-2 right-2 p-1.5 bg-white/20 rounded cursor-move"><GripVertical className="w-4 h-4 text-white"/></div>}
    </div>
  );

  const renderTableSection = () => (
    <div 
        className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-transform ${isEditing ? 'cursor-move ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        draggable={isEditing}
        onDragStart={(e) => handleSectionDragStart(e, 'table')}
        onDragOver={handleDragOver}
        onDrop={(e) => handleSectionDrop(e, 'table')}
    >
       <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
           <span>Chi tiết P&L (Profit & Loss)</span>
           <div className="flex items-center gap-3">
                <div className="text-xs font-normal text-slate-500">Đơn vị: VNĐ</div>
                {isEditing && <GripVertical className="w-4 h-4 text-slate-400" />}
           </div>
       </div>
       
       <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
               <thead>
                   <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                       {isEditing && <th className="p-3 w-10"></th>}
                       <th className="p-3 font-semibold">Khoản mục</th>
                       <th className="p-3 text-right font-semibold">Giá trị</th>
                       <th className="p-3 text-right font-semibold">% Doanh thu</th>
                       <th className="p-3 font-semibold w-1/3">Ghi chú</th>
                       {isEditing && <th className="p-3 w-10"></th>}
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                   {/* Revenue Row */}
                   {revenueItem && (
                       <tr className="bg-blue-50/50">
                           {isEditing && <td></td>}
                           <td className="p-3 font-bold text-blue-800">{revenueItem.name}</td>
                           <td className="p-3 text-right font-bold text-blue-800">
                               {isEditing ? (
                                   <CurrencyInput 
                                        value={revenueItem.value} 
                                        onChange={(val) => updateItem(revenueItem.id, 'value', val)}
                                        className="w-32 text-right bg-transparent border-b border-dashed border-blue-300 focus:outline-none font-bold text-blue-700"
                                   />
                               ) : (
                                   new Intl.NumberFormat('vi-VN').format(revenueItem.value)
                               )}
                           </td>
                           <td className="p-3 text-right font-bold text-blue-800">100%</td>
                           <td className="p-3 text-slate-500 italic text-xs">
                                {isEditing ? (
                                   <input className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none text-xs" value={revenueItem.note} onChange={(e) => updateItem(revenueItem.id, 'note', e.target.value)} />
                               ) : revenueItem.note}
                           </td>
                           {isEditing && <td></td>}
                       </tr>
                   )}

                   {/* Variable Costs Header */}
                   <tr 
                     className={`bg-slate-50 ${isEditing ? 'cursor-copy hover:bg-indigo-50 transition-colors border-y-2 border-transparent hover:border-indigo-200' : ''}`}
                     onDragOver={isEditing ? handleDragOver : undefined}
                     onDrop={isEditing ? (e) => handleDrop(e, 'variable') : undefined}
                   >
                       <td colSpan={isEditing ? 6 : 4} className="p-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                           Chi phí Biến đổi
                           {isEditing && <span className="text-[10px] font-normal text-indigo-500 bg-indigo-50 px-1 rounded border border-indigo-100 ml-2">Thả vào đây để chuyển loại</span>}
                       </td>
                   </tr>
                   {variableCosts.map((item) => (
                       <tr 
                            key={item.id} 
                            className="hover:bg-slate-50 group transition-colors"
                            draggable={isEditing}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={isEditing ? handleDragOver : undefined}
                            onDrop={isEditing ? (e) => handleDrop(e, 'variable', item.id) : undefined}
                       >
                           {isEditing && (
                               <td className="p-3 text-center cursor-move"><GripVertical className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" /></td>
                           )}
                           <td className="p-3">
                               {isEditing ? (
                                   <input className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} />
                               ) : item.name}
                           </td>
                           <td className="p-3 text-right">
                               {isEditing ? (
                                   <CurrencyInput value={item.value} onChange={(val) => updateItemByValue(item.id, val)} className="w-24 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" />
                               ) : (
                                   new Intl.NumberFormat('vi-VN').format(item.value)
                               )}
                           </td>
                           <td className="p-3 text-right text-slate-500">
                               {isEditing ? (
                                    <div className="flex items-center justify-end">
                                        <input 
                                            type="number"
                                            className="w-16 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none mr-1"
                                            value={item.percentage ? item.percentage.toFixed(2) : 0}
                                            onChange={(e) => updateItemByPercentage(item.id, Number(e.target.value))}
                                        />
                                        <span>%</span>
                                    </div>
                               ) : (
                                    `${totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(2) : 0}%`
                               )}
                           </td>
                           <td className="p-3 text-slate-500 text-xs">
                                {isEditing ? (
                                   <input className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none text-xs" value={item.note} onChange={(e) => updateItem(item.id, 'note', e.target.value)} />
                               ) : item.note}
                           </td>
                           {isEditing && (
                               <td className="p-3 text-center"><button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></td>
                           )}
                       </tr>
                   ))}
                   {isEditing && (
                       <tr>
                           <td colSpan={6} className="p-2 text-center">
                               <button onClick={() => addItem('variable')} className="text-xs flex items-center justify-center w-full text-blue-500 hover:text-blue-700 font-medium"><Plus className="w-3 h-3 mr-1"/> Thêm chi phí biến đổi</button>
                           </td>
                       </tr>
                   )}

                   {/* Fixed Costs Header */}
                   <tr 
                     className={`bg-slate-50 ${isEditing ? 'cursor-copy hover:bg-orange-50 transition-colors border-y-2 border-transparent hover:border-orange-200' : ''}`}
                     onDragOver={isEditing ? handleDragOver : undefined}
                     onDrop={isEditing ? (e) => handleDrop(e, 'fixed') : undefined}
                   >
                        <td colSpan={isEditing ? 6 : 4} className="p-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            Chi phí Cố định
                            {isEditing && <span className="text-[10px] font-normal text-orange-500 bg-orange-50 px-1 rounded border border-orange-100 ml-2">Thả vào đây để chuyển loại</span>}
                        </td>
                   </tr>
                   {fixedCosts.map((item) => (
                       <tr 
                            key={item.id} 
                            className="hover:bg-slate-50 group transition-colors"
                            draggable={isEditing}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={isEditing ? handleDragOver : undefined}
                            onDrop={isEditing ? (e) => handleDrop(e, 'fixed', item.id) : undefined}
                       >
                           {isEditing && (
                               <td className="p-3 text-center cursor-move"><GripVertical className="w-4 h-4 text-slate-300 group-hover:text-orange-500" /></td>
                           )}
                           <td className="p-3">
                               {isEditing ? (
                                   <input className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} />
                               ) : item.name}
                           </td>
                           <td className="p-3 text-right">
                               {isEditing ? (
                                   <CurrencyInput value={item.value} onChange={(val) => updateItemByValue(item.id, val)} className="w-24 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none" />
                               ) : (
                                   new Intl.NumberFormat('vi-VN').format(item.value)
                               )}
                           </td>
                           <td className="p-3 text-right text-slate-500">
                               {isEditing ? (
                                    <div className="flex items-center justify-end">
                                        <input 
                                            type="number"
                                            className="w-16 text-right bg-transparent border-b border-dashed border-slate-300 focus:outline-none mr-1"
                                            value={item.percentage ? item.percentage.toFixed(2) : 0}
                                            onChange={(e) => updateItemByPercentage(item.id, Number(e.target.value))}
                                        />
                                        <span>%</span>
                                    </div>
                               ) : (
                                    `${totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(2) : 0}%`
                               )}
                           </td>
                           <td className="p-3 text-slate-500 text-xs">
                                {isEditing ? (
                                   <input className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none text-xs" value={item.note} onChange={(e) => updateItem(item.id, 'note', e.target.value)} />
                               ) : item.note}
                           </td>
                           {isEditing && (
                               <td className="p-3 text-center"><button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></td>
                           )}
                       </tr>
                   ))}
                    {isEditing && (
                       <tr>
                           <td colSpan={6} className="p-2 text-center">
                               <button onClick={() => addItem('fixed')} className="text-xs flex items-center justify-center w-full text-blue-500 hover:text-blue-700 font-medium"><Plus className="w-3 h-3 mr-1"/> Thêm chi phí cố định</button>
                           </td>
                       </tr>
                   )}
                   
                   {/* Total Row */}
                   <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                       {isEditing && <td></td>}
                       <td className="p-3 text-slate-800">TỔNG CHI PHÍ</td>
                       <td className="p-3 text-right text-red-600">{new Intl.NumberFormat('vi-VN').format(totalCost)}</td>
                       <td className="p-3 text-right text-slate-600">{totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(2) : 0}%</td>
                       <td></td>
                       {isEditing && <td></td>}
                   </tr>
               </tbody>
           </table>
       </div>
    </div>
  );


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <input 
                        className="text-2xl font-bold text-slate-800 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                    />
                ) : (
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{pageTitle}</h2>
                )}
            </div>
            
            <div className="flex gap-2">
                 {isEditing ? (
                     <>
                        <button 
                            onClick={cancelEditing} 
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-red-500"
                        >
                            <X className="w-4 h-4 mr-2" /> Hủy
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)} 
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                        >
                            <Check className="w-4 h-4 mr-2" /> Lưu
                        </button>
                     </>
                 ) : (
                    <>
                        <button onClick={() => downloadCSV(items, 'financial_report')} className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-slate-600 border border-slate-300 hover:bg-slate-50">
                            <Download className="w-4 h-4 mr-2" /> Xuất Excel
                        </button>
                        <button 
                            onClick={startEditing} 
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:border-blue-300"
                        >
                            <Edit2 className="w-4 h-4 mr-2" /> Chỉnh sửa
                        </button>
                    </>
                 )}
            </div>
       </div>

       {/* Top Metric Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
           {/* Revenue Card */}
           <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between ${isEditing ? 'h-auto min-h-[160px]' : 'h-[160px]'} relative overflow-hidden group`}>
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="relative">
                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        {!isEditing && (
                             <div className="absolute right-0 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-50">
                                 {metricConfig.revenue.explanation}
                             </div>
                        )}
                   </div>
               </div>
               <div>
                   {isEditing ? (
                       <input 
                            className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 bg-transparent border-b border-dashed border-slate-300 focus:outline-none w-full"
                            value={metricConfig.revenue.title}
                            onChange={(e) => updateMetricConfig('revenue', 'title', e.target.value)}
                       />
                   ) : (
                       <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{metricConfig.revenue.title}</p>
                   )}
                   
                   {isEditing && revenueItem ? (
                       <CurrencyInput 
                            value={revenueItem.value} 
                            onChange={(val) => updateItem(revenueItem.id, 'value', val)}
                            className="text-2xl font-bold text-blue-600 border-b border-dashed border-slate-300 w-full focus:outline-none mt-1"
                       />
                   ) : (
                       <h3 className="text-2xl font-bold text-blue-600 mt-1">
                           {new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(totalRevenue)}
                       </h3>
                   )}
               </div>
               <div className="mt-auto">
                    {isEditing ? (
                        <>
                             <input 
                                className="text-xs text-slate-400 mb-1 w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
                                value={metricConfig.revenue.subtitle}
                                onChange={(e) => updateMetricConfig('revenue', 'subtitle', e.target.value)}
                            />
                             <textarea 
                                className="w-full text-[10px] bg-slate-50 p-1 border border-slate-200 rounded text-slate-500 mt-2 h-12 focus:outline-none"
                                value={metricConfig.revenue.explanation}
                                onChange={(e) => updateMetricConfig('revenue', 'explanation', e.target.value)}
                                placeholder="Giải thích (Tooltip)"
                            />
                        </>
                    ) : (
                        <p className="text-xs text-slate-400 mb-1">{metricConfig.revenue.subtitle}</p>
                    )}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
               </div>
           </div>

            {/* Daily Average Card */}
            <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between ${isEditing ? 'h-auto min-h-[160px]' : 'h-[160px]'} group`}>
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="relative">
                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        {!isEditing && (
                            <div className="absolute right-0 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-50">
                                {metricConfig.daily.explanation}
                            </div>
                        )}
                   </div>
               </div>
               <div>
                   <div className="flex items-center gap-2 mb-1">
                       <Calendar className="w-4 h-4 text-indigo-500" />
                       {isEditing ? (
                           <input 
                                className="text-xs text-slate-500 uppercase font-bold tracking-wider bg-transparent border-b border-dashed border-slate-300 focus:outline-none w-24"
                                value={metricConfig.daily.title}
                                onChange={(e) => updateMetricConfig('daily', 'title', e.target.value)}
                           />
                       ) : (
                           <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{metricConfig.daily.title}</p>
                       )}
                   </div>
                   <h3 className="text-2xl font-bold text-indigo-600">
                       {new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(dailyAverage)}
                   </h3>
               </div>
               <div className="mt-auto bg-indigo-50 rounded-lg p-2">
                   <div className="flex justify-between items-center text-xs">
                       {isEditing ? (
                           <input 
                                className="text-indigo-600 font-medium bg-transparent border-b border-indigo-200 focus:outline-none w-full"
                                value={metricConfig.daily.subtitle}
                                onChange={(e) => updateMetricConfig('daily', 'subtitle', e.target.value)}
                           />
                       ) : (
                           <span className="text-indigo-600 font-medium">{metricConfig.daily.subtitle}</span>
                       )}
                       <span className="text-indigo-700 font-bold"><Target className="w-3 h-3 inline mr-1"/></span>
                   </div>
                   {isEditing && (
                        <textarea 
                            className="w-full text-[10px] bg-white p-1 border border-indigo-100 rounded text-slate-500 mt-2 h-12 focus:outline-none"
                            value={metricConfig.daily.explanation}
                            onChange={(e) => updateMetricConfig('daily', 'explanation', e.target.value)}
                            placeholder="Giải thích (Tooltip)"
                        />
                   )}
               </div>
           </div>

           {/* Break-even Point Card */}
           <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between ${isEditing ? 'h-auto min-h-[160px]' : 'h-[160px]'} group`}>
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="relative">
                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        {!isEditing && (
                            <div className="absolute right-0 w-56 p-2 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-50">
                                {metricConfig.breakeven.explanation}
                            </div>
                        )}
                   </div>
               </div>
               <div>
                   <div className="flex items-center gap-2 mb-1">
                       <Scale className="w-4 h-4 text-orange-500" />
                       {isEditing ? (
                           <input 
                                className="text-xs text-slate-500 uppercase font-bold tracking-wider bg-transparent border-b border-dashed border-slate-300 focus:outline-none w-24"
                                value={metricConfig.breakeven.title}
                                onChange={(e) => updateMetricConfig('breakeven', 'title', e.target.value)}
                           />
                       ) : (
                           <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{metricConfig.breakeven.title}</p>
                       )}
                   </div>
                   <h3 className="text-2xl font-bold text-orange-600">
                       {new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(breakEvenPoint)}
                   </h3>
               </div>
               <div className="mt-auto">
                    {isEditing ? (
                        <>
                             <input 
                                className="text-[10px] text-slate-400 mb-1 w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
                                value={metricConfig.breakeven.subtitle}
                                onChange={(e) => updateMetricConfig('breakeven', 'subtitle', e.target.value)}
                            />
                             <textarea 
                                className="w-full text-[10px] bg-slate-50 p-1 border border-slate-200 rounded text-slate-500 mt-2 h-12 focus:outline-none"
                                value={metricConfig.breakeven.explanation}
                                onChange={(e) => updateMetricConfig('breakeven', 'explanation', e.target.value)}
                                placeholder="Giải thích (Tooltip)"
                            />
                        </>
                    ) : (
                        <p className="text-[10px] text-slate-400 mb-1">{metricConfig.breakeven.subtitle}</p>
                    )}
                   
                   <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        {/* Progress toward break even based on current revenue */}
                        <div className={`h-full rounded-full transition-all duration-500 ${totalRevenue >= breakEvenPoint ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.min((totalRevenue / breakEvenPoint) * 100, 100)}%` }}></div>
                   </div>
               </div>
           </div>

           {/* Profit Card */}
           <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between ${isEditing ? 'h-auto min-h-[160px]' : 'h-[160px]'} group`}>
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="relative">
                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        {!isEditing && (
                            <div className="absolute right-0 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-50">
                                {metricConfig.profit.explanation}
                            </div>
                        )}
                   </div>
               </div>
               <div>
                   {isEditing ? (
                       <input 
                            className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 bg-transparent border-b border-dashed border-slate-300 focus:outline-none w-full"
                            value={metricConfig.profit.title}
                            onChange={(e) => updateMetricConfig('profit', 'title', e.target.value)}
                       />
                   ) : (
                       <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{metricConfig.profit.title}</p>
                   )}
                   <h3 className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(profit)}
                   </h3>
               </div>
               <div className="mt-auto flex flex-col">
                   <div className="flex items-center">
                        <span className={`text-xs px-2 py-1 rounded font-bold ${margin >= 15 ? 'bg-green-100 text-green-700' : margin > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {isEditing ? (
                                <input 
                                    className="bg-transparent border-b border-slate-400 w-16 focus:outline-none"
                                    value={metricConfig.profit.subtitle}
                                    onChange={(e) => updateMetricConfig('profit', 'subtitle', e.target.value)}
                                />
                            ) : (
                                <>Margin: {margin.toFixed(1)}%</>
                            )}
                        </span>
                        {margin < 10 && margin > 0 && <span className="ml-2 text-[10px] text-red-500 font-medium">Thấp</span>}
                   </div>
                    {isEditing && (
                        <textarea 
                            className="w-full text-[10px] bg-slate-50 p-1 border border-slate-200 rounded text-slate-500 mt-2 h-12 focus:outline-none"
                            value={metricConfig.profit.explanation}
                            onChange={(e) => updateMetricConfig('profit', 'explanation', e.target.value)}
                            placeholder="Giải thích (Tooltip)"
                        />
                   )}
               </div>
           </div>

           {/* Break-even Time */}
           <div className={`bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-xl shadow-lg text-white flex-col justify-between ${isEditing ? 'h-auto min-h-[160px]' : 'h-[160px]'} relative overflow-hidden group`}>
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="relative">
                        <Info className="w-4 h-4 text-indigo-200 cursor-help" />
                        {!isEditing && (
                            <div className="absolute right-0 w-48 p-2 bg-slate-900 text-white text-xs rounded shadow-lg hidden group-hover:block z-50">
                                {metricConfig.time.explanation}
                            </div>
                        )}
                   </div>
               </div>
               <div className="relative z-10 text-white">
                   <p className="text-xs text-indigo-100 uppercase font-bold tracking-wider flex items-center gap-1">
                       <RefreshCw className="w-3 h-3" /> 
                       {isEditing ? (
                           <input 
                                className="bg-transparent border-b border-dashed border-white/30 focus:outline-none w-24 text-white placeholder-indigo-200"
                                value={metricConfig.time.title}
                                onChange={(e) => updateMetricConfig('time', 'title', e.target.value)}
                           />
                       ) : metricConfig.time.title}
                   </p>
                   <h3 className="text-3xl font-extrabold text-white mt-1">
                       {daysToBreakEven > 30 ? '> 30' : daysToBreakEven.toFixed(1)} <span className="text-base font-normal opacity-80">Ngày</span>
                   </h3>
               </div>
               <div className="relative z-10 mt-auto bg-white/10 p-2 rounded">
                    {isEditing ? (
                        <>
                            <input 
                                className="text-xs text-indigo-200 bg-transparent border-b border-indigo-400/50 w-full focus:outline-none mb-1"
                                value={metricConfig.time.subtitle}
                                onChange={(e) => updateMetricConfig('time', 'subtitle', e.target.value)}
                                placeholder="Subtitle"
                            />
                             <textarea 
                                className="w-full text-[10px] bg-white/10 p-1 border border-white/20 rounded text-indigo-100 h-12 focus:outline-none"
                                value={metricConfig.time.explanation}
                                onChange={(e) => updateMetricConfig('time', 'explanation', e.target.value)}
                                placeholder="Giải thích (Tooltip)"
                            />
                        </>
                    ) : (
                         <p className="text-xs text-indigo-200">
                             {daysToBreakEven <= 15 ? '🚀 Tuyệt vời! Rủi ro thấp' : daysToBreakEven <= 25 ? '⚠️ Cần đẩy mạnh doanh thu' : '🔥 Rủi ro cao!'}
                         </p>
                    )}
               </div>
               {/* Background Deco */}
               <div className="absolute -right-2 -bottom-4 opacity-20">
                   <Clock className="w-24 h-24 text-white" />
               </div>
           </div>
       </div>

        {/* Main Content with Reorderable Sections */}
        <div className="flex flex-col gap-6">
            {layoutOrder.map((section) => (
                <React.Fragment key={section}>
                    {section === 'ai' ? renderAISection() : renderTableSection()}
                </React.Fragment>
            ))}
        </div>
    </div>
  );
};

export default FinancialModule;
