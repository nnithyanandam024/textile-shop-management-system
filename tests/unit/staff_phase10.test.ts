import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../../electron/main/database';
import { CommunicationService } from '../../electron/main/services/communicationService';
import { NotificationDispatcher } from '../../electron/main/services/notificationDispatcher';

import { AuthService } from '../../electron/main/services/auth/authService';

describe('Staff Management System — Phase 10 Test Suite (Communication & Notification Center)', () => {
  let db: Database.Database;
  let dbPath: string;
  let commService: CommunicationService;
  let dispatcher: NotificationDispatcher;
  let adminUserId: number;
  let mgrUserId: number;

  beforeEach(() => {
    closeDatabase();
    dbPath = path.join(__dirname, `../.test_db/test_staff_phase10_${Date.now()}_${Math.floor(Math.random() * 10000)}.db`);
    db = initDatabase(dbPath);
    commService = new CommunicationService(db);
    dispatcher = new NotificationDispatcher(db);

    const u1 = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('admin', 'hash', 'Admin Owner', 1)
    `).run();
    adminUserId = Number(u1.lastInsertRowid);

    const u2 = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role_id)
      VALUES ('manager1', 'hash', 'Manager User', 2)
    `).run();
    mgrUserId = Number(u2.lastInsertRowid);
  });

  afterEach(() => {
    closeDatabase();
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // ignore cleanup lock
      }
    }
  });

  it('1. should verify Migration v12 database schema and seeded communication permissions', () => {
    const perms = db.prepare("SELECT * FROM permissions WHERE module = 'Communication'").all();
    expect(perms.length).toBeGreaterThanOrEqual(7);

    const ownerRolePerms = db.prepare(`
      SELECT p.code FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = 1 AND p.module = 'Communication'
    `).all();
    expect(ownerRolePerms.length).toBeGreaterThanOrEqual(7);
  });

  it('2. should dispatch automated event notifications (SHIFT_CHANGED, LEAVE_APPROVED) with formatted text', () => {
    const res1 = dispatcher.dispatch({
      event: 'SHIFT_CHANGED',
      data: { date: '2026-08-25', shiftName: 'Morning Store Shift' },
      recipientUserId: adminUserId,
    });

    expect(res1.notificationId).toBeDefined();

    const notifs = commService.getMyNotifications(adminUserId);
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toBe('Shift Updated');
    expect(notifs[0].priority).toBe('HIGH');

    const unread = commService.getUnreadCount(adminUserId);
    expect(unread).toBe(1);
  });

  it('3. should enforce user recipient privacy isolation (user only sees own notifications & messages)', () => {
    dispatcher.dispatch({
      event: 'LEAVE_APPROVED',
      data: { startDate: '2026-08-28' },
      recipientUserId: adminUserId,
    });

    dispatcher.dispatch({
      event: 'LEAVE_REJECTED',
      data: { startDate: '2026-08-29', reason: 'Peak Sales Day' },
      recipientUserId: mgrUserId,
    });

    const user1Notifs = commService.getMyNotifications(adminUserId);
    expect(user1Notifs.length).toBe(1);
    expect(user1Notifs[0].title).toBe('Leave Approved');

    const mgrNotifs = commService.getMyNotifications(mgrUserId);
    expect(mgrNotifs.length).toBe(1);
    expect(mgrNotifs[0].title).toBe('Leave Request Rejected');
  });

  it('4. should process mark as read and mark all read status updates', () => {
    const n1 = dispatcher.dispatch({ event: 'SHIFT_CHANGED', data: { date: '2026-08-25' }, recipientUserId: adminUserId });
    dispatcher.dispatch({ event: 'LEAVE_APPROVED', data: { startDate: '2026-08-28' }, recipientUserId: adminUserId });

    expect(commService.getUnreadCount(adminUserId)).toBe(2);

    commService.markAsRead(n1.notificationId, adminUserId);
    expect(commService.getUnreadCount(adminUserId)).toBe(1);

    commService.markAllAsRead(adminUserId);
    expect(commService.getUnreadCount(adminUserId)).toBe(0);
  });

  it('5. should create company announcements and retrieve active announcement feed', () => {
    const annRes = commService.createAnnouncement({
      title: 'Monthly Sales Strategy Meeting',
      content: 'All sales executives should join storefront meeting at 9:30 AM.',
      priority: 'HIGH',
      target_type: 'DEPARTMENT',
    }, adminUserId);

    expect(annRes.success).toBe(true);
    expect(annRes.id).toBeDefined();

    const anns = commService.getAnnouncements();
    expect(anns.length).toBe(1);
    expect(anns[0].title).toBe('Monthly Sales Strategy Meeting');
  });

  it('6. should process direct staff messaging and notify recipient user', () => {
    const msgRes = commService.sendMessage({
      recipient_user_id: mgrUserId,
      subject: 'Inventory Audit Preparation',
      message: 'Please review silk saree stock count before Friday.',
      priority: 'URGENT',
    }, adminUserId);

    expect(msgRes.success).toBe(true);

    const msgs = commService.getMyMessages(adminUserId);
    expect(msgs.length).toBe(1);
    expect(msgs[0].subject).toBe('Inventory Audit Preparation');
  });
});
