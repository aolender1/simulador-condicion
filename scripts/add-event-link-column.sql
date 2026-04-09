-- Add event_link column to events table
-- This field stores private meeting links (Zoom, etc.) that are only visible in email notifications

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_link VARCHAR(500);

-- Add a comment explaining the column
COMMENT ON COLUMN events.event_link IS 'Private event link (Zoom, etc.) - only sent via email, not shown in public calendar';
