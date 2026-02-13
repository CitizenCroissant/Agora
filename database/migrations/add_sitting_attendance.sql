-- Attendance for commission reunions (participants / présents / absents / excusés).
-- Source: data.assemblee-nationale.fr Agenda JSON, participants.participantsInternes.participantInterne.
-- Only commission reunions have this data; séances publiques have participants = null.

CREATE TABLE sitting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sitting_id UUID NOT NULL REFERENCES sittings(id) ON DELETE CASCADE,
    acteur_ref TEXT NOT NULL,
    presence TEXT NOT NULL CHECK (presence IN ('présent', 'absent', 'excusé')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sitting_id, acteur_ref)
);

CREATE INDEX idx_sitting_attendance_sitting_id ON sitting_attendance(sitting_id);
CREATE INDEX idx_sitting_attendance_acteur_ref ON sitting_attendance(acteur_ref);

CREATE TRIGGER update_sitting_attendance_updated_at
    BEFORE UPDATE ON sitting_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
