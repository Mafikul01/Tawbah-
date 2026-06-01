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
import { Plus, X, Edit, Trash2, Eye, Phone, MapPin, User, Calendar, ExternalLink } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
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

  const dischargePatient = async (p: Patient) => {
    if (confirm(t("Are you sure you want to discharge this patient?", "আপনি কি নিশ্চিত যে আপনি এই রোগীকে রিলিজ করতে চান?"))) {
      try {
        await updateDoc(doc(db, "patients", p.id), {
          status: "discharged",
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error as any, OperationType.UPDATE, "patients");
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between pl-14 pr-4 md:px-8 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">{t("Patient Directory", "রোগী ডিরেক্টরি")}</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={openNewModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold flex items-center gap-2"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t("Add New Patient", "নতুন রোগী যোগ করুন")}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("Admitted", "ভর্তি আছে")}</p>
             <p className="text-2xl font-bold mt-1 text-blue-600">{patients.filter(p => p.status === 'admitted').length}</p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("Discharged", "রিলিজ হয়েছে")}</p>
             <p className="text-2xl font-bold mt-1 text-slate-800">{patients.filter(p => p.status === 'discharged').length}</p>
           </div>
           <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
             <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{t("Total Expected", "মোট প্রত্যাশিত")}</p>
             <p className="text-2xl font-bold mt-1 text-emerald-700">৳{patients.reduce((sum, p) => sum + (p.totalFee || 0), 0).toFixed(2)}</p>
           </div>
           <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-100">
             <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">{t("Total Due", "মোট বকেয়া")}</p>
             <p className="text-2xl font-bold mt-1 text-red-500">৳{(patients.reduce((sum, p) => sum + (p.totalFee || 0), 0) - patients.reduce((sum, p) => sum + ((p.installment1 || 0) + (p.installment2 || 0) + (p.installment3 || 0) || p.fee || 0), 0)).toFixed(2)}</p>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-w-7xl mx-auto">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">{t("All Patients", "সকল রোগী")}</h3>
            <span className="text-xs text-slate-500 font-medium">{t("Total", "মোট")}: {patients.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
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
                    {t("Total Fee", "মোট ফি")}
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    {t("Paid", "প্রদানকৃত")}
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    {t("Due", "বকেয়া")}
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
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setViewingPatient(p)}
                        title={t("Click to view details", "বিস্তারিত দেখতে ক্লিক করুন") as string}
                      >
                        {p.photo ? (
                          <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:border-blue-500 transition-colors" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold group-hover:bg-blue-200 transition-colors">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</div>
                          {p.guardianName && <div className="text-xs text-slate-500">{t("Guardian", "অভিভাবক")}: {p.guardianName}</div>}
                          <div className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">{p.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{p.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${p.status === "admitted" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {p.status === "admitted" ? t("Admitted", "ভর্তি") : t("Discharged", "রিলিজ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      ৳{((p.totalFee) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      ৳{((p.installment1 || 0) + (p.installment2 || 0) + (p.installment3 || 0) || p.fee || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">
                      ৳{(((p.totalFee) || 0) - ((p.installment1 || 0) + (p.installment2 || 0) + (p.installment3 || 0) || p.fee || 0)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewingPatient(p)}
                        title={t("View Details", "বিস্তারিত দেখুন") as string}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Edit size={16} />
                      </button>
                      {p.status === "admitted" ? (
                        <button
                          onClick={() => dischargePatient(p)}
                          title={t("Discharge Patient", "রোগীকে রিলিজ করুন") as string}
                          className="p-2 text-slate-400 hover:text-emerald-600 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                             if (confirm(t("Are you sure you want to re-admit this patient?", "আপনি কি নিশ্চিত যে আপনি এই রোগীকে পুনরায় ভর্তি করতে চান?"))) {
                               updateDoc(doc(db, "patients", p.id!), { status: "admitted", updatedAt: new Date().toISOString() });
                             }
                          }}
                          title={t("Re-admit Patient", "পুনরায় ভর্তি করুন") as string}
                          className="p-2 text-slate-400 hover:text-blue-600 transition"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
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

      {viewingPatient && (
        <PatientDetailsModal
          patient={viewingPatient}
          onClose={() => setViewingPatient(null)}
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
    guardianName: patient?.guardianName || "",
    phone: patient?.phone || "",
    address: patient?.address || "",
    photo: patient?.photo || "",
    totalFee: patient?.totalFee?.toString() || patient?.fee?.toString() || "0",
    installment1: patient?.installment1?.toString() || "0",
    installment2: patient?.installment2?.toString() || "0",
    installment3: patient?.installment3?.toString() || "0",
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

      const installment1Num = parseFloat(formData.installment1 || "0");
      const installment2Num = parseFloat(formData.installment2 || "0");
      const installment3Num = parseFloat(formData.installment3 || "0");

      const cleanInstallmentDate = (num: number, existingDate: string | undefined): string | null => {
        if (num > 0) {
          return existingDate || now;
        }
        return null;
      };

      const i1Date = cleanInstallmentDate(installment1Num, patient?.installment1Date);
      const i2Date = cleanInstallmentDate(installment2Num, patient?.installment2Date);
      const i3Date = cleanInstallmentDate(installment3Num, patient?.installment3Date);

      const patientData = {
        name: formData.name,
        guardianName: formData.guardianName || "",
        phone: formData.phone,
        address: formData.address,
        photo: formData.photo || "",
        totalFee: parseFloat(formData.totalFee || "0"),
        installment1: installment1Num,
        installment1Date: i1Date,
        installment2: installment2Num,
        installment2Date: i2Date,
        installment3: installment3Num,
        installment3Date: i3Date,
        fee: installment1Num + installment2Num + installment3Num,
        status: formData.status,
      };

      if (isUpdate) {
        await updateDoc(docRef, { ...patientData, updatedAt: now });
      } else {
        await setDoc(docRef, { ...patientData, createdAt: now, updatedAt: now });
      }

      // Automatically create finance records for any newly added amounts
      const oldI1 = parseFloat(patient?.installment1?.toString() || "0");
      const oldI2 = parseFloat(patient?.installment2?.toString() || "0");
      const oldI3 = parseFloat(patient?.installment3?.toString() || "0");
      
      const newlyPaid1 = installment1Num - oldI1;
      const newlyPaid2 = installment2Num - oldI2;
      const newlyPaid3 = installment3Num - oldI3;
      
      const createFinanceRecord = async (amount: number, monthName: string) => {
         if (amount > 0) {
            await setDoc(doc(collection(db, "finances")), {
               type: "income",
               amount: amount,
               description: `Patient Fee (${formData.name}) - ${monthName}`,
               createdAt: now
            });
         }
      };

      await createFinanceRecord(newlyPaid1, "Month 1");
      await createFinanceRecord(newlyPaid2, "Month 2");
      await createFinanceRecord(newlyPaid3, "Month 3");

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

          <div className="grid grid-cols-2 gap-4">
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
                {t("Guardian Name", "অভিভাবকের নাম")}
              </label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(e) =>
                  setFormData({ ...formData, guardianName: e.target.value })
                }
                className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>
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
                {t("Total Course Fee (৳)", "মোট কোর্স ফি (৳)")}
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.totalFee}
                onChange={(e) =>
                  setFormData({ ...formData, totalFee: e.target.value })
                }
                className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t("Month 1 (৳)", "১ম মাস (৳)")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.installment1}
                onChange={(e) =>
                  setFormData({ ...formData, installment1: e.target.value })
                }
                className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t("Month 2 (৳)", "২য় মাস (৳)")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.installment2}
                onChange={(e) =>
                  setFormData({ ...formData, installment2: e.target.value })
                }
                className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t("Month 3 (৳)", "৩য় মাস (৳)")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.installment3}
                onChange={(e) =>
                  setFormData({ ...formData, installment3: e.target.value })
                }
                className="w-full p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                {t("Photo", "ছবি")}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const img = new Image();
                      img.onload = () => {
                        const maxDim = 320;
                        let width = img.width;
                        let height = img.height;
                        if (width > maxDim || height > maxDim) {
                          if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                          } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                          }
                        }
                        const canvas = document.createElement("canvas");
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, width, height);
                          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
                          setFormData({ ...formData, photo: compressedBase64 });
                        } else {
                          setFormData({ ...formData, photo: reader.result as string });
                        }
                      };
                      img.src = reader.result as string;
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full p-1.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white"
              />
               {formData.photo && <img src={formData.photo} alt="Preview" className="mt-2 w-16 h-16 object-cover rounded-md border border-slate-200" />}
            </div>
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

function PatientDetailsModal({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  const paidAmount = (patient.installment1 || 0) + (patient.installment2 || 0) + (patient.installment3 || 0);
  const dueAmount = (patient.totalFee || 0) - paidAmount;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {t("Patient Profile Details", "রোগীর বিস্তারিত পরিচিতি")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Avatar/Photo Section */}
          <div className="flex flex-col items-center">
            {patient.photo ? (
              <div className="relative group">
                <img
                  src={patient.photo}
                  alt={patient.name}
                  className="w-32 h-32 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-slate-100 shadow-md group-hover:border-blue-100 transition-colors duration-300"
                />
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = patient.photo!;
                    link.download = `${patient.name.toLowerCase().replace(/\s+/g, "_")}_photo.jpg`;
                    link.click();
                  }}
                  className="absolute bottom-2 inset-x-2 mx-auto bg-slate-900/85 text-white rounded-lg py-1 text-[10px] uppercase font-bold tracking-wider hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 shadow-sm opacity-90 group-hover:opacity-100"
                  title={t("Download Full Size", "ডাউনলোড করুন") as string}
                >
                  <ExternalLink size={11} />
                  {t("Save / View", "সেভ / দেখুন")}
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 flex items-center justify-center font-bold text-4xl border border-slate-100 shadow-inner">
                {patient.name.charAt(0)}
              </div>
            )}
            <h3 className="text-xl font-bold text-slate-900 mt-4 tracking-tight">{patient.name}</h3>
            <span
              className={`mt-2 px-3 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${
                patient.status === "admitted" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {patient.status === "admitted" ? t("Admitted", "ভর্তি") : t("Discharged", "রিলিজ")}
            </span>
          </div>

          {/* Core Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            {patient.guardianName && (
              <div className="flex items-start gap-2.5">
                <User className="text-slate-400 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("Guardian Name", "অভিভাবকের নাম")}
                  </p>
                  <p className="text-sm font-medium text-slate-700">{patient.guardianName}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <Phone className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("Phone Number", "ফোন নম্বর")}
                </p>
                <a
                  href={`tel:${patient.phone}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {patient.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("Address", "ঠিকানা")}
                </p>
                <p className="text-sm font-medium text-slate-700">{patient.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <Calendar className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("Registration Date", "রেজিস্ট্রেশন তারিখ")}
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {patient.createdAt
                    ? new Date(patient.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : t("Unknown", "অজানা")}
                </p>
              </div>
            </div>
          </div>

          {/* Installment History Log */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t("Fee & Installment Log", "ফি ও কিস্তির বিবরণী")}
            </h4>
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">{t("Total Course Fee", "মোট কোর্স ফি")}:</span>
                <span className="font-bold text-slate-950">৳{((patient.totalFee) || 0).toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-200/50 my-1"></div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{t("Month 1 Installment", "১ম মাসের কিস্তি")}:</span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">৳{(patient.installment1 || 0).toFixed(2)}</span>
                    {patient.installment1Date && (
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(patient.installment1Date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{t("Month 2 Installment", "২য় মাসের কিস্তি")}:</span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">৳{(patient.installment2 || 0).toFixed(2)}</span>
                    {patient.installment2Date && (
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(patient.installment2Date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{t("Month 3 Installment", "৩য় মাসের কিস্তি")}:</span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">৳{(patient.installment3 || 0).toFixed(2)}</span>
                    {patient.installment3Date && (
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(patient.installment3Date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/85 my-1"></div>

              <div className="flex justify-between text-sm pt-1">
                <span className="text-slate-600 font-medium">{t("Paid to Date", "প্রদানকৃত মোট")}:</span>
                <span className="font-bold text-emerald-600">৳{paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">{t("Current Due", "নিট বকেয়া")}:</span>
                <span className={`font-bold ${dueAmount > 0 ? "text-red-500" : "text-green-600"}`}>
                  ৳{dueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            {t("Close", "বন্ধ করুন")}
          </button>
        </div>
      </div>
    </div>
  );
}
