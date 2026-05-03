# Legacy freeze and archive

Legacy web and PHP assets are **archived** under `legacy_archive/` and are **not** part of the active stack.

## Archived legacy frontends

- `legacy_archive/html/portal_admin.html`
- `legacy_archive/html/portal_teacher.html`
- `legacy_archive/html/portal_student.html`
- `legacy_archive/html/portal_parent.html`
- `legacy_archive/html/alqalam_ems.html`
- `legacy_archive/html/alqalam_website.html`
- `legacy_archive/html/alqalam_website_3d.html`
- `legacy_archive/html/alqalam_identity_frontend.html`
- `legacy_archive/alqalam_site/*`

## Archived legacy backends and config

- `legacy_archive/php/alqalam_backend.php`
- `legacy_archive/php/alqalam_api.php`
- `legacy_archive/php/alqalam_fcm.php`
- `legacy_archive/php/config.php`

## Archived documentation snapshots

- `legacy_archive/docs/ALQALAM_SERVER_GUIDE.html`
- `legacy_archive/docs/DEPLOYMENT_GUIDE.html`
- `legacy_archive/docs/ALQALAM_PRODUCTION_GUIDE.html`
- `legacy_archive/docs/alqalam_system_blueprint.md`

## Canonical runtime

- **Frontend:** `alqalam_next`
- **Backend:** `alqalam_node_server.js` (repo root)

## Rules

1. No new features in archived files.
2. Emergency fixes only if production still depends on archived PHP (prefer migrating to Node).
3. All new work targets Next.js + Node API.
