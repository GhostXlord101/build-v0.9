import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers (optional if you want to keep data contexts)
import { UserProvider } from './contexts/UserContext';
import { LeadDataProvider } from './contexts/LeadDataContext';
import { DataProvider } from './contexts/DataContext';

// Components (pages and layout)
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import LeadDetail from './components/LeadDetail';
import LeadForm from './components/LeadForm';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import ContactList from './components/ContactList';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

const App = () => (
  // You can keep providers if you want to maintain global state or remove if not needed now
  <UserProvider>
    <DataProvider>
      <LeadDataProvider>
        <Router>
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
        </Router>
      </LeadDataProvider>
    </DataProvider>
  </UserProvider>
);

export default App;
