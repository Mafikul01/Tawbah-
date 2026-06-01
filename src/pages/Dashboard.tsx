import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Patient, FinanceRecord } from "../lib/types";
import { handleFirestoreError } from "../lib/utils";
import { OperationType } from "../lib/types";
import { useLanguage } from "../lib/LanguageContext";

export default function Dashboard({ isAdmin }: { isAdmin: boolean }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const { t } = useLanguage();

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
          {/* Top Stats */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("Daily Admissions", "দৈনিক ভর্তি")}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-blue-600">{admittedToday}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("Daily Discharges", "দৈনিক রিলিজ")}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-800">{dischargedToday}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("Daily Income", "দৈনিক আয়")}
            </p>
            <div className="flex items-baseline gap-2 mt-2 text-green-600">
              <span className="text-3xl font-bold">৳{incomeToday.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("Market Expenses", "বাজার খরচ")}
            </p>
            <div className="flex items-baseline gap-2 mt-2 text-red-600">
              <span className="text-3xl font-bold">৳{marketExpToday.toFixed(2)}</span>
            </div>
          </div>

          {/* Financial Overview Panel */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-900 rounded-xl shadow-sm p-6 text-white flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-widest">
                  {t("Today's Net Margin", "আজকের নিট মার্জিন")}
                </h3>
                <p className={`text-4xl font-bold mt-1 ${netTotal >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  ৳{netTotal.toFixed(2)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">
                    {t("Center Expenses", "সেন্টার খরচ")}
                  </p>
                  <p className="text-lg font-semibold text-red-300">
                    ৳{clinicExpToday.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold">
                    {t("Market Expenses", "বাজার খরচ")}
                  </p>
                  <p className="text-lg font-semibold text-red-300">
                    ৳{marketExpToday.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block w-px bg-slate-800 h-full"></div>
            <div className="flex-1">
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-4">
                {t("Recent Patients", "সাম্প্রতিক রোগী")}
              </h3>
              <div className="space-y-3">
                {patients
                  .slice()
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .slice(0, 3)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-200">{p.name}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {p.status === 'admitted' ? t('admitted', 'ভর্তি') : t('discharged', 'রিলিজ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-300">
                          ৳{p.fee}
                        </p>
                      </div>
                    </div>
                  ))}
                {patients.length === 0 && (
                  <p className="text-slate-500 italic text-sm">{t("No patients recorded yet.", "কোনো রোগীর রেকর্ড নেই।")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
