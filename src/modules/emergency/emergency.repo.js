/**
 * Emergency Repository
 * Handles all database operations for emergency requests
 * 
 * @param {import('@prisma/client').PrismaClient} prisma - Prisma client instance
 */
export function createEmergencyRepo(prisma) {
  return {
    /**
     * Create a new emergency request
     * 
     * @param {Object} data - Emergency request data
     * @param {string|null} data.requesterUserId - ID of the user making the request
     * @param {Array<string>} data.emergencyTypes - Array of emergency types
     * @param {Array<string>} data.emergencyServices - Array of emergency services needed
     * @param {string} data.description - Description of the emergency
     * @param {string|null} data.photoUri - Optional photo URI
     * @param {number} data.lat - Latitude coordinate
     * @param {number} data.lng - Longitude coordinate
     * @param {Date} data.timestamp - Timestamp of the emergency
     * @param {string} data.status - Status of the request (default: QUEUED)
     * @returns {Promise<Object>} Created emergency request with ID
     */
    async createEmergencyRequest(data) {
      return prisma.emergencyRequest.create({
        data: {
          requesterUserId: data.requesterUserId,
          emergencyTypes: data.emergencyTypes,
          emergencyServices: data.emergencyServices,
          description: data.description,
          photoUri: data.photoUri || null,
          lat: data.lat,
          lng: data.lng,
          timestamp: data.timestamp,
          status: data.status || "QUEUED",
        },
        select: {
          id: true,
          emergencyTypes: true,
          emergencyServices: true,
          description: true,
          photoUri: true,
          lat: true,
          lng: true,
          timestamp: true,
          status: true,
          createdAt: true,
        },
      });
    },

    /**
     * Find emergency request by ID
     * 
     * @param {string} id - Emergency request ID
     * @returns {Promise<Object|null>} Emergency request or null if not found
     */
    async findEmergencyRequestById(id) {
      return prisma.emergencyRequest.findUnique({
        where: { id },
        select: {
          id: true,
          requesterUserId: true,
          emergencyTypes: true,
          emergencyServices: true,
          description: true,
          photoUri: true,
          lat: true,
          lng: true,
          timestamp: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              bloodType: true,
              allergies: true,
              chronicConditions: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
            },
          },
        },
      });
    },

    /**
     * List emergency requests with optional filtering
     * 
     * @param {Object} options - Query options
     * @param {string} options.status - Filter by status (optional)
     * @param {number} options.limit - Maximum number of results
     * @param {number} options.offset - Number of results to skip
     * @param {string} options.userId - Filter by user ID (optional)
     * @returns {Promise<Array<Object>>} List of emergency requests
     */
    async listEmergencyRequests(options = {}) {
      const { status, limit = 20, offset = 0, userId } = options;

      const where = {};
      if (status) where.status = status;
      if (userId) where.requesterUserId = userId;

      return prisma.emergencyRequest.findMany({
        where,
        select: {
          id: true,
          requesterUserId: true,
          emergencyTypes: true,
          emergencyServices: true,
          description: true,
          photoUri: true,
          lat: true,
          lng: true,
          timestamp: true,
          status: true,
          createdAt: true,
          requester: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      });
    },

    /**
     * Update emergency request status
     * 
     * @param {string} id - Emergency request ID
     * @param {string} status - New status (QUEUED, SENT, FAILED)
     * @returns {Promise<Object>} Updated emergency request
     */
    async updateEmergencyRequestStatus(id, status) {
      return prisma.emergencyRequest.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });
    },

    /**
     * Count emergency requests
     * 
     * @param {Object} where - Filter conditions
     * @returns {Promise<number>} Count of emergency requests
     */
    async countEmergencyRequests(where = {}) {
      return prisma.emergencyRequest.count({ where });
    },
  };
}
