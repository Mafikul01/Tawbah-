import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { FinanceRecord, OperationType } from "../lib/types";
import { handleFirestoreError } from "../lib/utils";
import { Plus, X, Tag } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function Finances() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "finances")),
      (snapshot) => {
        const f: FinanceRecord[] = [];
        snapshot.forEach((doc) =>
          f.push({ id: doc.id, ...doc.data() } as FinanceRecord),
        );
        setRecords(f.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, "finances"),
    );
    return unsub;
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">{t("Financial Logs", "আর্থিক লগ")}</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center gap-2 transition"
          >
            <Plus size={16} /> {t("Add Record", "রেকর্ড যোগ করুন")}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-w-7xl mx-auto">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-700">{t("Recent Transactions", "সাম্প্রতিক লেনদেন")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">
                    {t("Type", "ধরন")}
                  </th>
                  <th className="px-6 py-3 font-semibold">
                    {t("Description", "বিবরণ")}
                  </th>
                  <th className="px-6 py-3 font-semibold">
                    {t("Amount", "পরিমাণ")}
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    {t("Date", "তারিখ")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider flex items-center w-fit space-x-1 ${r.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        <Tag size={12} />
                        <span>
                          {r.type === 'income' ? t('Income', 'আয়') : r.type === 'clinic_expense' ? t('Clinic Expense', 'ক্লিনিক খরচ') : t('Market Expense', 'বাজার খরচ')}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{r.description}</td>
                    <td
                      className={`px-6 py-4 font-bold ${r.type === "income" ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {r.type === "income" ? "+" : "-"}৳{r.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium text-right uppercase">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      {t("No records found.", "কোনো রেকর্ড পাওয়া যায়নি।")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && <FinanceModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function FinanceModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    type: "income",
    amount: "0",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dbId = Math.random().toString(36).substring(2, 15);
      const docRef = doc(db, "finances", dbId);
      const now = new Date().toISOString();

      await setDoc(docRef, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
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
          <h2 className="text-xl font-bold text-slate-800">{t("Add Record", "রেকর্ড যোগ করুন")}</h2>
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
              {t("Record Type", "রেকর্ডের ধরন")}
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
            >
              <option value="income">{t("Income", "আয়")}</option>
              <option value="clinic_expense">{t("Clinic Expense", "ক্লিনিক খরচ")}</option>
              <option value="market_expense">{t("Market Expense", "বাজার খরচ")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("Amount (৳)", "পরিমাণ (৳)")}
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("Description", "বিবরণ")}
            </label>
            <input
              required
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
            />
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
              {loading ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save Record", "রেকর্ড সংরক্ষণ করুন")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
