// FCM provider stub (implemented behind interface).
// Real integration can be added later by loading Google credentials and calling FCM APIs.

export function createFcmProvider() {
  return {
    async sendToUsers({ userIds, title, body, data }) {
      // Stub: pretend all sends succeeded
      return { sent: userIds.length, failed: 0, failures: [] };
    },
  };
}

