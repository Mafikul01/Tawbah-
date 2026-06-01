import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Patient, OperationType } from "../lib/types";
import { handleFirestoreError } from "../lib/utils";
import { Plus, X, Edit, Trash2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "patients")),
      (snapshot) => {
        const p: Patient[] = [];
        snapshot.forEach((doc) =>
          p.push({ id: doc.id, ...doc.data() } as Patient),
        );
        setPatients(p.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, "patients"),
    );
    return unsub;
  }, []);

  const openNewModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Patient) => {
    setEditingPatient(p);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">{t("Patient Directory", "রোগী ডিরেক্টরি")}</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={openNewModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center gap-2"
          >
            <Plus size={16} /> {t("Add New Patient", "নতুন রোগী যোগ করুন")}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-w-7xl mx-auto">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">{t("All Patients", "সকল রোগী")}</h3>
            <span className="text-xs text-slate-500 font-medium">{t("Total", "মোট")}: {patients.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">
                    {t("Name", "নাম")}
                  </th>
                  <th className="px-6 py-3 font-semibold">
                    {t("Phone", "ফোন")}
                  </th>
                  <th className="px-6 py-3 font-semibold">
                    {t("Status", "স্ট্যাটাস")}
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    {t("Fee Paid", "ফি প্রদান")}
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    {t("Actions", "অ্যাকশন")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.address}</div>
                    </td>
                    <td className="px-6 py-4">{p.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${p.status === "admitted" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {p.status === "admitted" ? t("Admitted", "ভর্তি") : t("Discharged", "রিলিজ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">৳{p.fee.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      {t("No patients found.", "কোনো রোগী পাওয়া যায়নি।")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <PatientModal
          patient={editingPatient}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function PatientModal({
  patient,
  onClose,
}: {
  patient: Patient | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: patient?.name || "",
    phone: patient?.phone || "",
    address: patient?.address || "",
    fee: patient?.fee?.toString() || "0",
    status: patient?.status || "admitted",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dbId = patient?.id || Math.random().toString(36).substring(2, 15);
      const docRef = doc(db, "patients", dbId);
      const isUpdate = !!patient;
      const now = new Date().toISOString();

      if (isUpdate) {
        await updateDoc(docRef, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          fee: parseFloat(formData.fee),
          status: formData.status,
          updatedAt: now,
        });
      } else {
        await setDoc(docRef, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          fee: parseFloat(formData.fee),
          status: formData.status,
          createdAt: now,
          updatedAt: now,
        });
      }
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
          <h2 className="text-xl font-bold text-slate-800">
            {patient ? t("Edit Patient", "রোগী সম্পাদনা") : t("Add New Patient", "নতুন রোগী যোগ করুন")}
          </h2>
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
              {t("Full Name", "পুরো নাম")}
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t("Phone Number", "ফোন নম্বর")}
              </label>
              <input
                required
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t("Fee Amount (৳)", "ফি এর পরিমাণ (৳)")}
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.fee}
                onChange={(e) =>
                  setFormData({ ...formData, fee: e.target.value })
                }
                className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("Address", "ঠিকানা")}
            </label>
            <input
              required
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("Status", "স্ট্যাটাস")}
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
            >
              <option value="admitted">{t("Admitted", "ভর্তি")}</option>
              <option value="discharged">{t("Discharged", "রিলিজ")}</option>
            </select>
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
              {loading ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save Patient", "রোগী সংরক্ষণ করুন")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
