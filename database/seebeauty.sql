create table prompt_templates
(
    id         char(36)   default (uuid())          not null
        primary key,
    name       varchar(100)                         not null,
    version    varchar(20)                          not null,
    mode       enum ('normal', 'roast')             null,
    body       text                                 not null,
    active     tinyint(1) default 1                 not null,
    created_at timestamp  default CURRENT_TIMESTAMP not null,
    constraint unique_name_version
        unique (name, version)
);

create index idx_prompt_templates_mode
    on prompt_templates (mode);

create table users
(
    id             char(36)     default (uuid()) not null
        primary key,
    email          varchar(255)                  not null,
    password_hash  varchar(255)                  null,
    oauth_provider varchar(255)                  null,
    oauth_sub      varchar(255)                  null,
    plan           varchar(255) default 'free'   not null,
    is_active      tinyint(1)   default 1        not null,
    created_at     datetime                      not null,
    updated_at     datetime                      not null,
    profile        json                          not null,
    settings       json                          not null,
    constraint email
        unique (email)
);

create table audit_logs
(
    id            char(36)  default (uuid())          not null
        primary key,
    actor_user_id char(36)                            null,
    action        varchar(100)                        not null,
    target_type   varchar(50)                         null,
    target_id     char(36)                            null,
    meta_json     json                                null,
    created_at    timestamp default CURRENT_TIMESTAMP not null,
    constraint audit_logs_ibfk_1
        foreign key (actor_user_id) references users (id)
            on delete set null
);

create index idx_audit_logs_action
    on audit_logs (action);

create index idx_audit_logs_actor
    on audit_logs (actor_user_id);

create index idx_audit_logs_created
    on audit_logs (created_at);

create table auth_sessions
(
    id                 char(36) default (uuid()) not null
        primary key,
    user_id            char(36)                  not null,
    refresh_token_hash varchar(255)              not null,
    user_agent         varchar(255)              null,
    ip                 varchar(255)              null,
    expires_at         datetime                  not null,
    created_at         datetime                  not null,
    constraint auth_sessions_ibfk_1
        foreign key (user_id) references users (id)
            on update cascade on delete cascade
);

create index auth_sessions_expires_at
    on auth_sessions (expires_at);

create index auth_sessions_user_id
    on auth_sessions (user_id);

create index idx_auth_sessions_expires
    on auth_sessions (expires_at);

create index idx_auth_sessions_user
    on auth_sessions (user_id);

create table image_assets
(
    id            char(36)     default (uuid()) not null
        primary key,
    user_id       char(36)                      null,
    original_url  varchar(255)                  not null,
    hash_phash    varchar(255)                  null,
    status        varchar(255) default 'stored' not null,
    content_mime  varchar(255)                  null,
    width         int                           null,
    height        int                           null,
    safe_flags    json                          null comment 'Content moderation results',
    created_at    datetime                      not null,
    deleted_at    datetime                      null,
    thumbnail_url varchar(255)                  null,
    size_bytes    int                           null,
    metadata      json                          null comment 'EXIF and other metadata',
    updated_at    datetime                      not null,
    constraint image_assets_ibfk_1
        foreign key (user_id) references users (id)
            on update cascade on delete set null
);

create table feature_sets
(
    id                 char(36)     default (uuid())     not null
        primary key,
    image_id           char(36)                          not null,
    feature_json       json                              not null comment 'Extracted features from vision API',
    diversity_flags    json                              not null comment 'Detected diversity characteristics',
    created_at         datetime                          not null,
    extraction_method  varchar(255) default 'vision_api' not null,
    extraction_version varchar(255)                      null,
    constraint feature_sets_ibfk_1
        foreign key (image_id) references image_assets (id)
            on update cascade on delete cascade
);

create index feature_sets_image_id
    on feature_sets (image_id);

create index idx_feature_sets_image
    on feature_sets (image_id);

create index idx_image_assets_hash
    on image_assets (hash_phash);

create index idx_image_assets_user
    on image_assets (user_id);

create index image_assets_hash_phash
    on image_assets (hash_phash);

create index image_assets_status
    on image_assets (status);

create index image_assets_user_id
    on image_assets (user_id);

create table score_reports
(
    id                  char(36)   default (uuid()) not null
        primary key,
    user_id             char(36)                    not null,
    image_id            char(36)                    null,
    feature_set_id      char(36)                    null,
    mode                varchar(255)                not null,
    modules             json                        not null,
    radar_json          json                        not null comment 'Radar chart data for each module',
    highlights_json     json                        null comment 'Positive highlights',
    improvements_json   json                        null comment 'Improvement suggestions',
    total_score         decimal(4, 2)               null,
    raw_output_ref      text                        null comment 'Raw AI output reference',
    prompt_version      varchar(255)                null,
    created_at          datetime                    not null,
    processing_time_ms  int                         null,
    share_eligible      tinyint(1) default 1        not null,
    module_details_json json                        null comment 'Detailed dimension-level objects per module (v2.0)',
    module_burns_json   json                        null comment 'Roast mode one-line module burns (v2.0)',
    constraint score_reports_ibfk_160
        foreign key (user_id) references users (id)
            on update cascade on delete cascade,
    constraint score_reports_ibfk_161
        foreign key (image_id) references image_assets (id)
            on update cascade on delete set null,
    constraint score_reports_ibfk_162
        foreign key (feature_set_id) references feature_sets (id)
            on update cascade on delete set null
);

create table abuse_reports
(
    id               char(36)    default (uuid())          not null
        primary key,
    reporter_user_id char(36)                              null,
    report_id        char(36)                              null,
    category         enum ('offensive', 'bias', 'other')   not null,
    detail           text                                  null,
    status           varchar(20) default 'open'            not null,
    created_at       timestamp   default CURRENT_TIMESTAMP not null,
    resolved_at      timestamp                             null,
    constraint abuse_reports_ibfk_1
        foreign key (reporter_user_id) references users (id)
            on delete set null,
    constraint abuse_reports_ibfk_2
        foreign key (report_id) references score_reports (id)
            on delete cascade
);

create index idx_abuse_reports_report
    on abuse_reports (report_id);

create index idx_abuse_reports_status
    on abuse_reports (status);

create index reporter_user_id
    on abuse_reports (reporter_user_id);

create table feedback
(
    id         char(36)  default (uuid())                        not null
        primary key,
    user_id    char(36)                                          null,
    report_id  char(36)                                          null,
    type       enum ('suggestion', 'bug', 'complaint', 'praise') not null,
    content    text                                              not null,
    created_at timestamp default CURRENT_TIMESTAMP               not null,
    constraint feedback_ibfk_1
        foreign key (user_id) references users (id)
            on delete set null,
    constraint feedback_ibfk_2
        foreign key (report_id) references score_reports (id)
            on delete cascade
);

create index idx_feedback_report
    on feedback (report_id);

create index idx_feedback_user
    on feedback (user_id);

create index feature_set_id
    on score_reports (feature_set_id);

create index idx_score_reports_created
    on score_reports (created_at);

create index idx_score_reports_mode
    on score_reports (mode);

create index idx_score_reports_recent
    on score_reports (created_at);

create index idx_score_reports_user
    on score_reports (user_id);

create index image_id
    on score_reports (image_id);

create index score_reports_created_at
    on score_reports (created_at);

create index score_reports_mode
    on score_reports (mode);

create index score_reports_user_id
    on score_reports (user_id);

create table share_cards
(
    id                   char(36)  default (uuid())          not null
        primary key,
    report_id            char(36)                            not null,
    card_url             text                                not null,
    theme                varchar(50)                         null,
    share_channel        varchar(50)                         null,
    impressions_estimate int       default 0                 null,
    created_at           timestamp default CURRENT_TIMESTAMP not null,
    constraint share_cards_ibfk_1
        foreign key (report_id) references score_reports (id)
            on delete cascade
);

create index idx_share_cards_report
    on share_cards (report_id);

create table task_statuses
(
    id            char(36) default (uuid())          not null
        primary key,
    user_id       char(36)                           not null,
    image_id      char(36)                           null,
    status        varchar(64)                        not null,
    report_id     char(36)                           null,
    error_code    varchar(128)                       null,
    error_message text                               null,
    data_json     longtext                           null,
    created_at    datetime default CURRENT_TIMESTAMP not null,
    updated_at    datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint task_statuses_image_fk
        foreign key (image_id) references image_assets (id)
            on update cascade on delete set null,
    constraint task_statuses_report_fk
        foreign key (report_id) references score_reports (id)
            on update cascade on delete set null,
    constraint task_statuses_user_fk
        foreign key (user_id) references users (id)
            on update cascade on delete cascade
);

create index idx_task_status_image
    on task_statuses (image_id);

create index idx_task_status_report
    on task_statuses (report_id);

create index idx_task_status_user
    on task_statuses (user_id);

create index idx_users_email
    on users (email);

