import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamList } from '@/components/teams/TeamList';
import { TeamCard } from '@/components/teams/TeamCard';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      noTeams: 'No teams yet',
      noTeamsDescription: 'You are not a member of any teams.',
      member: 'member',
      members: 'members',
      created: 'Created',
      joined: 'Joined',
      manage: 'Manage',
      view: 'View',
      'role.owner': 'Owner',
      'role.admin': 'Admin',
      'role.member': 'Member',
      createTeamTitle: 'Create a new team',
      createTeamDescription: 'Teams allow you to collaborate.',
      teamName: 'Team name',
      teamNamePlaceholder: 'My awesome team',
      nameRequired: 'Team name is required',
      createError: 'Failed to create team.',
      cancel: 'Cancel',
      create: 'Create Team',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
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
