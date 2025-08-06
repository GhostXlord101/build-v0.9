import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { UserProvider } from './contexts/UserContext';
import { LeadDataProvider } from './contexts/LeadDataContext';
import { DataProvider } from './contexts/DataContext';

// Main UI Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Page Components (adjust import paths as needed)
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import LeadDetail from './components/LeadDetail';
import LeadForm from './components/LeadForm';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import ContactList from './components/ContactList';

const App = () => (
  <UserProvider>
    <DataProvider>
      <LeadDataProvider>
        <Router>
          <div className="flex min-h-screen bg-brand-black">
            {/* Sidebar (responsive) */}
            <Sidebar />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-4 md:p-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/leads" element={<LeadList />} />
                  <Route path="/leads/:leadId" element={<LeadDetail />} />
                  <Route path="/leads/:leadId/edit" element={<LeadForm />} />
                  <Route path="/contacts" element={<ContactList />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* Fallback route */}
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
