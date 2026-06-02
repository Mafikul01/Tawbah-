import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError } from "../lib/utils";
import { OperationType } from "../lib/types";
import { Plus, X, Trash2, Key, ShieldAlert, RefreshCw, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

interface AdminType {
  id: string;
  email: string;
  createdAt: string;
}

export default function AdminSettings() {
  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useLanguage();

  // Reset values state
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "admins")),
      (snapshot) => {
        const a: AdminType[] = [];
        snapshot.forEach((doc) =>
          a.push({ id: doc.id, ...doc.data() } as AdminType),
        );
        setAdmins(a.sort((x, y) => x.email.localeCompare(y.email)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, "admins"),
    );
    return unsub;
  }, []);

  const handleDelete = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to remove admin access for ${email}?`)) {
      try {
        await deleteDoc(doc(db, "admins", id));
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleResetAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus({ type: "", message: "" });

    const pwd = resetPassword.trim().toLowerCase();
    const conf = resetConfirm.trim().toLowerCase();

    if (pwd !== "reset") {
      setResetStatus({
        type: "error",
        message: t("Incorrect password. The password must be 'reset'.", "ভুল পাসওয়ার্ড। পাসওয়ার্ড অবশ্যই 'reset' হতে হবে।"),
      });
      return;
    }

    if (conf !== "reset") {
      setResetStatus({
        type: "error",
        message: t("Confirmation mismatch. You must write 'reset' to confirm.", "নিশ্চিতকরণের অমিল। নিশ্চিত করতে আপনাকে অবশ্যই 'reset' লিখতে হবে।"),
      });
      return;
    }

    const firstConfirm = confirm(t(
      "Are you absolutely sure you want to proceed? This will permanently delete all records of Patients, Financial logs, Staff, and Volunteers, resetting all totals and the balance sheet to zero. This action cannot be revoked!",
      "আপনি কি নিশ্চিতভাবে এগিয়ে যেতে চান? এটি রোগী, আর্থিক লগ, কর্মী এবং স্বেচ্ছাসেবীদের সমস্ত রেকর্ড স্থায়ীভাবে ডিলিট করে দেবে এবং ব্যালেন্স শিট সহ সব হিসাব শূন্যে রিসেট করবে। এই প্রক্রিয়া আর ফিরিয়ে আনা যাবে না!"
    ));

    if (!firstConfirm) return;

    const secondConfirm = confirm(t(
      "FINAL CONFIRMATION: Double check your choice. Click OK to wipe out all data.",
      "চূড়ান্ত নিশ্চিতকরণ: আপনার সিদ্ধান্তটি আবার যাচাই করুন। সব ডাটা মুছে ফেলতে OK ক্লিক করুন।"
    ));

    if (!secondConfirm) return;

    setIsResetting(true);
    try {
      const collectionsToReset = ["patients", "finances", "staff", "volunteers"];
      let deletedCount = 0;

      for (const colName of collectionsToReset) {
        const querySnapshot = await getDocs(collection(db, colName));
        for (const docSnapshot of querySnapshot.docs) {
          await deleteDoc(doc(db, colName, docSnapshot.id));
          deletedCount++;
        }
      }

      setResetStatus({
        type: "success",
        message: t(
          `Successfully reset all values to zero! Deleted ${deletedCount} records across all modules.`,
          `সাফল্যের সাথে সব মান শূন্যে রিসেট করা হয়েছে! মোট ${deletedCount}-টি রেকর্ড মুছে ফেলা হয়েছে।`
        ),
      });
      setResetPassword("");
      setResetConfirm("");
    } catch (err: any) {
      setResetStatus({
        type: "error",
        message: err.message || "An error occurred during reset.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between pl-14 pr-4 md:px-8 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
          {t("Admin Settings", "অ্যাডমিন সেটিংস")}
          <Key className="ml-2 md:ml-3 text-slate-400" size={18} />
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center gap-2 transition"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t("Add Admin", "অ্যাডমিন যোগ করুন")}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        {/* Admin Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-w-7xl mx-auto">
          <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center text-blue-800 text-sm">
            <Key size={16} className="mr-2 shrink-0" />
            <span className="font-medium">
              {t("Root administrators (tawbah.rehabcenter@gmail.com, pi969043@gmail.com) always have full access and are not listed here. Additional users listed below have been granted administrative privileges.", "মূল অ্যাডমিনদের (tawbah.rehabcenter@gmail.com, pi969043@gmail.com) সর্বদা সম্পূর্ণ অ্যাক্সেস থাকে। নিচে যুক্ত করা ব্যবহারকারীদের অতিরিক্ত প্রশাসনিক সুবিধা দেওয়া হয়েছে।")}
            </span>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">
                    {t("Email Address", "ইমেইল ঠিকানা")}
                  </th>
                  <th className="px-6 py-3 font-semibold">
                    {t("Added On", "যোগ করা হয়েছে")}
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    {t("Actions", "অ্যাকশন")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {admins.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{a.email}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs uppercase font-medium">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(a.id, a.email)}
                        className="p-2 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      {t("No additional admins created.", "কোনো অতিরিক্ত অ্যাডমিন তৈরি করা হয়নি।")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danger Zone: Reset Section */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden flex flex-col max-w-7xl mx-auto">
          <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-center text-red-800 text-sm font-semibold">
            <ShieldAlert size={18} className="mr-2 text-red-600 shrink-0" />
            <span>{t("Danger Zone: Permanent Reset", "বিপদজনক অঞ্চল: স্থায়ী রিসেট")}</span>
          </div>
          
          <div className="p-6 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed md:w-3/4">
              {t(
                "Use this feature to reset all balances, logs, patients, staff members, and volunteers back to zero. Once triggered, all data in these collections will be instantly and permanently wiped out from the live system. Only administrators can perform this action.",
                "সেন্টারের ব্যালেন্স শিট, সাম্প্রতিক আর্থিক ট্রানজেকশন লগ, রোগী, কর্মী এবং স্বেচ্ছাসেবকদের সমস্ত রেকর্ড মুছে শুন্যে নামিয়ে আনতে এই অপশনটি ব্যবহার করুন। এই প্রক্রিয়া নিশ্চিত করার সাথে সাথে পুরো লাইভ সিস্টেমের সমস্ত ডাটা চিরতরে মুছে যাবে।"
              )}
            </p>

            <form onSubmit={handleResetAllData} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide mb-2">
                  {t("Step 1: Write Password ('reset')", "ধাপ ১: পাসওয়ার্ডটি লিখুন ('reset')")}
                </label>
                <input
                  type="password"
                  required
                  placeholder='reset'
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm text-slate-800 rounded-md transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide mb-2">
                  {t("Step 2: Confirm by writing 'reset' again", "ধাপ ২: নিশ্চিতকরণ শব্দ 'reset' পুনরায় লিখুন")}
                </label>
                <input
                  type="text"
                  required
                  placeholder='reset'
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm text-slate-800 rounded-md transition"
                />
              </div>

              {resetStatus.message && (
                <div className={`md:col-span-2 p-4 rounded-lg flex items-center gap-3 text-sm border ${
                  resetStatus.type === "success" 
                    ? "bg-green-50 text-green-800 border-green-100" 
                    : "bg-red-50 text-red-800 border-red-100"
                }`}>
                  {resetStatus.type === "success" ? (
                    <CheckCircle2 className="text-green-600 shrink-0" size={18} />
                  ) : (
                    <ShieldAlert className="text-red-600 shrink-0" size={18} />
                  )}
                  <span>{resetStatus.message}</span>
                </div>
              )}

              <div className="md:col-span-2 pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isResetting || !resetPassword || !resetConfirm}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:shadow-md text-white font-semibold flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? t("Executing Reset...", "রিসেট হচ্ছে...") : t("Reset All Values to Zero", "সব রেকর্ড শূন্যে রিসেট করুন")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isModalOpen && <AdminModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function AdminModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dbId = email.trim().toLowerCase(); // Email used as ID
      const docRef = doc(db, "admins", dbId);
      const now = new Date().toISOString();

      await setDoc(docRef, {
        email: dbId,
        createdAt: now,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{t("Add Admin", "অ্যাডমিন যোগ করুন")}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 text-sm rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("User's Email Address", "ব্যবহারকারীর ইমেইল ঠিকানা")}
            </label>
            <input
              required
              type="email"
              placeholder={t("Enter email address", "ইমেইল ঠিকানা লিখুন")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
            />
            <p className="text-[10px] uppercase font-semibold text-slate-400 mt-2">
              {t("Enter the exact email address of the user you want to grant admin access to.", "আপনি যে ব্যবহারকারীকে অ্যাডমিন অ্যাক্সেস দিতে চান তার সঠিক ইমেইল ঠিকানা লিখুন।")}
            </p>
          </div>

          <div className="pt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 border border-transparent rounded-md text-sm font-semibold transition"
            >
              {t("Cancel", "বাতিল")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Grant Access", "অ্যাক্সেস প্রদান করুন")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
