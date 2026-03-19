-- Add separate tracking columns for email and whatsapp alerts
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS email_alert_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_alert_sent BOOLEAN DEFAULT false;

-- For existing 'sent' events, mark both as sent
UPDATE events 
SET email_alert_sent = true, whatsapp_alert_sent = true 
WHERE alert_status = 'sent';

-- Comment for clarity
COMMENT ON COLUMN events.email_alert_sent IS 'Tracks if email alert has been sent';
COMMENT ON COLUMN events.whatsapp_alert_sent IS 'Tracks if WhatsApp alert has been sent';
