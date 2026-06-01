import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import {
  LayoutDashboard,
  Users,
  UserCog,
  UserCheck,
  DollarSign,
  LogOut,
  Settings,
  Languages,
} from "lucide-react";
import { useLanguage } from "./lib/LanguageContext";

import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Finances from "./pages/Finances";
import Staff from "./pages/Staff";
import Volunteers from "./pages/Volunteers";
import AdminSettings from "./pages/AdminSettings";

function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && user.email) {
        if (user.email === "pi969043@gmail.com") {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, "admins", user.email!.toLowerCase()));
            setIsAdmin(adminDoc.exists());
          } catch (e) {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user || !user.email) {
    const handleLogin = async () => {
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (error) {
        console.error("Login failed", error);
      }
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 font-sans">
            {t("Nexus Clinic System", "নেক্সাস ক্লিনিক সিস্টেম")}
          </h1>
          <p className="text-slate-600 mb-8 font-sans">
            {t("Please sign in to access the system.", "সিস্টেমে অ্যাক্সেস করতে অনুগ্রহ করে সাইন ইন করুন।")}
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
          >
            {t("Sign in with Google", "গুগল দিয়ে সাইন ইন করুন")}
          </button>
          <div className="mt-6 flex justify-center space-x-4 text-sm text-slate-500">
            <button onClick={() => setLang('en')} className={`hover:text-slate-900 ${lang === 'en' ? 'font-bold text-slate-900' : ''}`}>EN</button>
            <button onClick={() => setLang('bn')} className={`hover:text-slate-900 ${lang === 'bn' ? 'font-bold text-slate-900' : ''}`}>BN</button>
            <button onClick={() => setLang('both')} className={`hover:text-slate-900 ${lang === 'both' ? 'font-bold text-slate-900' : ''}`}>Both</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        <aside className="w-64 bg-slate-900 text-white flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center font-bold text-xl">C</div>
              <span className="font-bold tracking-tight text-lg">{t("Nexus Clinic", "নেক্সাস ক্লিনিক")}</span>
            </div>
          </div>
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">{t("Main Menu", "প্রধান মেনু")}</div>
            <NavItem
              to="/"
              icon={<LayoutDashboard size={20} />}
              label={t("Dashboard Overview", "ড্যাশবোর্ড ওভারভিউ") as string}
            />
            <NavItem
              to="/patients"
              icon={<Users size={20} />}
              label={t("Patient Directory", "রোগী ডিরেক্টরি") as string}
            />
            <NavItem
              to="/finances"
              icon={<DollarSign size={20} />}
              label={t("Financial Logs", "আর্থিক লগ") as string}
            />

            {isAdmin && (
              <>
                <div className="px-6 pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  {t("Administration", "প্রশাসন")}
                </div>
                <NavItem
                  to="/staff"
                  icon={<UserCog size={20} />}
                  label={t("Staff", "কর্মী") as string}
                />
                <NavItem
                  to="/volunteers"
                  icon={<UserCheck size={20} />}
                  label={t("Volunteers", "স্বেচ্ছাসেবক") as string}
                />
                <NavItem
                  to="/settings"
                  icon={<Settings size={20} />}
                  label={t("Admin Settings", "অ্যাডমিন সেটিংস") as string}
                />
              </>
            )}
          </nav>
          <div className="p-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg">
               <Languages size={14} />
               <button onClick={() => setLang('en')} className={`hover:text-white px-1 ${lang === 'en' ? 'text-white font-bold' : ''}`}>EN</button>
               <span>|</span>
               <button onClick={() => setLang('bn')} className={`hover:text-white px-1 ${lang === 'bn' ? 'text-white font-bold' : ''}`}>BN</button>
               <span>|</span>
               <button onClick={() => setLang('both')} className={`hover:text-white px-1 ${lang === 'both' ? 'text-white font-bold' : ''}`}>Both</button>
            </div>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 font-medium">
                  {user.email?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div>
                  <p className="text-sm font-medium truncate max-w-[100px]">{isAdmin ? 'Admin' : 'User'}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[100px]" title={user.email || ''}>{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="text-slate-500 hover:text-white transition p-2 cursor-pointer"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard isAdmin={isAdmin} />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/finances" element={<Finances />} />
            {isAdmin && <Route path="/staff" element={<Staff />} />}
            {isAdmin && <Route path="/volunteers" element={<Volunteers />} />}
            {isAdmin && <Route path="/settings" element={<AdminSettings />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-6 py-3 transition ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:text-white"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default App;
