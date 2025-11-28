import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ShieldCheck, TrendingUp, Users, Activity, Lock, Mail, AlertTriangle, Info, ExternalLink } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user'); // Toggle mode
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Admin credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
                setError("Lỗi cấu hình: Google Sign-in chưa được BẬT trong Firebase Console (Authentication > Sign-in method).");
            } else if (err.code === 'auth/unauthorized-domain') {
                setError(`LỖI TÊN MIỀN: Tên miền hiện tại (${window.location.hostname}) chưa được phép. Hãy vào Firebase Console > Authentication > Settings > Authorized domains và thêm tên miền này vào.`);
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError("Bạn đã đóng cửa sổ đăng nhập.");
            } else {
                setError(`Đăng nhập thất bại: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error("Admin Login Error:", err);
            
            // Các mã lỗi thường gặp
            const isUserNotFound = err.code === 'auth/user-not-found';
            const isWrongPassword = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password';

            if (isUserNotFound) {
                 // Tài khoản chưa có -> Tạo mới
                 if (email === 'admin@bizguard.com') {
                     try {
                         await createUserWithEmailAndPassword(auth, email, password);
                         return; // Success -> Auto login
                     } catch (createErr: any) {
                         setError(`Không thể tạo Admin: ${createErr.message}`);
                     }
                 } else {
                     setError("Tài khoản không tồn tại.");
                 }
            } else if (isWrongPassword) {
                // Tài khoản có nhưng sai pass
                if (email === 'admin@bizguard.com') {
                    setError("Sai mật khẩu! Nếu bạn quên, hãy vào Firebase Console > Authentication > Users và XÓA tài khoản admin@bizguard.com đi, sau đó đăng nhập lại để hệ thống tự tạo mới.");
                } else {
                    setError("Email hoặc mật khẩu không đúng.");
                }
            } else if (err.code === 'auth/operation-not-allowed') {
                setError("LỖI CẤU HÌNH: Bạn chưa bật 'Email/Password' trong Firebase Console.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Quá nhiều lần thử thất bại. Vui lòng thử lại sau ít phút.");
            } else {
                setError(`Lỗi: ${err.code} - ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
                
                {/* Left Side: Brand & Info */}
                <div className="md:w-1/2 bg-slate-50 p-8 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <span className="font-bold text-xl">SB</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">BizGuard</h1>
                        </div>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            Hệ thống quản trị doanh nghiệp SME toàn diện. Quản lý Tài chính, Marketing và Vận hành trên một nền tảng duy nhất.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp className="w-5 h-5" /></div>
                            <span className="font-medium">Theo dõi hiệu quả kinh doanh</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Activity className="w-5 h-5" /></div>
                            <span className="font-medium">Phân tích tài chính & P&L</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Users className="w-5 h-5" /></div>
                            <span className="font-medium">Quản lý nhân sự & công việc</span>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-200">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4" /> Dữ liệu được mã hóa và bảo mật an toàn.
                        </p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Chào mừng trở lại!</h2>
                        <div className="flex justify-center gap-4 text-sm font-medium border-b border-slate-100 pb-2 mb-4">
                            <button 
                                onClick={() => { setLoginMode('user'); setError(null); }}
                                className={`pb-2 px-2 transition-colors ${loginMode === 'user' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Người dùng
                            </button>
                            <button 
                                onClick={() => { setLoginMode('admin'); setError(null); }}
                                className={`pb-2 px-2 transition-colors ${loginMode === 'admin' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Quản trị viên
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span className="break-words w-full">{error}</span>
                        </div>
                    )}

                    {loginMode === 'user' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <div className="flex gap-2 text-blue-800 font-semibold text-sm mb-1">
                                    <Info className="w-4 h-4" /> Dành cho người dùng mới
                                </div>
                                <p className="text-xs text-blue-600">Đăng nhập để trải nghiệm dữ liệu mẫu ngành hàng tiêu dùng (FMCG).</p>
                            </div>
                            <button 
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                        <span>Tiếp tục với Google</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                    <input 
                                        type="email"
                                        required
                                        className="w-full border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                                        placeholder="admin@bizguard.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                    <input 
                                        type="password"
                                        required
                                        className="w-full border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span>Đăng nhập Admin</span>
                                )}
                            </button>
                            <div className="text-center text-xs text-slate-400 mt-2">
                                <p>*Nếu đăng nhập thất bại do sai mật khẩu, vui lòng XÓA user trong Firebase để tạo lại.</p>
                            </div>
                        </form>
                    )}

                    <div className="mt-8 text-center border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-400">
                            Bằng việc đăng nhập, bạn đồng ý với <a href="#" className="text-blue-600 hover:underline">Điều khoản dịch vụ</a> của BizGuard.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;