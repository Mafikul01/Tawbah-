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
import { Volunteer, OperationType } from "../lib/types";
import { handleFirestoreError } from "../lib/utils";
import { Plus, X, Edit, Heart } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(
    null,
  );
  const { t } = useLanguage();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "volunteers")),
      (snapshot) => {
        const v: Volunteer[] = [];
        snapshot.forEach((doc) =>
          v.push({ id: doc.id, ...doc.data() } as Volunteer),
        );
        setVolunteers(v.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, "volunteers"),
    );
    return unsub;
  }, []);

  const openNewModal = () => {
    setEditingVolunteer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Volunteer) => {
    setEditingVolunteer(v);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between pl-14 pr-4 md:px-8 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
          {t("Volunteers", "স্বেচ্ছাসেবক")}
          <Heart className="ml-2 md:ml-3 text-red-500" size={18} />
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={openNewModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center gap-2 transition"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t("Add Volunteer", "স্বেচ্ছাসেবক যোগ করুন")}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-w-7xl mx-auto">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-700">{t("Volunteer Roster", "স্বেচ্ছাসেবক তালিকা")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">
                    {t("Name", "নাম")}
                  </th>
                  <th className="px-6 py-3 font-semibold">
                    {t("Contact", "যোগাযোগ")}
                  </th>
                  <th className="px-6 py-3 font-semibold">
                    {t("National ID", "জাতীয় পরিচয়পত্র")}
                  </th>
                  <th className="px-6 py-3 font-semibold">
                    {t("Join Date", "যোগদানের তারিখ")}
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    {t("Actions", "অ্যাকশন")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {volunteers.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{v.name}</div>
                      <div className="text-xs text-slate-500">{v.address}</div>
                    </td>
                    <td className="px-6 py-4">{v.phone}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {v.nationalId}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(v)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {volunteers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      {t("No volunteers recorded.", "কোনো স্বেচ্ছাসেবক পাওয়া যায়নি।")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <VolunteerModal
          volunteer={editingVolunteer}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function VolunteerModal({
  volunteer,
  onClose,
}: {
  volunteer: Volunteer | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: volunteer?.name || "",
    phone: volunteer?.phone || "",
    address: volunteer?.address || "",
    nationalId: volunteer?.nationalId || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dbId = volunteer?.id || Math.random().toString(36).substring(2, 15);
      const docRef = doc(db, "volunteers", dbId);
      const isUpdate = !!volunteer;
      const now = new Date().toISOString();

      if (isUpdate) {
        await updateDoc(docRef, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          nationalId: formData.nationalId,
        });
      } else {
        await setDoc(docRef, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          nationalId: formData.nationalId,
          createdAt: now,
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
            {volunteer ? t("Edit Volunteer", "স্বেচ্ছাসেবক সম্পাদনা") : t("Add Volunteer", "স্বেচ্ছাসেবক যোগ করুন")}
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
              {t("National ID Number", "জাতীয় পরিচয়পত্র নম্বর")}
            </label>
            <input
              required
              type="text"
              value={formData.nationalId}
              onChange={(e) =>
                setFormData({ ...formData, nationalId: e.target.value })
              }
              className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
            />
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
              {loading ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save Volunteer", "স্বেচ্ছাসেবক সংরক্ষণ করুন")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
