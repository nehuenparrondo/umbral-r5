-- MySQL 8.0 o superior. InnoDB conserva transacciones y claves foráneas.
-- Importar dentro de la base asignada por el proveedor, sin crear usuarios SQL.
CREATE TABLE IF NOT EXISTS roles (
 id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(20) NOT NULL UNIQUE,
 description VARCHAR(200) NOT NULL,
 CHECK (name IN ('user','admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
INSERT IGNORE INTO roles (name,description) VALUES
 ('user','Regular authenticated user'),('admin','Administrative user with audited management access');
CREATE TABLE IF NOT EXISTS users (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 email VARCHAR(254) NOT NULL,
 email_normalized VARCHAR(254) GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED,
 username VARCHAR(30) NOT NULL,
 username_normalized VARCHAR(30) GENERATED ALWAYS AS (LOWER(TRIM(username))) STORED,
 display_name VARCHAR(80) NOT NULL,
 password_hash VARCHAR(255),
 role_id SMALLINT UNSIGNED NOT NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 email_verified_at DATETIME(3),
 failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
 login_locked_at DATETIME(3),
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 UNIQUE KEY users_email_normalized_uq (email_normalized),
 UNIQUE KEY users_username_normalized_uq (username_normalized),
 CONSTRAINT users_role_fk FOREIGN KEY (role_id) REFERENCES roles(id),
 CHECK (is_active IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS user_sessions (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 refresh_token_hash CHAR(64) CHARACTER SET ascii NOT NULL UNIQUE,
 user_agent TEXT, ip_address VARCHAR(45),
 expires_at DATETIME(3) NOT NULL, revoked_at DATETIME(3),
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 KEY user_sessions_user_id_idx(user_id),
 KEY user_sessions_valid_idx(refresh_token_hash,expires_at,revoked_at),
 CONSTRAINT sessions_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS oauth_accounts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 provider VARCHAR(30) NOT NULL, provider_user_id VARCHAR(255) NOT NULL,
 email_at_provider VARCHAR(254),
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY oauth_provider_identity_uq(provider,provider_user_id),
 UNIQUE KEY oauth_user_provider_uq(user_id,provider),
 CONSTRAINT oauth_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
-- Bloqueos transaccionales por identidad/email: evitan altas OAuth duplicadas.
CREATE TABLE IF NOT EXISTS oauth_identity_locks (
 lock_key CHAR(64) CHARACTER SET ascii PRIMARY KEY
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS oauth_login_states (
 state_hash CHAR(64) CHARACTER SET ascii PRIMARY KEY,
 provider VARCHAR(30) NOT NULL, code_verifier VARCHAR(128), nonce VARCHAR(128),
 expires_at DATETIME(3) NOT NULL, consumed_at DATETIME(3),
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY oauth_login_states_expiry_idx(expires_at,consumed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS auth_challenges (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 purpose VARCHAR(30) NOT NULL, target_email VARCHAR(254) NOT NULL,
 code_hash CHAR(64) CHARACTER SET ascii NOT NULL,
 attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
 delivery_status VARCHAR(10) NOT NULL DEFAULT 'pending',
 expires_at DATETIME(3) NOT NULL, consumed_at DATETIME(3),
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY auth_challenges_user_purpose_idx(user_id,purpose,created_at),
 CONSTRAINT challenge_user_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CHECK(purpose IN ('verify_email','unlock','reset_password','change_email')),
 CHECK(delivery_status IN ('pending','sent','failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 actor_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin,
 action VARCHAR(80) NOT NULL,
 target_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin,
 ip_address VARCHAR(45), user_agent TEXT, metadata JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY audit_logs_actor_idx(actor_user_id), KEY audit_logs_target_idx(target_user_id),
 KEY audit_logs_action_created_idx(action,created_at),
 CONSTRAINT audit_actor_fk FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
 CONSTRAINT audit_target_fk FOREIGN KEY(target_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
