/**
 * Database Seeder
 * Populates MongoDB with realistic sample data for development and testing
 *
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-database.ts
 * Or: npm run db:seed
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import models
import { User, type IUser } from '../src/lib/db/models/User';
import { Team, TeamMemberLookup, type ITeamMember } from '../src/lib/db/models/Team';
import { UserFile, StorageQuota } from '../src/lib/db/models/UserFile';
import { UsageEvent, DailyUsage } from '../src/lib/db/models/Usage';
import { SSOConfiguration, SSODomainMapping, SSOAuditLog } from '../src/lib/db/models/SSO';
import type { PlanType } from '../src/lib/plans/config';

// Sample data
const SAMPLE_USERS = [
  {
    email: 'free.user@example.com',
    name: 'Free User',
    plan: 'free' as PlanType,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=free',
  },
  {
    email: 'pro.user@example.com',
    name: 'Pro User',
    plan: 'pro' as PlanType,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro',
  },
  {
    email: 'team.owner@example.com',
    name: 'Team Owner',
    plan: 'team' as PlanType,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=team',
  },
  {
    email: 'team.member@example.com',
    name: 'Team Member',
    plan: 'team' as PlanType,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member',
  },
  {
    email: 'enterprise.admin@acme-corp.com',
    name: 'Enterprise Admin',
    plan: 'enterprise' as PlanType,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=enterprise',
  },
  {
    email: 'hmdy7486@gmail.com',
    name: 'Ahmed (Owner)',
    plan: 'enterprise' as PlanType,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
  },
  {
    email: 'mwm.softwars.solutions@gmail.com',
    name: 'MWM Solutions',
    plan: 'enterprise' as PlanType,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mwm',
  },
];

const SAMPLE_FILES = [
  { name: 'README.md', mimeType: 'text/markdown', size: 4096 },
  { name: 'report-2024.md', mimeType: 'text/markdown', size: 15360 },
  { name: 'meeting-notes.md', mimeType: 'text/markdown', size: 2048 },
  { name: 'project-plan.md', mimeType: 'text/markdown', size: 8192 },
  { name: 'api-docs.md', mimeType: 'text/markdown', size: 25600 },
  { name: 'logo.png', mimeType: 'image/png', size: 102400 },
  { name: 'chart.svg', mimeType: 'image/svg+xml', size: 5120 },
  { name: 'data.json', mimeType: 'application/json', size: 10240 },
];

const EVENT_TYPES = ['conversion', 'api_call', 'file_upload', 'file_download', 'template_used', 'batch_conversion'] as const;

async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function clearDatabase(): Promise<void> {
  console.log('\n--- Clearing existing data ---');

  await User.deleteMany({});
  console.log('  Cleared users');

  await Team.deleteMany({});
  await TeamMemberLookup.deleteMany({});
  console.log('  Cleared teams');

  await UserFile.deleteMany({});
  await StorageQuota.deleteMany({});
  console.log('  Cleared files and storage quotas');

  await UsageEvent.deleteMany({});
  await DailyUsage.deleteMany({});
  console.log('  Cleared usage data');

  await SSOConfiguration.deleteMany({});
  await SSODomainMapping.deleteMany({});
  await SSOAuditLog.deleteMany({});
  console.log('  Cleared SSO data');
}

async function seedUsers(): Promise<IUser[]> {
  console.log('\n--- Seeding users ---');

  const users: IUser[] = [];

  for (const userData of SAMPLE_USERS) {
    const user = await User.create({
      _id: userData.email,
      email: userData.email,
      name: userData.name,
      image: userData.image,
      plan: userData.plan,
    });

    users.push(user);
    console.log(`  Created user: ${userData.name} (${userData.email}) - ${userData.plan}`);
  }

  return users;
}

async function seedTeams(users: IUser[]): Promise<void> {
  console.log('\n--- Seeding teams ---');

  const teamOwner = users.find((u) => u.email === 'team.owner@example.com');
  const teamMember = users.find((u) => u.email === 'team.member@example.com');
  const enterpriseAdmin = users.find((u) => u.email === 'enterprise.admin@acme-corp.com');
  const ahmed = users.find((u) => u.email === 'hmdy7486@gmail.com');
  const mwm = users.find((u) => u.email === 'mwm.softwars.solutions@gmail.com');

  if (teamOwner && teamMember) {
    const now = new Date();
    const ownerMember: ITeamMember = {
      userId: teamOwner.email,
      email: teamOwner.email,
      name: teamOwner.name,
      role: 'owner',
      joinedAt: now,
    };

    const memberMember: ITeamMember = {
      userId: teamMember.email,
      email: teamMember.email,
      name: teamMember.name,
      role: 'member',
      joinedAt: now,
      invitedBy: teamOwner.email,
    };

    const team = await Team.create({
      name: 'Development Team',
      ownerId: teamOwner.email,
      ownerEmail: teamOwner.email,
      plan: 'team',
      members: [ownerMember, memberMember],
      settings: {
        allowMemberInvites: true,
        defaultMemberRole: 'member',
        sharedStorageEnabled: true,
        sharedTemplatesEnabled: true,
      },
    });

    // Create lookup records
    await TeamMemberLookup.create([
      { teamId: team._id.toString(), userId: teamOwner.email, email: teamOwner.email, role: 'owner', joinedAt: now, status: 'active' },
      { teamId: team._id.toString(), userId: teamMember.email, email: teamMember.email, role: 'member', joinedAt: now, invitedBy: teamOwner.email, status: 'active' },
    ]);

    console.log(`  Created team: ${team.name} with ${team.members.length} members`);
  }

  if (enterpriseAdmin && ahmed && mwm) {
    const now = new Date();

    const enterpriseTeam = await Team.create({
      name: 'ACME Corporation',
      ownerId: enterpriseAdmin.email,
      ownerEmail: enterpriseAdmin.email,
      plan: 'enterprise',
      members: [
        { userId: enterpriseAdmin.email, email: enterpriseAdmin.email, name: enterpriseAdmin.name, role: 'owner', joinedAt: now },
        { userId: ahmed.email, email: ahmed.email, name: ahmed.name, role: 'admin', joinedAt: now, invitedBy: enterpriseAdmin.email },
        { userId: mwm.email, email: mwm.email, name: mwm.name, role: 'member', joinedAt: now, invitedBy: enterpriseAdmin.email },
      ],
      settings: {
        allowMemberInvites: false,
        defaultMemberRole: 'member',
        sharedStorageEnabled: true,
        sharedTemplatesEnabled: true,
      },
    });

    await TeamMemberLookup.create([
      { teamId: enterpriseTeam._id.toString(), userId: enterpriseAdmin.email, email: enterpriseAdmin.email, role: 'owner', joinedAt: now, status: 'active' },
      { teamId: enterpriseTeam._id.toString(), userId: ahmed.email, email: ahmed.email, role: 'admin', joinedAt: now, invitedBy: enterpriseAdmin.email, status: 'active' },
      { teamId: enterpriseTeam._id.toString(), userId: mwm.email, email: mwm.email, role: 'member', joinedAt: now, invitedBy: enterpriseAdmin.email, status: 'active' },
    ]);

    console.log(`  Created team: ${enterpriseTeam.name} with ${enterpriseTeam.members.length} members`);
  }
}

async function seedFiles(users: IUser[]): Promise<void> {
  console.log('\n--- Seeding files ---');

  // Only seed files for users with storage access (pro and above)
  const usersWithStorage = users.filter((u) => u.plan !== 'free');

  for (const user of usersWithStorage) {
    const fileCount = Math.floor(Math.random() * 5) + 1; // 1-5 files per user
    let totalSize = 0;

    for (let i = 0; i < fileCount; i++) {
      const fileTemplate = SAMPLE_FILES[Math.floor(Math.random() * SAMPLE_FILES.length)];
      const fileName = `${user.name?.split(' ')[0].toLowerCase()}_${Date.now()}_${fileTemplate.name}`;

      const file = await UserFile.create({
        userId: user.email,
        filename: fileName,
        originalName: fileTemplate.name,
        mimeType: fileTemplate.mimeType,
        size: fileTemplate.size,
        path: `md2pdf/users/${user.email}/${fileName}`,
        url: `https://res.cloudinary.com/demo/raw/upload/md2pdf/users/${user.email}/${fileName}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });

      totalSize += fileTemplate.size;
      console.log(`  Created file: ${file.originalName} for ${user.email}`);
    }

    // Update storage quota
    await StorageQuota.create({
      userId: user.email,
      used: totalSize,
    });
  }
}

async function seedUsageData(users: IUser[]): Promise<void> {
  console.log('\n--- Seeding usage data ---');

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const user of users) {
    // Generate daily usage for the last 30 days
    const currentDate = new Date(thirtyDaysAgo);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Generate random usage based on plan
      const multiplier = user.plan === 'free' ? 1 : user.plan === 'pro' ? 5 : 10;
      const conversions = Math.floor(Math.random() * 10 * multiplier);
      const apiCalls = Math.floor(Math.random() * 50 * multiplier);
      const fileUploads = Math.floor(Math.random() * 3 * multiplier);
      const fileDownloads = Math.floor(Math.random() * 5 * multiplier);
      const templatesUsed = Math.floor(Math.random() * 5 * multiplier);
      const batchConversions = user.plan !== 'free' ? Math.floor(Math.random() * 2) : 0;

      // Create daily usage record
      await DailyUsage.create({
        userId: user.email,
        date: dateStr,
        conversions,
        apiCalls,
        fileUploads,
        fileDownloads,
        templatesUsed,
        batchConversions,
        storageUsed: 0,
      });

      // Create some individual events for today and yesterday only
      if (currentDate >= new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)) {
        const eventCount = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < eventCount; i++) {
          const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
          await UsageEvent.create({
            userId: user.email,
            eventType,
            metadata: { source: 'seeder' },
            timestamp: new Date(currentDate.getTime() + Math.random() * 24 * 60 * 60 * 1000),
            date: dateStr,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`  Created 30 days of usage data for ${user.email}`);
  }
}

async function seedSSOConfigurations(users: IUser[]): Promise<void> {
  console.log('\n--- Seeding SSO configurations ---');

  const enterpriseAdmin = users.find((u) => u.email === 'enterprise.admin@acme-corp.com');

  if (enterpriseAdmin) {
    const ssoConfig = await SSOConfiguration.create({
      organizationId: 'acme-corp',
      provider: 'azure_ad',
      status: 'active',
      config: {
        tenantId: '12345678-1234-1234-1234-123456789012',
        clientId: '87654321-4321-4321-4321-210987654321',
        clientSecret: 'demo-client-secret-do-not-use-in-prod',
        allowedGroups: ['developers', 'managers'],
      },
      domain: 'acme-corp.com',
      enforceSSO: false,
      allowBypass: true,
      jitProvisioning: true,
      defaultRole: 'member',
      lastTestedAt: new Date(),
      testResult: {
        success: true,
        testedBy: enterpriseAdmin.email,
      },
    });

    // Create domain mapping
    await SSODomainMapping.create({
      domain: 'acme-corp.com',
      organizationId: 'acme-corp',
      ssoConfigId: ssoConfig._id.toString(),
      verified: true,
      verificationMethod: 'dns',
    });

    // Create some audit logs
    const actions = ['config_created', 'test_success', 'login', 'login', 'login'] as const;
    for (const action of actions) {
      await SSOAuditLog.create({
        organizationId: 'acme-corp',
        action,
        userId: enterpriseAdmin.email,
        ssoConfigId: ssoConfig._id.toString(),
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }

    console.log(`  Created SSO configuration for ACME Corp (Azure AD)`);
    console.log(`  Created domain mapping: acme-corp.com`);
    console.log(`  Created ${actions.length} SSO audit logs`);
  }
}

async function printSummary(): Promise<void> {
  console.log('\n========================================');
  console.log('Database Seeding Summary');
  console.log('========================================\n');

  const userCount = await User.countDocuments();
  const teamCount = await Team.countDocuments();
  const fileCount = await UserFile.countDocuments();
  const dailyUsageCount = await DailyUsage.countDocuments();
  const eventCount = await UsageEvent.countDocuments();
  const ssoConfigCount = await SSOConfiguration.countDocuments();

  console.log(`Users:           ${userCount}`);
  console.log(`Teams:           ${teamCount}`);
  console.log(`Files:           ${fileCount}`);
  console.log(`Daily Usage:     ${dailyUsageCount}`);
  console.log(`Usage Events:    ${eventCount}`);
  console.log(`SSO Configs:     ${ssoConfigCount}`);

  console.log('\n--- Test Accounts ---');
  console.log('Free:       free.user@example.com');
  console.log('Pro:        pro.user@example.com');
  console.log('Team Owner: team.owner@example.com');
  console.log('Enterprise: enterprise.admin@acme-corp.com');
  console.log('Your Email: hmdy7486@gmail.com (Enterprise)');

  console.log('\n--- SSO Test ---');
  console.log('Domain: acme-corp.com (Azure AD)');
  console.log('Status: Active');
}

async function main(): Promise<void> {
  try {
    console.log('========================================');
    console.log('MongoDB Database Seeder');
    console.log('========================================');

    await connectDB();
    await clearDatabase();

    const users = await seedUsers();
    await seedTeams(users);
    await seedFiles(users);
    await seedUsageData(users);
    await seedSSOConfigurations(users);

    await printSummary();

    console.log('\nSeeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
