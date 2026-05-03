# Legacy Freeze and Archive Plan

Legacy web assets are frozen as reference and no longer receive feature work.

## Frozen legacy frontends
- `portal_admin.html`
- `portal_teacher.html`
- `portal_student.html`
- `portal_parent.html`
- `alqalam_ems.html`
- `alqalam_website.html`
- `alqalam_website_3d.html`
- `alqalam_identity_frontend.html`
- `alqalam_site/*`

## Frozen legacy backends
- `alqalam_backend.php`
- `alqalam_api.php`
- `alqalam_fcm.php`
- `config.php`

## Canonical runtime
- Frontend: `alqalam_next`
- Backend: `alqalam_node_server.js`

## Rules
1. No new features in frozen files.
2. Only emergency fixes allowed if production is blocked.
3. All new module work must target Next + Node stack.
