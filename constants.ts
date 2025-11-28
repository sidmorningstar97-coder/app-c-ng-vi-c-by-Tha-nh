import { Task, TaskStatus, FinancialItem, AdCampaignData, OverviewMetricData, ChartDataPoint, ChannelCostData, FinancialAnalysisData, ProfileData } from './types';
import { FunctionDeclaration, Type } from "@google/genai";

// ... (Giữ nguyên các hằng số cũ: ADMIN_TASKS, ADMIN_FINANCIALS...)
// Tôi sẽ chèn thêm INITIAL_PROFILE_DATA vào cuối file

// ============================================================================
// ADMIN DATA (ORIGINAL DATA - Dữ liệu gốc của bạn - 500M)
// ============================================================================

export const ADMIN_TASKS: Task[] = [
    {
        id: '1',
        title: 'Duyệt ngân sách Marketing T11',
        description: 'Cần xem lại chi phí Facebook Ads đang tăng cao.',
        status: TaskStatus.URGENT,
        dueDate: '2023-11-20',
        assignee: 'Giám đốc',
        progress: 80,
        members: ['Marketing Lead', 'Finance'],
        notes: 'Ưu tiên xử lý trước thứ 6'
    },
    {
        id: '2',
        title: 'Kiểm kê kho hàng Quý 4',
        description: 'Chuẩn bị cho đợt sale cuối năm.',
        status: TaskStatus.IN_PROGRESS,
        dueDate: '2023-11-25',
        assignee: 'Kho vận',
        progress: 45,
        members: ['Kho', 'Kế toán'],
        notes: 'Đang đếm khu vực A'
    },
    {
        id: '3',
        title: 'Họp chiến lược sản phẩm mới',
        description: 'Review mẫu thử từ nhà cung cấp.',
        status: TaskStatus.PENDING,
        dueDate: '2023-11-22',
        assignee: 'R&D',
        progress: 0,
        members: ['R&D', 'Sales'],
        notes: 'Chờ mẫu gửi về'
    },
    {
        id: '4',
        title: 'Tối ưu lại quy trình CSKH',
        description: 'Giảm tỷ lệ phản hồi chậm.',
        status: TaskStatus.HIGH_PRIORITY,
        dueDate: '2023-11-21',
        assignee: 'CS Team',
        progress: 20,
        members: ['CS Lead'],
        notes: 'Khách phàn nàn nhiều về inbox page'
    }
];

export const ADMIN_FINANCIALS: FinancialItem[] = [
    // Revenue
    { id: 'rev', name: 'DOANH THU', value: 500000000, type: 'revenue', isEditable: true, note: 'Thấp nhất 400tr' },
    // Variable Costs
    { id: 'v1', name: 'Giá vốn', value: 190000000, type: 'variable', percentage: 38, isEditable: true, note: '31% DT' },
    { id: 'v2', name: 'Chi phí tài trợ/đại lý/phí sàn', value: 8000000, type: 'variable', percentage: 1.6, isEditable: true, note: '0.5% DT' },
    { id: 'v3', name: 'Hoa hồng bán hàng', value: 12500000, type: 'variable', percentage: 2.5, isEditable: true, note: '2.5% DT' },
    { id: 'v4', name: 'Chi phí MTK', value: 90000000, type: 'variable', percentage: 18, isEditable: true, note: '16.25% DT' },
    { id: 'v5', name: 'Tiếp khách', value: 800000, type: 'variable', percentage: 0.16, isEditable: true, note: '0.16% DT' },
    { id: 'v6', name: 'Hủy hàng + Mẫu + Test', value: 20000000, type: 'variable', percentage: 4.00, isEditable: true, note: 'Trung bình tháng' },
    // Fixed Costs
    { id: 'f1', name: 'Chi phí lãi vay', value: 20300000, type: 'fixed', isEditable: true, note: 'Cố định' },
    { id: 'f2', name: 'Lương toàn công ty', value: 90000000, type: 'fixed', isEditable: true, note: 'Theo bảng chi tiết' },
    { id: 'f3', name: 'Bảo hiểm', value: 15738000, type: 'fixed', isEditable: true, note: 'Cố định' },
    { id: 'f4', name: 'Hành chính', value: 10000000, type: 'fixed', isEditable: true, note: 'Cố định' },
    { id: 'f5', name: 'Thuê VP', value: 35000000, type: 'fixed', isEditable: true, note: 'Cố định' },
    { id: 'f6', name: 'Điện nước VP', value: 10000000, type: 'fixed', isEditable: true, note: 'Cố định' },
];

export const ADMIN_FINANCIAL_ANALYSIS: FinancialAnalysisData = {
    optimizationSuggestion: 'Tổng chi phí đang vượt doanh thu (100.47%). Cần cắt giảm chi phí biến đổi, đặc biệt là Giá vốn (38%) và Marketing (18%).',
    costWarning: 'Cảnh báo: Công ty đang lỗ 2.338.000 VNĐ. Cần tăng doanh thu hoặc giảm định phí Lương/VP.'
};

export const ADMIN_ADS_DATA: AdCampaignData[] = [
    { id: '1', kpi: 'Doanh thu', octValue: 40000000, novValue: 20954000, unit: 'VND', evaluation: 'Giảm Gần một nửa', isNegativeBad: true },
    { id: '2', kpi: 'Chi phí chạy (Ad Spend)', octValue: 32400000, novValue: 24107000, unit: 'VND', evaluation: 'Giảm chi tiêu', isNegativeBad: false },
    { id: '3', kpi: 'Tỷ lệ Chi phí / Doanh thu', octValue: 81.00, novValue: 115.05, unit: 'ratio', evaluation: 'Tăng báo động (Lỗ)', isNegativeBad: false },
    { id: '4', kpi: 'ROAS', octValue: 1.23, novValue: 0.86, unit: 'ratio', evaluation: 'Đã chuyển sang trạng thái lỗ', isNegativeBad: true },
    { id: '5', kpi: 'Số lượng Tin nhắn (Leads)', octValue: 577, novValue: 452, unit: 'count', evaluation: 'Giảm đầu vào', isNegativeBad: true },
    { id: '6', kpi: 'CPL (Cost Per Lead)', octValue: 56152, novValue: 53334, unit: 'VND', evaluation: 'Chi phí Lead rẻ hơn', isNegativeBad: false },
    { id: '7', kpi: 'Tổng Đơn hàng (ước tính)', octValue: 36, novValue: 24, unit: 'count', evaluation: 'Đơn hàng giảm 1/3', isNegativeBad: true },
    { id: '8', kpi: 'Khách hàng Mới', octValue: 25, novValue: 11, unit: 'count', evaluation: 'Mất hơn nửa Khách hàng Mới', isNegativeBad: true },
    { id: '9', kpi: 'Khách hàng Cũ', octValue: 12, novValue: 13, unit: 'count', evaluation: 'Khách hàng Cũ ổn định', isNegativeBad: true },
    { id: '10', kpi: 'Tổng Khách hàng', octValue: 37, novValue: 24, unit: 'count', evaluation: 'Tổng khách hàng giảm mạnh', isNegativeBad: true },
    { id: '11', kpi: 'CPA (Cost Per Customer)', octValue: 875676, novValue: 1004458, unit: 'VND', evaluation: 'Chi phí mua Khách hàng ĐẮT hơn', isNegativeBad: false },
    { id: '12', kpi: 'CR (Lead → Customer)', octValue: 6.41, novValue: 5.31, unit: 'ratio', evaluation: 'Tỷ lệ chuyển đổi thấp hơn', isNegativeBad: true },
    { id: '13', kpi: 'AOV (Giá trị TB đơn)', octValue: 1110000, novValue: 873000, unit: 'VND', evaluation: 'Đơn hàng giá trị nhỏ hơn', isNegativeBad: true },
];

export const ADMIN_OVERVIEW_METRICS: OverviewMetricData[] = [
    { id: 'm1', title: 'Doanh thu Tháng 9', value: '383.2 Triệu', trend: '-28.8% vs T8', trendUp: false, color: 'text-blue-500', iconType: 'dollar' },
    { id: 'm2', title: 'Tổng đơn hàng', value: '261 Đơn', trend: '-21.1% vs T8', trendUp: false, color: 'text-purple-500', iconType: 'cart' },
    { id: 'm3', title: 'Khách hàng', value: '169 Khách', trend: '-27% vs T8', trendUp: false, color: 'text-orange-500', iconType: 'users' },
    { id: 'm4', title: 'Tỷ lệ CP/DT', value: '19.44%', trend: '+5.41% vs T8', trendUp: false, color: 'text-red-500', iconType: 'activity' },
];

export const ADMIN_CHART_DATA: ChartDataPoint[] = [
    { name: 'Tháng 7', revenue: 363000000, orders: 256, customers: 157, marketingCost: 50000000, newCustomers: 48, oldCustomers: 109, oldCustomerRevenueShare: 55 },
    { name: 'Tháng 8', revenue: 538699085, orders: 331, customers: 232, marketingCost: 75553889, newCustomers: 73, oldCustomers: 159, oldCustomerRevenueShare: 62 },
    { name: 'Tháng 9', revenue: 383210385, orders: 261, customers: 169, marketingCost: 74479565, newCustomers: 66, oldCustomers: 103, oldCustomerRevenueShare: 60 },
    { name: 'Tháng 10', revenue: 466091352, orders: 373, customers: 191, marketingCost: 75929570, newCustomers: 66, oldCustomers: 125, oldCustomerRevenueShare: 78 },
    { name: 'Tháng 11', revenue: 323267535, orders: 266, customers: 145, marketingCost: 45360057, newCustomers: 38, oldCustomers: 107, oldCustomerRevenueShare: 83 },
];

export const ADMIN_CHANNEL_COST_DATA: ChannelCostData[] = [
    { name: 'Tháng 8', revenue: 198294545, cost: 75553889, cpdt: 38.10 },
    { name: 'Tháng 9', revenue: 128126973, cost: 74479565, cpdt: 58.13 },
    { name: 'Tháng 10', revenue: 169711566, cost: 75929570, cpdt: 44.74 },
    { name: 'Tháng 11', revenue: 109244803, cost: 45360057, cpdt: 41.52 },
];

// ============================================================================
// SAMPLE DATA (USER MODE - FMCG - 1 BILLION REVENUE)
// ============================================================================

export const SAMPLE_TASKS: Task[] = [
    {
        id: 's1',
        title: 'Nhập hàng Tết Âm Lịch 2026',
        description: 'Chốt đơn đặt hàng với nhà cung cấp bánh kẹo, nước ngọt. Dự báo nhu cầu tăng 30%.',
        status: TaskStatus.URGENT,
        dueDate: '2025-12-15',
        dueTime: '17:00',
        assignee: 'Phòng Thu mua',
        progress: 30,
        members: ['Kế toán', 'Kho', 'Sales'],
        notes: 'Cần cọc trước 30%'
    },
    {
        id: 's2',
        title: 'Triển khai POSM siêu thị (5 điểm)',
        description: 'Lắp đặt kệ trưng bày, standee tại BigC, Coopmart.',
        status: TaskStatus.IN_PROGRESS,
        dueDate: '2025-12-20',
        dueTime: '09:00',
        assignee: 'Trade Marketing',
        progress: 60,
        members: ['Sales Admin'],
        notes: 'Đã nhận đủ vật phẩm, đang thi công'
    },
    {
        id: 's3',
        title: 'Mega Livestream TikTok Shop 12.12',
        description: 'Lên kịch bản, booking KOLs, setup phòng live. Mục tiêu: 200tr doanh thu/phiên.',
        status: TaskStatus.HIGH_PRIORITY,
        dueDate: '2025-12-12',
        dueTime: '19:00',
        assignee: 'Digital Team',
        progress: 10,
        members: ['Content', 'Booking', 'KOLs'],
        notes: 'Deal shock mua 1 tặng 1'
    },
    {
        id: 's4',
        title: 'Đối soát công nợ Đại lý Quý 4',
        description: 'Gửi biên bản đối chiếu cho 50 đại lý cấp 1.',
        status: TaskStatus.PENDING,
        dueDate: '2025-12-31',
        dueTime: '17:00',
        assignee: 'Kế toán công nợ',
        progress: 0,
        members: ['Sales'],
        notes: 'Thu hồi trước 5/1'
    }
];

export const SAMPLE_FINANCIALS: FinancialItem[] = [
    { id: 'rev', name: 'DOANH THU', value: 1000000000, type: 'revenue', isEditable: true, note: 'Doanh thu tháng 11 (Mục tiêu đạt)' },
    { id: 'v1', name: 'Giá vốn hàng bán (COGS)', value: 600000000, type: 'variable', percentage: 60, isEditable: true, note: '60% DT (Nhập hàng)' },
    { id: 'v2', name: 'Chi phí Marketing (Ads + Trade)', value: 150000000, type: 'variable', percentage: 15, isEditable: true, note: '15% DT (Cao do mùa sale)' },
    { id: 'v3', name: 'Vận chuyển & Fulfillment', value: 50000000, type: 'variable', percentage: 5, isEditable: true, note: '5% DT' },
    { id: 'v4', name: 'Chiết khấu đại lý', value: 30000000, type: 'variable', percentage: 3, isEditable: true, note: '3% DT' },
    { id: 'f1', name: 'Lương nhân sự (Cố định)', value: 100000000, type: 'fixed', isEditable: true, note: 'Văn phòng + Kho' },
    { id: 'f2', name: 'Thuê kho & Văn phòng', value: 40000000, type: 'fixed', isEditable: true, note: 'Cố định hàng tháng' },
    { id: 'f3', name: 'Điện, Nước, Internet, PM', value: 10000000, type: 'fixed', isEditable: true, note: 'Cố định' },
];

export const SAMPLE_FINANCIAL_ANALYSIS: FinancialAnalysisData = {
    optimizationSuggestion: 'Biên lợi nhuận gộp 40% là mức trung bình khá. Tuy nhiên, chi phí Marketing 15% đang hơi cao, nên tối ưu xuống 10-12% bằng cách tăng tỷ lệ khách hàng quay lại (Retention).',
    costWarning: 'Lợi nhuận ròng dự kiến chỉ đạt 20 triệu (2%). Mức an toàn tối thiểu là 10%. Cần kiểm soát chặt chi phí Vận chuyển và Marketing.'
};

export const SAMPLE_ADS_DATA: AdCampaignData[] = [
    { id: '1', kpi: 'Doanh thu TikTok Shop', octValue: 350000000, novValue: 420000000, unit: 'VND', evaluation: 'Tăng trưởng mạnh', isNegativeBad: true },
    { id: '2', kpi: 'Doanh thu Facebook Ads', octValue: 200000000, novValue: 180000000, unit: 'VND', evaluation: 'Giảm nhẹ do cạnh tranh', isNegativeBad: true },
    { id: '3', kpi: 'Doanh thu Shopee', octValue: 250000000, novValue: 300000000, unit: 'VND', evaluation: 'Tăng trưởng ổn định', isNegativeBad: true },
    { id: '4', kpi: 'Tổng Chi phí Ads', octValue: 120000000, novValue: 150000000, unit: 'VND', evaluation: 'Tăng chi tiêu mùa cuối năm', isNegativeBad: false },
    { id: '5', kpi: 'ROAS Trung bình', octValue: 6.6, novValue: 6.0, unit: 'ratio', evaluation: 'Hiệu quả giảm nhẹ', isNegativeBad: true },
    { id: '6', kpi: 'Số đơn hàng', octValue: 2000, novValue: 2500, unit: 'count', evaluation: 'Tăng 25%', isNegativeBad: true },
    { id: '7', kpi: 'Khách hàng mới', octValue: 1500, novValue: 1800, unit: 'count', evaluation: 'Thu hút tốt', isNegativeBad: true },
];

export const SAMPLE_OVERVIEW_METRICS: OverviewMetricData[] = [
    { id: 'm1', title: 'Doanh thu Tháng 11', value: '1.0 Tỷ', trend: '+11.1% vs T10', trendUp: true, color: 'text-blue-500', iconType: 'dollar' },
    { id: 'm2', title: 'Tổng đơn hàng', value: '2,500 Đơn', trend: '+8.7% vs T10', trendUp: true, color: 'text-purple-500', iconType: 'cart' },
    { id: 'm3', title: 'Khách hàng', value: '1,900 Khách', trend: '+11.7% vs T10', trendUp: true, color: 'text-orange-500', iconType: 'users' },
    { id: 'm4', title: 'Tỷ lệ CP/DT', value: '15.0%', trend: '+3.9% vs T10', trendUp: false, color: 'text-red-500', iconType: 'activity' },
];

export const SAMPLE_CHART_DATA: ChartDataPoint[] = [
    { name: 'Tháng 7', revenue: 800000000, orders: 2000, customers: 1500, marketingCost: 80000000, newCustomers: 400, oldCustomers: 1100, oldCustomerRevenueShare: 60 },
    { name: 'Tháng 8', revenue: 850000000, orders: 2100, customers: 1600, marketingCost: 90000000, newCustomers: 450, oldCustomers: 1150, oldCustomerRevenueShare: 62 },
    { name: 'Tháng 9', revenue: 820000000, orders: 2050, customers: 1550, marketingCost: 85000000, newCustomers: 420, oldCustomers: 1130, oldCustomerRevenueShare: 65 },
    { name: 'Tháng 10', revenue: 900000000, orders: 2300, customers: 1700, marketingCost: 100000000, newCustomers: 500, oldCustomers: 1200, oldCustomerRevenueShare: 60 },
    { name: 'Tháng 11', revenue: 1000000000, orders: 2500, customers: 1900, marketingCost: 150000000, newCustomers: 600, oldCustomers: 1300, oldCustomerRevenueShare: 58 },
];

export const SAMPLE_CHANNEL_COST_DATA: ChannelCostData[] = [
    { name: 'TikTok', revenue: 420000000, cost: 70000000, cpdt: 16.6 },
    { name: 'Facebook', revenue: 180000000, cost: 40000000, cpdt: 22.2 },
    { name: 'Shopee', revenue: 300000000, cost: 30000000, cpdt: 10.0 },
    { name: 'Offline/Đại lý', revenue: 100000000, cost: 10000000, cpdt: 10.0 },
];

export const INITIAL_PROFILE_DATA: ProfileData = {
    name: 'Nguyễn Tấn Thành',
    role: 'COO & Strategic Partner',
    intro: 'Nhà quản trị thực chiến với tư duy lai (Hybrid Mindset) giữa Vận hành, Tài chính và Marketing. "Không làm thay – nhưng làm rõ. Dẫn dắt bằng kết quả."',
    phone: '0988 675 267',
    email: 'nstanthanh@gmail.com',
    website: 'dongtrunghathaotienluat.com',
    avatar: 'https://ui-avatars.com/api/?name=Thanh+Nguyen&background=111&color=d4af37&size=400',
    bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    stats: [
        { label: 'Khách hàng', value: '55k+' },
        { label: 'Chi Phí G&A', value: '-50%' },
        { label: 'Tối ưu MKT', value: '34%' },
        { label: 'SKU Mới', value: '26+' }
    ],
    skills: [
        { id: 1, text: 'Strategic Planning', style: 'gold-text' },
        { id: 2, text: 'Retail Ops', style: 'gold-fill' },
        { id: 3, text: 'P&L Mgmt', style: 'default' },
        { id: 4, text: 'Cost Control', style: 'default' },
        { id: 5, text: 'Lark Suite', style: 'default' },
        { id: 6, text: 'AI Business', style: 'default' }
    ],
    timeline: [
        { id: 1, year: '2025 - Nay', role: 'General Manager (Project)', org: 'TIM Homes & Farm (Retreat Project)', desc: 'Quản trị trọn vòng đời dự án Retreat 3ha. Setup quy trình F&B - Farm - Lưu trú. Tối ưu Capex/Opex và xây dựng thương hiệu.' },
        { id: 2, year: '2021 - 2024', role: 'Assistant GM & COO', org: 'Dược Thảo Kim Cương Vàng Plus', desc: 'Quản lý 70+ nhân sự. Giảm 68% giá vốn (COGS) sản phẩm chủ lực. Cắt giảm 34% ngân sách Ads kém hiệu quả.' }
    ],
    gallery: [
        { id: 1, img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2273&auto=format&fit=crop', caption: 'Mô hình Retreat 3ha' },
        { id: 2, img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2340&auto=format&fit=crop', caption: 'Team 70+ Nhân sự' },
        { id: 3, img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop', caption: 'Họp chiến lược P&L' }
    ],
    media: [
        { title: 'Báo Doanh Chủ: Hành trình lãnh đạo', url: 'https://doanhchu.vn' },
        { title: 'MTV.vn: Từ nghệ sĩ đến COO', url: 'https://mtv.vn' }
    ],
    education: [
        '<strong class="text-white block text-sm mb-0.5">Professional CFO</strong> PTI School',
        '<strong class="text-white block text-sm mb-0.5">Professional CMO</strong> PTI School',
        '<strong class="text-white block text-sm mb-0.5">E-commerce Strategy</strong> CASK Academy'
    ]
};

// Fallback legacy exports
export const INITIAL_TASKS = ADMIN_TASKS;
export const INITIAL_FINANCIALS = ADMIN_FINANCIALS;
export const INITIAL_ADS_DATA = ADMIN_ADS_DATA;
export const INITIAL_OVERVIEW_METRICS = ADMIN_OVERVIEW_METRICS;
export const INITIAL_CHART_DATA = ADMIN_CHART_DATA;
export const INITIAL_CHANNEL_COST_DATA = ADMIN_CHANNEL_COST_DATA;
export const INITIAL_FINANCIAL_ANALYSIS = ADMIN_FINANCIAL_ANALYSIS;

export const AI_SYSTEM_INSTRUCTION = `
Bạn là Trợ lý Phân tích Dữ liệu Doanh nghiệp & Chuyên gia Tài chính (SME BizGuard).
QUY TẮC:
-   **Luôn ưu tiên dữ liệu trong [CONTEXT_DATA]** làm căn cứ trả lời.
-   Định dạng tiền tệ VNĐ (ví dụ: 100.000.000 đ) cho dễ đọc.
`;

export const AI_TOOLS: FunctionDeclaration[] = [
  {
    name: "update_overview_data",
    description: "Cập nhật dữ liệu biểu đồ Tổng quan.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        data: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              revenue: { type: Type.NUMBER },
              orders: { type: Type.NUMBER },
              customers: { type: Type.NUMBER },
              marketingCost: { type: Type.NUMBER },
              newCustomers: { type: Type.NUMBER },
              oldCustomers: { type: Type.NUMBER },
              oldCustomerRevenueShare: { type: Type.NUMBER }
            },
            required: ["name", "revenue", "orders", "customers", "marketingCost"]
          }
        }
      },
      required: ["data"]
    }
  },
  {
    name: "update_channel_cost_data",
    description: "Cập nhật bảng hiệu quả Kênh Quảng Cáo.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            data: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        revenue: { type: Type.NUMBER },
                        cost: { type: Type.NUMBER },
                        cpdt: { type: Type.NUMBER }
                    },
                    required: ["name", "revenue", "cost", "cpdt"]
                }
            }
        },
        required: ["data"]
    }
  },
  {
    name: "update_marketing_data",
    description: "Cập nhật bảng so sánh chỉ số Marketing.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              kpi: { type: Type.STRING },
              octValue: { type: Type.NUMBER },
              novValue: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              evaluation: { type: Type.STRING },
              isNegativeBad: { type: Type.BOOLEAN }
            },
            required: ["kpi", "octValue", "novValue"]
          }
        }
      },
      required: ["items"]
    }
  },
  {
    name: "update_financial_data",
    description: "Cập nhật bảng Chi phí & Doanh thu.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.NUMBER },
              type: { type: Type.STRING },
              note: { type: Type.STRING }
            },
            required: ["name", "value", "type"]
          }
        }
      },
      required: ["items"]
    }
  },
  {
    name: "update_financial_analysis",
    description: "Cập nhật phần phân tích AI cho bảng Tài chính.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        optimizationSuggestion: { type: Type.STRING },
        costWarning: { type: Type.STRING }
      },
      required: ["optimizationSuggestion", "costWarning"]
    }
  },
  {
    name: "update_ui_titles",
    description: "Thay đổi tiêu đề của các trang dashboard.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        overviewTitle: { type: Type.STRING },
        marketingTitle: { type: Type.STRING },
        financialTitle: { type: Type.STRING }
      }
    }
  }
];