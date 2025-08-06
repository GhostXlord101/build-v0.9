import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { UserProvider, useUser } from './contexts/UserContext';
import { LeadDataProvider } from './contexts/LeadDataContext';
import { DataProvider } from './contexts/DataContext';

// Components (pages & common UI)
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import LeadDetail from './components/LeadDetail';
import LeadForm from './components/LeadForm';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import ContactList from './components/ContactList';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Conditional Routes component to handle auth status and route protection
const AppRoutes = () => {
  const { currentUser, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-brand-violet text-xl">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        {/* Redirect any other route to sign-in */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  // User is authenticated; show main app with sidebar and header
  return (
    <div className="flex min-h-screen bg-brand-black text-brand-accent font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadList />} />
            <Route path="/leads/:leadId" element={<LeadDetail />} />
            <Route path="/leads/:leadId/edit" element={<LeadForm />} />
            <Route path="/contacts" element={<ContactList />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <UserProvider>
    <DataProvider>
      <LeadDataProvider>
        <Router>
          <AppRoutes />
        </Router>
      </LeadDataProvider>
    </DataProvider>
  </UserProvider>
);

export default App;
