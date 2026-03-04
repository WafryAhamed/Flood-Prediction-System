# 🚀 FloodWeb Backend - Setup & Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Navigate to backend directory
cd server

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

The server will start on `http://localhost:3001`

---

## Project Structure

```
server/
├── src/
│   ├── app.ts                    # Main Express app
│   ├── config/
│   │   ├── database.ts          # MongoDB connection
│   │   └── constants.ts         # App constants
│   ├── controllers/             # Request handlers
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API routes
│   ├── middleware/              # Express middleware
│   ├── utils/                   # Helper functions
│   ├── types/                   # TypeScript types
│   └── scripts/                 # Migration scripts
├── tests/                       # Test files
├── dist/                        # Compiled JavaScript
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Setup

### Local Development (.env)

```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/floodweb
JWT_SECRET=dev_secret_key_change_in_production
FRONTEND_URL=http://localhost:5173
```

### Production (deploy platform variables)
Set on deployment platform (Vercel, Heroku, etc.):
- All variables from .env.example
- Use strong JWT secrets
- Use production MongoDB URI
- Set NODE_ENV=production

---

## API Routes (Stub Stubs Ready for Implementation)

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### User Profile
- `GET /api/v1/profile` - Get current user
- `PUT /api/v1/profile` - Update profile
- `DELETE /api/v1/profile` - Delete account

### Safety Profile
- `POST /api/v1/safety-profile` - Create profile
- `GET /api/v1/safety-profile` - Get profile
- `PUT /api/v1/safety-profile/:id` - Update profile
- `DELETE /api/v1/safety-profile/:id` - Delete profile

### Risk & Alerts
- `GET /api/v1/risk/current` - Get current risk
- `GET /api/v1/alerts` - Get alerts
- `POST /api/v1/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/v1/alerts/preferences` - Update preferences

### Community Reports
- `POST /api/v1/reports` - Submit report
- `GET /api/v1/reports` - Get reports feed
- `POST /api/v1/reports/:id/help` - Mark helpful
- `POST /api/v1/reports/:id/comments` - Add comment

### More routes in BACKEND_API_SPEC.md

---

## Development Workflow

### Start Development
```bash
npm run dev
```

### Watch Files
```bash
npm run watch
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
npm run test:watch
```

### Lint Code
```bash
npm run lint
```

---

## Database Setup

### MongoDB Local
```bash
# Install MongoDB Community
# https://docs.mongodb.com/manual/installation/

# Start MongoDB service
mongod

# Create database and collections
mongo floodweb

# In MongoDB shell:
db.createCollection("users")
db.createCollection("safetyProfiles")
db.createCollection("alerts")
```

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Add to .env: `MONGODB_URI=mongodb+srv://user:pass@cluster...`

---

## Implementation Checklist

### Phase 1: Core Infrastructure (3 days)
- [ ] Set up Express + TypeScript
- [ ] Configure MongoDB connection
- [ ] Create middleware (auth, validation, logging)
- [ ] Implement JWT authentication
- [ ] Create user authentication endpoints

### Phase 2: Main Services (5 days)
- [ ] Implement all 30+ REST endpoints
- [ ] Create MongoDB schemas & models
- [ ] Add input validation
- [ ] Implement error handling
- [ ] Add RBAC middleware

### Phase 3: Advanced Features (3 days)
- [ ] Background sync jobs
- [ ] WebSocket for real-time alerts
- [ ] File upload handling
- [ ] Caching strategy
- [ ] Rate limiting

### Phase 4: Testing & Deployment (2 days)
- [ ] Write integration tests
- [ ] Load testing
- [ ] Security audit
- [ ] Deploy to production
- [ ] Monitor and optimize

---

## Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Heroku
```bash
heroku create floodweb-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=<your_mongodb_uri>
git push heroku main
```

### AWS/DigitalOcean
```bash
# Build Docker image
docker build -t floodweb-api .

# Push to registry
docker push <registry>/floodweb-api:latest

# Deploy using platform tools
```

---

## Testing

### Run All Tests
```bash
npm test
```

### Test Coverage
```bash
npm test -- --coverage
```

### Integration Tests
```bash
npm run test:watch
```

---

## Monitoring & Logging

- Logs stored in `logs/server.log`
- Set `LOG_LEVEL` in .env (debug, info, warn, error)
- Use Morgan for HTTP request logging
- Implement error tracking (Sentry optional)

---

## API Documentation

Full API specification: [BACKEND_API_SPEC.md](../BACKEND_API_SPEC.md)

---

## Troubleshooting

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED
→ Ensure MongoDB is running: mongod
```

### Port Already in Use
```
Error: listen EADDRINUSE :::3001
→ Change PORT in .env or kill process: lsof -ti:3001 | xargs kill -9
```

### JWT Secret Error
```
Error: error:0906D06C:PEM routines:PEM_read_bio:no start line
→ Generate new secret: openssl rand -hex 32
```

---

## Support

For issues and questions:
- Check BACKEND_API_SPEC.md
- Review error logs
- Check MongoDB connection
- Verify environment variables

---

**Ready to build!** 🚀
