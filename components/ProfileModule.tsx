import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Eye, FileText, Link as LinkIcon, X, Edit2, Quote, MapPin, Mail, Phone, Globe, Share2, ExternalLink, Check, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ProfileData, ProfileGallery, ProfileSkill, ProfileTimeline } from '../types';
import { INITIAL_PROFILE_DATA } from '../constants';

interface ProfileModuleProps {
    data?: ProfileData;
    setData?: (data: ProfileData) => void;
}

const ProfileModule: React.FC<ProfileModuleProps> = ({ data, setData }) => {
    const [localData, setLocalData] = useState<ProfileData>(data || INITIAL_PROFILE_DATA);
    const [isPreview, setIsPreview] = useState(false);
    
    // State for Link Editing Popup
    const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
    const [tempLinkUrl, setTempLinkUrl] = useState('');

    // Sync with parent data if available
    useEffect(() => {
        if (data) {
            setLocalData(data);
        }
    }, [data]);

    // Helper to update state
    const updateField = (field: keyof ProfileData, value: any) => {
        const newData = { ...localData, [field]: value };
        setLocalData(newData);
        if (setData) setData(newData);
    };

    // Refs for file inputs
    const bgInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handlers for Images
    const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => updateField('bgImage', ev.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => updateField('avatar', ev.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const newGallery = localData.gallery.map(g => g.id === id ? { ...g, img: ev.target?.result as string } : g);
                updateField('gallery', newGallery);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Handlers for Interactive Lists
    const cycleSkillStyle = (id: number) => {
        if (isPreview) return;
        const styles = ['default', 'gold-text', 'gold-fill', 'white-fill'] as const;
        const newSkills = localData.skills.map(s => {
            if (s.id === id) {
                const currentIdx = styles.indexOf(s.style);
                const nextStyle = styles[(currentIdx + 1) % styles.length];
                return { ...s, style: nextStyle };
            }
            return s;
        });
        updateField('skills', newSkills);
    };

    const addSkill = () => {
        const newId = Date.now();
        const newSkills = [...localData.skills, { id: newId, text: 'New Skill', style: 'default' as const }];
        updateField('skills', newSkills);
    };

    const removeSkill = (id: number) => {
        updateField('skills', localData.skills.filter(s => s.id !== id));
    };

    const addTimelineItem = () => {
        const newId = Date.now();
        const newTimeline = [{ id: newId, year: 'Năm', role: 'Chức danh', org: 'Tên tổ chức', desc: 'Mô tả...' }, ...localData.timeline];
        updateField('timeline', newTimeline);
    };

    const removeTimelineItem = (id: number) => {
        updateField('timeline', localData.timeline.filter(t => t.id !== id));
    };

    const addGalleryItem = () => {
        if (localData.gallery.length >= 8) {
            alert("Tối đa 8 ảnh trong thư viện.");
            return;
        }
        const newId = Date.now();
        const newGallery = [...localData.gallery, { id: newId, img: 'https://via.placeholder.com/300x160', caption: 'Caption...' }];
        updateField('gallery', newGallery);
    };

    const removeGalleryItem = (id: number) => {
        updateField('gallery', localData.gallery.filter(g => g.id !== id));
    };

    // Media Handlers
    const addMediaItem = () => {
        const newMedia = [...localData.media, { title: 'Tiêu đề bài viết mới', url: '#' }];
        updateField('media', newMedia);
    }
    
    const removeMediaItem = (index: number) => {
        const newMedia = localData.media.filter((_, i) => i !== index);
        updateField('media', newMedia);
    }

    const saveLinkUrl = (index: number) => {
        const newMedia = [...localData.media];
        newMedia[index].url = tempLinkUrl;
        updateField('media', newMedia);
        setEditingLinkIndex(null);
    }

    const downloadPDF = async () => {
        const element = containerRef.current;
        if (!element) return;

        const wasPreview = isPreview;
        setIsPreview(true);
        
        // Wait for UI to update and images to load
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#080808',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate aspect ratio to fit
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const width = imgWidth * ratio;
            const height = imgHeight * ratio;

            // Center image
            const x = (pdfWidth - width) / 2;
            const y = (pdfHeight - height) / 2;

            pdf.addImage(imgData, 'PNG', x, y, width, height);
            pdf.save('bizguard-portfolio.pdf');
        } catch (err) {
            console.error("PDF Export Error:", err);
            alert("Lỗi khi xuất PDF. Vui lòng thử lại.");
        } finally {
            setIsPreview(wasPreview);
        }
    };

    return (
        <div className="w-full min-h-full flex flex-col items-center bg-gray-900 p-4 lg:p-8 relative font-sans overflow-y-auto">
            {/* Toolbar - Sticky Top */}
            <div className="sticky top-0 z-50 flex justify-end w-full max-w-6xl mb-4 pointer-events-none">
                <div className="flex gap-2 bg-black/60 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-xl pointer-events-auto">
                    <button onClick={() => bgInputRef.current?.click()} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors" title="Đổi hình nền">
                        <Camera className="w-5 h-5" />
                    </button>
                    <input type="file" ref={bgInputRef} hidden accept="image/*" onChange={handleBgChange} />
                    
                    <button onClick={() => setIsPreview(!isPreview)} className={`p-2 rounded-full transition-colors ${isPreview ? 'bg-[#d4af37] text-black' : 'text-white hover:bg-white/10'}`} title={isPreview ? "Chế độ chỉnh sửa" : "Xem trước"}>
                        {isPreview ? <Edit2 className="w-5 h-5"/> : <Eye className="w-5 h-5" />}
                    </button>

                    <button onClick={downloadPDF} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors" title="Tải PDF">
                        <FileText className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div 
                ref={containerRef}
                id="portfolio-content"
                className={`relative w-full max-w-[1280px] min-h-[720px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${isPreview ? 'pointer-events-none' : ''}`}
                style={{
                    backgroundImage: `linear-gradient(rgba(8,8,8,0.85), rgba(8,8,8,0.95)), url(${localData.bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Header / Hero Section */}
                <div className="p-8 border-b border-white/5 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">
                    {/* Avatar */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 group mx-auto md:mx-0 shrink-0">
                        <img src={localData.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl border border-[#d4af37] shadow-[5px_5px_0_rgba(212,175,55,0.15)]" />
                        {!isPreview && (
                            <div onClick={() => avatarInputRef.current?.click()} className="absolute bottom-[-10px] right-[-10px] w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg text-black z-10">
                                <Camera className="w-4 h-4" />
                            </div>
                        )}
                        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-center md:text-left">
                        <h1 
                            className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#fce38a] to-[#d4af37] break-words" 
                            contentEditable={!isPreview} 
                            suppressContentEditableWarning
                            onBlur={(e) => updateField('name', e.currentTarget.textContent)}
                        >
                            {localData.name}
                        </h1>
                        <p 
                            className="text-sm uppercase tracking-[3px] text-white/80 font-sans font-medium" 
                            contentEditable={!isPreview} 
                            suppressContentEditableWarning
                            onBlur={(e) => updateField('role', e.currentTarget.textContent)}
                        >
                            {localData.role}
                        </p>
                        <div 
                            className="text-sm text-gray-300 leading-relaxed border-l-2 border-[#d4af37] pl-4 mt-4 max-w-xl italic mx-auto md:mx-0" 
                            contentEditable={!isPreview} 
                            suppressContentEditableWarning
                            onBlur={(e) => updateField('intro', e.currentTarget.textContent)}
                        >
                            {localData.intro}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-white/5 p-4 rounded-lg space-y-2 text-xs text-gray-400 border border-white/5 backdrop-blur-sm min-w-[200px]">
                        <div className="flex items-center gap-2 hover:text-white transition-colors">
                            <span className="text-[#d4af37] font-bold w-12 shrink-0">PHONE</span>
                            <span contentEditable={!isPreview} suppressContentEditableWarning onBlur={(e) => updateField('phone', e.currentTarget.textContent)}>{localData.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 hover:text-white transition-colors">
                            <span className="text-[#d4af37] font-bold w-12 shrink-0">EMAIL</span>
                            <span className="break-all" contentEditable={!isPreview} suppressContentEditableWarning onBlur={(e) => updateField('email', e.currentTarget.textContent)}>{localData.email}</span>
                        </div>
                        <div className="flex items-center gap-2 hover:text-white transition-colors">
                            <span className="text-[#d4af37] font-bold w-12 shrink-0">WEB</span>
                            <span className="break-all" contentEditable={!isPreview} suppressContentEditableWarning onBlur={(e) => updateField('website', e.currentTarget.textContent)}>{localData.website}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-8 overflow-visible">
                    
                    {/* LEFT COLUMN */}
                    <div className="space-y-8">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {localData.stats.map((stat, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center hover:bg-white/10 transition-colors">
                                    <div 
                                        className="text-2xl font-bold text-white font-sans" 
                                        contentEditable={!isPreview} 
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newStats = [...localData.stats];
                                            newStats[i].value = e.currentTarget.textContent || '';
                                            updateField('stats', newStats);
                                        }}
                                    >{stat.value}</div>
                                    <div 
                                        className="text-[10px] uppercase text-gray-400 mt-1 font-medium" 
                                        contentEditable={!isPreview} 
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newStats = [...localData.stats];
                                            newStats[i].label = e.currentTarget.textContent || '';
                                            updateField('stats', newStats);
                                        }}
                                    >{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Timeline */}
                        <div>
                            <div className="flex justify-between items-center mb-4 text-[#d4af37] text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                                <span>Hành Trình Sự Nghiệp</span>
                                {!isPreview && <Plus className="w-4 h-4 cursor-pointer hover:text-white" onClick={addTimelineItem} />}
                            </div>
                            <div className="space-y-6 border-l border-white/10 ml-2 pl-6 relative">
                                {localData.timeline.map(item => (
                                    <div key={item.id} className="relative group">
                                        <div className="absolute -left-[29px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_10px_#d4af37]"></div>
                                        {!isPreview && (
                                            <button onClick={() => removeTimelineItem(item.id)} className="absolute -right-4 top-0 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                        <div className="flex flex-wrap items-baseline gap-3 mb-1">
                                            <span 
                                                className="text-[10px] font-bold bg-[#d4af37] text-black px-1.5 rounded" 
                                                contentEditable={!isPreview} 
                                                suppressContentEditableWarning
                                                onBlur={(e) => {
                                                    const newTimeline = localData.timeline.map(t => t.id === item.id ? { ...t, year: e.currentTarget.textContent || '' } : t);
                                                    updateField('timeline', newTimeline);
                                                }}
                                            >{item.year}</span>
                                            <span 
                                                className="text-white font-semibold" 
                                                contentEditable={!isPreview} 
                                                suppressContentEditableWarning
                                                onBlur={(e) => {
                                                    const newTimeline = localData.timeline.map(t => t.id === item.id ? { ...t, role: e.currentTarget.textContent || '' } : t);
                                                    updateField('timeline', newTimeline);
                                                }}
                                            >{item.role}</span>
                                        </div>
                                        <div 
                                            className="text-xs text-gray-400 italic mb-1" 
                                            contentEditable={!isPreview} 
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const newTimeline = localData.timeline.map(t => t.id === item.id ? { ...t, org: e.currentTarget.textContent || '' } : t);
                                                updateField('timeline', newTimeline);
                                            }}
                                        >{item.org}</div>
                                        <div 
                                            className="text-sm text-gray-300 leading-relaxed" 
                                            contentEditable={!isPreview} 
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const newTimeline = localData.timeline.map(t => t.id === item.id ? { ...t, desc: e.currentTarget.textContent || '' } : t);
                                                updateField('timeline', newTimeline);
                                            }}
                                        >{item.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gallery */}
                        <div>
                            <div className="flex justify-between items-center mb-4 text-[#d4af37] text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                                <span>Dự Án & Hình Ảnh ({localData.gallery.length}/8)</span>
                                {!isPreview && <Plus className="w-4 h-4 cursor-pointer hover:text-white" onClick={addGalleryItem} />}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {localData.gallery.map((item) => (
                                    <div key={item.id} className="relative aspect-video bg-black/50 rounded border border-white/10 overflow-hidden group">
                                        <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Gallery" />
                                        {!isPreview && (
                                            <>
                                                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                                                    <Camera className="w-5 h-5 text-white mb-1" />
                                                    <span className="text-[10px] text-white">Thay ảnh</span>
                                                    <input 
                                                        type="file" 
                                                        hidden 
                                                        accept="image/*" 
                                                        onChange={(e) => handleGalleryChange(e, item.id)} 
                                                    />
                                                </label>
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); removeGalleryItem(item.id); }}
                                                    className="absolute top-1 right-1 bg-red-500/80 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 z-20 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-2 pt-6 pointer-events-none">
                                            <div 
                                                className="text-[10px] text-white font-medium truncate" 
                                                contentEditable={!isPreview} 
                                                suppressContentEditableWarning 
                                                style={{pointerEvents: isPreview ? 'none' : 'auto'}}
                                                onBlur={(e) => {
                                                    const newGallery = localData.gallery.map(g => g.id === item.id ? { ...g, caption: e.currentTarget.textContent || '' } : g);
                                                    updateField('gallery', newGallery);
                                                }}
                                            >{item.caption}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-8">
                        {/* Skills */}
                        <div>
                            <div className="flex justify-between items-center mb-4 text-[#d4af37] text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                                <span>Năng Lực Cốt Lõi</span>
                                {!isPreview && <Plus className="w-4 h-4 cursor-pointer hover:text-white" onClick={addSkill} />}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {localData.skills.map(skill => (
                                    <span 
                                        key={skill.id}
                                        onClick={() => cycleSkillStyle(skill.id)}
                                        className={`
                                            relative group px-3 py-1.5 rounded text-[11px] font-medium cursor-pointer border transition-all
                                            ${skill.style === 'default' ? 'bg-slate-800 border-slate-700 text-slate-300' : ''}
                                            ${skill.style === 'gold-text' ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' : ''}
                                            ${skill.style === 'gold-fill' ? 'bg-[#d4af37] border-[#d4af37] text-slate-900 font-bold' : ''}
                                            ${skill.style === 'white-fill' ? 'bg-white border-white text-slate-900 font-bold' : ''}
                                        `}
                                    >
                                        <span contentEditable={!isPreview} suppressContentEditableWarning onBlur={(e) => {
                                            const newSkills = localData.skills.map(s => s.id === skill.id ? { ...s, text: e.currentTarget.textContent || '' } : s);
                                            updateField('skills', newSkills);
                                        }}>{skill.text}</span>
                                        {!isPreview && <X className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveItem('skills', skill.id); }} />}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Media - UPDATED FOR EDITING */}
                        <div>
                            <div className="flex justify-between items-center mb-4 text-[#d4af37] text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                                <span>Truyền Thông</span>
                                {!isPreview && <Plus className="w-4 h-4 cursor-pointer hover:text-white" onClick={addMediaItem} />}
                            </div>
                            <div className="space-y-2">
                                {localData.media.map((m, i) => (
                                    <div key={i} className="relative group">
                                        {/* Main Item Container */}
                                        <div className={`flex items-center gap-3 p-3 rounded border transition-colors ${isPreview ? 'bg-white/5 hover:bg-[#d4af37]/10 border-transparent hover:border-[#d4af37]/30 cursor-pointer' : 'bg-slate-800/50 border-slate-700'}`}>
                                            <LinkIcon className="w-4 h-4 text-[#d4af37] shrink-0" />
                                            
                                            {/* Content Logic: Link if Preview, Editable Span if Edit Mode */}
                                            {isPreview ? (
                                                <a href={m.url} target="_blank" rel="noreferrer" className="flex-1 text-sm text-gray-300 group-hover:text-[#d4af37] truncate">
                                                    {m.title}
                                                </a>
                                            ) : (
                                                <span 
                                                    className="flex-1 text-sm text-gray-300 outline-none border-b border-transparent focus:border-[#d4af37] focus:bg-black/20 px-1 rounded"
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        const newMedia = [...localData.media];
                                                        newMedia[i].title = e.currentTarget.textContent || '';
                                                        updateField('media', newMedia);
                                                    }}
                                                >
                                                    {m.title}
                                                </span>
                                            )}
                                        </div>

                                        {/* Edit Controls (Visible only in Edit Mode) */}
                                        {!isPreview && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-100">
                                                <button 
                                                    onClick={() => { setEditingLinkIndex(i); setTempLinkUrl(m.url); }} 
                                                    className="p-1.5 bg-slate-700 text-slate-300 hover:text-[#d4af37] hover:bg-slate-600 rounded" 
                                                    title={`Sửa Link: ${m.url}`}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => removeMediaItem(i)} 
                                                    className="p-1.5 bg-slate-700 text-slate-300 hover:text-red-500 hover:bg-slate-600 rounded" 
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* URL Edit Popup */}
                            {editingLinkIndex !== null && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                                    <div className="bg-slate-800 p-5 rounded-xl shadow-2xl border border-white/10 w-full max-w-md animate-in fade-in zoom-in duration-200">
                                        <h4 className="text-white text-sm font-bold mb-1">Chỉnh sửa đường dẫn (URL)</h4>
                                        <p className="text-xs text-slate-400 mb-4">Nhập đường dẫn đầy đủ (bao gồm https://)</p>
                                        
                                        <div className="relative">
                                            <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                                            <input 
                                                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                                                value={tempLinkUrl}
                                                onChange={(e) => setTempLinkUrl(e.target.value)}
                                                placeholder="https://example.com"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 mt-5">
                                            <button 
                                                onClick={() => setEditingLinkIndex(null)} 
                                                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                Hủy
                                            </button>
                                            <button 
                                                onClick={() => saveLinkUrl(editingLinkIndex)} 
                                                className="px-4 py-2 text-xs bg-[#d4af37] text-slate-900 font-bold rounded-lg hover:bg-[#fce38a] transition-colors flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3" /> Lưu thay đổi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Education */}
                        <div>
                            <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                                <h3 className="text-[#d4af37] font-bold uppercase text-xs tracking-wider">Đào tạo & Chứng chỉ</h3>
                            </div>
                            <div className="space-y-3 text-xs text-slate-400">
                                {localData.education.map((edu, i) => (
                                    <div 
                                        key={i} 
                                        contentEditable={!isPreview} 
                                        suppressContentEditableWarning 
                                        dangerouslySetInnerHTML={{__html: edu}} 
                                        onBlur={(e) => {
                                            const newEdu = [...localData.education];
                                            newEdu[i] = e.currentTarget.innerHTML;
                                            updateField('education', newEdu);
                                        }}
                                        className="leading-relaxed"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModule;