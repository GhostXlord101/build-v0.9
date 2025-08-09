import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Context Providers
import { UserProvider, useUser } from './contexts/UserContext';
import { LeadDataProvider } from './contexts/LeadDataContext';
import { DataProvider } from './contexts/DataContext';

// Components (pages & layout)
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import LeadDetail from './components/LeadDetail';
import LeadForm from './components/LeadForm';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import ContactList from './components/ContactList';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-brand-black text-brand-accent p-4">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
      <p className="text-brand-accent mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-brand-violet hover:bg-brand-violetDark text-white rounded"
      >
        Try again
      </button>
    </div>
  </div>
);
// Authentication-guarded routing
const AppRoutes = () => {
  const { currentUser, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-violet mx-auto mb-4"></div>
          <p className="text-brand-violet text-xl">Loading CRM...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Only allow sign-in/sign-up routes when not logged in
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  // Authenticated: show app UI
  return (
    <div className="flex min-h-screen bg-brand-black text-brand-accent font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<LeadList />} />
              <Route path="/leads/:leadId" element={<LeadDetail />} />
              <Route path="/leads/:leadId/edit" element={<LeadForm />} />
              <Route path="/contacts" element={<ContactList />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              {/* 404 handling */}
              <Route path="/404" element={
                <div className="text-center py-12">
                  <h1 className="text-4xl font-bold text-brand-violet mb-4">404</h1>
                  <p className="text-brand-accent mb-4">Page not found</p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-brand-violet hover:bg-brand-violetDark text-white rounded"
                  >
                    Go Home
                  </button>
                </div>
              } />
              {/* Catch-all: redirect to 404 */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <UserProvider>
      <DataProvider>
        <LeadDataProvider>
          <Router>
            <AppRoutes />
          </Router>
        </LeadDataProvider>
      </DataProvider>
    </UserProvider>
  </ErrorBoundary>
);

export default App;
