/**
 * Integration tests for Teams API endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock auth config
vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    limit: 60,
    remaining: 59,
    reset: Date.now() + 60000,
  })),
  getRateLimitHeaders: vi.fn(() => ({
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': '59',
    'X-RateLimit-Reset': String(Date.now() + 60000),
  })),
}));

// Mock teams service
vi.mock('@/lib/teams/service', () => ({
  createTeam: vi.fn(),
  getTeam: vi.fn(),
  getTeamsForUser: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  addTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  updateMemberRole: vi.fn(),
}));

// Mock plans config
vi.mock('@/lib/plans/config', () => ({
  getPlanLimits: vi.fn((plan: string) => {
    const limits: Record<string, { teamMembersAllowed: number }> = {
      free: { teamMembersAllowed: 0 },
      pro: { teamMembersAllowed: 0 },
      team: { teamMembersAllowed: 5 },
      enterprise: { teamMembersAllowed: Infinity },
    };
    return limits[plan] || limits.free;
  }),
}));

import { getServerSession } from 'next-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  createTeam,
  getTeam,
  getTeamsForUser,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
} from '@/lib/teams/service';

const mockGetServerSession = vi.mocked(getServerSession);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockCreateTeam = vi.mocked(createTeam);
const mockGetTeam = vi.mocked(getTeam);
const mockGetTeamsForUser = vi.mocked(getTeamsForUser);
const mockUpdateTeam = vi.mocked(updateTeam);
const mockDeleteTeam = vi.mocked(deleteTeam);
const mockAddTeamMember = vi.mocked(addTeamMember);
const mockRemoveTeamMember = vi.mocked(removeTeamMember);
const mockUpdateMemberRole = vi.mocked(updateMemberRole);

describe('Teams API - List Teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { GET } = await import('@/app/api/teams/route');
    const request = new NextRequest('http://localhost/api/teams', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return empty list for user with no teams', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockGetTeamsForUser.mockResolvedValue({
      success: true,
      teams: [],
    });

    const { GET } = await import('@/app/api/teams/route');
    const request = new NextRequest('http://localhost/api/teams', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.teams).toEqual([]);
  });

  it('should return list of teams', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockGetTeamsForUser.mockResolvedValue({
      success: true,
      teams: [
        {
          id: 'team-1',
          name: 'Team 1',
          ownerId: 'user-123',
          ownerEmail: 'user@example.com',
          plan: 'team',
          members: [
            { userId: 'user-123', email: 'user@example.com', role: 'owner', joinedAt: new Date() },
          ],
          settings: {
            allowMemberInvites: false,
            defaultMemberRole: 'member',
            sharedStorageEnabled: true,
            sharedTemplatesEnabled: true,
          },
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ],
    });

    const { GET } = await import('@/app/api/teams/route');
    const request = new NextRequest('http://localhost/api/teams', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.teams).toHaveLength(1);
    expect(data.teams[0].name).toBe('Team 1');
    expect(data.teams[0].isOwner).toBe(true);
  });
});

describe('Teams API - Create Team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { POST } = await import('@/app/api/teams/route');
    const request = new NextRequest('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Team' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should deny team creation for free plan', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
    });

    const { POST } = await import('@/app/api/teams/route');
    const request = new NextRequest('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Team' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('not available on your plan');
  });

  it('should create team for team plan users', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', name: 'Test User', plan: 'team' },
    });

    mockCreateTeam.mockResolvedValue({
      success: true,
      team: {
        id: 'team-123',
        name: 'Test Team',
        ownerId: 'user-123',
        ownerEmail: 'user@example.com',
        plan: 'team',
        members: [
          { userId: 'user-123', email: 'user@example.com', role: 'owner', joinedAt: new Date() },
        ],
        settings: {
          allowMemberInvites: false,
          defaultMemberRole: 'member',
          sharedStorageEnabled: true,
          sharedTemplatesEnabled: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const { POST } = await import('@/app/api/teams/route');
    const request = new NextRequest('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Team' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.team.name).toBe('Test Team');
    expect(data.team.role).toBe('owner');
  });

  it('should validate team name', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    const { POST } = await import('@/app/api/teams/route');
    const request = new NextRequest('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });
});

describe('Teams API - Get Team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 120,
      remaining: 119,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { GET } = await import('@/app/api/teams/[teamId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ teamId: 'team-123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return team details for member', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockGetTeam.mockResolvedValue({
      success: true,
      team: {
        id: 'team-123',
        name: 'Test Team',
        ownerId: 'user-123',
        ownerEmail: 'user@example.com',
        plan: 'team',
        members: [
          { userId: 'user-123', email: 'user@example.com', role: 'owner', joinedAt: new Date() },
        ],
        settings: {
          allowMemberInvites: false,
          defaultMemberRole: 'member',
          sharedStorageEnabled: true,
          sharedTemplatesEnabled: true,
        },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    });

    const { GET } = await import('@/app/api/teams/[teamId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ teamId: 'team-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.team.id).toBe('team-123');
    expect(data.team.isOwner).toBe(true);
  });

  it('should return 404 for non-existent team', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockGetTeam.mockResolvedValue({
      success: false,
      error: 'Team not found',
    });

    const { GET } = await import('@/app/api/teams/[teamId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ teamId: 'team-123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Team not found');
  });
});

describe('Teams API - Update Team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update team name', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockUpdateTeam.mockResolvedValue({
      success: true,
      team: {
        id: 'team-123',
        name: 'Updated Team',
        ownerId: 'user-123',
        ownerEmail: 'user@example.com',
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
      },
    });

    const { PATCH } = await import('@/app/api/teams/[teamId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Team' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ teamId: 'team-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.team.name).toBe('Updated Team');
  });
});

describe('Teams API - Delete Team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delete team', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockDeleteTeam.mockResolvedValue({
      success: true,
    });

    const { DELETE } = await import('@/app/api/teams/[teamId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ teamId: 'team-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return error if not owner', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockDeleteTeam.mockResolvedValue({
      success: false,
      error: 'Only the team owner can delete the team',
    });

    const { DELETE } = await import('@/app/api/teams/[teamId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ teamId: 'team-123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('owner');
  });
});

describe('Teams API - Add Member', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add member to team', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockAddTeamMember.mockResolvedValue({
      success: true,
      member: {
        userId: 'pending-456',
        email: 'newmember@example.com',
        name: 'New Member',
        role: 'member',
        joinedAt: new Date(),
        invitedBy: 'user-123',
      },
    });

    const { POST } = await import('@/app/api/teams/[teamId]/members/route');
    const request = new NextRequest('http://localhost/api/teams/team-123/members', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newmember@example.com',
        name: 'New Member',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ teamId: 'team-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.member.email).toBe('newmember@example.com');
  });

  it('should validate email format', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    const { POST } = await import('@/app/api/teams/[teamId]/members/route');
    const request = new NextRequest('http://localhost/api/teams/team-123/members', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const response = await POST(request, { params: Promise.resolve({ teamId: 'team-123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });
});

describe('Teams API - Remove Member', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should remove member from team', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockRemoveTeamMember.mockResolvedValue({
      success: true,
    });

    const { DELETE } = await import('@/app/api/teams/[teamId]/members/[memberId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123/members/member-456', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ teamId: 'team-123', memberId: 'member-456' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('Teams API - Update Member Role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update member role', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    mockUpdateMemberRole.mockResolvedValue({
      success: true,
      member: {
        userId: 'member-456',
        email: 'member@example.com',
        role: 'admin',
        joinedAt: new Date(),
      },
    });

    const { PATCH } = await import('@/app/api/teams/[teamId]/members/[memberId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123/members/member-456', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'admin' }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ teamId: 'team-123', memberId: 'member-456' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.member.role).toBe('admin');
  });

  it('should validate role value', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com', plan: 'team' },
    });

    const { PATCH } = await import('@/app/api/teams/[teamId]/members/[memberId]/route');
    const request = new NextRequest('http://localhost/api/teams/team-123/members/member-456', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'invalid' }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ teamId: 'team-123', memberId: 'member-456' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });
});
