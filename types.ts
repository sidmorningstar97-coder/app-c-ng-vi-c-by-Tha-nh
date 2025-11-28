
export enum TaskStatus {
    PENDING = 'Pending',
    IN_PROGRESS = 'In Progress',
    HIGH_PRIORITY = 'High Priority',
    COMPLETED = 'Completed',
    URGENT = 'Urgent' // Used for the Ticker
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    dueDate: string; // YYYY-MM-DD
    dueTime?: string; // HH:MM (New)
    remindAt?: number; // Timestamp for snooze (New)
    assignee: string;
    progress: number; // 0-100
    members?: string[]; // List of people involved
    notes?: string;
}

export interface TimelineEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    color: string;
    icon: string;
    description?: string;
}

export interface FinancialItem {
    id: string;
    name: string;
    value: number;
    type: 'fixed' | 'variable' | 'revenue';
    percentage?: number; // For variable costs based on revenue
    note?: string;
    isEditable: boolean;
}

export interface FinancialAnalysisData {
    optimizationSuggestion: string;
    costWarning: string;
}

export interface MarketingMetric {
    label: string;
    prevValue: number;
    currValue: number;
    unit: string;
    description: string;
}

export interface AdCampaignData {
    id: string; // Added ID for editing
    kpi: string;
    octValue: number;    
    novValue: number;
    unit: 'VND' | '%' | 'count' | 'ratio';
    evaluation: string;
    isNegativeBad: boolean;
}

export interface OverviewMetricData {
    id: string;
    title: string;
    value: string; // Using string to allow free-form input like "383.2 Triệu"
    trend: string;
    trendUp: boolean;
    color: string;
    iconType: 'dollar' | 'cart' | 'users' | 'activity' | 'percent';
}

export interface ChartDataPoint {
    name: string;
    revenue: number;
    orders: number;
    customers: number;      
    marketingCost: number;   
    // New fields for Customer Analysis
    newCustomers?: number;
    oldCustomers?: number;
    oldCustomerRevenueShare?: number; // Percentage 0-100
}

// --- INTERFACE MỚI: Dữ liệu Chi phí theo Kênh Quảng cáo ---
export interface ChannelCostData {
    name: string; // Tên kênh hoặc Tháng
    revenue: number; // Doanh thu
    cost: number; // Chi phí MKT
    cpdt: number; // Tỷ lệ Chi phí / Doanh thu (%)
}

// New Interface for AI UI Control
export interface GlobalUIConfig {
    overviewTitle: string;
    marketingTitle: string;
    financialTitle: string;
}

// --- PROFILE INTERFACES ---
export interface ProfileSkill {
    id: number;
    text: string;
    style: 'default' | 'gold-text' | 'gold-fill' | 'white-fill';
}

export interface ProfileTimeline {
    id: number;
    year: string;
    role: string;
    org: string;
    desc: string;
}

export interface ProfileGallery {
    id: number;
    img: string;
    caption: string;
}

export interface ProfileData {
    name: string;
    role: string;
    intro: string;
    phone: string;
    email: string;
    website: string;
    avatar: string;
    bgImage: string;
    stats: { label: string; value: string }[];
    skills: ProfileSkill[];
    timeline: ProfileTimeline[];
    gallery: ProfileGallery[];
    media: { title: string; url: string }[];
    education: string[];
}