import React from 'react';
import { useUser } from '../contexts/UserContext';
import { useLeadData } from '../contexts/LeadDataContext';
import { useData } from '../contexts/DataContext'; // The DataContext you have for pipelines, stages, and users

const Dashboard = () => {
  const { currentUser } = useUser();

  // From LeadDataContext
  const { leads, loading: leadsLoading, error: leadsError } = useLeadData();

  // From DataContext (pipelines, stages, users)
  const { pipelines, stages, users, loading: dataLoading, error: dataError } = useData();

  // Derive contacts count from LeadDataContext contacts array or fetch it if your context exposes it
  // If your LeadDataContext exposes contacts for a current lead only, you may need another context or query for all contacts count.
  // For now we can show "N/A" or 0 if no direct access:

  // If contacts count is not in any context, you could add a fetchContacts method later.

  const totalLeads = leads?.length ?? 0;
  const totalUsers = users?.length ?? 0;
  const totalPipelines = pipelines?.length ?? 0;
  const totalStages = stages?.length ?? 0;

  // Placeholder contacts count — replace with actual value if you add a context or API call
  const totalContacts = 'N/A';

  const loading = leadsLoading || dataLoading;
  const error = leadsError || dataError;

  return (
    <main className="min-h-screen bg-brand-black text-brand-accent p-6 font-sans">
      <h1 className="text-4xl text-brand-violet font-bold mb-8">Dashboard</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900 bg-opacity-20 rounded text-red-500" role="alert">
          Error loading dashboard data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard label="Leads" loading={loading} count={totalLeads} />
        <StatCard label="Contacts" loading={loading} count={totalContacts} />
        <StatCard label="Users" loading={loading} count={totalUsers} />
        <StatCard label="Pipelines" loading={loading} count={totalPipelines} />
        <StatCard label="Stages" loading={loading} count={totalStages} />
      </div>
    </main>
  );
};

const StatCard = ({ label, loading, count }) => (
  <div className="bg-brand-surface rounded-lg p-6 flex flex-col items-center justify-center shadow border border-brand-violetDark">
    <h2 className="text-xl font-semibold text-brand-violet mb-2">{label}</h2>
    {loading ? (
      <div
        className="w-6 h-6 border-4 border-brand-violet border-t-transparent rounded-full animate-spin"
        aria-label={`${label} loading`}
      />
    ) : (
      <p className="text-5xl font-extrabold">{count ?? '—'}</p>
    )}
  </div>
);

export default Dashboard;
