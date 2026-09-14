import { AuthUser, LoginRequest, PermissionKeys } from '@eurochoice/shared';

// Determine if Demo / Mock mode is active
export function isDemoMode(): boolean {
  // 1. Explicit Vite environment variable
  const metaEnv = (import.meta as any)?.env || {};
  if (
    metaEnv.VITE_DEMO_MODE === 'true' ||
    metaEnv.VITE_DEMO_MODE === true ||
    metaEnv.VITE_DEMO_MODE === '1'
  ) {
    return true;
  }

  // 2. Client-side URL query parameter or localStorage preference
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo') === 'true' || urlParams.get('demo') === '1') {
        localStorage.setItem('ec_demo_mode', 'true');
        return true;
      }
      if (localStorage.getItem('ec_demo_mode') === 'true') {
        return true;
      }

      // 3. Vercel deployment detection without an explicitly set backend URL
      const host = window.location.hostname;
      const isVercel = host.includes('vercel.app') || host.includes('now.sh');
      const hasBackendUrl = Boolean(metaEnv.VITE_API_URL);
      if (isVercel && !hasBackendUrl) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

// Generate realistic mock user based on email
export function getMockUser(credentials?: Partial<LoginRequest>): AuthUser {
  const email = (credentials?.email || localStorage.getItem('ec_demo_email') || 'admin@eurochoice.com').toLowerCase();
  const isEmployee = email.includes('employee') || email.includes('john') || email.includes('user');

  if (isEmployee) {
    const employeePermissions = [
      'records:view',
      'records:create',
      'records:edit',
      'records:change_status',
      'records:add_note',
      'records:view_history',
      'records:manage_dependencies',
      'clients:manage',
    ];
    return {
      _id: 'mock_emp_user_002',
      name: 'Elena Rostova (Demo)',
      email,
      role: {
        _id: 'mock_role_employee',
        name: 'Employee',
        permissions: employeePermissions,
        isSystemRole: true,
      },
      department: {
        _id: 'mock_dept_operations',
        name: 'Operations',
      },
      permissions: employeePermissions,
      accountStatus: 'active',
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date('2026-01-01').toISOString(),
    };
  }

  return {
    _id: 'mock_admin_user_001',
    name: 'System Administrator (Demo)',
    email,
    role: {
      _id: 'mock_role_admin',
      name: 'Admin',
      permissions: [...PermissionKeys],
      isSystemRole: true,
    },
    department: {
      _id: 'mock_dept_operations',
      name: 'Operations',
    },
    permissions: [...PermissionKeys],
    accountStatus: 'active',
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date('2026-01-01').toISOString(),
  };
}

// Mock login simulation with realistic delay and token generation
export async function mockLogin(credentials: LoginRequest): Promise<{ accessToken: string; user: AuthUser }> {
  // UX loading simulation
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = getMockUser(credentials);
  const fakeToken = `demo_jwt_token_${Date.now()}_eurochoice_preview`;

  localStorage.setItem('ec_access_token', fakeToken);
  localStorage.setItem('ec_demo_email', user.email);
  localStorage.setItem('ec_demo_user', JSON.stringify(user));

  return {
    accessToken: fakeToken,
    user,
  };
}

// Mock Reference Data
export const MOCK_STATUSES = [
  { _id: 'stat_1', name: 'Open', color: '#3B82F6', order: 1, isTerminal: false },
  { _id: 'stat_2', name: 'In Progress', color: '#F59E0B', order: 2, isTerminal: false },
  { _id: 'stat_3', name: 'Pending', color: '#8B5CF6', order: 3, isTerminal: false },
  { _id: 'stat_4', name: 'Completed', color: '#10B981', order: 4, isTerminal: true },
  { _id: 'stat_5', name: 'Expired', color: '#EF4444', order: 5, isTerminal: true },
];

export const MOCK_DEPARTMENTS = [
  { _id: 'dept_1', name: 'Operations', description: 'Operations Department' },
  { _id: 'dept_2', name: 'Logistics', description: 'Global Logistics' },
  { _id: 'dept_3', name: 'Customer Service', description: 'Client Relations' },
  { _id: 'dept_4', name: 'Finance', description: 'Billing & Accounting' },
];

export const MOCK_JOBS = [
  { _id: 'job_1', name: 'Customs Clearance', description: 'Border clearance workflow' },
  { _id: 'job_2', name: 'Freight Forwarding', description: 'Cargo route tracking' },
  { _id: 'job_3', name: 'Warehousing Inspection', description: 'Facility inspection' },
  { _id: 'job_4', name: 'Express Delivery', description: 'Priority dispatch' },
];

export const MOCK_AREAS = [
  { _id: 'area_1', name: 'Rotterdam Port Hub', code: 'RTM-01' },
  { _id: 'area_2', name: 'Hamburg Logistics Terminal', code: 'HAM-02' },
  { _id: 'area_3', name: 'Antwerp Gateway Terminal', code: 'ANT-03' },
  { _id: 'area_4', name: 'Frankfurt Central Depot', code: 'FRA-04' },
];

export const MOCK_TYPES = [
  { _id: 'type_1', name: 'Import Cargo Standard' },
  { _id: 'type_2', name: 'Export Direct Transit' },
  { _id: 'type_3', name: 'Special Handling / Hazmat' },
  { _id: 'type_4', name: 'Bonded Warehouse Transit' },
];

export const MOCK_CLIENTS = [
  {
    _id: 'client_1',
    name: 'Apex Freight Logistics GmbH',
    email: 'operations@apexfreight.de',
    phone: '+49 40 555 0192',
    company: 'Apex Logistics Europe',
    notes: 'Key maritime logistics account for Port Authority route.',
    customFieldValues: [{ key: 'contact_preference', value: 'Direct Dispatch' }],
    createdAt: new Date('2026-02-10').toISOString(),
  },
  {
    _id: 'client_2',
    name: 'Nordic Global Import AB',
    email: 'contact@nordicglobal.se',
    phone: '+46 8 555 0914',
    company: 'Nordic Import Group',
    notes: 'Cold chain supply and bulk reefer transport.',
    customFieldValues: [{ key: 'contact_preference', value: 'Email' }],
    createdAt: new Date('2026-02-14').toISOString(),
  },
  {
    _id: 'client_3',
    name: 'Trans-European Express SARL',
    email: 'dispatch@tee-express.fr',
    phone: '+33 1 44 55 66 77',
    company: 'TEE Freight Solutions',
    notes: 'High volume intermodal client between Benelux & France.',
    customFieldValues: [{ key: 'contact_preference', value: 'Phone' }],
    createdAt: new Date('2026-02-18').toISOString(),
  },
  {
    _id: 'client_4',
    name: 'Iberian Cargo Link SL',
    email: 'admin@iberiancargolink.es',
    phone: '+34 91 123 4567',
    company: 'Iberian Link Logistics',
    notes: 'Southwestern corridor logistics & customs.',
    customFieldValues: [{ key: 'contact_preference', value: 'Email' }],
    createdAt: new Date('2026-03-01').toISOString(),
  },
];

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);

export const MOCK_RECORDS = [
  {
    _id: 'rec_1',
    recordId: 'REC-2026-0001',
    client: MOCK_CLIENTS[0],
    department: MOCK_DEPARTMENTS[0],
    job: MOCK_JOBS[0],
    area: MOCK_AREAS[0],
    type: MOCK_TYPES[0],
    status: MOCK_STATUSES[0], // Open
    submissionDate: new Date('2026-03-10').toISOString(),
    endDate: tomorrow.toISOString(),
    shortText: 'Maritime clearance for Hamburg reefer container batch',
    longText: 'Documentation verification underway with customs officials. All bill of lading paperwork filed.',
    customFieldValues: [
      { key: 'priority_level', value: 'High' },
      { key: 'tracking_number', value: 'TRK-98231-DE' },
    ],
    dependencies: [],
    notes: [
      {
        _id: 'note_1',
        content: 'Customs declaration submitted electronically. Awaiting green lane confirmation.',
        user: { name: 'System Administrator (Demo)' },
        createdAt: new Date('2026-03-11T10:30:00').toISOString(),
      },
    ],
    createdAt: new Date('2026-03-10').toISOString(),
  },
  {
    _id: 'rec_2',
    recordId: 'REC-2026-0002',
    client: MOCK_CLIENTS[1],
    department: MOCK_DEPARTMENTS[1],
    job: MOCK_JOBS[1],
    area: MOCK_AREAS[1],
    type: MOCK_TYPES[1],
    status: MOCK_STATUSES[1], // In Progress
    submissionDate: new Date('2026-03-11').toISOString(),
    endDate: tomorrow.toISOString(),
    shortText: 'Overnight bonded transport to Stockholm distribution facility',
    longText: 'Cross-docking completed at Hamburg logistics hub. Driver assigned for transit.',
    customFieldValues: [
      { key: 'priority_level', value: 'Critical' },
      { key: 'tracking_number', value: 'TRK-88412-SE' },
    ],
    dependencies: [],
    notes: [],
    createdAt: new Date('2026-03-11').toISOString(),
  },
  {
    _id: 'rec_3',
    recordId: 'REC-2026-0003',
    client: MOCK_CLIENTS[2],
    department: MOCK_DEPARTMENTS[0],
    job: MOCK_JOBS[2],
    area: MOCK_AREAS[2],
    type: MOCK_TYPES[2],
    status: MOCK_STATUSES[2], // Pending
    submissionDate: new Date('2026-03-12').toISOString(),
    endDate: new Date(now.getTime() + 4 * 86400000).toISOString(),
    shortText: 'Hazardous chemicals safety inspection & pallet security seal',
    longText: 'Awaiting chemical containment certification before loading to rail transport.',
    customFieldValues: [
      { key: 'priority_level', value: 'Medium' },
      { key: 'tracking_number', value: 'TRK-33491-FR' },
    ],
    dependencies: [],
    notes: [],
    createdAt: new Date('2026-03-12').toISOString(),
  },
  {
    _id: 'rec_4',
    recordId: 'REC-2026-0004',
    client: MOCK_CLIENTS[3],
    department: MOCK_DEPARTMENTS[1],
    job: MOCK_JOBS[3],
    area: MOCK_AREAS[3],
    type: MOCK_TYPES[0],
    status: MOCK_STATUSES[3], // Completed
    submissionDate: new Date('2026-03-08').toISOString(),
    endDate: new Date('2026-03-12').toISOString(),
    shortText: 'Express aviation cargo dispatch to Madrid Barajas terminal',
    longText: 'Delivered and verified by client receiving manager with digital sign-off.',
    customFieldValues: [
      { key: 'priority_level', value: 'Low' },
      { key: 'tracking_number', value: 'TRK-10948-ES' },
    ],
    dependencies: [],
    notes: [],
    createdAt: new Date('2026-03-08').toISOString(),
  },
];

// Provide mock responses for any backend endpoint when in Demo Mode
export function getDemoResponse(endpoint: string, options: any = {}): any {
  const method = (options.method || 'GET').toUpperCase();
  const cleanPath = endpoint
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/?(api\/)?/, '')
    .replace(/^\/+/, '')
    .split('?')[0];

  // Auth
  if (cleanPath === 'auth/login') {
    const body = options.body ? JSON.parse(options.body) : {};
    return {
      accessToken: 'demo_jwt_token_preview',
      user: getMockUser(body),
    };
  }

  if (cleanPath === 'auth/refresh' || cleanPath === 'auth/me') {
    return {
      accessToken: 'demo_jwt_token_preview',
      user: getMockUser(),
    };
  }

  if (cleanPath === 'auth/logout') {
    return { message: 'Successfully logged out' };
  }

  // Dashboard
  if (cleanPath === 'dashboard/summary') {
    return {
      total: 16,
      byStatus: {
        Open: 5,
        'In Progress': 6,
        Pending: 3,
        Completed: 2,
        Expired: 0,
      },
      expiringSoon: 4,
      planningTomorrowCount: 2,
      recentActivity: [
        {
          _id: 'act_1',
          action: 'record_status_changed',
          user: { name: 'System Administrator' },
          record: { recordId: 'REC-2026-0002', shortText: 'Overnight bonded transport' },
          meta: { from: 'Open', to: 'In Progress' },
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          _id: 'act_2',
          action: 'record_created',
          user: { name: 'Elena Rostova' },
          record: { recordId: 'REC-2026-0003', shortText: 'Hazardous chemicals safety inspection' },
          meta: {},
          createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
        },
      ],
    };
  }

  if (cleanPath === 'dashboard/tomorrow') {
    return MOCK_RECORDS.slice(0, 2);
  }

  // Reference Data
  if (cleanPath === 'statuses') return MOCK_STATUSES;
  if (cleanPath === 'reference/departments') return MOCK_DEPARTMENTS;
  if (cleanPath === 'reference/jobs') return MOCK_JOBS;
  if (cleanPath === 'reference/areas') return MOCK_AREAS;
  if (cleanPath === 'reference/types') return MOCK_TYPES;

  if (cleanPath === 'custom-fields') {
    return [
      {
        _id: 'cf_1',
        key: 'priority_level',
        label: 'Priority Level',
        type: 'dropdown',
        options: ['Critical', 'High', 'Medium', 'Low'],
        appliesTo: 'record',
        required: true,
        isActive: true,
      },
      {
        _id: 'cf_2',
        key: 'tracking_number',
        label: 'Carrier Tracking Number',
        type: 'text',
        appliesTo: 'record',
        required: false,
        isActive: true,
      },
      {
        _id: 'cf_3',
        key: 'contact_preference',
        label: 'Contact Preference',
        type: 'dropdown',
        options: ['Email', 'Phone', 'Direct Dispatch'],
        appliesTo: 'client',
        required: false,
        isActive: true,
      },
    ];
  }

  // Records
  if (cleanPath === 'records') {
    if (method === 'POST') {
      const newRec = {
        _id: `rec_${Date.now()}`,
        recordId: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        ...JSON.parse(options.body || '{}'),
        status: MOCK_STATUSES[0],
        createdAt: new Date().toISOString(),
      };
      return newRec;
    }
    return {
      records: MOCK_RECORDS,
      total: MOCK_RECORDS.length,
      page: 1,
      totalPages: 1,
    };
  }

  if (cleanPath.startsWith('records/')) {
    const id = cleanPath.replace('records/', '');
    const found = MOCK_RECORDS.find((r) => r._id === id || r.recordId === id) || MOCK_RECORDS[0];
    return found;
  }

  // Clients
  if (cleanPath === 'clients') {
    if (method === 'POST') {
      const newClient = {
        _id: `client_${Date.now()}`,
        ...JSON.parse(options.body || '{}'),
        createdAt: new Date().toISOString(),
      };
      return newClient;
    }
    return {
      clients: MOCK_CLIENTS,
      total: MOCK_CLIENTS.length,
      page: 1,
      totalPages: 1,
    };
  }

  if (cleanPath.startsWith('clients/')) {
    const id = cleanPath.replace('clients/', '');
    return MOCK_CLIENTS.find((c) => c._id === id) || MOCK_CLIENTS[0];
  }

  // Settings / Users / Roles
  if (cleanPath === 'roles') {
    return [
      { _id: 'mock_role_admin', name: 'Admin', description: 'System Administrator', permissions: [...PermissionKeys] },
      { _id: 'mock_role_employee', name: 'Employee', description: 'Standard Staff', permissions: ['records:view'] },
    ];
  }

  if (cleanPath === 'users') {
    return [getMockUser({ email: 'admin@eurochoice.com' }), getMockUser({ email: 'employee@eurochoice.com' })];
  }

  if (cleanPath === 'history') {
    return {
      history: [
        {
          _id: 'act_1',
          action: 'record_created',
          user: { name: 'System Administrator' },
          record: { recordId: 'REC-2026-0001', shortText: 'Maritime clearance' },
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };
  }

  // Generic fallback
  return { success: true };
}
