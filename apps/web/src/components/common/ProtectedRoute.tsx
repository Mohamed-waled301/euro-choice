import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-400">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black mx-auto animate-pulse">
            EC
          </div>
          <p className="text-xs text-slate-400 font-medium">Validating Euro Choice session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
