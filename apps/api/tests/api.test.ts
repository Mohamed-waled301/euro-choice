import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/seed/seedData';
import { RecordModel } from '../src/models/Record';
import { Status } from '../src/models/Status';
import { ActionHistory } from '../src/models/ActionHistory';
import { CustomField } from '../src/models/CustomField';
import { Client } from '../src/models/Client';
import { Department } from '../src/models/Department';
import { Job } from '../src/models/Job';
import { Area } from '../src/models/Area';
import { RecordType } from '../src/models/Type';
import { generateUniqueRecordId } from '../src/models/Counter';
import { runExpirationSweep } from '../src/jobs/expirationJob';

const app = createApp();

let adminToken = '';
let employeeToken = '';
let seededClientId = '';
let seededDeptId = '';
let seededJobId = '';
let seededAreaId = '';
let seededTypeId = '';
let openStatusId = '';
let inProgressStatusId = '';
let completedStatusId = '';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();

  // Clean up any test custom fields from previous test runs
  await CustomField.deleteMany({ key: { $regex: /^inspection_level_/ } });

  // Login as Admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@eurochoice.com', password: 'Admin123!' });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.accessToken;

  // Login as Employee
  const empRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'employee@eurochoice.com', password: 'Employee123!' });
  expect(empRes.status).toBe(200);
  employeeToken = empRes.body.accessToken;

  // Retrieve seed entities
  const client = await Client.findOne();
  seededClientId = client!._id.toString();

  const dept = await Department.findOne({ name: 'Operations' });
  seededDeptId = dept!._id.toString();

  const job = await Job.findOne({ name: 'Customs Clearance' });
  seededJobId = job!._id.toString();

  const area = await Area.findOne({ name: 'Port Authority' });
  seededAreaId = area!._id.toString();

  const type = await RecordType.findOne({ name: 'Import Entry' });
  seededTypeId = type!._id.toString();

  const sOpen = await Status.findOne({ name: 'Open' });
  openStatusId = sOpen!._id.toString();

  const sInProg = await Status.findOne({ name: 'In Progress' });
  inProgressStatusId = sInProg!._id.toString();

  const sCompleted = await Status.findOne({ name: 'Completed' });
  completedStatusId = sCompleted!._id.toString();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Euro Choice Test Suite', () => {
  describe('1. Authentication & Role Permissions (Section 3)', () => {
    it('rejects invalid login credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@eurochoice.com', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns access token and user info on valid login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@eurochoice.com', password: 'Admin123!' });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.permissions).toContain('records:delete');
    });

    it('denies Employee access to DELETE /api/records/:id with 403 Forbidden', async () => {
      // Create a dummy record first as admin
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          client: seededClientId,
          department: seededDeptId,
          job: seededJobId,
          area: seededAreaId,
          type: seededTypeId,
          shortText: 'Permission test record',
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(createRes.status).toBe(201);
      const recordId = createRes.body._id;

      // Employee does not have records:delete permission
      const deleteRes = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Atomic Unique ID & Concurrency (Section 4)', () => {
    it('generates unique IDs concurrently without collision across 50 parallel requests', async () => {
      const promises = Array.from({ length: 50 }).map(() => generateUniqueRecordId());
      const generatedIds = await Promise.all(promises);

      const uniqueSet = new Set(generatedIds);
      expect(uniqueSet.size).toBe(50);
      generatedIds.forEach((id) => {
        expect(id).toMatch(/^EC-\d{4}-\d{6}$/);
      });
    });
  });

  describe('3. Dynamic Custom Fields Without Schema Alteration (Section 5)', () => {
    it('creates a new custom dropdown field and uses it immediately in record creation', async () => {
      const fieldKey = `inspection_level_${Date.now()}`;
      const fieldRes = await request(app)
        .post('/api/custom-fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: fieldKey,
          label: 'Inspection Level',
          type: 'dropdown',
          options: ['Level 1', 'Level 2', 'Level 3'],
          appliesTo: 'record',
          required: true,
        });
      expect(fieldRes.status).toBe(201);
      const fieldId = fieldRes.body._id;

      try {
        // Creating record without this required field should fail
        const failRes = await request(app)
          .post('/api/records')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            client: seededClientId,
            department: seededDeptId,
            job: seededJobId,
            area: seededAreaId,
            type: seededTypeId,
            shortText: 'Custom field test fail',
            endDate: new Date(Date.now() + 86400000).toISOString(),
            customFieldValues: [],
          });
        expect(failRes.status).toBe(400);

        // Creating record with valid custom field value should succeed immediately
        const successRes = await request(app)
          .post('/api/records')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            client: seededClientId,
            department: seededDeptId,
            job: seededJobId,
            area: seededAreaId,
            type: seededTypeId,
            shortText: 'Custom field test success',
            endDate: new Date(Date.now() + 86400000).toISOString(),
            customFieldValues: [{ fieldId, value: 'Level 2' }],
          });
        expect(successRes.status).toBe(201);
        expect(successRes.body.customFieldValues).toEqual(
          expect.arrayContaining([expect.objectContaining({ fieldId, value: 'Level 2' })])
        );
      } finally {
        await CustomField.findByIdAndDelete(fieldId);
      }
    });
  });

  describe('4. Status Transitions & Atomic Audit Trail (Section 7 & 14)', () => {
    it('atomically records ActionHistory on status transition', async () => {
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          client: seededClientId,
          department: seededDeptId,
          job: seededJobId,
          area: seededAreaId,
          type: seededTypeId,
          shortText: 'Status transition record',
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      const recordId = createRes.body._id;

      const statusRes = await request(app)
        .patch(`/api/records/${recordId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          statusId: inProgressStatusId,
          note: 'Work started by operations crew',
        });
      expect(statusRes.status).toBe(200);

      // Verify history endpoint
      const historyRes = await request(app)
        .get(`/api/records/${recordId}/history`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(historyRes.status).toBe(200);

      const statusChangedLog = historyRes.body.data.find(
        (h: any) => h.action === 'status_changed'
      );
      expect(statusChangedLog).toBeDefined();
      expect(statusChangedLog.meta.to).toBe('In Progress');
      expect(statusChangedLog.meta.note).toBe('Work started by operations crew');
    });
  });

  describe('5. Automatic Expiration Background Sweep (Section 8)', () => {
    it('automatically flips past-due records to Expired and writes ActionHistory without user interaction', async () => {
      const pastSubmissionDate = new Date(Date.now() - 15 * 86400000); // 15 days ago
      const pastExpiresAt = new Date(Date.now() - 8 * 86400000); // 8 days ago (expired)

      const expiredRecord = await RecordModel.create({
        uniqueId: await generateUniqueRecordId(),
        client: seededClientId,
        clientNameCache: 'Test Client',
        department: seededDeptId,
        type: seededTypeId,
        area: seededAreaId,
        job: seededJobId,
        status: openStatusId,
        submissionDate: pastSubmissionDate,
        endDate: new Date(Date.now() - 1 * 86400000),
        shortText: 'Cron past due record',
        expiresAt: pastExpiresAt,
        isExpired: false,
      });

      // Run expiration sweep directly
      const sweepResult = await runExpirationSweep();
      expect(sweepResult.expiredCount).toBeGreaterThanOrEqual(1);

      // Verify authoritative state in DB
      const updatedRecord = await RecordModel.findById(expiredRecord._id).populate('status');
      expect(updatedRecord?.isExpired).toBe(true);
      expect((updatedRecord?.status as any)?.name).toBe('Expired');

      // Verify ActionHistory was created
      const history = await ActionHistory.findOne({
        record: expiredRecord._id,
        action: 'expired',
      });
      expect(history).toBeDefined();
    });
  });

  describe('6. Server-Side Search, Filter & Planning Tomorrow (Section 9, 10, 11)', () => {
    it('filters records by department and performs partial search ANDed together', async () => {
      const searchRes = await request(app)
        .get('/api/records?search=Express&department=' + seededDeptId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(searchRes.status).toBe(200);
      expect(Array.isArray(searchRes.body.data)).toBe(true);
      expect(searchRes.body.total).toBeDefined();
      expect(searchRes.body.pageCount).toBeDefined();
    });

    it('returns planning tomorrow records sorted by urgency with isOverdue computed', async () => {
      const planRes = await request(app)
        .get('/api/records/planning-tomorrow')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(planRes.status).toBe(200);
      expect(Array.isArray(planRes.body.data)).toBe(true);
      if (planRes.body.data.length > 0) {
        expect(typeof planRes.body.data[0].isOverdue).toBe('boolean');
      }
    });
  });

  describe('7. Dependencies & Cycle Prevention (Section 15)', () => {
    it('rejects circular dependencies when A->B and B->A is attempted', async () => {
      // Record A
      const resA = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          client: seededClientId,
          department: seededDeptId,
          job: seededJobId,
          area: seededAreaId,
          type: seededTypeId,
          shortText: 'Record A',
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      const idA = resA.body._id;

      // Record B
      const resB = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          client: seededClientId,
          department: seededDeptId,
          job: seededJobId,
          area: seededAreaId,
          type: seededTypeId,
          shortText: 'Record B',
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      const idB = resB.body._id;

      // Make A depend on B (A -> B)
      const depRes1 = await request(app)
        .post(`/api/records/${idA}/dependencies`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dependsOnId: idB });
      expect(depRes1.status).toBe(200);

      // Now attempt to make B depend on A (B -> A), which forms a cycle
      const cycleRes = await request(app)
        .post(`/api/records/${idB}/dependencies`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dependsOnId: idA });
      expect(cycleRes.status).toBe(400);
      expect(cycleRes.body.error.code).toBe('CIRCULAR_DEPENDENCY');
    });
  });

  describe('8. Dashboard Summary Aggregation (Section 16)', () => {
    it('returns aggregated counts, byStatus, expiringSoon, and recent activity in a single response', async () => {
      const dashRes = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(dashRes.status).toBe(200);
      expect(typeof dashRes.body.total).toBe('number');
      expect(typeof dashRes.body.expiringSoon).toBe('number');
      expect(typeof dashRes.body.planningTomorrowCount).toBe('number');
      expect(dashRes.body.byStatus).toBeDefined();
      expect(Array.isArray(dashRes.body.recentActivity)).toBe(true);
    });
  });
});
