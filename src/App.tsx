import { HashRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  Menu,
  X,
  AlertTriangle,
  Copy,
  ExternalLink,
  Lock,
  Mail,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  // Authentication configuration and troubleshooting states
  const [loginTab, setLoginTab] = useState<"google" | "email">("google");
  const [emailForm, setEmailForm] = useState("");
  const [passwordForm, setPasswordForm] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Process the redirect result on mount if available
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect login error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && user.email) {
        const emailLower = user.email.toLowerCase();
        if (emailLower === "pi969043@gmail.com" || emailLower === "tawbah.rehabcenter@gmail.com") {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, "admins", emailLower));
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
    const handleGoogleLogin = async () => {
      setAuthError(null);
      setAuthFeedback(null);
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          await signInWithRedirect(auth, new GoogleAuthProvider());
        } else {
          await signInWithPopup(auth, new GoogleAuthProvider());
        }
      } catch (error: any) {
        console.error("Google Login failed", error);
        if (error.code !== "auth/popup-closed-by-user") {
          let msg = error.message;
          if (error.code === "auth/unauthorized-domain" || msg.toLowerCase().includes("domain") || msg.toLowerCase().includes("authorized")) {
            msg = t(
              `This website domain is not authorized for Google Sign-In yet. Please add "${window.location.hostname}" to your Firebase Console under Authentication > Settings > Authorized Domains, or switch to the Email & Password tab below.`,
              `এই ওয়েবসাইট ডোমেইনটি গুগল সাইন-ইনের জন্য অনুমোদিত নয়। দয়া করে আপনার ফায়ারবেস কনসোলে (Authentication > Settings > Authorized Domains) "${window.location.hostname}" ডোমেইনটি যুক্ত করুন, অথবা নিচের ইমেইল ও পাসওয়ার্ড ট্যাবটি ব্যবহার করুন।`
            );
          }
          setAuthError(msg);
        }
      }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      setAuthFeedback(null);

      if (!emailForm || !passwordForm) {
        setAuthError(t("Please fill in all fields.", "দয়া করে সবগুলো ঘর পূরণ করুন।"));
        return;
      }

      const isRootAdmin = emailForm.toLowerCase() === "tawbah.rehabcenter@gmail.com";

      try {
        if (isSignUp) {
          await createUserWithEmailAndPassword(auth, emailForm, passwordForm);
          setAuthFeedback(t("Account created successfully! Logging you in...", "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! সিস্টেমে প্রবেশ করা হচ্ছে..."));
        } else {
          try {
            await signInWithEmailAndPassword(auth, emailForm, passwordForm);
            setAuthFeedback(t("Successfully signed in!", "সফলভাবে সাইন-ইন করা হয়েছে!"));
          } catch (innerError: any) {
            // Auto register the root admin on discovery if they provide our requested default setup password
            if (isRootAdmin && passwordForm === "TawbahAdmin2026!" && (innerError.code === "auth/user-not-found" || innerError.code === "auth/invalid-credential")) {
              await createUserWithEmailAndPassword(auth, emailForm, passwordForm);
              setAuthFeedback(t("One-time Administrator account activated and signed in successfully!", "মূল অ্যাডমিন অ্যাকাউন্ট সফলভাবে অ্যাক্টিভেট ও সাইন-ইন করা হয়েছে!"));
            } else {
              throw innerError;
            }
          }
        }
      } catch (error: any) {
        console.error("Email login failed", error);
        let errorMsg = error.message;
        if (error.code === "auth/email-already-in-use") {
          errorMsg = t("This email is already registered. Please sign in instead.", "এই ইমেইলটি ইতিপূর্বে নিবন্ধিত হয়েছে। অনুগ্রহ করে সাইন-ইন করুন।");
        } else if (error.code === "auth/wrong-password") {
          errorMsg = t("Incorrect password. Please try again.", "ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।");
        } else if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
          errorMsg = t("Incorrect password or user not found. For first-time administrator login, enter the direct password provided.", "ভুল পাসওয়ার্ড বা ব্যবহারকারী পাওয়া যায়নি। প্রথমবার অ্যাডমিন লগইনের জন্য নির্ধারিত পাসওয়ার্ডটি ব্যবহার করুন।");
        } else if (error.code === "auth/weak-password") {
          errorMsg = t("Password should be at least 6 characters.", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
        } else if (error.code === "auth/invalid-email") {
          errorMsg = t("Invalid email formatted username. Please check spelling.", "ভুল ইমেইল ফরম্যাট। দয়া করে বানান চেক করুন।");
        }
        setAuthError(errorMsg);
      }
    };

    const handleCopyDomain = () => {
      navigator.clipboard.writeText(window.location.hostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const isDomainError = authError && (authError.includes("domain") || authError.includes("ডোমেইন") || authError.includes("unauthorized"));

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-8 overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-4 text-center">
            <img src="https://i.imgur.com/xcvaY6b.png" alt="Tawbah Rehab Center" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {t("Tawbah Rehab Center System", "তাওবাহ রিহ্যাব সেন্টার সিস্টেম")}
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-sans">
              {t("Secure Rehab Management Portal", "নিরাপদ রিহ্যাব ম্যানেজমেন্ট পোর্টাল")}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 px-6">
            <button
              onClick={() => {
                setLoginTab("google");
                setAuthError(null);
                setAuthFeedback(null);
              }}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                loginTab === "google"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("Google Sign-In", "গুগল সাইন-ইন")}
            </button>
            <button
              onClick={() => {
                setLoginTab("email");
                setAuthError(null);
                setAuthFeedback(null);
              }}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                loginTab === "email"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("Email & Password", "ইমেইল ও পাসওয়ার্ড")}
            </button>
          </div>

          {/* Form / Actions */}
          <div className="p-8 pt-6 space-y-5">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 flex gap-2.5 items-start">
                <AlertTriangle className="shrink-0 mt-0.5" size={15} />
                <div className="leading-relaxed font-medium">
                  {authError}
                </div>
              </div>
            )}

            {authFeedback && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl p-3 text-center">
                {authFeedback}
              </div>
            )}

            {loginTab === "google" ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  {t(
                    "Sign in securely using any registered Google account.",
                    "যেকোনো নিবন্ধিত গুগল অ্যাকাউন্ট ব্যবহার করে নিরাপদে সাইন ইন করুন।"
                  )}
                </p>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.745-.08-1.32-.176-1.886H12.24z" />
                  </svg>
                  {t("Sign in with Google", "গুগল দিয়ে সাইন ইন করুন")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 matches-label">
                    {t("Email address", "ইমেইল অ্যাড্রেস")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <input
                      type="email"
                      value={emailForm}
                      onChange={(e) => setEmailForm(e.target.value)}
                      placeholder="tawbah.rehabcenter@gmail.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-5 middle text-slate-800 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 matches-label">
                    {t("Password", "পাসওয়ার্ড")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <input
                      type="password"
                      value={passwordForm}
                      onChange={(e) => setPasswordForm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-5 text-slate-800 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm hover:shadow active:scale-[0.99] cursor-pointer text-sm uppercase"
                >
                  {isSignUp ? t("Create Account & Sign In", "অ্যাকাউন্ট তৈরি ও লগ-ইন করুন") : t("Sign In", "সাইনিং ইন করুন")}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthError(null);
                      setAuthFeedback(null);
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    {isSignUp
                      ? t("Already have an account? Sign In", "ইতিপূর্বে অ্যাকাউন্ট আছে? সাইন-ইন করুন")
                      : t("Need to register your email? Sign Up / Register", "নতুন ইমেইল রেজিস্টার করবেন? সাইন-আপ করুন")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Dynamic Troubleshooting Guide Cards */}
        <div className="max-w-md w-full mt-6 space-y-4">
          {/* Email/Password Setup Helper */}
          {loginTab === "email" && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 text-xs text-amber-900 leading-relaxed space-y-2">
              <h3 className="font-bold flex items-center gap-2 text-amber-950">
                <Lock size={14} className="text-amber-700" />
                {t("Bypass Website Restriction Instantly", "তাত্ক্ষণিক সাইন-ইন করার সুবিধা")}
              </h3>
              <p>
                {t(
                  "Email & Password login completely bypasses Google's domain restrictions. You can sign in from any PC or laptop immediately.",
                  "ইমেইল ও পাসওয়ার্ড লগইন গুগল এর ডোমেইন নিষেধাজ্ঞা সম্পূর্ণভাবে এড়িয়ে চলে। আপনি যেকোনো ল্যাপটপ বা পিসি থেকে এখনই সরাসরি সংযোগ করতে পারবেন।"
                )}
              </p>
              <p className="bg-amber-100/50 p-2 rounded border border-amber-200/50">
                <strong>{t("Admin One-Time Password Access", "অ্যাডমিন ওয়ান-টাইম পাসওয়ার্ড")}:</strong> <br />
                {t(
                  "Simply enter the email 'tawbah.rehabcenter@gmail.com' and type the one-time setup password 'TawbahAdmin2026!' above to register and sign in instantly. This account grants default Admin credentials automatically!",
                  "সহজেই উপরে ইমেইল 'tawbah.rehabcenter@gmail.com' এবং ওয়ান-টাইম সেটআপ পাসওয়ার্ড 'TawbahAdmin2026!' টাইপ করে সরাসরি সাইন-ইন করুন। এটি স্বয়ংক্রিয়ভাবে মূল অ্যাডমিন অ্যাক্সেস প্রদান করবে।"
                )}
              </p>
            </div>
          )}

          {/* Google Auth Domain Error Card */}
          {(loginTab === "google" || isDomainError) && (
            <div className="bg-sky-50/90 border border-sky-100 rounded-xl p-5 text-xs text-slate-600 leading-relaxed space-y-3 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 text-sky-950 text-[13px]">
                <AlertTriangle size={15} className="text-sky-600 animate-pulse" />
                {t("Why does PC Login show a Domain restriction?", "ল্যাপটপ বা পিসিতে ডোমেইন ডিরেক্টরি সমস্যাটি কেন হয়?")}
              </h3>
              <p>
                {t(
                  "Google Secure authentication blocks requests from new website addresses unless they are added to your Firebase project config.",
                  "গুগল সিকিউর লগইন নতুন কোনো ওয়েবসাইট ঠিকানা বা লিংক থেকে রিকোয়েস্ট ফিরিয়ে দেয় যদি না সেটি ফায়ারবেস অথরাইজড ডোমেইন তালিকায় নিবন্ধিত থাকে।"
                )}
              </p>
              
              <div className="bg-white border border-sky-200 rounded-lg p-3.5 space-y-2.5">
                <p className="font-semibold text-slate-800">
                  {t("How to authorize this computer/laptop instantly:", "কিভাবে সহজেই ১ মিনিটে সমাধান করবেন:")}
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-700">
                  <li>
                    {t("Copy this laptop's website domain link below:", "নিচে থাকা আপনার এই ল্যাপটপের অরিজিনাল লিংকটি কপি করুন:")}
                  </li>
                  <div className="flex gap-2 items-center bg-slate-50 p-1.5 pl-2.5 rounded border border-slate-200 font-mono text-[10px] text-blue-600">
                    <span className="truncate select-all">{window.location.hostname}</span>
                    <button
                      onClick={handleCopyDomain}
                      className="ml-auto p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded transition shrink-0 cursor-pointer"
                      title={t("Copy Domain Link", "ডোমেইন লিংক কপি করুন") as string}
                    >
                      {copied ? t("Copied!", "কপি হয়েছে!") : <Copy size={12} />}
                    </button>
                  </div>
                  <li>
                    Go to your {" "}
                    <a
                      href={`https://console.firebase.google.com/u/0/project/gen-lang-client-0073319574/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold underline inline-flex items-center gap-0.5"
                    >
                      Firebase Console settings <ExternalLink size={10} />
                    </a>
                  </li>
                  <li>
                    Scroll down to <strong>{t("Authorized Domains", "Authorized Domains")}</strong> and click <strong>{t("Add Domain", "Add Domain")}</strong>.
                  </li>
                  <li>
                    {t("Paste the link and save! Refresh this login page and click 'Sign in with Google' to access.", "কপি করা লিংকটি পেস্ট করে সেভ করুন! এরপর এই পেজটি রিফ্রেশ দিয়ে গুগলে ক্লিক করলেই লগইন হয়ে যাবে।")}
                  </li>
                </ol>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                {t("💡 Pro-Tip: Skip all of this by using the 'Email & Password' tab!", "💡 প্রো-টিপ: কোনো রকম ডোমেইন সেটিংস ছাড়াই ঝামেলাহীন লগইন করতে 'Email & Password' ট্যাবটি ব্যবহার করুন!")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="https://i.imgur.com/xcvaY6b.png" alt="Tawbah Rehab Center" className="w-10 h-10 object-contain rounded-sm bg-white" />
              <span className="font-bold tracking-tight text-lg">{t("Tawbah Rehab Center", "তাওবাহ রিহ্যাব সেন্টার")}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">{t("Main Menu", "প্রধান মেনু")}</div>
            <NavItem
              to="/"
              icon={<LayoutDashboard size={20} />}
              label={t("Dashboard Overview", "ড্যাশবোর্ড ওভারভিউ") as string}
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/patients"
              icon={<Users size={20} />}
              label={t("Patient Directory", "রোগী ডিরেক্টরি") as string}
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              to="/finances"
              icon={<DollarSign size={20} />}
              label={t("Financial Logs", "আর্থিক লগ") as string}
              onClick={() => setSidebarOpen(false)}
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
                  onClick={() => setSidebarOpen(false)}
                />
                <NavItem
                  to="/volunteers"
                  icon={<UserCheck size={20} />}
                  label={t("Volunteers", "স্বেচ্ছাসেবক") as string}
                  onClick={() => setSidebarOpen(false)}
                />
                <NavItem
                  to="/settings"
                  icon={<Settings size={20} />}
                  label={t("Admin Settings", "অ্যাডমিন সেটিংস") as string}
                  onClick={() => setSidebarOpen(false)}
                />
              </>
            )}
          </nav>
          <div className="px-6 py-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-1.5 text-slate-400">
              <Languages size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t("System Language", "সিস্টেম ভাষা")}</span>
            </div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-md py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="bn">বাংলা (Bengali)</option>
              <option value="en">English (ইংরেজি)</option>
            </select>
          </div>
          <div className="p-4 border-t border-slate-800 flex items-center justify-between px-2">
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
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <button 
            className="lg:hidden absolute top-3 left-3 md:top-5 md:left-4 z-40 p-1.5 bg-white rounded-md shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard isAdmin={isAdmin} />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/finances" element={<Finances />} />
              {isAdmin && <Route path="/staff" element={<Staff />} />}
              {isAdmin && <Route path="/volunteers" element={<Volunteers />} />}
              {isAdmin && <Route path="/settings" element={<AdminSettings />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
}

function NavItem({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
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
