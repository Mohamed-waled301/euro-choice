import bcrypt from 'bcryptjs';
import { Role } from '../models/Role';
import { Status } from '../models/Status';
import { Department } from '../models/Department';
import { Job } from '../models/Job';
import { Area } from '../models/Area';
import { RecordType } from '../models/Type';
import { SystemSettings } from '../models/SystemSettings';
import { CustomField } from '../models/CustomField';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { RecordModel } from '../models/Record';
import { generateUniqueRecordId } from '../models/Counter';
import { logActionHistory } from '../utils/audit';
import { PermissionKeys } from '@eurochoice/shared';
import { logger } from '../config/logger';

export async function seedDatabase(): Promise<void> {
  logger.info('Starting database seeding...');

  // 1. Seed Roles
  const allPermissions = [...PermissionKeys];
  const managerPermissions = allPermissions.filter((p) => !p.startsWith('settings:'));
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
  const viewerPermissions = ['records:view', 'records:view_history'];

  const rolesData = [
    { name: 'Admin', description: 'Full system administrator', permissions: allPermissions, isSystemRole: true },
    { name: 'Manager', description: 'Operational team lead', permissions: managerPermissions, isSystemRole: true },
    { name: 'Employee', description: 'Standard operational staff', permissions: employeePermissions, isSystemRole: true },
    { name: 'Viewer', description: 'Read-only stakeholder', permissions: viewerPermissions, isSystemRole: true },
  ];

  for (const r of rolesData) {
    await Role.findOneAndUpdate({ name: r.name }, r, { upsert: true, new: true });
  }

  // 2. Seed Statuses
  const statusesData = [
    { name: 'Open', color: '#3B82F6', order: 1, isTerminal: false, isSystemStatus: true },
    { name: 'In Progress', color: '#F59E0B', order: 2, isTerminal: false, isSystemStatus: true },
    { name: 'Pending', color: '#8B5CF6', order: 3, isTerminal: false, isSystemStatus: true },
    { name: 'Completed', color: '#10B981', order: 4, isTerminal: true, isSystemStatus: true },
    { name: 'Expired', color: '#EF4444', order: 5, isTerminal: true, isSystemStatus: true },
  ];

  for (const s of statusesData) {
    await Status.findOneAndUpdate({ name: s.name }, s, { upsert: true, new: true });
  }

  // 3. Seed Reference Data
  const depts = ['Operations', 'Logistics', 'Customer Service', 'Finance', 'Legal'];
  for (const d of depts) {
    await Department.findOneAndUpdate({ name: d }, { name: d, description: `${d} department` }, { upsert: true });
  }

  const jobs = ['Customs Clearance', 'Freight Forwarding', 'Warehousing Inspection', 'Express Delivery', 'Safety Audit'];
  for (const j of jobs) {
    await Job.findOneAndUpdate({ name: j }, { name: j, description: `${j} workflow` }, { upsert: true });
  }

  const areas = ['Central Hub', 'North Terminal', 'Port Authority', 'Airport Cargo', 'West Depot'];
  for (const a of areas) {
    await Area.findOneAndUpdate({ name: a }, { name: a, description: `${a} zone` }, { upsert: true });
  }

  const types = ['Import Entry', 'Export Declaration', 'Transit Document', 'Inspection Permit', 'Commercial Invoice'];
  for (const t of types) {
    await RecordType.findOneAndUpdate({ name: t }, { name: t, description: `${t} document type` }, { upsert: true });
  }

  // 4. System Settings
  await SystemSettings.findOneAndUpdate(
    {},
    { expirationPeriodDays: 7, companyName: 'Euro Choice', supportEmail: 'support@eurochoice.com' },
    { upsert: true, new: true }
  );

  // 5. Seed Custom Fields
  const priorityField = await CustomField.findOneAndUpdate(
    { key: 'priority' },
    {
      key: 'priority',
      label: 'Priority',
      type: 'dropdown',
      options: ['Low', 'Medium', 'High', 'Urgent'],
      appliesTo: 'record',
      required: false,
      order: 1,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  await CustomField.findOneAndUpdate(
    { key: 'cargo_weight_kg' },
    {
      key: 'cargo_weight_kg',
      label: 'Cargo Weight (kg)',
      type: 'number',
      options: [],
      appliesTo: 'record',
      required: false,
      order: 2,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  await CustomField.findOneAndUpdate(
    { key: 'contact_preference' },
    {
      key: 'contact_preference',
      label: 'Contact Preference',
      type: 'dropdown',
      options: ['Email', 'Phone', 'Direct Dispatch'],
      appliesTo: 'client',
      required: false,
      order: 1,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  // 6. Seed Users
  const adminRole = await Role.findOne({ name: 'Admin' });
  const employeeRole = await Role.findOne({ name: 'Employee' });
  const defaultDept = await Department.findOne({ name: 'Operations' });

  const adminHash = await bcrypt.hash('Admin123!', 12);
  const employeeHash = await bcrypt.hash('Employee123!', 12);

  const adminUser = await User.findOneAndUpdate(
    { email: 'admin@eurochoice.com' },
    {
      name: 'System Administrator',
      email: 'admin@eurochoice.com',
      passwordHash: adminHash,
      role: adminRole!._id,
      department: defaultDept?._id,
      permissions: [],
      accountStatus: 'active',
    },
    { upsert: true, new: true }
  );

  const empUser = await User.findOneAndUpdate(
    { email: 'employee@eurochoice.com' },
    {
      name: 'Elena Rostova',
      email: 'employee@eurochoice.com',
      passwordHash: employeeHash,
      role: employeeRole!._id,
      department: defaultDept?._id,
      permissions: [],
      accountStatus: 'active',
    },
    { upsert: true, new: true }
  );

  // 7. Seed Clients
  const clientsData = [
    {
      name: 'Apex Freight Logistics GmbH',
      email: 'operations@apexfreight.de',
      phone: '+49 40 555 0192',
      company: 'Apex Logistics Europe',
      notes: 'Key maritime logistics account for Port Authority route.',
    },
    {
      name: 'Nordic Global Import AB',
      email: 'clearance@nordicglobal.se',
      phone: '+46 8 123 4567',
      company: 'Nordic Global Group',
      notes: 'High-frequency timber and paper goods customs entries.',
    },
    {
      name: 'Rotterdam Distribution Hub',
      email: 'intake@rdhub.nl',
      phone: '+31 10 987 6543',
      company: 'RDH Intermodal B.V.',
      notes: 'Cross-docking and re-packaging partner.',
    },
  ];

  const seededClients: any[] = [];
  for (const c of clientsData) {
    const doc = await Client.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
    seededClients.push(doc);
  }

  // 8. Seed sample records if empty
  const existingCount = await RecordModel.countDocuments();
  if (existingCount === 0) {
    const openStatus = await Status.findOne({ name: 'Open' });
    const inProgressStatus = await Status.findOne({ name: 'In Progress' });
    const opDept = await Department.findOne({ name: 'Operations' });
    const job1 = await Job.findOne({ name: 'Customs Clearance' });
    const area1 = await Area.findOne({ name: 'Port Authority' });
    const type1 = await RecordType.findOne({ name: 'Import Entry' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const rec1Id = await generateUniqueRecordId();
    const subDate1 = new Date();
    const expDate1 = new Date(subDate1);
    expDate1.setDate(expDate1.getDate() + 7);

    const rec1 = await RecordModel.create({
      uniqueId: rec1Id,
      client: seededClients[0]._id,
      clientNameCache: seededClients[0].name,
      department: opDept?._id,
      type: type1?._id,
      area: area1?._id,
      job: job1?._id,
      status: openStatus?._id,
      submissionDate: subDate1,
      endDate: tomorrow,
      shortText: 'Express maritime customs entry for Hamburg container #4021',
      longText: 'Documentation verified against EU TARIC standards. Customs bond pending clearance approval.',
      customFieldValues: priorityField ? [{ fieldId: priorityField._id, value: 'High' }] : [],
      dependencies: [],
      createdBy: adminUser._id,
      expiresAt: expDate1,
      isExpired: false,
    });

    await logActionHistory({
      recordId: rec1._id.toString(),
      clientId: seededClients[0]._id.toString(),
      action: 'created',
      userId: adminUser._id.toString(),
      meta: { uniqueId: rec1Id, note: 'Initial seed record' },
    });

    const rec2Id = await generateUniqueRecordId();
    const subDate2 = new Date();
    const expDate2 = new Date(subDate2);
    expDate2.setDate(expDate2.getDate() + 7);

    const rec2 = await RecordModel.create({
      uniqueId: rec2Id,
      client: seededClients[1]._id,
      clientNameCache: seededClients[1].name,
      department: opDept?._id,
      type: type1?._id,
      area: area1?._id,
      job: job1?._id,
      status: inProgressStatus?._id,
      submissionDate: subDate2,
      endDate: inThreeDays,
      shortText: 'Nordic timber consignment export declaration',
      longText: 'Sanitary inspection certificate attached. Awaiting customs stamp.',
      customFieldValues: priorityField ? [{ fieldId: priorityField._id, value: 'Urgent' }] : [],
      dependencies: [rec1._id],
      createdBy: empUser._id,
      expiresAt: expDate2,
      isExpired: false,
    });

    await logActionHistory({
      recordId: rec2._id.toString(),
      clientId: seededClients[1]._id.toString(),
      action: 'created',
      userId: empUser._id.toString(),
      meta: { uniqueId: rec2Id },
    });

    await logActionHistory({
      recordId: rec2._id.toString(),
      action: 'dependency_added',
      userId: empUser._id.toString(),
      meta: { dependsOn: rec1Id },
    });
  }

  logger.info('Database seeding completed successfully.');
}
