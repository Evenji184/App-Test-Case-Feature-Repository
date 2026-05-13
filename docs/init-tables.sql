-- APP 特征库管理系统 - 建表脚本
-- 适用环境: MySQL 8.0, utf8mb4, InnoDB (DYNAMIC row format)
-- 用途: 绕过 prisma db push 在 utf8mb4 下的 index key 长度超限问题
-- 共 12 张表: users, roles, permissions, user_roles, role_permissions,
--            feature_nodes, features, request_logs, audit_logs, login_logs,
--            ai_providers, prompts

-- 创建数据库
CREATE DATABASE IF NOT EXISTS app_feature_repository
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE app_feature_repository;

-- ========================================
-- 用户与权限相关表
-- ========================================

CREATE TABLE users (
  id              CHAR(36)     NOT NULL,
  username        VARCHAR(64)  NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(128) DEFAULT NULL,
  phone           VARCHAR(32)  DEFAULT NULL,
  avatar_url      VARCHAR(500) DEFAULT NULL,
  status          VARCHAR(32)  NOT NULL DEFAULT 'active',
  is_super_admin  TINYINT(1)   NOT NULL DEFAULT 0,
  last_login_at   DATETIME(3)  DEFAULT NULL,
  last_login_ip   VARCHAR(45)  DEFAULT NULL,
  remark          TEXT         DEFAULT NULL,
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_username_deleted_at_key (username, deleted_at),
  UNIQUE KEY users_email_deleted_at_key (email, deleted_at),
  KEY users_status_deleted_at_idx (status, deleted_at),
  KEY users_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
  id              CHAR(36)     NOT NULL,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(64)  NOT NULL,
  description     TEXT         DEFAULT NULL,
  is_system       TINYINT(1)   NOT NULL DEFAULT 0,
  status          VARCHAR(32)  NOT NULL DEFAULT 'active',
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY roles_code_deleted_at_key (code, deleted_at),
  UNIQUE KEY roles_name_deleted_at_key (name, deleted_at),
  KEY roles_status_deleted_at_idx (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id              CHAR(36)     NOT NULL,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(128) NOT NULL,
  module          VARCHAR(64)  NOT NULL,
  resource        VARCHAR(64)  NOT NULL,
  action          VARCHAR(64)  NOT NULL,
  description     TEXT         DEFAULT NULL,
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY permissions_code_deleted_at_key (code, deleted_at),
  UNIQUE KEY permissions_module_resource_action_deleted_at_key (module, resource, action, deleted_at),
  KEY permissions_module_deleted_at_idx (module, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  id              CHAR(36)     NOT NULL,
  user_id         CHAR(36)     NOT NULL,
  role_id         CHAR(36)     NOT NULL,
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY user_roles_user_id_role_id_deleted_at_key (user_id, role_id, deleted_at),
  KEY user_roles_role_id_deleted_at_idx (role_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  id              CHAR(36)     NOT NULL,
  role_id         CHAR(36)     NOT NULL,
  permission_id   CHAR(36)     NOT NULL,
  deleted_at      DATETIME(3)  DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL,
  created_by      CHAR(36)     DEFAULT NULL,
  updated_by      CHAR(36)     DEFAULT NULL,
  deleted_by      CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY role_permissions_role_id_permission_id_deleted_at_key (role_id, permission_id, deleted_at),
  KEY role_permissions_permission_id_deleted_at_idx (permission_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 特征库相关表
-- ========================================

CREATE TABLE feature_nodes (
  id                    CHAR(36)     NOT NULL,
  parent_id             CHAR(36)     DEFAULT NULL,
  name                  VARCHAR(200) NOT NULL,
  code                  VARCHAR(128) NOT NULL,
  node_type             VARCHAR(32)  NOT NULL DEFAULT 'folder',
  path                  VARCHAR(1024) NOT NULL,
  level                 INT          NOT NULL DEFAULT 1,
  sort_order            INT          NOT NULL DEFAULT 0,
  is_visible            TINYINT(1)   NOT NULL DEFAULT 1,
  is_locked             TINYINT(1)   NOT NULL DEFAULT 0,
  source_node_id        CHAR(36)     DEFAULT NULL,
  copied_from_node_id   CHAR(36)     DEFAULT NULL,
  moved_from_node_id    CHAR(36)     DEFAULT NULL,
  move_operation_id     CHAR(36)     DEFAULT NULL,
  copy_operation_id     CHAR(36)     DEFAULT NULL,
  remark                TEXT         DEFAULT NULL,
  deleted_at            DATETIME(3)  DEFAULT NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3)  NOT NULL,
  created_by            CHAR(36)     DEFAULT NULL,
  updated_by            CHAR(36)     DEFAULT NULL,
  deleted_by            CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY feature_nodes_parent_id_code_deleted_at_key (parent_id, code, deleted_at),
  KEY feature_nodes_path_idx (path(255)),
  KEY feature_nodes_is_visible_deleted_at_idx (is_visible, deleted_at),
  KEY feature_nodes_source_node_id_idx (source_node_id),
  KEY feature_nodes_copied_from_node_id_idx (copied_from_node_id),
  KEY feature_nodes_moved_from_node_id_idx (moved_from_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE features (
  id                    CHAR(36)     NOT NULL,
  node_id               CHAR(36)     NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  code                  VARCHAR(128) NOT NULL,
  summary               VARCHAR(500) DEFAULT NULL,
  description           TEXT         DEFAULT NULL,
  platform              VARCHAR(64)  DEFAULT NULL,
  status                VARCHAR(32)  NOT NULL DEFAULT 'draft',
  priority              VARCHAR(32)  NOT NULL DEFAULT 'medium',
  version               VARCHAR(64)  DEFAULT NULL,
  tags                  TEXT         DEFAULT NULL,
  is_visible            TINYINT(1)   NOT NULL DEFAULT 1,
  is_archived           TINYINT(1)   NOT NULL DEFAULT 0,
  source_feature_id     CHAR(36)     DEFAULT NULL,
  copied_from_id        CHAR(36)     DEFAULT NULL,
  moved_from_node_id    CHAR(36)     DEFAULT NULL,
  move_operation_id     CHAR(36)     DEFAULT NULL,
  copy_operation_id     CHAR(36)     DEFAULT NULL,
  last_copied_at        DATETIME(3)  DEFAULT NULL,
  last_moved_at         DATETIME(3)  DEFAULT NULL,
  remark                TEXT         DEFAULT NULL,
  deleted_at            DATETIME(3)  DEFAULT NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3)  NOT NULL,
  created_by            CHAR(36)     DEFAULT NULL,
  updated_by            CHAR(36)     DEFAULT NULL,
  deleted_by            CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY features_node_id_code_deleted_at_key (node_id, code, deleted_at),
  KEY features_status_deleted_at_idx (status, deleted_at),
  KEY features_is_visible_deleted_at_idx (is_visible, deleted_at),
  KEY features_source_feature_id_idx (source_feature_id),
  KEY features_copied_from_id_idx (copied_from_id),
  KEY features_moved_from_node_id_idx (moved_from_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 日志相关表
-- ========================================

CREATE TABLE request_logs (
  id              CHAR(36)     NOT NULL,
  request_id      CHAR(36)     NOT NULL,
  user_id         CHAR(36)     DEFAULT NULL,
  method          VARCHAR(16)  NOT NULL,
  path            VARCHAR(500) NOT NULL,
  query_string    TEXT         DEFAULT NULL,
  request_body    LONGTEXT     DEFAULT NULL,
  response_status INT          NOT NULL,
  response_body   LONGTEXT     DEFAULT NULL,
  duration_ms     INT          NOT NULL,
  ip_address      VARCHAR(45)  DEFAULT NULL,
  user_agent      TEXT         DEFAULT NULL,
  trace_id        VARCHAR(128) DEFAULT NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY request_logs_request_id_key (request_id),
  KEY request_logs_user_id_created_at_idx (user_id, created_at),
  KEY request_logs_path_created_at_idx (path, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id               CHAR(36)     NOT NULL,
  user_id          CHAR(36)     DEFAULT NULL,
  request_id       CHAR(36)     DEFAULT NULL,
  action           VARCHAR(64)  NOT NULL,
  target_type      VARCHAR(64)  NOT NULL,
  target_id        CHAR(36)     DEFAULT NULL,
  target_name      VARCHAR(255) DEFAULT NULL,
  change_summary   VARCHAR(500) DEFAULT NULL,
  before_data      LONGTEXT     DEFAULT NULL,
  after_data       LONGTEXT     DEFAULT NULL,
  ip_address       VARCHAR(45)  DEFAULT NULL,
  user_agent       TEXT         DEFAULT NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY audit_logs_user_id_created_at_idx (user_id, created_at),
  KEY audit_logs_target_type_target_id_idx (target_type, target_id),
  KEY audit_logs_request_id_idx (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_logs (
  id               CHAR(36)     NOT NULL,
  user_id          CHAR(36)     DEFAULT NULL,
  username         VARCHAR(64)  NOT NULL,
  login_type       VARCHAR(32)  NOT NULL DEFAULT 'password',
  login_status     VARCHAR(32)  NOT NULL,
  failure_reason   VARCHAR(255) DEFAULT NULL,
  ip_address       VARCHAR(45)  DEFAULT NULL,
  user_agent       TEXT         DEFAULT NULL,
  occurred_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY login_logs_user_id_occurred_at_idx (user_id, occurred_at),
  KEY login_logs_username_occurred_at_idx (username, occurred_at),
  KEY login_logs_login_status_occurred_at_idx (login_status, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- AI 供应商相关表
-- ========================================

CREATE TABLE ai_providers (
  id                CHAR(36)     NOT NULL,
  name              VARCHAR(128) NOT NULL,
  website_url       VARCHAR(500) DEFAULT NULL,
  api_key_encrypted TEXT         NOT NULL,
  api_key_hint      VARCHAR(32)  NOT NULL,
  request_url       VARCHAR(500) NOT NULL,
  model_name        VARCHAR(128) NOT NULL,
  provider_format   VARCHAR(32)  NOT NULL DEFAULT 'openai_compatible',
  is_default        TINYINT(1)   NOT NULL DEFAULT 0,
  status            VARCHAR(32)  NOT NULL DEFAULT 'active',
  remark            TEXT         DEFAULT NULL,
  deleted_at        DATETIME(3)  DEFAULT NULL,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL,
  created_by        CHAR(36)     DEFAULT NULL,
  updated_by        CHAR(36)     DEFAULT NULL,
  deleted_by        CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ai_providers_name_deleted_at_key (name, deleted_at),
  KEY ai_providers_status_deleted_at_idx (status, deleted_at),
  KEY ai_providers_provider_format_idx (provider_format, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 提示词相关表
-- ========================================

CREATE TABLE prompts (
  id                CHAR(36)     NOT NULL,
  name              VARCHAR(200) DEFAULT NULL,
  content           LONGTEXT     NOT NULL,
  provider_id       CHAR(36)     DEFAULT NULL,
  model             VARCHAR(128) DEFAULT NULL,
  usage_info        TEXT         DEFAULT NULL,
  node_ids          TEXT         DEFAULT NULL,
  feature_ids       TEXT         DEFAULT NULL,
  custom_instruction TEXT         DEFAULT NULL,
  deleted_at        DATETIME(3)  DEFAULT NULL,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL,
  created_by        CHAR(36)     DEFAULT NULL,
  updated_by        CHAR(36)     DEFAULT NULL,
  deleted_by        CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY prompts_provider_id_deleted_at_idx (provider_id, deleted_at),
  KEY prompts_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;