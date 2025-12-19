// MongoDB Initialization Script
// Creates the database and user for the application

db = db.getSiblingDB('markdown-to-pdf');

// Create application user
db.createUser({
  user: 'md2pdf_user',
  pwd: 'md2pdf_password',
  roles: [
    {
      role: 'readWrite',
      db: 'markdown-to-pdf',
    },
  ],
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.teams.createIndex({ ownerId: 1 });
db.teams.createIndex({ 'members.userId': 1 });

db.team_members.createIndex({ teamId: 1, userId: 1 }, { unique: true });
db.team_members.createIndex({ userId: 1 });

db.user_files.createIndex({ userId: 1 });
db.user_files.createIndex({ userId: 1, createdAt: -1 });

db.usage_events.createIndex({ userId: 1, date: 1 });
db.usage_events.createIndex({ date: 1 });

db.daily_usage.createIndex({ userId: 1, date: 1 }, { unique: true });

db.sso_configurations.createIndex({ organizationId: 1 });
db.sso_configurations.createIndex({ domain: 1, status: 1 });

db.sso_domains.createIndex({ domain: 1 }, { unique: true });
db.sso_domains.createIndex({ ssoConfigId: 1 });

db.sso_audit_logs.createIndex({ organizationId: 1, timestamp: -1 });

print('Database initialized successfully!');
