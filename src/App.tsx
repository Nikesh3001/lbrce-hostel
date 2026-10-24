import React, { useState, useEffect } from 'react';
import { User } from './types';
import { storageService } from './services/storage';
import { api } from './services/api';
import { authService } from './services/authService';
import { checkAndSeedFirestore } from './services/firebaseService';
import { Header } from './components/common/Header';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return storageService.getCurrentUser();
  });
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    checkAndSeedFirestore().catch(() => {});
  }, []);

  const handleLogin = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await authService.logout(currentUser);
    storageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleResetData = async () => {
    await api.resetAll();
    setDataVersion((v) => v + 1);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div key={dataVersion} className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-blue-800 selection:text-white">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        onResetData={handleResetData}
      />

      <main className="flex-1">
        {currentUser.role === 'admin' ? (
          <AdminDashboard
            currentUser={currentUser}
            onRefreshData={() => setDataVersion((v) => v + 1)}
          />
        ) : (
          <StudentDashboard currentUser={currentUser} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Lakireddy Bali Reddy College of Engineering (Autonomous) — Hostels Portal</span>
          <span>Mylavaram, NTR District, AP · Chief Warden Office</span>
        </div>
      </footer>
    </div>
  );
}
