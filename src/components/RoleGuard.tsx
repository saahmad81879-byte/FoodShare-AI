import React from 'react';
import { ShieldAlert, ArrowRight, UserCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  onNavigateToOwnDashboard?: () => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  onNavigateToOwnDashboard,
}) => {
  const { currentUser, switchDemoRole } = useAuth();

  const userRole = currentUser?.role || 'donor';
  const hasAccess = userRole === 'admin' || allowedRoles.includes(userRole);

  if (hasAccess) {
    return <>{children}</>;
  }

  const roleLabels: Record<UserRole, string> = {
    donor: 'Food Donor',
    ngo: 'NGO & Relief Shelter',
    volunteer: 'Volunteer Courier',
    admin: 'Platform Administrator',
  };

  const requiredLabel = allowedRoles.map((r) => roleLabels[r]).join(' or ');

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-amber-200 shadow-md text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
          Role-Based Access Guard
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          Access Restricted for {roleLabels[userRole]}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          This portal requires <strong>{requiredLabel}</strong> authorization. Your current profile is registered as <strong>{roleLabels[userRole]}</strong>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {onNavigateToOwnDashboard && (
          <button
            onClick={onNavigateToOwnDashboard}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Go to My Authorized Dashboard</span>
          </button>
        )}

        <button
          onClick={() => {
            const primaryAllowed = allowedRoles[0];
            switchDemoRole(primaryAllowed);
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Switch to {roleLabels[allowedRoles[0]]} (Sandbox Test)</span>
        </button>
      </div>

      <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4">
        FoodShare AI enforces zero-trust Attribute-Based Access Control (ABAC) in Cloud Firestore.
      </div>
    </div>
  );
};
