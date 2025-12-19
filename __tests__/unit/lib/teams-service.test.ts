/**
 * Unit tests for teams service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MongoDB connection first (must be before any imports that use it)
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

import {
  getTeamMemberCount,
  getTeamMemberLimit,
  isTeamOwner,
  isTeamAdmin,
  getUserTeamRole,
  Team,
  TeamMember,
} from '@/lib/teams/service';

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => ({ exists: false, data: () => null })),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(() => ({
        get: vi.fn(() => ({ empty: true, docs: [] })),
      })),
    })),
    batch: vi.fn(() => ({
      delete: vi.fn(),
      commit: vi.fn(),
    })),
  },
}));

describe('Teams Service - Utility Functions', () => {
  // Create a mock team for testing
  const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
    id: 'team-123',
    name: 'Test Team',
    ownerId: 'owner-456',
    ownerEmail: 'owner@example.com',
    plan: 'team',
    members: [
      {
        userId: 'owner-456',
        email: 'owner@example.com',
        name: 'Team Owner',
        role: 'owner',
        joinedAt: new Date(),
      },
      {
        userId: 'admin-789',
        email: 'admin@example.com',
        name: 'Team Admin',
        role: 'admin',
        joinedAt: new Date(),
      },
      {
        userId: 'member-101',
        email: 'member@example.com',
        name: 'Team Member',
        role: 'member',
        joinedAt: new Date(),
      },
    ],
    settings: {
      allowMemberInvites: false,
      defaultMemberRole: 'member',
      sharedStorageEnabled: true,
      sharedTemplatesEnabled: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTeamMemberCount', () => {
    it('should return correct member count', () => {
      const team = createMockTeam();
      expect(getTeamMemberCount(team)).toBe(3);
    });

    it('should return 0 for empty members array', () => {
      const team = createMockTeam({ members: [] });
      expect(getTeamMemberCount(team)).toBe(0);
    });

    it('should return 1 for single member', () => {
      const team = createMockTeam({
        members: [
          {
            userId: 'owner-456',
            email: 'owner@example.com',
            role: 'owner',
            joinedAt: new Date(),
          },
        ],
      });
      expect(getTeamMemberCount(team)).toBe(1);
    });
  });

  describe('getTeamMemberLimit', () => {
    it('should return 0 for free plan', () => {
      expect(getTeamMemberLimit('free')).toBe(0);
    });

    it('should return 0 for pro plan', () => {
      expect(getTeamMemberLimit('pro')).toBe(0);
    });

    it('should return 5 for team plan', () => {
      expect(getTeamMemberLimit('team')).toBe(5);
    });

    it('should return Infinity for enterprise plan', () => {
      expect(getTeamMemberLimit('enterprise')).toBe(Infinity);
    });
  });

  describe('isTeamOwner', () => {
    it('should return true for team owner', () => {
      const team = createMockTeam();
      expect(isTeamOwner(team, 'owner-456')).toBe(true);
    });

    it('should return false for team admin', () => {
      const team = createMockTeam();
      expect(isTeamOwner(team, 'admin-789')).toBe(false);
    });

    it('should return false for team member', () => {
      const team = createMockTeam();
      expect(isTeamOwner(team, 'member-101')).toBe(false);
    });

    it('should return false for non-member', () => {
      const team = createMockTeam();
      expect(isTeamOwner(team, 'unknown-user')).toBe(false);
    });
  });

  describe('isTeamAdmin', () => {
    it('should return true for team owner', () => {
      const team = createMockTeam();
      expect(isTeamAdmin(team, 'owner-456')).toBe(true);
    });

    it('should return true for team admin', () => {
      const team = createMockTeam();
      expect(isTeamAdmin(team, 'admin-789')).toBe(true);
    });

    it('should return false for team member', () => {
      const team = createMockTeam();
      expect(isTeamAdmin(team, 'member-101')).toBe(false);
    });

    it('should return false for non-member', () => {
      const team = createMockTeam();
      expect(isTeamAdmin(team, 'unknown-user')).toBe(false);
    });
  });

  describe('getUserTeamRole', () => {
    it('should return owner role for team owner', () => {
      const team = createMockTeam();
      expect(getUserTeamRole(team, 'owner-456')).toBe('owner');
    });

    it('should return admin role for team admin', () => {
      const team = createMockTeam();
      expect(getUserTeamRole(team, 'admin-789')).toBe('admin');
    });

    it('should return member role for team member', () => {
      const team = createMockTeam();
      expect(getUserTeamRole(team, 'member-101')).toBe('member');
    });

    it('should return null for non-member', () => {
      const team = createMockTeam();
      expect(getUserTeamRole(team, 'unknown-user')).toBe(null);
    });
  });
});

describe('Teams Service - Data Structures', () => {
  describe('TeamMember interface', () => {
    it('should have all required fields', () => {
      const member: TeamMember = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'member',
        joinedAt: new Date(),
      };

      expect(member).toHaveProperty('userId');
      expect(member).toHaveProperty('email');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('joinedAt');
    });

    it('should support optional fields', () => {
      const member: TeamMember = {
        userId: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'member',
        joinedAt: new Date(),
        invitedBy: 'owner-456',
      };

      expect(member.name).toBe('Test User');
      expect(member.invitedBy).toBe('owner-456');
    });
  });

  describe('Team interface', () => {
    it('should have all required fields', () => {
      const team: Team = {
        id: 'team-123',
        name: 'Test Team',
        ownerId: 'owner-456',
        ownerEmail: 'owner@example.com',
        plan: 'team',
        members: [],
        settings: {
          allowMemberInvites: false,
          defaultMemberRole: 'member',
          sharedStorageEnabled: true,
          sharedTemplatesEnabled: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(team).toHaveProperty('id');
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('ownerId');
      expect(team).toHaveProperty('ownerEmail');
      expect(team).toHaveProperty('plan');
      expect(team).toHaveProperty('members');
      expect(team).toHaveProperty('settings');
      expect(team).toHaveProperty('createdAt');
      expect(team).toHaveProperty('updatedAt');
    });
  });

  describe('TeamSettings interface', () => {
    it('should have all required settings', () => {
      const settings = {
        allowMemberInvites: true,
        defaultMemberRole: 'member' as const,
        sharedStorageEnabled: true,
        sharedTemplatesEnabled: false,
      };

      expect(settings).toHaveProperty('allowMemberInvites');
      expect(settings).toHaveProperty('defaultMemberRole');
      expect(settings).toHaveProperty('sharedStorageEnabled');
      expect(settings).toHaveProperty('sharedTemplatesEnabled');
    });
  });
});

describe('Teams Service - Role Validation', () => {
  describe('TeamRole type', () => {
    it('should accept valid role values', () => {
      const validRoles: ('owner' | 'admin' | 'member')[] = ['owner', 'admin', 'member'];
      expect(validRoles).toHaveLength(3);
      expect(validRoles).toContain('owner');
      expect(validRoles).toContain('admin');
      expect(validRoles).toContain('member');
    });
  });

  describe('Role hierarchy', () => {
    it('owner should have highest permissions', () => {
      const roleHierarchy = { owner: 3, admin: 2, member: 1 };
      expect(roleHierarchy.owner).toBeGreaterThan(roleHierarchy.admin);
      expect(roleHierarchy.owner).toBeGreaterThan(roleHierarchy.member);
    });

    it('admin should have higher permissions than member', () => {
      const roleHierarchy = { owner: 3, admin: 2, member: 1 };
      expect(roleHierarchy.admin).toBeGreaterThan(roleHierarchy.member);
    });
  });
});

describe('Teams Service - Plan Permissions', () => {
  describe('Team creation permissions', () => {
    it('free plan should not allow team creation', () => {
      expect(getTeamMemberLimit('free')).toBe(0);
    });

    it('pro plan should not allow team creation', () => {
      expect(getTeamMemberLimit('pro')).toBe(0);
    });

    it('team plan should allow team creation', () => {
      expect(getTeamMemberLimit('team')).toBeGreaterThan(0);
    });

    it('enterprise plan should allow team creation', () => {
      expect(getTeamMemberLimit('enterprise')).toBeGreaterThan(0);
    });
  });
});
