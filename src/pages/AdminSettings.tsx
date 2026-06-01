import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError } from "../lib/utils";
import { OperationType } from "../lib/types";
import { Plus, X, Trash2, Key } from "lucide-react";
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          {t("Admin Settings", "অ্যাডমিন সেটিংস")}
          <Key className="ml-3 text-slate-400" size={18} />
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center gap-2 transition"
          >
            <Plus size={16} /> {t("Add Admin", "অ্যাডমিন যোগ করুন")}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-w-7xl mx-auto">
          <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center text-blue-800 text-sm">
            <Key size={16} className="mr-2 shrink-0" />
            <span className="font-medium">
              {t("The root admin (pi969043@gmail.com) always has access and is not listed here unless explicitly added. Users listed here have full administrative privileges.", "মূল অ্যাডমিনের (pi969043@gmail.com) সর্বদা অ্যাক্সেস থাকে এবং স্পষ্টভাবে যোগ না করা পর্যন্ত এখানে তালিকাভুক্ত করা হয় না। এখানে তালিকাভুক্ত ব্যবহারকারীদের সম্পূর্ণ প্রশাসনিক সুবিধা রয়েছে।")}
            </span>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
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
