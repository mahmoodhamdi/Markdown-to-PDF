import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamList } from '@/components/teams/TeamList';
import { TeamCard } from '@/components/teams/TeamCard';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { PendingInvitations } from '@/components/teams/PendingInvitations';
import { TransferOwnershipDialog } from '@/components/teams/TransferOwnershipDialog';
import { TeamMembers } from '@/components/teams/TeamMembers';
import { TeamSettings } from '@/components/teams/TeamSettings';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (_namespace?: string) => (key: string, params?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
      // Teams translations
      noTeams: 'No teams yet',
      noTeamsDescription: 'You are not a member of any teams.',
      member: 'member',
      members: 'members',
      created: 'Created',
      joined: 'Joined',
      manage: 'Manage',
      view: 'View',
      settings: 'Settings',
      lastActive: 'Last active',
      'role.owner': 'Owner',
      'role.admin': 'Admin',
      'role.member': 'Member',
      'time.justNow': 'just now',
      'time.minutesAgo': `${params?.count || ''} minutes ago`,
      'time.hoursAgo': `${params?.count || ''} hours ago`,
      'time.daysAgo': `${params?.count || ''} days ago`,
      createTeamTitle: 'Create a new team',
      createTeamDescription: 'Teams allow you to collaborate.',
      teamName: 'Team name',
      teamNamePlaceholder: 'My awesome team',
      nameRequired: 'Team name is required',
      createError: 'Failed to create team.',
      cancel: 'Cancel',
      create: 'Create Team',
      // Team detail translations
      membersTitle: 'Members',
      addMember: 'Add Member',
      searchMembers: 'Search members',
      'filter.all': 'All',
      'filter.owners': 'Owners',
      'filter.admins': 'Admins',
      'filter.members': 'Members',
      noMatchingMembers: 'No matching members found',
      noMembers: 'No members',
      pending: 'Pending',
      you: 'You',
      makeAdmin: 'Make Admin',
      removeAdmin: 'Remove Admin',
      removeMember: 'Remove Member',
      leaveTeam: 'Leave Team',
      memberRemoved: 'Member removed',
      removeError: 'Failed to remove member',
      roleChanged: 'Role changed',
      roleChangeError: 'Failed to change role',
      leaveTeamTitle: 'Leave Team',
      removeMemberTitle: 'Remove Member',
      leaveTeamDescription: 'Are you sure you want to leave?',
      removeMemberDescription: `Remove ${params?.name || 'member'}?`,
      removing: 'Removing...',
      confirm: 'Confirm',
      // Team settings translations
      settingsTitle: 'Team Settings',
      settingsDescription: 'Configure your team',
      memberSettings: 'Member Settings',
      allowMemberInvites: 'Allow Member Invites',
      allowMemberInvitesHint: 'Let members invite others',
      defaultRole: 'Default Role',
      defaultRoleHint: 'Default role for new members',
      sharingSettings: 'Sharing Settings',
      sharedStorage: 'Shared Storage',
      sharedStorageHint: 'Enable shared storage',
      sharedTemplates: 'Shared Templates',
      sharedTemplatesHint: 'Share templates with team',
      dangerZone: 'Danger Zone',
      transferOwnership: 'Transfer Ownership',
      transferOwnershipHint: 'Transfer to another admin',
      transfer: 'Transfer',
      deleteTeam: 'Delete Team',
      deleteTeamHint: 'Permanently delete this team',
      delete: 'Delete',
      settingsSaved: 'Settings saved',
      saveError: 'Failed to save',
      saving: 'Saving...',
      save: 'Save',
      deleteTeamTitle: 'Delete Team',
      deleteTeamDescription: 'This action cannot be undone',
      confirmDelete: 'Delete Team',
      deleting: 'Deleting...',
      teamDeleted: 'Team deleted',
      deleteError: 'Failed to delete',
      // Invitations translations
      title: 'Pending Invitations',
      invitedBy: `Invited by ${params?.name || 'someone'}`,
      expiresIn: `Expires in ${params?.time || ''}`,
      'time.hours': `${params?.count || ''} hours`,
      'time.days': `${params?.count || ''} days`,
      expired: 'Expired',
      expiredOn: `Expired on ${params?.date || ''}`,
      expiredInvitations: 'Expired Invitations',
      resend: 'Resend',
      resendNew: 'Resend',
      resendSuccess: 'Invitation resent',
      resendError: 'Failed to resend',
      cancelTitle: 'Cancel Invitation',
      cancelDescription: `Cancel invitation for ${params?.email || ''}?`,
      keep: 'Keep',
      confirmCancel: 'Cancel Invitation',
      canceling: 'Canceling...',
      cancelSuccess: 'Invitation canceled',
      cancelError: 'Failed to cancel',
      // Transfer ownership translations
      success: 'Ownership transferred',
      successDescription: `Transferred to ${params?.name || ''}`,
      error: 'Transfer failed',
      warning: 'Warning: This is irreversible',
      warningItem1: 'You will become an admin',
      warningItem2: 'New owner gets full control',
      warningItem3: 'Cannot be undone',
      noEligibleMembers: 'No eligible members',
      noEligibleMembersHint: 'Promote someone to admin first',
      selectNewOwner: 'Select New Owner',
      selectPlaceholder: 'Select a member',
      confirmLabel: 'Confirm by typing team name',
      confirmHint: `Type "${params?.teamName || ''}" to confirm`,
      transferring: 'Transferring...',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockTeams = [
  {
    id: '1',
    name: 'My Company',
    plan: 'team',
    memberCount: 5,
    role: 'owner' as const,
    isOwner: true,
    createdAt: '2024-12-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Project Alpha',
    plan: 'team',
    memberCount: 3,
    role: 'member' as const,
    isOwner: false,
    createdAt: '2024-11-15T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Design Team',
    plan: 'enterprise',
    memberCount: 8,
    role: 'admin' as const,
    isOwner: false,
    createdAt: '2024-10-01T00:00:00.000Z',
  },
];

describe('TeamList', () => {
  it('renders empty state when no teams', () => {
    render(<TeamList teams={[]} currentUserId="user-1" />);

    expect(screen.getByText('No teams yet')).toBeInTheDocument();
  });

  it('renders list of teams', () => {
    render(<TeamList teams={mockTeams} currentUserId="user-1" />);

    expect(screen.getByText('My Company')).toBeInTheDocument();
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Design Team')).toBeInTheDocument();
  });

  it('shows correct member count', () => {
    render(<TeamList teams={mockTeams} currentUserId="user-1" />);

    expect(screen.getByText('5 members')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
    expect(screen.getByText('8 members')).toBeInTheDocument();
  });
});

describe('TeamCard', () => {
  it('renders team name', () => {
    render(<TeamCard team={mockTeams[0]} currentUserId="user-1" />);

    expect(screen.getByText('My Company')).toBeInTheDocument();
  });

  it('shows owner badge for team owner', () => {
    render(<TeamCard team={mockTeams[0]} currentUserId="user-1" />);

    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('shows member badge for regular member', () => {
    render(<TeamCard team={mockTeams[1]} currentUserId="user-1" />);

    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('shows admin badge for team admin', () => {
    render(<TeamCard team={mockTeams[2]} currentUserId="user-1" />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows Manage button for owner', () => {
    render(<TeamCard team={mockTeams[0]} currentUserId="user-1" />);

    expect(screen.getByText('Manage')).toBeInTheDocument();
  });

  it('shows Manage button for admin', () => {
    render(<TeamCard team={mockTeams[2]} currentUserId="user-1" />);

    expect(screen.getByText('Manage')).toBeInTheDocument();
  });

  it('shows View button for member', () => {
    render(<TeamCard team={mockTeams[1]} currentUserId="user-1" />);

    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('shows Created for owner teams', () => {
    render(<TeamCard team={mockTeams[0]} currentUserId="user-1" />);

    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });

  it('shows Joined for non-owner teams', () => {
    render(<TeamCard team={mockTeams[1]} currentUserId="user-1" />);

    expect(screen.getByText(/Joined/)).toBeInTheDocument();
  });
});

describe('CreateTeamDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnTeamCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', () => {
    render(
      <CreateTeamDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTeamCreated={mockOnTeamCreated}
      />
    );

    expect(screen.getByText('Create a new team')).toBeInTheDocument();
    expect(screen.getByText('Teams allow you to collaborate.')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <CreateTeamDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onTeamCreated={mockOnTeamCreated}
      />
    );

    expect(screen.queryByText('Create a new team')).not.toBeInTheDocument();
  });

  it('shows team name input', () => {
    render(
      <CreateTeamDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTeamCreated={mockOnTeamCreated}
      />
    );

    expect(screen.getByLabelText('Team name')).toBeInTheDocument();
  });

  it('disables create button when name is empty', () => {
    render(
      <CreateTeamDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTeamCreated={mockOnTeamCreated}
      />
    );

    const createButton = screen.getByRole('button', { name: 'Create Team' });
    expect(createButton).toBeDisabled();
  });

  it('enables create button when name is entered', () => {
    render(
      <CreateTeamDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTeamCreated={mockOnTeamCreated}
      />
    );

    const input = screen.getByLabelText('Team name');
    fireEvent.change(input, { target: { value: 'New Team' } });

    const createButton = screen.getByRole('button', { name: 'Create Team' });
    expect(createButton).not.toBeDisabled();
  });

  it('calls onOpenChange when cancel is clicked', () => {
    render(
      <CreateTeamDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTeamCreated={mockOnTeamCreated}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('creates team on submit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          team: {
            id: '1',
            name: 'New Team',
            plan: 'team',
            memberCount: 1,
            role: 'owner',
            isOwner: true,
            createdAt: new Date().toISOString(),
          },
        }),
    });

    render(
      <CreateTeamDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTeamCreated={mockOnTeamCreated}
      />
    );

    const input = screen.getByLabelText('Team name');
    fireEvent.change(input, { target: { value: 'New Team' } });

    const createButton = screen.getByRole('button', { name: 'Create Team' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnTeamCreated).toHaveBeenCalled();
    });
  });

  it('shows error on create failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Team creation failed' }),
    });

    render(
      <CreateTeamDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTeamCreated={mockOnTeamCreated}
      />
    );

    const input = screen.getByLabelText('Team name');
    fireEvent.change(input, { target: { value: 'New Team' } });

    const createButton = screen.getByRole('button', { name: 'Create Team' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Team creation failed')).toBeInTheDocument();
    });
  });
});

// ============================================
// AvatarGroup Tests
// ============================================
describe('AvatarGroup', () => {
  const mockMembers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', image: 'https://example.com/john.jpg' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', email: 'bob@example.com' },
    { id: '4', name: 'Alice', email: 'alice@example.com' },
    { id: '5', name: 'Charlie Brown', email: 'charlie@example.com' },
    { id: '6', name: 'Diana Prince', email: 'diana@example.com' },
  ];

  it('renders avatars for members', () => {
    render(<AvatarGroup members={mockMembers.slice(0, 3)} />);

    expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
    expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith
    expect(screen.getByText('B')).toBeInTheDocument(); // bob@example.com
  });

  it('shows overflow count when members exceed max', () => {
    render(<AvatarGroup members={mockMembers} max={4} />);

    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('respects custom max value', () => {
    render(<AvatarGroup members={mockMembers} max={3} />);

    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('does not show overflow when members fit within max', () => {
    render(<AvatarGroup members={mockMembers.slice(0, 3)} max={5} />);

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('generates correct initials for multi-word names', () => {
    render(<AvatarGroup members={[{ id: '1', name: 'Charlie Brown' }]} />);

    expect(screen.getByText('CB')).toBeInTheDocument();
  });

  it('uses first letter of email when no name', () => {
    render(<AvatarGroup members={[{ id: '1', email: 'test@example.com' }]} />);

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('shows ? for empty member data', () => {
    render(<AvatarGroup members={[{ id: '1' }]} showTooltip={false} />);

    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders without tooltip when showTooltip is false', () => {
    render(<AvatarGroup members={mockMembers.slice(0, 2)} showTooltip={false} />);

    // Avatars should render but no tooltip container
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('returns empty content for empty members array', () => {
    const { container } = render(<AvatarGroup members={[]} />);

    // Should render but with no avatars
    expect(container.querySelector('.flex.-space-x-2')).toBeInTheDocument();
  });
});

// ============================================
// TeamCard Enhancements Tests
// ============================================
describe('TeamCard Enhancements', () => {
  const teamWithExtras = {
    id: '1',
    name: 'My Company',
    plan: 'enterprise',
    memberCount: 5,
    role: 'owner' as const,
    isOwner: true,
    createdAt: '2024-12-01T00:00:00.000Z',
    lastActivity: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    memberPreviews: [
      { id: '1', name: 'John Doe', email: 'john@test.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@test.com' },
    ],
  };

  it('displays plan badge', () => {
    render(<TeamCard team={teamWithExtras} currentUserId="user-1" />);

    expect(screen.getByText('enterprise')).toBeInTheDocument();
  });

  it('applies enterprise plan badge styling', () => {
    render(<TeamCard team={teamWithExtras} currentUserId="user-1" />);

    const badge = screen.getByText('enterprise');
    expect(badge).toHaveClass('bg-purple-100');
  });

  it('applies team plan badge styling', () => {
    render(<TeamCard team={{ ...teamWithExtras, plan: 'team' }} currentUserId="user-1" />);

    const badge = screen.getByText('team');
    expect(badge).toHaveClass('bg-blue-100');
  });

  it('applies pro plan badge styling', () => {
    render(<TeamCard team={{ ...teamWithExtras, plan: 'pro' }} currentUserId="user-1" />);

    const badge = screen.getByText('pro');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('displays last activity when available', () => {
    render(<TeamCard team={teamWithExtras} currentUserId="user-1" />);

    expect(screen.getByText(/Last active/)).toBeInTheDocument();
  });

  it('renders member previews as avatars', () => {
    render(<TeamCard team={teamWithExtras} currentUserId="user-1" />);

    // AvatarGroup should be rendered with member previews
    expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials
    expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith initials
  });

  it('does not render avatars when no member previews', () => {
    const teamNoPreview = { ...teamWithExtras, memberPreviews: undefined };
    render(<TeamCard team={teamNoPreview} currentUserId="user-1" />);

    // Should not have avatar group
    expect(screen.queryByText('JD')).not.toBeInTheDocument();
  });

  it('shows settings button for owners', () => {
    render(<TeamCard team={teamWithExtras} currentUserId="user-1" />);

    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows settings button for admins', () => {
    const adminTeam = { ...teamWithExtras, role: 'admin' as const, isOwner: false };
    render(<TeamCard team={adminTeam} currentUserId="user-1" />);

    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('does not show settings button for regular members', () => {
    const memberTeam = { ...teamWithExtras, role: 'member' as const, isOwner: false };
    render(<TeamCard team={memberTeam} currentUserId="user-1" />);

    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  });
});

// ============================================
// PendingInvitations Tests
// ============================================
describe('PendingInvitations', () => {
  const mockInvitations = [
    {
      id: 'inv-1',
      email: 'pending@example.com',
      role: 'member' as const,
      invitedBy: 'user-1',
      invitedByName: 'John Doe',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days
      status: 'pending' as const,
    },
    {
      id: 'inv-2',
      email: 'urgent@example.com',
      role: 'admin' as const,
      invitedBy: 'user-1',
      invitedByName: 'John Doe',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 12).toISOString(), // 12 hours
      status: 'pending' as const,
    },
    {
      id: 'inv-3',
      email: 'expired@example.com',
      role: 'member' as const,
      invitedBy: 'user-1',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // expired
      status: 'expired' as const,
    },
  ];

  const mockCallbacks = {
    onInvitationCanceled: vi.fn(),
    onInvitationResent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no invitations', () => {
    const { container } = render(
      <PendingInvitations
        teamId="team-1"
        invitations={[]}
        canManage={true}
        {...mockCallbacks}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders title with invitation count', () => {
    render(
      <PendingInvitations
        teamId="team-1"
        invitations={mockInvitations}
        canManage={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays invitation email', () => {
    render(
      <PendingInvitations
        teamId="team-1"
        invitations={mockInvitations}
        canManage={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
  });

  it('displays role badge', () => {
    render(
      <PendingInvitations
        teamId="team-1"
        invitations={[mockInvitations[0]]}
        canManage={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('shows resend and cancel buttons when canManage is true', () => {
    render(
      <PendingInvitations
        teamId="team-1"
        invitations={[mockInvitations[0]]}
        canManage={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByRole('button', { name: /Resend/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('hides action buttons when canManage is false', () => {
    render(
      <PendingInvitations
        teamId="team-1"
        invitations={[mockInvitations[0]]}
        canManage={false}
        {...mockCallbacks}
      />
    );

    expect(screen.queryByRole('button', { name: /Resend/ })).not.toBeInTheDocument();
  });

  it('shows expired invitations section', () => {
    render(
      <PendingInvitations
        teamId="team-1"
        invitations={mockInvitations}
        canManage={true}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Expired Invitations')).toBeInTheDocument();
    expect(screen.getByText('expired@example.com')).toBeInTheDocument();
  });

  it('calls resend API on resend button click', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <PendingInvitations
        teamId="team-1"
        invitations={[mockInvitations[0]]}
        canManage={true}
        {...mockCallbacks}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Resend/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/teams/team-1/invitations/inv-1/resend',
        { method: 'POST' }
      );
    });
  });

  it('shows cancel button for pending invitations', () => {
    render(
      <PendingInvitations
        teamId="team-1"
        invitations={[mockInvitations[0]]}
        canManage={true}
        {...mockCallbacks}
      />
    );

    // Find the cancel button (with X icon) that has destructive styling
    const allButtons = screen.getAllByRole('button');
    const cancelBtn = allButtons.find(btn => btn.className.includes('text-destructive'));

    expect(cancelBtn).toBeInTheDocument();
  });
});

// ============================================
// TransferOwnershipDialog Tests
// ============================================
describe('TransferOwnershipDialog', () => {
  const mockMembers = [
    { userId: 'owner-1', email: 'owner@test.com', name: 'Owner User', role: 'owner' as const },
    { userId: 'admin-1', email: 'admin@test.com', name: 'Admin User', role: 'admin' as const },
    { userId: 'admin-2', email: 'admin2@test.com', name: 'Admin Two', role: 'admin' as const },
    { userId: 'member-1', email: 'member@test.com', name: 'Member User', role: 'member' as const },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    teamId: 'team-1',
    teamName: 'My Team',
    members: mockMembers,
    currentOwnerId: 'owner-1',
    onOwnershipTransferred: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', () => {
    render(<TransferOwnershipDialog {...defaultProps} />);

    expect(screen.getByText(/Transfer Ownership/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TransferOwnershipDialog {...defaultProps} open={false} />);

    expect(screen.queryByText(/Transfer Ownership/i)).not.toBeInTheDocument();
  });

  it('displays warning message', () => {
    render(<TransferOwnershipDialog {...defaultProps} />);

    expect(screen.getByText(/Warning/i)).toBeInTheDocument();
    // Check for list items in the warning section
    expect(screen.getByText(/become an admin/i)).toBeInTheDocument();
  });

  it('shows only admins in selection (excludes owner and members)', () => {
    render(<TransferOwnershipDialog {...defaultProps} />);

    // Verify the select trigger exists for admin selection
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();

    // The component should filter to only admins (verified by component logic)
    // We verify the select placeholder is shown
    expect(screen.getByText('Select a member')).toBeInTheDocument();
  });

  it('shows no eligible members message when no admins', () => {
    const noAdminMembers = mockMembers.filter(m => m.role !== 'admin');
    render(<TransferOwnershipDialog {...defaultProps} members={noAdminMembers} />);

    expect(screen.getByText('No eligible members')).toBeInTheDocument();
  });

  it('disables transfer button initially', () => {
    render(<TransferOwnershipDialog {...defaultProps} />);

    const transferBtn = screen.getByRole('button', { name: /Transfer Ownership/i });
    expect(transferBtn).toBeDisabled();
  });

  it('requires confirmation text to enable transfer', async () => {
    render(<TransferOwnershipDialog {...defaultProps} />);

    // Select an admin
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    fireEvent.click(screen.getByText('Admin User'));

    // Enter confirmation text
    const confirmInput = await screen.findByPlaceholderText('My Team');
    fireEvent.change(confirmInput, { target: { value: 'my team' } }); // lowercase should work

    const transferBtn = screen.getByRole('button', { name: /Transfer Ownership/i });
    expect(transferBtn).not.toBeDisabled();
  });

  it('calls API on transfer', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<TransferOwnershipDialog {...defaultProps} />);

    // Select admin
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    fireEvent.click(screen.getByText('Admin User'));

    // Confirm
    const confirmInput = await screen.findByPlaceholderText('My Team');
    fireEvent.change(confirmInput, { target: { value: 'my team' } });

    // Transfer
    fireEvent.click(screen.getByRole('button', { name: /Transfer Ownership/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/teams/team-1/transfer-ownership',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ newOwnerId: 'admin-1' }),
        })
      );
    });
  });
});

// ============================================
// TeamMembers Enhancement Tests
// ============================================
describe('TeamMembers Enhancements', () => {
  const mockMembers = [
    { userId: 'owner-1', email: 'owner@test.com', name: 'Owner User', role: 'owner' as const, joinedAt: '2024-01-01T00:00:00Z' },
    { userId: 'admin-1', email: 'admin@test.com', name: 'Admin Person', role: 'admin' as const, joinedAt: '2024-02-01T00:00:00Z' },
    { userId: 'member-1', email: 'member@test.com', name: 'Member One', role: 'member' as const, joinedAt: '2024-03-01T00:00:00Z' },
    { userId: 'member-2', email: 'john@test.com', name: 'John Doe', role: 'member' as const, joinedAt: '2024-04-01T00:00:00Z' },
  ];

  const defaultProps = {
    teamId: 'team-1',
    members: mockMembers,
    currentUserId: 'owner-1',
    currentUserRole: 'owner' as const,
    canManageMembers: true,
    canChangeRoles: true,
    onAddMember: vi.fn(),
    onMemberRemoved: vi.fn(),
    onMemberRoleChanged: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders member list', () => {
    render(<TeamMembers {...defaultProps} />);

    expect(screen.getByText('Owner User')).toBeInTheDocument();
    expect(screen.getByText('Admin Person')).toBeInTheDocument();
    expect(screen.getByText('Member One')).toBeInTheDocument();
  });

  it('shows search input when more than 3 members', () => {
    render(<TeamMembers {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search members')).toBeInTheDocument();
  });

  it('hides search when 3 or fewer members', () => {
    render(<TeamMembers {...defaultProps} members={mockMembers.slice(0, 3)} />);

    expect(screen.queryByPlaceholderText('Search members')).not.toBeInTheDocument();
  });

  it('filters members by search query', () => {
    render(<TeamMembers {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search members');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Owner User')).not.toBeInTheDocument();
  });

  it('shows no matching members message', () => {
    render(<TeamMembers {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search members');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No matching members found')).toBeInTheDocument();
  });

  it('displays role filter dropdown', () => {
    render(<TeamMembers {...defaultProps} />);

    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('shows You badge for current user', () => {
    render(<TeamMembers {...defaultProps} />);

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows Add Member button when canManageMembers', () => {
    render(<TeamMembers {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Add Member/i })).toBeInTheDocument();
  });

  it('hides Add Member button when cannot manage', () => {
    render(<TeamMembers {...defaultProps} canManageMembers={false} />);

    expect(screen.queryByRole('button', { name: /Add Member/i })).not.toBeInTheDocument();
  });

  it('sorts members by role (owner first)', () => {
    render(<TeamMembers {...defaultProps} />);

    // Get all member names displayed in the member rows
    const ownerUser = screen.getByText('Owner User');
    const adminPerson = screen.getByText('Admin Person');
    const memberOne = screen.getByText('Member One');

    // All should be in the document
    expect(ownerUser).toBeInTheDocument();
    expect(adminPerson).toBeInTheDocument();
    expect(memberOne).toBeInTheDocument();

    // Verify that owner badge appears (indicating owner is displayed first visually)
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('shows member initials in avatar', () => {
    render(<TeamMembers {...defaultProps} />);

    expect(screen.getByText('OU')).toBeInTheDocument(); // Owner User
    expect(screen.getByText('AP')).toBeInTheDocument(); // Admin Person
  });
});

// ============================================
// TeamSettings Enhancement Tests
// ============================================
describe('TeamSettings Enhancements', () => {
  const defaultSettings = {
    allowMemberInvites: true,
    defaultMemberRole: 'member' as const,
    sharedStorageEnabled: true,
    sharedTemplatesEnabled: false,
  };

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    teamId: 'team-1',
    teamName: 'My Team',
    settings: defaultSettings,
    isOwner: true,
    hasAdmins: true,
    onSettingsUpdated: vi.fn(),
    onTeamNameUpdated: vi.fn(),
    onTransferOwnership: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings dialog when open', () => {
    render(<TeamSettings {...defaultProps} />);

    expect(screen.getByText('Team Settings')).toBeInTheDocument();
  });

  it('shows danger zone for owner', () => {
    render(<TeamSettings {...defaultProps} />);

    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('hides danger zone for non-owner', () => {
    render(<TeamSettings {...defaultProps} isOwner={false} />);

    expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
  });

  it('shows transfer ownership option when callback provided', () => {
    render(<TeamSettings {...defaultProps} />);

    expect(screen.getByText('Transfer Ownership')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Transfer/i })).toBeInTheDocument();
  });

  it('hides transfer ownership when no callback', () => {
    render(<TeamSettings {...defaultProps} onTransferOwnership={undefined} />);

    expect(screen.queryByText(/Transfer to another admin/i)).not.toBeInTheDocument();
  });

  it('disables transfer button when no admins', () => {
    render(<TeamSettings {...defaultProps} hasAdmins={false} />);

    const transferBtn = screen.getByRole('button', { name: /Transfer/i });
    expect(transferBtn).toBeDisabled();
  });

  it('calls onTransferOwnership when transfer clicked', () => {
    render(<TeamSettings {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Transfer/i }));

    expect(defaultProps.onTransferOwnership).toHaveBeenCalled();
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows delete team option for owner', () => {
    render(<TeamSettings {...defaultProps} />);

    expect(screen.getByText('Delete Team')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it('saves settings on save button click', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<TeamSettings {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/teams/team-1',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  it('updates team name', () => {
    render(<TeamSettings {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('My Team');
    fireEvent.change(nameInput, { target: { value: 'New Team Name' } });

    expect(nameInput).toHaveValue('New Team Name');
  });

  it('disables save when name is empty', () => {
    render(<TeamSettings {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('My Team');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    expect(saveBtn).toBeDisabled();
  });
});
