import { execute, query, queryOne } from '../config/db.js';
import env from '../config/env.js';
import { localizedMessages, normalizeLanguage } from '../utils/i18n.js';

const sendViaAfricasTalking = async (phone, message) => {
  const { username, apiKey } = env.sms.africastalking;
  if (!username || !apiKey) {
    console.info('[sms:africastalking] credentials missing, skipping', phone);
    return;
  }
  const body = new URLSearchParams({
    username,
    to: phone,
    message,
    from: env.sms.senderId
  });
  const response = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body
  });
  if (!response.ok) throw new Error(`Africa's Talking responded ${response.status}`);
};

const sendViaTwilio = async (phone, message) => {
  const { accountSid, authToken, from } = env.sms.twilio;
  if (!accountSid || !authToken || !from) {
    console.info('[sms:twilio] credentials missing, skipping', phone);
    return;
  }
  const body = new URLSearchParams({ To: phone, From: from, Body: message });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    }
  );
  if (!response.ok) throw new Error(`Twilio responded ${response.status}`);
};

export const sendSms = async (phone, message) => {
  if (!phone) return;
  try {
    if (env.sms.provider === 'africastalking') {
      await sendViaAfricasTalking(phone, message);
    } else if (env.sms.provider === 'twilio') {
      await sendViaTwilio(phone, message);
    } else {
      console.info(`[sms:console] ${phone} :: ${message}`);
    }
  } catch (error) {
    console.error('[sms] delivery failed', error.message);
  }
};

export const notifyUser = async ({
  userId,
  submissionId = null,
  type,
  messageKey,
  language = 'rw',
  vars = {},
  phone = null,
  sms = false
}) => {
  if (!userId) return null;
  const messages = localizedMessages(messageKey, vars);
  const preferred = normalizeLanguage(language);

  try {
    await execute(
      `INSERT INTO notifications (id, user_id, submission_id, type, message_rw, message_en, message_fr)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [userId, submissionId, type, messages.rw, messages.en, messages.fr]
    );
  } catch (error) {
    console.error('[notification] failed to store', error.message);
  }

  if (sms && phone) {
    await sendSms(phone, messages[preferred] || messages.en);
  }

  return messages[preferred] || messages.en;
};

export const notifySuperAdmins = async ({
  submissionId = null,
  type,
  messageKey,
  vars = {},
  language = 'en'
}) => {
  const admins = await query(
    "SELECT id FROM users WHERE role = 'super_admin' AND account_status = 'active'"
  );
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        submissionId,
        type,
        messageKey,
        vars,
        language
      })
    )
  );
};

export const notifyDistrictHead = async ({
  districtId,
  submissionId = null,
  type,
  messageKey,
  vars = {},
  language = 'rw'
}) => {
  if (!districtId) return null;
  const head = await queryOne(
    "SELECT id, language, phone FROM users WHERE role = 'district_head' AND district_id = ? AND account_status = 'active' LIMIT 1",
    [districtId]
  );
  if (!head) return null;
  return notifyUser({
    userId: head.id,
    submissionId,
    type,
    messageKey,
    vars,
    language: language || head.language,
    phone: head.phone,
    sms: true
  });
};

export const markRead = async (notificationId, userId) => {
  await execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [
    notificationId,
    userId
  ]);
};

export const unreadCount = async (userId) => {
  const row = await queryOne(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [userId]
  );
  return row?.total || 0;
};

export default {
  sendSms,
  notifyUser,
  notifySuperAdmins,
  notifyDistrictHead,
  markRead,
  unreadCount
};
