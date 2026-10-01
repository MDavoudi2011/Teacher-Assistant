"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, Download, LogOut, CheckCircle2, Lock } from "lucide-react";
import { loginAction } from "./actions";

type Submission = {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  file_url: string;
  created_at: string;
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [activeClass, setActiveClass] = useState("9/1");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const classes = ["9/1", "9/2", "9/3", "9/4"];

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSubmissions();
    }
  }, [activeClass, isLoggedIn]);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('class_name', activeClass)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await loginAction(password);
    if (res.success) {
      setIsLoggedIn(true);
      sessionStorage.setItem("adminAuth", "true");
    } else {
      setError(res.error || "خطا در ورود");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("adminAuth");
  };

  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <div className="glass-panel login-box">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="login-title">ورود به پنل مدیریت</h1>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">رمز عبور</label>
              <input
                type="password"
                className="styled-input"
                placeholder="رمز عبور خود را وارد کنید..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-400 text-sm text-right mb-4">{error}</p>}
            <button type="submit" className="primary-btn">
              ورود
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="glass-panel p-8">
        <header className="header">
          <h1>داشبورد تکالیف</h1>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            خروج
          </button>
        </header>

        <div className="tabs">
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setActiveClass(cls)}
              className={`tab ${activeClass === cls ? "active" : ""}`}
            >
              کلاس {cls}
            </button>
          ))}
        </div>

        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ردیف</th>
                <th>نام و نام خانوادگی</th>
                <th>تاریخ ارسال</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <CheckCircle2 size={48} className="mx-auto" />
                      <p className="mt-4">تاکنون فایلی برای این کلاس ارسال نشده است.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((sub, index) => (
                  <tr key={sub.id}>
                    <td className="text-slate-400">{index + 1}</td>
                    <td className="font-medium text-white">{sub.first_name} {sub.last_name}</td>
                    <td className="text-slate-400" dir="ltr" style={{ textAlign: 'right' }}>
                      {new Date(sub.created_at).toLocaleString('fa-IR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <div className="action-links">
                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="action-link">
                          <Eye size={16} />
                          مشاهده
                        </a>
                        <a href={sub.file_url} download className="action-link text-purple-400 hover:text-purple-300 hover:border-purple-300/30">
                          <Download size={16} />
                          دانلود
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
