import { execute } from '../config/db.js';

export const logAction = async ({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  oldValue = null,
  newValue = null,
  ipAddress = null
}) => {
  try {
    await execute(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress
      ]
    );
  } catch (error) {
    // Audit logging must never break the main request.
    console.error('[audit] failed to record action', action, error.message);
  }
};

export default { logAction };
