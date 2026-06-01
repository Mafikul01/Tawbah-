import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Patient, FinanceRecord } from "../lib/types";
import { handleFirestoreError } from "../lib/utils";
import { OperationType } from "../lib/types";
import { useLanguage } from "../lib/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, UserCog, UserCheck, Settings } from "lucide-react";

export default function Dashboard({ isAdmin }: { isAdmin: boolean }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // We fetch all records for simplicity, but in a real app might want to query by date.
    // Given the rules, we can list.
    const unsubPatients = onSnapshot(
      query(collection(db, "patients")),
      (snapshot) => {
        const p: Patient[] = [];
        snapshot.forEach((doc) =>
          p.push({ id: doc.id, ...doc.data() } as Patient),
        );
        setPatients(p);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "patients"),
    );

    const unsubFinances = onSnapshot(
      query(collection(db, "finances")),
      (snapshot) => {
        const f: FinanceRecord[] = [];
        snapshot.forEach((doc) =>
          f.push({ id: doc.id, ...doc.data() } as FinanceRecord),
        );
        setFinances(f);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "finances"),
    );

    return () => {
      unsubPatients();
      unsubFinances();
    };
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  const admittedToday = patients.filter(
    (p) => p.status === "admitted" && p.createdAt.startsWith(todayStr),
  ).length;
  const dischargedToday = patients.filter(
    (p) => p.status === "discharged" && p.updatedAt.startsWith(todayStr),
  ).length;

  const financesToday = finances.filter((f) =>
    f.createdAt.startsWith(todayStr),
  );
  const incomeToday = financesToday
    .filter((f) => f.type === "income")
    .reduce((sum, f) => sum + f.amount, 0);
  const clinicExpToday = financesToday
    .filter((f) => f.type === "clinic_expense")
    .reduce((sum, f) => sum + f.amount, 0);
  const marketExpToday = financesToday
    .filter((f) => f.type === "market_expense")
    .reduce((sum, f) => sum + f.amount, 0);
  const totalExpToday = clinicExpToday + marketExpToday;
  const netTotal = incomeToday - totalExpToday;

  const totalExpectedFees = patients.reduce((sum, p) => sum + (p.totalFee || 0), 0);
  const totalPaidFees = patients.reduce((sum, p) => sum + ((p.installment1 || 0) + (p.installment2 || 0) + (p.installment3 || 0) || p.fee || 0), 0);
  const totalDueFees = totalExpectedFees - totalPaidFees;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between pl-14 pr-4 md:px-8 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">{t("Dashboard Overview", "ড্যাশবোর্ড ওভারভিউ")}</h1>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-semibold border border-slate-300">
            {todayStr}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
          
          <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
             <div className="mb-10 text-center">
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">{t("Welcome to Tawbah Rehab Center", "তাওবাহ রিহ্যাব সেন্টারে স্বাগতম")}</h2>
                 <p className="text-slate-500">{t("Select an option below to manage operations", "কার্যক্রম পরিচালনা করতে নিচের একটি অপশন বেছে নিন")}</p>
             </div>

            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-6 text-center">
              {t("Main Menu", "প্রধান মেনু")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              <button onClick={() => navigate('/patients')} className="flex flex-col items-center justify-center p-6 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-100">
                <Users size={32} className="mb-3" />
                <span className="text-sm font-bold text-center">{t("Patient Directory", "রোগী ডিরেক্টরি")}</span>
              </button>
              <button onClick={() => navigate('/finances')} className="flex flex-col items-center justify-center p-6 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-100">
                <DollarSign size={32} className="mb-3" />
                <span className="text-sm font-bold text-center">{t("Financial Logs", "আর্থিক লগ")}</span>
              </button>
              {isAdmin && (
                <>
                  <button onClick={() => navigate('/staff')} className="flex flex-col items-center justify-center p-6 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-100">
                    <UserCog size={32} className="mb-3" />
                    <span className="text-sm font-bold text-center">{t("Staff", "কর্মী")}</span>
                  </button>
                  <button onClick={() => navigate('/volunteers')} className="flex flex-col items-center justify-center p-6 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition border border-orange-100">
                    <UserCheck size={32} className="mb-3" />
                    <span className="text-sm font-bold text-center">{t("Volunteers", "স্বেচ্ছাসেবক")}</span>
                  </button>
                  <button onClick={() => navigate('/settings')} className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200">
                    <Settings size={32} className="mb-3" />
                    <span className="text-sm font-bold text-center">{t("Settings", "সেটিংস")}</span>
                  </button>
                </>
              )}
            </div>
            
            <div className="mt-12 bg-slate-50 border border-slate-100 rounded-xl p-6">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-6 text-center">
                  {t("Patient Payment Strategy", "রোগীর পেমেন্ট কৌশল")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  <div className="pt-4 md:pt-0">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">{t("Expected Total Income", "মোট প্রত্যাশিত আয়")}</p>
                    <p className="text-2xl font-bold mt-1 text-slate-800">৳{totalExpectedFees.toFixed(2)}</p>
                  </div>
                  <div className="pt-4 md:pt-0">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">{t("Total Recovered (Paid)", "মোট সংগ্রহ (প্রদানকৃত)")}</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-600">৳{totalPaidFees.toFixed(2)}</p>
                  </div>
                  <div className="pt-4 md:pt-0">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">{t("Total Due Remaining", "মোট বকেয়া")}</p>
                    <p className="text-2xl font-bold mt-1 text-red-500">৳{totalDueFees.toFixed(2)}</p>
                  </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
