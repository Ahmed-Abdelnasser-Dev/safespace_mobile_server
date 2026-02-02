export function createAuthRepo(prisma) {
  return {
    async createUser({ email, passwordHash, fullName, phone }) {
      return prisma.user.create({
        data: { email, passwordHash, fullName, phone: phone || null },
        select: { id: true, email: true, fullName: true },
      });
    },

    async findUserByEmail(email) {
      return prisma.user.findUnique({ where: { email } });
    },

    async createSession({ userId, deviceId, fcmToken, refreshTokenHash, expiresAt }) {
      return prisma.session.create({
        data: {
          userId,
          deviceId: deviceId || null,
          fcmToken: fcmToken || null,
          refreshTokenHash,
          expiresAt,
        },
        select: { id: true, userId: true, expiresAt: true },
      });
    },

    async updateSessionRefreshHash(sessionId, refreshTokenHash) {
      return prisma.session.update({
        where: { id: sessionId },
        data: { refreshTokenHash },
        select: { id: true },
      });
    },

    async updateSessionFcmToken(sessionId, fcmToken) {
      return prisma.session.update({
        where: { id: sessionId },
        data: { fcmToken },
        select: { id: true, fcmToken: true },
      });
    },

    async findSessionById(sessionId) {
      return prisma.session.findUnique({ where: { id: sessionId } });
    },

    async revokeSession(sessionId) {
      return prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
        select: { id: true },
      });
    },

    async revokeAllUserSessions(userId) {
      return prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },

    async getUserActiveSessions(userId) {
      return prisma.session.findMany({
        where: { userId, revokedAt: null },
        select: { id: true, deviceId: true, fcmToken: true, expiresAt: true },
      });
    },
  };
}

