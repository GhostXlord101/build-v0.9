import React, { useEffect, useState } from 'react';
import { useLeadData } from '../contexts/LeadDataContext';
import { Loader2, BarChart2, PieChart, TrendUp } from 'lucide-react';

const Analytics = () => {
  const { leads, loading, error } = useLeadData();
  const [stats, setStats] = useState({
    totalLeads: 0,
    statusCounts: {},
    conversionRate: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
  });

  useEffect(() => {
    if (!loading && leads) {
      const totalLeads = leads.length;
      const statusCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});

      const qualifiedLeads = statusCounts['Qualified'] || 0;
      const wonLeads = statusCounts['Won'] || 0;
      const lostLeads = statusCounts['Lost'] || 0;
      const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

      setStats({
        totalLeads,
        statusCounts,
        conversionRate,
        qualifiedLeads,
        wonLeads,
        lostLeads,
      });
    }
  }, [leads, loading]);

  return (
    <main className="min-h-screen p-6 bg-brand-black text-brand-accent font-sans select-none">
      <h1 className="text-4xl font-bold mb-8 text-brand-violet">Analytics Dashboard</h1>

      {error && (
        <div role="alert" className="mb-4 p-4 border border-red-600 bg-red-100 text-red-700 rounded">
          Error loading analytics: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center space-x-2 text-brand-accent">
          <Loader2 className="animate-spin h-6 w-6" aria-hidden="true" />
          <span className="text-lg">Loading analytics...</span>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Leads */}
          <Card>
            <div className="flex items-center space-x-3">
              <BarChart2 className="h-8 w-8 text-brand-violet" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Total Leads</h2>
            </div>
            <p className="mt-4 text-5xl font-extrabold">{stats.totalLeads}</p>
          </Card>

          {/* Lead Status Breakdown */}
          <Card>
            <div className="flex items-center space-x-3">
              <PieChart className="h-8 w-8 text-brand-violet" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Lead Status Breakdown</h2>
            </div>
            {Object.keys(stats.statusCounts).length === 0 ? (
              <p className="mt-4 text-gray-400 italic">No lead data available</p>
            ) : (
              <ul className="mt-4 divide-y divide-brand-violetDark">
                {Object.entries(stats.statusCounts).map(([status, count]) => (
                  <li
                    key={status}
                    className="flex justify-between py-1 font-mono text-brand-accent text-lg"
                    title={`Number of leads with status ${status}`}
                  >
                    <span>{status}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Conversion Rate */}
          <Card>
            <div className="flex items-center space-x-3">
              <TrendUp className="h-8 w-8 text-brand-violet" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Conversion Rate</h2>
            </div>
            <p
              className={`mt-6 text-6xl font-extrabold ${
                stats.conversionRate >= 50 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {stats.conversionRate}%
            </p>
          </Card>

          {/* Additional Stats - Spanning full width on desktop */}
          <div className="md:col-span-3 grid grid-cols-3 gap-6 mt-6">
            <Card>
              <h3 className="text-lg font-semibold mb-2 text-brand-violet">Qualified Leads</h3>
              <p className="text-3xl font-bold">{stats.qualifiedLeads}</p>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-2 text-brand-violet">Won Leads</h3>
              <p className="text-3xl font-bold">{stats.wonLeads}</p>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-2 text-brand-violet">Lost Leads</h3>
              <p className="text-3xl font-bold">{stats.lostLeads}</p>
            </Card>
          </div>
        </section>
      )}
    </main>
  );
};

const Card = ({ children }) => (
  <div className="bg-brand-surface rounded-lg p-6 shadow-md border border-brand-violetDark">
    {children}
  </div>
);

export default Analytics;
