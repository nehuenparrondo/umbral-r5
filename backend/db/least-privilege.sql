-- Referencia para MySQL. Reemplazar base y cuenta según el entorno.
-- setup:local aplica estos permisos sin contraseñas compartidas.
GRANT SELECT ON umbral_r5.roles TO 'umbral_r5_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON umbral_r5.users TO 'umbral_r5_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON umbral_r5.user_sessions TO 'umbral_r5_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON umbral_r5.oauth_accounts TO 'umbral_r5_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON umbral_r5.oauth_identity_locks TO 'umbral_r5_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON umbral_r5.oauth_login_states TO 'umbral_r5_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON umbral_r5.auth_challenges TO 'umbral_r5_app'@'localhost';
GRANT SELECT, INSERT ON umbral_r5.audit_logs TO 'umbral_r5_app'@'localhost';
