import React, { useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { useLeadData } from '../contexts/LeadDataContext';
import { useData } from '../contexts/DataContext';
import { CardSkeleton } from './SkeletonLoader';

const Dashboard = () => {
  const { currentUser } = useUser();

  // Use optimized queries
  const { useLeadsQuery } = useLeadData();
  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useLeadsQuery();

  // From DataContext
  const { pipelines, stages, users, loading: dataLoading, error: dataError } = useData();

  const stats = useMemo(() => ({
    totalLeads: leads.length,
    totalUsers: users?.length ?? 0,
    totalPipelines: pipelines?.length ?? 0,
    totalStages: stages?.length ?? 0,
  }), [leads, users, pipelines, stages]);

  const loading = leadsLoading || dataLoading;
  const error = leadsError || dataError;

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-black text-brand-accent p-6 font-sans">
        <h1 className="text-4xl text-brand-violet font-bold mb-8">Dashboard</h1>
        <CardSkeleton count={5} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-black text-brand-accent p-6 font-sans">
      <h1 className="text-4xl text-brand-violet font-bold mb-8">Dashboard</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900 bg-opacity-20 rounded text-red-500" role="alert">
          Error loading dashboard data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard label="Leads" loading={loading} count={stats.totalLeads} />
        <StatCard label="Contacts" loading={loading} count="N/A" />
        <StatCard label="Users" loading={loading} count={stats.totalUsers} />
        <StatCard label="Pipelines" loading={loading} count={stats.totalPipelines} />
        <StatCard label="Stages" loading={loading} count={stats.totalStages} />
      </div>
    </main>
  );
};

const StatCard = React.memo(({ label, loading, count }) => (
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
));

export default Dashboard;
