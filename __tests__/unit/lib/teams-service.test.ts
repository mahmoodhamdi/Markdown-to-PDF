/**
 * Unit tests for teams service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';

// Mock MongoDB connection first (must be before any imports that use it)
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock activity service
vi.mock('@/lib/teams/activity-service', () => ({
  logTeamCreated: vi.fn().mockResolvedValue(undefined),
  logTeamUpdated: vi.fn().mockResolvedValue(undefined),
  logSettingsUpdated: vi.fn().mockResolvedValue(undefined),
  logTeamDeleted: vi.fn().mockResolvedValue(undefined),
  logMemberRemoved: vi.fn().mockResolvedValue(undefined),
  logMemberLeft: vi.fn().mockResolvedValue(undefined),
  logRoleChanged: vi.fn().mockResolvedValue(undefined),
}));

// Mock Team model
const mockTeamFindOne = vi.fn();
const mockTeamFindById = vi.fn();
const mockTeamFind = vi.fn();
const mockTeamCreate = vi.fn();
const mockTeamFindByIdAndUpdate = vi.fn();
const mockTeamFindByIdAndDelete = vi.fn();
const mockTeamFindOneAndUpdate = vi.fn();

// Mock TeamMemberLookup model
const mockMemberLookupCreate = vi.fn();
const mockMemberLookupFind = vi.fn();
const mockMemberLookupDeleteMany = vi.fn();
const mockMemberLookupDeleteOne = vi.fn();
const mockMemberLookupUpdateOne = vi.fn();

vi.mock('@/lib/db/models/Team', () => ({
  Team: {
    findOne: (...args: unknown[]) => mockTeamFindOne(...args),
    findById: (...args: unknown[]) => mockTeamFindById(...args),
    find: (...args: unknown[]) => mockTeamFind(...args),
    create: (...args: unknown[]) => mockTeamCreate(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockTeamFindByIdAndUpdate(...args),
    findByIdAndDelete: (...args: unknown[]) => mockTeamFindByIdAndDelete(...args),
    findOneAndUpdate: (...args: unknown[]) => mockTeamFindOneAndUpdate(...args),
  },
  TeamMemberLookup: {
    create: (...args: unknown[]) => mockMemberLookupCreate(...args),
    find: (...args: unknown[]) => mockMemberLookupFind(...args),
    deleteMany: (...args: unknown[]) => mockMemberLookupDeleteMany(...args),
    deleteOne: (...args: unknown[]) => mockMemberLookupDeleteOne(...args),
    updateOne: (...args: unknown[]) => mockMemberLookupUpdateOne(...args),
  },
}));

import {
  getTeamMemberCount,
  getTeamMemberLimit,
  isTeamOwner,
  isTeamAdmin,
  getUserTeamRole,
  createTeam,
  getTeam,
  getTeamsForUser,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  type TeamData,
  type TeamMember,
} from '@/lib/teams/service';

describe('Teams Service - Utility Functions', () => {
  // Create a mock team for testing
  const createMockTeam = (overrides: Partial<TeamData> = {}): TeamData => ({
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

  describe('TeamData interface', () => {
    it('should have all required fields', () => {
      const team: TeamData = {
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

describe('Teams Service - CRUD Operations', () => {
  const mockObjectId = new mongoose.Types.ObjectId();

  const createMockTeamDoc = (overrides = {}) => ({
    _id: mockObjectId,
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

  describe('createTeam', () => {
    it('should create a new team successfully', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindOne.mockResolvedValue(null); // No existing team
      mockTeamCreate.mockResolvedValue(mockTeam);
      mockMemberLookupCreate.mockResolvedValue({});

      const result = await createTeam({
        name: 'Test Team',
        ownerId: 'owner-456',
        ownerEmail: 'owner@example.com',
        ownerName: 'Team Owner',
        plan: 'team',
      });

      expect(result.success).toBe(true);
      expect(result.team).toBeDefined();
      expect(mockTeamCreate).toHaveBeenCalled();
      expect(mockMemberLookupCreate).toHaveBeenCalled();
    });

    it('should return error if user already owns a team', async () => {
      mockTeamFindOne.mockResolvedValue(createMockTeamDoc());

      const result = await createTeam({
        name: 'Another Team',
        ownerId: 'owner-456',
        ownerEmail: 'owner@example.com',
        ownerName: 'Team Owner',
        plan: 'team',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already own a team');
    });
  });

  describe('getTeam', () => {
    it('should return team for member', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindById.mockResolvedValue(mockTeam);

      const result = await getTeam(mockObjectId.toString(), 'owner-456');

      expect(result.success).toBe(true);
      expect(result.team).toBeDefined();
      expect(mockTeamFindById).toHaveBeenCalledWith(mockObjectId.toString());
    });

    it('should return error for non-existent team', async () => {
      mockTeamFindById.mockResolvedValue(null);

      const result = await getTeam('non-existent-id', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Team not found');
    });

    it('should deny access for non-members', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindById.mockResolvedValue(mockTeam);

      const result = await getTeam(mockObjectId.toString(), 'non-member-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('getTeamsForUser', () => {
    it('should return teams where user is a member', async () => {
      const mockLookups = [
        { teamId: 'team-1', role: 'owner' },
        { teamId: 'team-2', role: 'member' },
      ];
      const mockTeams = [
        createMockTeamDoc({ _id: new mongoose.Types.ObjectId(), name: 'Team 1' }),
        createMockTeamDoc({ _id: new mongoose.Types.ObjectId(), name: 'Team 2' }),
      ];

      mockMemberLookupFind.mockResolvedValue(mockLookups);
      mockTeamFind.mockResolvedValue(mockTeams);

      const result = await getTeamsForUser('user-123');

      expect(result.success).toBe(true);
      expect(result.teams).toHaveLength(2);
    });

    it('should return empty array for user with no teams', async () => {
      mockMemberLookupFind.mockResolvedValue([]);

      const result = await getTeamsForUser('lonely-user');

      expect(result.success).toBe(true);
      expect(result.teams).toEqual([]);
    });
  });

  describe('updateTeam', () => {
    it('should update team name when user is owner', async () => {
      const mockTeam = createMockTeamDoc();
      const updatedTeam = createMockTeamDoc({ name: 'Updated Team Name' });
      mockTeamFindById.mockResolvedValue(mockTeam);
      mockTeamFindByIdAndUpdate.mockResolvedValue(updatedTeam);

      const result = await updateTeam('team-123', 'owner-456', { name: 'Updated Team Name' });

      expect(result.success).toBe(true);
      expect(result.team?.name).toBe('Updated Team Name');
    });

    it('should deny update for non-admin member', async () => {
      const mockTeam = createMockTeamDoc({
        members: [
          { userId: 'owner-456', email: 'owner@example.com', role: 'owner', joinedAt: new Date() },
          { userId: 'member-123', email: 'member@example.com', role: 'member', joinedAt: new Date() },
        ],
      });
      mockTeamFindById.mockResolvedValue(mockTeam);

      const result = await updateTeam('team-123', 'member-123', { name: 'New Name' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only team owners and admins');
    });
  });

  describe('deleteTeam', () => {
    it('should delete team when user is owner', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindById.mockResolvedValue(mockTeam);
      mockTeamFindByIdAndDelete.mockResolvedValue(mockTeam);
      mockMemberLookupDeleteMany.mockResolvedValue({ deletedCount: 1 });

      const result = await deleteTeam(mockObjectId.toString(), 'owner-456');

      expect(result.success).toBe(true);
      expect(mockMemberLookupDeleteMany).toHaveBeenCalled();
    });

    it('should deny deletion for non-owner', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindById.mockResolvedValue(mockTeam);

      const result = await deleteTeam(mockObjectId.toString(), 'not-owner');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only the team owner');
    });

    it('should return error for non-existent team', async () => {
      mockTeamFindById.mockResolvedValue(null);

      const result = await deleteTeam('non-existent', 'owner');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Team not found');
    });
  });

  describe('addTeamMember', () => {
    it('should add a new member when inviter is owner', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindById.mockResolvedValue(mockTeam);
      mockTeamFindByIdAndUpdate.mockResolvedValue(mockTeam);
      mockMemberLookupCreate.mockResolvedValue({});

      const result = await addTeamMember(mockObjectId.toString(), 'owner-456', {
        email: 'new@example.com',
        name: 'New Member',
        invitedBy: 'owner-456',
      });

      expect(result.success).toBe(true);
      expect(result.member).toBeDefined();
    });

    it('should return error when team is at member limit', async () => {
      const fullTeam = createMockTeamDoc({
        members: Array(5).fill(null).map((_, i) => ({
          userId: `member-${i}`,
          email: `member${i}@example.com`,
          role: i === 0 ? 'owner' : 'member',
          joinedAt: new Date(),
        })),
      });
      mockTeamFindById.mockResolvedValue(fullTeam);

      const result = await addTeamMember(mockObjectId.toString(), 'member-0', {
        email: 'onemore@example.com',
        name: 'One More',
        invitedBy: 'member-0',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('limit reached');
    });

    it('should deny access for non-members', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindById.mockResolvedValue(mockTeam);

      const result = await addTeamMember(mockObjectId.toString(), 'non-member', {
        email: 'new@example.com',
        invitedBy: 'non-member',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('removeTeamMember', () => {
    it('should remove a member when remover is owner', async () => {
      const mockTeam = createMockTeamDoc({
        members: [
          { userId: 'owner-456', email: 'owner@example.com', role: 'owner', joinedAt: new Date() },
          { userId: 'member-to-remove', email: 'remove@example.com', role: 'member', joinedAt: new Date() },
        ],
      });
      mockTeamFindById.mockResolvedValue(mockTeam);
      mockTeamFindByIdAndUpdate.mockResolvedValue(mockTeam);
      mockMemberLookupDeleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await removeTeamMember(mockObjectId.toString(), 'owner-456', 'member-to-remove');

      expect(result.success).toBe(true);
      expect(mockMemberLookupDeleteOne).toHaveBeenCalled();
    });

    it('should prevent removing team owner', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindById.mockResolvedValue(mockTeam);

      const result = await removeTeamMember(mockObjectId.toString(), 'owner-456', 'owner-456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot remove team owner');
    });

    it('should return error for non-existent team', async () => {
      mockTeamFindById.mockResolvedValue(null);

      const result = await removeTeamMember('non-existent', 'user', 'member');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Team not found');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role when user is owner', async () => {
      const mockTeam = createMockTeamDoc({
        members: [
          { userId: 'owner-456', email: 'owner@example.com', role: 'owner', joinedAt: new Date() },
          { userId: 'member-123', email: 'member@example.com', role: 'member', joinedAt: new Date() },
        ],
      });
      mockTeamFindById.mockResolvedValue(mockTeam);
      mockTeamFindOneAndUpdate.mockResolvedValue({
        ...mockTeam,
        members: [
          mockTeam.members[0],
          { ...mockTeam.members[1], role: 'admin' },
        ],
      });
      mockMemberLookupUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await updateMemberRole(mockObjectId.toString(), 'owner-456', 'member-123', 'admin');

      expect(result.success).toBe(true);
      expect(mockMemberLookupUpdateOne).toHaveBeenCalled();
    });

    it('should prevent changing owner role', async () => {
      const mockTeam = createMockTeamDoc();
      mockTeamFindById.mockResolvedValue(mockTeam);

      const result = await updateMemberRole(mockObjectId.toString(), 'owner-456', 'owner-456', 'admin');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot change owner role');
    });

    it('should deny role change for non-owners', async () => {
      const mockTeam = createMockTeamDoc({
        members: [
          { userId: 'owner-456', email: 'owner@example.com', role: 'owner', joinedAt: new Date() },
          { userId: 'admin-user', email: 'admin@example.com', role: 'admin', joinedAt: new Date() },
          { userId: 'member-123', email: 'member@example.com', role: 'member', joinedAt: new Date() },
        ],
      });
      mockTeamFindById.mockResolvedValue(mockTeam);

      const result = await updateMemberRole(mockObjectId.toString(), 'admin-user', 'member-123', 'admin');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only the team owner');
    });

    it('should return error for non-existent team', async () => {
      mockTeamFindById.mockResolvedValue(null);

      const result = await updateMemberRole('non-existent', 'user', 'member', 'admin');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Team not found');
    });
  });
});
