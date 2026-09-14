import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UsersManager } from './UsersManager';
import { RolesManager } from './RolesManager';
import { StatusesManager } from './StatusesManager';
import { CustomFieldsManager } from './CustomFieldsManager';
import { ReferenceDataManager } from './ReferenceDataManager';
import { ExpirationConfig } from './ExpirationConfig';
import {
  Users,
  ShieldCheck,
  ToggleLeft,
  Sliders,
  Clock,
  Building2,
  Briefcase,
  MapPin,
  FileSpreadsheet,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
    { id: 'custom-fields', label: 'Custom Fields', icon: Sliders },
    { id: 'statuses', label: 'Statuses', icon: ToggleLeft },
    { id: 'expiration', label: 'Expiration Policy', icon: Clock },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'areas', label: 'Areas', icon: MapPin },
    { id: 'types', label: 'Document Types', icon: FileSpreadsheet },
    { id: 'system', label: 'System Info', icon: Info },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Administration control panel, custom field registries, reference taxonomies, and expiration
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-yellow-400 text-slate-950 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'users' && <UsersManager />}
        {activeTab === 'roles' && <RolesManager />}
        {activeTab === 'custom-fields' && <CustomFieldsManager />}
        {activeTab === 'statuses' && <StatusesManager />}
        {activeTab === 'expiration' && <ExpirationConfig />}
        {activeTab === 'departments' && (
          <ReferenceDataManager
            endpoint="departments"
            title="Departments"
            description="Organizational units assigned to submissions"
          />
        )}
        {activeTab === 'jobs' && (
          <ReferenceDataManager
            endpoint="jobs"
            title="Jobs"
            description="Workflow operational classifications"
          />
        )}
        {activeTab === 'areas' && (
          <ReferenceDataManager
            endpoint="areas"
            title="Areas"
            description="Geographic and cargo terminal handling zones"
          />
        )}
        {activeTab === 'types' && (
          <ReferenceDataManager
            endpoint="types"
            title="Document Types"
            description="Submission entry classifications"
          />
        )}
        {activeTab === 'system' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-xl space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-slate-900">Euro Choice Production Build</h3>
            <div className="divide-y divide-slate-100">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">API Endpoint</span>
                <span className="font-mono text-slate-800">http://localhost:5000/api</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Database</span>
                <span className="font-mono text-slate-800">MongoDB (127.0.0.1:27017)</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Audit History Architecture</span>
                <span className="font-semibold text-emerald-700">Immutable Server-Side Log</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Unique Counter Sequence</span>
                <span className="font-mono text-slate-800">Atomic $inc Counter</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Background Sweep Job</span>
                <span className="font-mono text-slate-800">node-cron (* / 15 * * * *)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
