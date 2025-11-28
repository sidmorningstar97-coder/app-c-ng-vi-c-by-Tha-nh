
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Lightbulb, AlertTriangle, Edit2, Check, Plus, Trash2, X, GripVertical, Download } from 'lucide-react';
import { AdCampaignData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface MarketingModuleProps {
    pageTitle: string;
    setPageTitle: (title: string) => void;
    data: AdCampaignData[];
    setData: React.Dispatch<React.SetStateAction<AdCampaignData[]>>;
    analysis: {
        warning: string;
        loss: string;
        action1: string;
        action2: string;
        action3: string;
    };
    setAnalysis: React.Dispatch<React.SetStateAction<{
        warning: string;
        loss: string;
        action1: string;
        action2: string;
        action3: string;
    }>>;
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

const MarketingModule: React.FC<MarketingModuleProps> = ({ 
    pageTitle, setPageTitle,
    data, setData, 
    analysis, setAnalysis 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [backupData, setBackupData] = useState<AdCampaignData[]>([]);

  // AUTO AI GENERATION LOGIC
  useEffect(() => {
    let newAnalysis = { ...analysis };
    let hasUpdates = false;

    const constCcRatio = data.find(d => d.kpi.includes('CP/DT') || d.kpi.includes('Chi phí / Doanh thu'));
    if (constCcRatio) {
        if (constCcRatio.novValue > 40) {
             const warningMsg = `Tỷ lệ Chi phí/Doanh thu đang ở mức cao (${constCcRatio.novValue.toFixed(1)}%). Cần kiểm tra lại hiệu quả ads.`;
             if (analysis.warning !== warningMsg) {
                 newAnalysis.warning = warningMsg;
                 hasUpdates = true;
             }
        }
    }

    const newCustMetric = data.find(d => d.kpi.includes('Khách hàng mới') || d.kpi.includes('New Customer'));
    if (newCustMetric) {
        const diff = newCustMetric.novValue - newCustMetric.octValue;
        const percent = newCustMetric.octValue > 0 ? (diff / newCustMetric.octValue) * 100 : 0;
        if (percent < -10) {
             const lossMsg = `Lượng khách mới giảm ${Math.abs(percent).toFixed(0)}%. Cần xem lại Creative hoặc Target.`;
             if (analysis.loss !== lossMsg) {
                 newAnalysis.loss = lossMsg;
                 hasUpdates = true;
             }
        }
    }

    if (hasUpdates) {
        setAnalysis(newAnalysis);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const startEditing = () => {
      setBackupData(JSON.parse(JSON.stringify(data)));
      setIsEditing(true);
  };

  const cancel = () => {
      setData(backupData);
      setIsEditing(false);
  };

  const handleDataChange = (id: string, field: keyof AdCampaignData, value: any) => {
    setData(data.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addRow = () => {
    const newId = Date.now().toString();
    const newRow: AdCampaignData = {
        id: newId,
        kpi: 'Chỉ số mới',
        octValue: 0,
        novValue: 0,
        unit: 'count',
        evaluation: 'Chưa đánh giá',
        isNegativeBad: true
    };
    setData([...data, newRow]);
  };

  const removeRow = (id: string) => {
      setData(data.filter(item => item.id !== id));
  };

  const handleAnalysisChange = (field: string, value: string) => {
      setAnalysis({ ...analysis, [field]: value });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/row-index", index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    const dragIndexStr = e.dataTransfer.getData("text/row-index");
    if (!dragIndexStr) return;
    const dragIndex = parseInt(dragIndexStr);
    
    if (dragIndex === dropIndex) return;
    
    const newData = [...data];
    const [removed] = newData.splice(dragIndex, 1);
    newData.splice(dropIndex, 0, removed);
    setData(newData);
  };

  const chartMetrics = data.filter(d => d.octValue > 0 || d.novValue > 0);

  return (
    <div className="space-y-6">
        <div className="flex justify-end mb-2 gap-2">
            {isEditing ? (
                <>
                    <button 
                        onClick={cancel} 
                        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-red-500"
                    >
                        <X className="w-4 h-4 mr-2" /> Hủy
                    </button>
                    <button 
                        onClick={() => setIsEditing(false)} 
                        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                    >
                        <Check className="w-4 h-4 mr-2" /> Lưu dữ liệu
                    </button>
                </>
            ) : (
                <button 
                    onClick={startEditing} 
                    className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                >
                    <Edit2 className="w-4 h-4 mr-2" /> Chỉnh sửa báo cáo
                </button>
            )}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Data Table */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-indigo-50 flex justify-between items-center">
                <div className="w-full">
                    {isEditing ? (
                        <input 
                            className="text-xl font-bold text-indigo-900 bg-transparent border-b border-dashed border-indigo-300 focus:outline-none w-full"
                            value={pageTitle}
                            onChange={(e) => setPageTitle(e.target.value)}
                        />
                    ) : (
                        <h2 className="text-xl font-bold text-indigo-900">{pageTitle}</h2>
                    )}
                    <p className="text-sm text-indigo-700 mt-1">So sánh số liệu thực tế</p>
                </div>
                <button 
                    onClick={() => downloadCSV(data, 'marketing_kpi')} 
                    className="p-2 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                    <Download className="w-5 h-5 opacity-70" />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {isEditing && <th className="p-4 w-10"></th>}
                    <th className="p-4">Chỉ số (KPIs)</th>
                    <th className="p-4 text-right">Tháng trước</th>
                    <th className="p-4 text-right">Tháng này</th>
                    <th className="p-4 text-right">Chênh lệch</th>
                    <th className="p-4">Đánh giá</th>
                    {isEditing && <th className="p-4 w-10"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {data.map((item, idx) => {
                    const diff = item.novValue - item.octValue;
                    const percent = item.octValue !== 0 ? (diff / item.octValue) * 100 : 0;
                    // Logic to determine color:
                    // isNegativeBad = true (e.g Revenue): diff > 0 is Good, diff < 0 is Bad
                    // isNegativeBad = false (e.g Cost): diff > 0 is Bad, diff < 0 is Good
                    
                    let isGood = false;
                    if (item.isNegativeBad) {
                        isGood = diff >= 0;
                    } else {
                        isGood = diff <= 0;
                    }
                    
                    return (
                        <tr 
                            key={item.id} 
                            className="hover:bg-slate-50 transition-colors group"
                            draggable={isEditing}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, idx)}
                        >
                        {isEditing && (
                            <td className="p-4 text-slate-400 cursor-move text-center">
                                <GripVertical className="w-4 h-4 mx-auto opacity-50 group-hover:opacity-100" />
                            </td>
                        )}
                        <td className="p-4 font-medium text-slate-700">
                            {isEditing ? (
                                <input 
                                    className="border border-slate-300 rounded px-2 py-1 w-full text-sm"
                                    value={item.kpi}
                                    onChange={(e) => handleDataChange(item.id, 'kpi', e.target.value)}
                                />
                            ) : item.kpi}
                        </td>
                        <td className="p-4 text-right text-slate-600">
                            {isEditing ? (
                                <input 
                                    type="number"
                                    className="border border-slate-300 rounded px-2 py-1 w-full text-right text-sm"
                                    value={item.octValue}
                                    onChange={(e) => handleDataChange(item.id, 'octValue', parseFloat(e.target.value) || 0)}
                                />
                            ) : (
                                item.unit === 'VND' 
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.octValue)
                                    : item.unit === 'ratio' ? `${(item.octValue * 1).toFixed(2)}%`
                                    : item.octValue
                            )}
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-800">
                            {isEditing ? (
                                    <input 
                                        type="number"
                                        className="border border-slate-300 rounded px-2 py-1 w-full text-right text-sm font-semibold"
                                        value={item.novValue}
                                        onChange={(e) => handleDataChange(item.id, 'novValue', parseFloat(e.target.value) || 0)}
                                    />
                                ) : (
                                    item.unit === 'VND' 
                                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.novValue)
                                        : item.unit === 'ratio' ? `${(item.novValue * 1).toFixed(2)}%`
                                        : item.novValue
                            )}
                        </td>
                        <td className={`p-4 text-right font-bold ${!isGood ? 'text-red-500' : 'text-emerald-500'}`}>
                            <div className="flex items-center justify-end">
                                {diff > 0 ? <span className="mr-1">↑</span> : <span className="mr-1">↓</span>}
                                {Math.abs(percent).toFixed(2)}%
                            </div>
                        </td>
                        <td className="p-4 text-slate-500 text-xs italic">
                            {isEditing ? (
                                <input 
                                        className="border border-slate-300 rounded px-2 py-1 w-full text-xs"
                                        value={item.evaluation}
                                        onChange={(e) => handleDataChange(item.id, 'evaluation', e.target.value)}
                                    />
                            ) : item.evaluation}
                        </td>
                        {isEditing && (
                            <td className="p-4 text-center">
                                <button onClick={() => removeRow(item.id)} className="text-red-400 hover:text-red-600">
                                    <X className="w-4 h-4"/>
                                </button>
                            </td>
                        )}
                        </tr>
                    );
                    })}
                </tbody>
                </table>
                {isEditing && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <button onClick={addRow} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center font-medium transition-colors">
                            <Plus className="w-4 h-4 mr-2"/> Thêm chỉ số KPI
                        </button>
                    </div>
                )}
            </div>
            </div>

            {/* VISUAL DASHBOARD - KPI Comparison */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-6">Biểu đồ Tăng trưởng (%) Tháng này vs Tháng trước</h3>
                 <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                         <BarChart 
                            layout="vertical" 
                            data={chartMetrics} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                         >
                             <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f1f5f9" />
                             <XAxis type="number" domain={['dataMin', 'dataMax']} tickFormatter={(v) => `${v.toFixed(0)}%`} stroke="#cbd5e1" fontSize={12}/>
                             <YAxis type="category" dataKey="kpi" width={140} tick={{fontSize: 11, fill: '#475569'}} stroke="#cbd5e1" />
                             <Tooltip 
                                formatter={(value: any) => [`${value.toFixed(2)}%`, 'Tăng trưởng']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                             />
                             <Legend />
                             <Bar 
                                dataKey={(d) => {
                                    const diff = d.novValue - d.octValue;
                                    return d.octValue !== 0 ? (diff / d.octValue) * 100 : 0;
                                }} 
                                name="Tỷ lệ tăng trưởng (%)" 
                                radius={[0, 4, 4, 0]}
                            >
                                {chartMetrics.map((entry, index) => {
                                    const diff = entry.novValue - entry.octValue;
                                    const percent = entry.octValue !== 0 ? (diff / entry.octValue) * 100 : 0;
                                    
                                    // UPDATED LOGIC COLOR MỚI: 
                                    // Cái nào TỐT thì màu XANH, KHÔNG TỐT thì màu ĐỎ.
                                    
                                    let color = '#cbd5e1';
                                    if (entry.isNegativeBad) {
                                        // Revenue-like: Increase (Positive %) is Good (Green), Decrease is Bad (Red)
                                        color = percent >= 0 ? '#10b981' : '#ef4444'; 
                                    } else {
                                        // Cost-like: Increase (Positive %) is Bad (Red), Decrease is Good (Green)
                                        color = percent > 0 ? '#ef4444' : '#10b981'; 
                                    }
                                    
                                    return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                            </Bar>
                         </BarChart>
                     </ResponsiveContainer>
                 </div>
            </div>
        </div>

        {/* Right Column: AI Analysis & Strategy */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Cảnh báo & Vấn đề</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                             <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                {isEditing ? (
                                    <textarea 
                                        className="w-full bg-transparent border-b border-dashed border-white/30 text-white focus:outline-none text-sm"
                                        value={analysis.warning}
                                        onChange={(e) => handleAnalysisChange('warning', e.target.value)}
                                    />
                                ) : (
                                    <p className="text-sm font-medium leading-relaxed">{analysis.warning}</p>
                                )}
                             </div>
                        </div>

                        <div className="bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                             <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0"></div>
                                {isEditing ? (
                                    <textarea 
                                        className="w-full bg-transparent border-b border-dashed border-white/30 text-white focus:outline-none text-sm"
                                        value={analysis.loss}
                                        onChange={(e) => handleAnalysisChange('loss', e.target.value)}
                                    />
                                ) : (
                                    <p className="text-sm font-medium leading-relaxed">{analysis.loss}</p>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-10 -right-10 opacity-10">
                    <AlertTriangle className="w-48 h-48 text-white" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                 <div className="flex items-center gap-2 mb-6">
                    <Lightbulb className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Đề xuất tối ưu (Action)</h3>
                </div>

                <div className="space-y-4">
                    {[analysis.action1, analysis.action2, analysis.action3].map((action, idx) => (
                        <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0 mt-0.5">
                                {idx + 1}
                            </span>
                            {isEditing ? (
                                <textarea 
                                    className="w-full bg-transparent border border-slate-200 rounded p-2 text-slate-600 focus:outline-none focus:border-indigo-500 text-sm h-16"
                                    value={action}
                                    onChange={(e) => handleAnalysisChange(`action${idx + 1}`, e.target.value)}
                                />
                            ) : (
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {action}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingModule;
