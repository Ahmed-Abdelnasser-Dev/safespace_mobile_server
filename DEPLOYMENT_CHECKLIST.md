# Production Deployment Checklist - SafeSpace Companion

## Pre-Deployment Tasks

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No linting errors: `npm run lint` (if configured)
- [ ] No console errors or warnings
- [ ] Code reviewed and approved
- [ ] All TODO/FIXME comments addressed
- [ ] Database migrations tested

### Security
- [ ] JWT secrets are strong (32+ characters)
  - [ ] Access secret: `JWT_ACCESS_SECRET`
  - [ ] Refresh secret: `JWT_REFRESH_SECRET`
- [ ] Firebase service account key is secured
  - [ ] Never committed to version control
  - [ ] File permissions: `chmod 600`
  - [ ] Only accessible to application
- [ ] Database credentials are strong
  - [ ] Use unique username/password
  - [ ] Enable SSL/TLS for connections
- [ ] CORS configuration is restrictive
  - [ ] Only allow your frontend domain
  - [ ] Don't use wildcard (`*`)
- [ ] HTTPS enabled on production domain
- [ ] No hardcoded secrets in code
- [ ] `.env` and `.env.production` are in `.gitignore`

### Configuration
- [ ] `.env.production` created with all required variables
- [ ] Database credentials correct
- [ ] Firebase project ID matches credentials
- [ ] Firebase service account path accessible
- [ ] Central Unit base URL correct
- [ ] TLS certificates valid (if using mTLS)
- [ ] All environment variables validated

### Database
- [ ] PostgreSQL 14+ installed and running
- [ ] Database created: `safeespace_mobile_server_db`
- [ ] Migrations up-to-date: `npx prisma migrate status`
- [ ] Connection string tested
- [ ] Database backups configured
- [ ] Automatic backup schedule enabled
- [ ] Performance indexes verified

### Monitoring & Logging
- [ ] Application logging configured
  - [ ] Log level: `info` or `warn`
  - [ ] Log format structured (JSON)
  - [ ] Logs written to file/aggregator
- [ ] Error tracking setup
  - [ ] Sentry, DataDog, or similar
  - [ ] Error notifications configured
- [ ] Metrics collection
  - [ ] Request count/latency
  - [ ] Database query performance
  - [ ] Firebase notification delivery rate
- [ ] Health check endpoint configured
- [ ] Status page created

### Infrastructure
- [ ] Server has adequate resources
  - [ ] CPU: 2+ cores minimum
  - [ ] Memory: 2GB+ minimum
  - [ ] Storage: 20GB+ for logs
- [ ] Firewall rules configured
  - [ ] Allow port 80/443 from internet
  - [ ] Restrict database port to app server
  - [ ] Block unnecessary ports
- [ ] Load balancer/reverse proxy setup
  - [ ] HTTPS termination
  - [ ] Health checks configured
  - [ ] Rate limiting enabled
- [ ] CDN configured (if applicable)
- [ ] DNS records configured
  - [ ] A/AAAA records point to server
  - [ ] SSL certificate domain matches

### Deployment
- [ ] Docker image built and tested
  - [ ] Tag: `safespace-mobile-server:1.0.0`
  - [ ] Multi-stage build (if applicable)
  - [ ] Size optimized
- [ ] Docker registry setup
  - [ ] Image pushed to registry
  - [ ] Registry credentials secured
- [ ] Kubernetes/orchestration configured (if using)
  - [ ] Deployment manifest created
  - [ ] Service/Ingress configured
  - [ ] Secrets mounted correctly
  - [ ] Resource requests/limits set
- [ ] CI/CD pipeline configured
  - [ ] Automated testing on push
  - [ ] Automated deployment on merge
  - [ ] Rollback procedure documented

### Backup & Recovery
- [ ] Database backups automated
  - [ ] Daily backups enabled
  - [ ] Retention policy: 30+ days
  - [ ] Test restore procedure
- [ ] Application state backups
  - [ ] Firebase configuration saved
  - [ ] Secrets encrypted and backed up
- [ ] Disaster recovery plan
  - [ ] RTO (Recovery Time Objective): < 1 hour
  - [ ] RPO (Recovery Point Objective): < 1 day
  - [ ] Recovery procedures documented
  - [ ] Team trained on procedures

### Performance
- [ ] Load testing completed
  - [ ] Target: 100+ concurrent users
  - [ ] No errors under load
  - [ ] Response time < 500ms p95
- [ ] Database query performance
  - [ ] All queries use indexes
  - [ ] Slow query log enabled
  - [ ] No N+1 queries
- [ ] Firebase quota verified
  - [ ] Can send notifications to user base
  - [ ] Monitoring quota usage
- [ ] Caching strategy implemented
  - [ ] Session caching (if applicable)
  - [ ] Response caching headers
- [ ] Assets optimized
  - [ ] No unnecessary assets
  - [ ] Compression enabled (gzip)

### Documentation
- [ ] README.md updated for production
- [ ] Architecture documented
- [ ] API documentation generated/updated
- [ ] Runbook created for common tasks
- [ ] Troubleshooting guide updated
- [ ] Firebase configuration guide reviewed
- [ ] Notification flow documented
- [ ] Incident response plan created

## Deployment Day Tasks

### Pre-Deployment
- [ ] Get sign-off from stakeholders
- [ ] Team members available for support
- [ ] Maintenance window scheduled (if needed)
- [ ] Communication plan ready
  - [ ] Status page updated
  - [ ] Customer notification ready
  - [ ] Support team notified

### During Deployment
- [ ] Deploy code to staging first
  - [ ] Run all tests in staging
  - [ ] Verify all features work
  - [ ] Check performance
- [ ] Deploy to production
  - [ ] Use blue-green or canary deployment
  - [ ] Monitor error rates
  - [ ] Monitor response times
  - [ ] Monitor FCM notification delivery
- [ ] Smoke tests
  - [ ] Login endpoint works
  - [ ] Can report accidents
  - [ ] Can receive notifications
  - [ ] Database queries work
  - [ ] Firebase integration works
- [ ] Check logs for errors
- [ ] Verify monitoring/alerting

### Post-Deployment
- [ ] Verify all features working
- [ ] Check error rates (should be < 0.1%)
- [ ] Monitor database performance
- [ ] Monitor Firebase quota usage
- [ ] Collect user feedback
- [ ] Update status page
- [ ] Notify stakeholders

## Rollback Plan

If issues occur:

### Immediate Actions
- [ ] Stop receiving new traffic
- [ ] Check error logs
- [ ] Check database status
- [ ] Check Firebase status

### Decision Point
- [ ] Is rollback needed? (Critical errors, > 1% error rate, > 2s response time)

### Rollback Execution
```bash
# Revert code to previous version
git revert <deployment-commit>

# Redeploy
docker run ... safespace-mobile-server:previous-version

# Or rollback database migrations
npx prisma migrate resolve --rolled-back <migration-name>

# Verify
curl http://localhost:3000/health
```

### Post-Rollback
- [ ] Verify all systems operational
- [ ] Collect incident data
- [ ] Document what went wrong
- [ ] Create issues for fixes
- [ ] Update deployment procedures

## Ongoing Monitoring

### Daily
- [ ] Check error logs
- [ ] Monitor notification delivery rate (target > 95%)
- [ ] Check database performance
- [ ] Review Firebase quota usage
- [ ] Check server resource usage (CPU, memory, disk)

### Weekly
- [ ] Analyze slow queries
- [ ] Review security logs
- [ ] Check backup status
- [ ] Test disaster recovery procedure

### Monthly
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Dependency updates
- [ ] Database maintenance
- [ ] Documentation review

## Contact & Escalation

### On-Call Support
- [ ] Primary contact: `[name/email]`
- [ ] Secondary contact: `[name/email]`
- [ ] On-call schedule: `[link]`

### Incident Management
- [ ] Incident channel: Slack `#incidents`
- [ ] Status page: `[url]`
- [ ] Incident postmortem template: `[link]`

### Emergency Contacts
- [ ] Firebase support: `[contact info]`
- [ ] Database hosting support: `[contact info]`
- [ ] Infrastructure support: `[contact info]`

## Useful Commands

### Deployment
```bash
# Build Docker image
docker build -t safespace-mobile-server:1.0.0 .

# Push to registry
docker push registry.example.com/safespace-mobile-server:1.0.0

# Deploy via Docker
docker run -e NODE_ENV=production \
  -e FIREBASE_SERVICE_ACCOUNT_PATH=/secrets/firebase.json \
  -v /path/to/firebase.json:/secrets/firebase.json \
  -p 3000:3000 \
  safespace-mobile-server:1.0.0

# Deploy via Kubernetes
kubectl apply -f k8s/deployment.yaml
```

### Monitoring
```bash
# Check application health
curl https://safespace.example.com/health

# Check logs
docker logs <container-id>
kubectl logs <pod-name>

# Monitor resources
docker stats
kubectl top pods

# Database status
psql $DATABASE_URL -c "SELECT version();"
```

### Troubleshooting
```bash
# SSH into server
ssh user@safespace.example.com

# Check running processes
ps aux | grep node

# Check ports
netstat -tlnp | grep 3000

# Restart application
systemctl restart safespace-mobile-server
# or
docker restart <container-id>
```

### Rollback
```bash
# View deployment history
kubectl rollout history deployment/safespace-mobile-server

# Rollback to previous version
kubectl rollout undo deployment/safespace-mobile-server

# Or redeploy previous image
docker pull registry.example.com/safespace-mobile-server:previous-version
```

## Post-Deployment Review

Within 24 hours of deployment:

- [ ] No critical issues reported
- [ ] Error rate stable and low
- [ ] Performance metrics normal
- [ ] Firebase notifications delivering (> 95%)
- [ ] Database performing well
- [ ] User feedback positive
- [ ] All monitoring alerts configured
- [ ] Team feedback collected

Conduct a brief postmortem:
- [ ] What went well?
- [ ] What could be improved?
- [ ] What will we do differently next time?
- [ ] Create issues for improvements

---

**Created**: February 2, 2026  
**Project**: SafeSpace Companion  
**Status**: Ready for Production
