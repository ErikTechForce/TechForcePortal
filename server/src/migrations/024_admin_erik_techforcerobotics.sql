-- Migration: 024_admin_erik_techforcerobotics.sql
-- Description: Grant admin role to user with email erik@techforcerobotics.com.

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE LOWER(TRIM(email)) = 'erik@techforcerobotics.com'
ON CONFLICT (user_id, role) DO NOTHING;
