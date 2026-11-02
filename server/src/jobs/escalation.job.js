import cron from 'node-cron';
import env from '../config/env.js';
import { execute, query } from '../config/db.js';
import logger from '../utils/logger.js';
import { addTimeline } from '../services/submissionView.service.js';
import { notifyDistrictHead, notifySuperAdmins } from '../services/notification.service.js';
import { translate } from '../utils/i18n.js';

let task = null;
let running = false;

export const runEscalationOnce = async () => {
  if (running) return { skipped: true };
  running = true;

  try {
    const rows = await query(
      `SELECT id, tracking_number, district_id, language, status, escalation_level
         FROM submissions
        WHERE due_at IS NOT NULL
          AND due_at < NOW()
          AND status IN ('received', 'assigned', 'under_review', 'awaiting_info', 'overdue')
          AND escalation_level < 3
        ORDER BY due_at ASC
        LIMIT 200`
    );

    let escalated = 0;

    for (const row of rows) {
      const nextLevel = Math.min(3, Number(row.escalation_level || 0) + 1);
      await execute(
        `UPDATE submissions
            SET status = 'overdue', escalation_level = ?
          WHERE id = ?`,
        [nextLevel, row.id]
      );

      await addTimeline({
        submissionId: row.id,
        actorRole: 'system',
        status: 'overdue',
        message: translate('overdue', row.language, { tracking: row.tracking_number }),
        isPublic: true,
        metadata: { escalationLevel: nextLevel }
      });

      if (nextLevel === 1) {
        await notifyDistrictHead({
          districtId: row.district_id,
          submissionId: row.id,
          type: 'escalation',
          messageKey: 'overdue',
          vars: { tracking: row.tracking_number },
          language: row.language
        });
      } else {
        await notifySuperAdmins({
          submissionId: row.id,
          type: 'escalation',
          messageKey: 'overdue',
          vars: { tracking: row.tracking_number }
        });
      }

      escalated += 1;
    }

    if (escalated) {
      logger.info({ escalated }, 'escalation job processed overdue submissions');
    }

    return { escalated };
  } catch (error) {
    logger.error({ err: error.message }, 'escalation job failed');
    return { error: error.message };
  } finally {
    running = false;
  }
};

export const startEscalationJob = () => {
  if (task) return task;
  if (!cron.validate(env.jobs.escalationCron)) {
    logger.warn({ cron: env.jobs.escalationCron }, 'invalid escalation cron expression');
    return null;
  }

  task = cron.schedule(env.jobs.escalationCron, () => runEscalationOnce(), {
    timezone: 'Africa/Kigali'
  });

  logger.info({ cron: env.jobs.escalationCron }, 'escalation job scheduled');
  runEscalationOnce();
  return task;
};

export const stopEscalationJob = () => {
  if (task) {
    task.stop();
    task = null;
  }
};

export default { runEscalationOnce, startEscalationJob, stopEscalationJob };
