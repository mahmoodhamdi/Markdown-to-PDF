import { Template } from '@/types';

export const templates: Template[] = [
  {
    id: 'resume',
    name: 'Resume / CV',
    description: 'Professional resume template',
    category: 'business',
    content: `# John Doe
## Software Engineer

**Email:** john.doe@email.com | **Phone:** +1 (555) 123-4567 | **Location:** San Francisco, CA

---

## Summary

Experienced software engineer with 5+ years of expertise in building scalable web applications. Passionate about clean code, best practices, and continuous learning.

---

## Experience

### Senior Software Engineer
**Tech Company Inc.** | Jan 2021 - Present

- Led development of microservices architecture serving 1M+ daily users
- Mentored junior developers and conducted code reviews
- Implemented CI/CD pipelines reducing deployment time by 60%

### Software Engineer
**Startup XYZ** | Jun 2018 - Dec 2020

- Built responsive web applications using React and Node.js
- Collaborated with cross-functional teams to deliver features on schedule
- Optimized database queries improving performance by 40%

---

## Education

### Bachelor of Science in Computer Science
**University of Technology** | 2014 - 2018

---

## Skills

**Languages:** JavaScript, TypeScript, Python, Go
**Frameworks:** React, Node.js, Next.js, Express
**Tools:** Git, Docker, Kubernetes, AWS
**Databases:** PostgreSQL, MongoDB, Redis

---

## Projects

### Open Source Contribution
- Contributor to popular open-source projects
- Maintained personal projects with 500+ GitHub stars
`,
  },
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    description: 'Job application cover letter',
    category: 'business',
    content: `# Cover Letter

**John Doe**
123 Main Street
San Francisco, CA 94102
john.doe@email.com
(555) 123-4567

---

**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

**Hiring Manager**
Company Name
456 Business Ave
City, State 12345

---

Dear Hiring Manager,

I am writing to express my interest in the Software Engineer position at Company Name, as advertised on your careers page. With over five years of experience in full-stack development and a proven track record of delivering high-quality software solutions, I am confident in my ability to contribute effectively to your team.

In my current role at Tech Company Inc., I have successfully led the development of microservices architecture that serves over one million daily users. My experience includes:

- **Technical Leadership:** Mentoring junior developers and establishing best practices
- **Performance Optimization:** Improving system performance by 40% through code optimization
- **Collaboration:** Working effectively with cross-functional teams to deliver projects on time

I am particularly drawn to Company Name because of your commitment to innovation and your focus on creating impactful products. I believe my technical skills and passion for problem-solving align well with your team's goals.

I would welcome the opportunity to discuss how my background and skills would be a good fit for this position. Thank you for considering my application.

Sincerely,

**John Doe**
`,
  },
  {
    id: 'report',
    name: 'Business Report',
    description: 'Professional report template',
    category: 'business',
    content: `# Quarterly Business Report
## Q4 2024

**Prepared by:** Business Analytics Team
**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

## Executive Summary

This report provides an overview of our company's performance during Q4 2024. Key highlights include a 15% increase in revenue, successful launch of new product features, and expansion into two new markets.

---

## Key Metrics

| Metric | Q3 2024 | Q4 2024 | Change |
|--------|---------|---------|--------|
| Revenue | $2.5M | $2.875M | +15% |
| Active Users | 50,000 | 65,000 | +30% |
| Customer Satisfaction | 4.2/5 | 4.5/5 | +7% |
| Employee Count | 120 | 145 | +21% |

---

## Revenue Analysis

### By Product Line

- **Product A:** $1.2M (42%)
- **Product B:** $0.9M (31%)
- **Product C:** $0.775M (27%)

### By Region

- **North America:** 55%
- **Europe:** 30%
- **Asia Pacific:** 15%

---

## Key Achievements

1. **Product Launch:** Successfully launched v2.0 with 15 new features
2. **Market Expansion:** Entered UK and Germany markets
3. **Team Growth:** Hired 25 new team members
4. **Infrastructure:** Migrated to cloud-native architecture

---

## Challenges & Risks

- Supply chain disruptions affecting hardware delivery
- Increased competition in core markets
- Talent acquisition in competitive job market

---

## Recommendations

1. Invest in automation to improve operational efficiency
2. Explore strategic partnerships for market expansion
3. Enhance customer success programs to improve retention

---

## Conclusion

Q4 2024 demonstrated strong growth across all key metrics. With continued focus on product innovation and customer satisfaction, we are well-positioned for success in the upcoming year.
`,
  },
  {
    id: 'thesis',
    name: 'Thesis',
    description: 'Academic thesis template',
    category: 'academic',
    content: `# The Impact of Artificial Intelligence on Modern Software Development

## A Thesis Submitted in Partial Fulfillment of the Requirements for the Degree of Master of Science in Computer Science

---

**Author:** Jane Smith

**Advisor:** Dr. John Professor

**Department:** Computer Science

**University:** University of Technology

**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}

---

## Abstract

This thesis examines the transformative impact of artificial intelligence on modern software development practices. Through a comprehensive analysis of current AI tools and methodologies, we explore how machine learning and natural language processing are reshaping the software development lifecycle.

**Keywords:** Artificial Intelligence, Software Development, Machine Learning, Code Generation

---

## Chapter 1: Introduction

### 1.1 Background

The software development industry has undergone significant transformation with the advent of artificial intelligence technologies. AI-powered tools are increasingly being integrated into various stages of the software development lifecycle.

### 1.2 Research Questions

1. How are AI tools currently being used in software development?
2. What are the productivity impacts of AI-assisted development?
3. What challenges and limitations exist in current AI development tools?

### 1.3 Thesis Structure

This thesis is organized as follows: Chapter 2 reviews related literature, Chapter 3 describes our methodology, Chapter 4 presents findings, and Chapter 5 concludes with implications and future research directions.

---

## Chapter 2: Literature Review

### 2.1 History of AI in Software Development

The integration of AI in software development has evolved significantly since the early expert systems of the 1980s...

### 2.2 Current AI Development Tools

Modern AI tools include code completion systems, automated testing frameworks, and natural language to code translators...

---

## Chapter 3: Methodology

### 3.1 Research Design

This study employs a mixed-methods approach combining quantitative surveys with qualitative interviews...

### 3.2 Data Collection

Data was collected from 500 software developers across various industries...

---

## Chapter 4: Results

### 4.1 Survey Findings

Our survey revealed that 78% of developers use at least one AI-powered tool in their daily workflow...

### 4.2 Interview Insights

Qualitative interviews provided deeper insights into developer experiences and perceptions...

---

## Chapter 5: Conclusion

### 5.1 Summary of Findings

This research demonstrates the significant impact of AI tools on developer productivity...

### 5.2 Future Research

Future studies should explore the long-term effects of AI-assisted development on code quality...

---

## References

1. Smith, J. (2023). "AI in Software Engineering." *Journal of Computer Science*, 45(2), 123-145.
2. Johnson, M. (2024). "Machine Learning for Code Generation." *ACM Computing Surveys*, 56(1), 1-35.
`,
  },
  {
    id: 'readme',
    name: 'README',
    description: 'Project documentation template',
    category: 'technical',
    content: `# Project Name

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

A brief description of what this project does and who it's for.

## Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/username/project.git

# Navigate to project directory
cd project

# Install dependencies
npm install
\`\`\`

## Usage

\`\`\`javascript
import { Component } from 'project';

const result = Component.doSomething();
console.log(result);
\`\`\`

## API Reference

### \`Component.doSomething(options)\`

| Parameter | Type | Description |
|-----------|------|-------------|
| \`option1\` | \`string\` | Description of option1 |
| \`option2\` | \`number\` | Description of option2 |

**Returns:** \`Promise<Result>\`

## Configuration

Create a \`.env\` file in the root directory:

\`\`\`env
API_KEY=your_api_key
DEBUG=true
\`\`\`

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors
- Inspired by [Project X](https://example.com)
`,
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Meeting minutes template',
    category: 'business',
    content: `# Meeting Notes

## Project Status Update

**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Time:** 10:00 AM - 11:00 AM
**Location:** Conference Room A / Zoom

---

## Attendees

- [ ] John Smith (Project Manager)
- [ ] Jane Doe (Tech Lead)
- [ ] Bob Johnson (Developer)
- [ ] Alice Brown (Designer)

---

## Agenda

1. Project status review
2. Blockers and challenges
3. Upcoming milestones
4. Action items

---

## Discussion Points

### 1. Project Status Review

**Current Sprint Progress:**
- Completed: 15 story points
- In Progress: 8 story points
- Remaining: 5 story points

**Key Updates:**
- Feature A is complete and ready for QA
- Feature B is 80% complete
- Design review for Feature C scheduled

### 2. Blockers and Challenges

| Issue | Owner | Status | Priority |
|-------|-------|--------|----------|
| API latency issues | Bob | In Progress | High |
| Design feedback pending | Alice | Blocked | Medium |

### 3. Upcoming Milestones

- **Sprint End:** Friday
- **Release v2.1:** Next Monday
- **Client Demo:** Next Wednesday

---

## Action Items

- [ ] **John:** Schedule client demo (@due: Monday)
- [ ] **Jane:** Review PR for Feature A (@due: Tomorrow)
- [ ] **Bob:** Investigate API latency (@due: Thursday)
- [ ] **Alice:** Complete design mockups (@due: Friday)

---

## Next Meeting

**Date:** Next Tuesday, 10:00 AM
**Topics:** Sprint retrospective, Release planning
`,
  },
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Simple invoice template',
    category: 'business',
    content: `# INVOICE

---

**From:**
Your Company Name
123 Business Street
City, State 12345
Email: billing@company.com

**To:**
Client Company
456 Client Avenue
City, State 67890

---

**Invoice Number:** INV-2024-001
**Invoice Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Due Date:** ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

## Services

| Description | Quantity | Unit Price | Amount |
|-------------|----------|------------|--------|
| Web Development Services | 40 hours | $100.00 | $4,000.00 |
| UI/UX Design | 20 hours | $85.00 | $1,700.00 |
| Project Management | 10 hours | $75.00 | $750.00 |
| Hosting Setup | 1 | $200.00 | $200.00 |

---

## Summary

| | |
|---|---:|
| Subtotal | $6,650.00 |
| Tax (10%) | $665.00 |
| **Total Due** | **$7,315.00** |

---

## Payment Information

**Bank:** First National Bank
**Account Name:** Your Company Name
**Account Number:** 1234567890
**Routing Number:** 987654321

---

## Terms & Conditions

- Payment is due within 30 days of invoice date
- Late payments subject to 1.5% monthly interest
- Please include invoice number with payment

---

Thank you for your business!
`,
  },
  {
    id: 'proposal',
    name: 'Proposal',
    description: 'Business proposal template',
    category: 'business',
    content: `# Project Proposal

## Web Application Development

**Prepared for:** Client Company
**Prepared by:** Your Company Name
**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

## Executive Summary

We are pleased to present this proposal for the development of a custom web application that will streamline your business operations and improve customer engagement. Our solution is designed to meet your specific requirements while ensuring scalability and maintainability.

---

## Project Overview

### Objectives

1. Develop a modern, responsive web application
2. Integrate with existing systems and databases
3. Implement user authentication and authorization
4. Provide comprehensive analytics dashboard

### Scope of Work

- **Phase 1:** Discovery and Planning (2 weeks)
- **Phase 2:** Design and Prototyping (3 weeks)
- **Phase 3:** Development (8 weeks)
- **Phase 4:** Testing and QA (2 weeks)
- **Phase 5:** Deployment and Training (1 week)

---

## Technical Approach

### Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Hosting | AWS |

### Key Features

- Responsive design for all devices
- Real-time data updates
- Role-based access control
- Automated reporting

---

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Discovery | 2 weeks | Week 1 | Week 2 |
| Design | 3 weeks | Week 3 | Week 5 |
| Development | 8 weeks | Week 6 | Week 13 |
| Testing | 2 weeks | Week 14 | Week 15 |
| Deployment | 1 week | Week 16 | Week 16 |

**Total Duration:** 16 weeks

---

## Investment

| Service | Cost |
|---------|------|
| Discovery & Planning | $5,000 |
| Design & Prototyping | $8,000 |
| Development | $35,000 |
| Testing & QA | $7,000 |
| Deployment & Training | $5,000 |
| **Total** | **$60,000** |

### Payment Schedule

- 25% upon project kickoff
- 25% upon design approval
- 25% upon development milestone
- 25% upon final delivery

---

## Why Choose Us

- 10+ years of industry experience
- Dedicated project manager
- Transparent communication
- Post-launch support included

---

## Next Steps

1. Review and approve proposal
2. Sign agreement and submit initial payment
3. Schedule kickoff meeting
4. Begin discovery phase

---

We look forward to working with you on this exciting project.

**Contact:**
John Smith
john@company.com
(555) 123-4567
`,
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Blog article template',
    category: 'personal',
    content: `# How to Build a Successful Product in 2024

*Published on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} by Jane Author*

---

![Header Image](https://via.placeholder.com/800x400)

Building a successful product requires more than just a great idea. In this article, we'll explore the key principles and strategies that can help you turn your vision into reality.

---

## Introduction

The landscape of product development has evolved dramatically over the past decade. With new technologies, methodologies, and user expectations, building a successful product requires a thoughtful approach that balances innovation with practicality.

> "The best products solve real problems for real people in ways that feel almost magical." - Anonymous

---

## Key Principles

### 1. Start with the Problem

Before writing a single line of code or creating a mockup, deeply understand the problem you're solving:

- Who experiences this problem?
- How severe is the problem?
- What solutions currently exist?

### 2. Build for Your Users

User-centered design isn't just a buzzword—it's essential:

- Conduct user interviews
- Create personas
- Test early and often

### 3. Iterate Quickly

The faster you can learn, the faster you can improve:

\`\`\`
Build → Measure → Learn → Repeat
\`\`\`

---

## Common Mistakes to Avoid

1. **Building in isolation** - Get feedback early and often
2. **Feature creep** - Focus on core value first
3. **Ignoring data** - Let metrics guide decisions
4. **Perfectionism** - Ship early, improve later

---

## Conclusion

Building a successful product is a journey, not a destination. By focusing on real problems, staying close to your users, and iterating quickly, you can create something truly valuable.

---

### About the Author

Jane Author is a product manager with 10 years of experience building consumer and enterprise products. Follow her on Twitter @janeauthor.

---

*Did you find this article helpful? Share it with your network!*

**Tags:** #ProductManagement #Startup #Technology #ProductDevelopment
`,
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Technical documentation template',
    category: 'technical',
    content: `# API Documentation

## Overview

This document provides comprehensive documentation for the Example API. The API allows developers to integrate our services into their applications.

---

## Authentication

All API requests require authentication using an API key.

### Getting an API Key

1. Sign up for an account at [dashboard.example.com](https://dashboard.example.com)
2. Navigate to Settings → API Keys
3. Click "Generate New Key"

### Using Your API Key

Include your API key in the request header:

\`\`\`http
Authorization: Bearer YOUR_API_KEY
\`\`\`

---

## Base URL

All API requests should be made to:

\`\`\`
https://api.example.com/v1
\`\`\`

---

## Endpoints

### Users

#### Get User

\`\`\`http
GET /users/{id}
\`\`\`

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | The user's unique identifier |

**Response:**

\`\`\`json
{
  "id": "usr_123",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
\`\`\`

#### Create User

\`\`\`http
POST /users
\`\`\`

**Request Body:**

\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
\`\`\`

**Response:**

\`\`\`json
{
  "id": "usr_123",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
\`\`\`

---

## Error Handling

The API uses standard HTTP status codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

**Error Response Format:**

\`\`\`json
{
  "error": {
    "code": "invalid_request",
    "message": "The request body is missing required fields"
  }
}
\`\`\`

---

## Rate Limiting

- 100 requests per minute for free tier
- 1000 requests per minute for pro tier
- 10000 requests per minute for enterprise tier

Rate limit headers are included in every response:

\`\`\`http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
\`\`\`

---

## SDKs

Official SDKs are available for:

- JavaScript/Node.js: \`npm install example-sdk\`
- Python: \`pip install example-sdk\`
- Ruby: \`gem install example-sdk\`

---

## Support

- Documentation: [docs.example.com](https://docs.example.com)
- API Status: [status.example.com](https://status.example.com)
- Support Email: api-support@example.com
`,
  },
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter((t) => t.category === category);
}

export function getAllTemplates(): Template[] {
  return templates;
}
