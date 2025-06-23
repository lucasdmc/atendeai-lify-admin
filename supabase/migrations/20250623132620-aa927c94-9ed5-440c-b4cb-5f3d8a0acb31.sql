
-- Add agendamentos permission for all existing users
INSERT INTO user_permissions (user_id, module_name, can_access)
SELECT id, 'agendamentos', true
FROM user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_permissions 
  WHERE user_id = user_profiles.id AND module_name = 'agendamentos'
);

-- Make sure all admins have agendamentos permission
UPDATE user_permissions 
SET can_access = true 
WHERE module_name = 'agendamentos' 
AND user_id IN (
  SELECT id FROM user_profiles WHERE role = 'admin'
);
