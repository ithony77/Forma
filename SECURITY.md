# Security policy

## Supported scope

This edition is a single-user local editor and static export tool. Its server binds
only to 127.0.0.1. Do not expose its API through a public proxy or change it to a
network interface. Use maintained Node.js security updates within package.json's
supported LTS lines. Only the current development line is maintained.

Fixed CSP hashes, iframe isolation, source/channel checks, strict schema
validation, URL and raster allowlists, application tokens and exact Host/Origin
checks bound the local trust surface. Requests and provider calls have byte,
time, concurrency and process-wide safety limits. User-generated executable code
is never accepted. Browser storage, imports and model choices are untrusted.

## Data and credentials

Projects and browser backups are unencrypted. Anyone with access to your operating
system account or browser profile may read them. Keep .data, environment files,
raw reports and screenshots private. Uploaded images are local project data;
the live composer excludes their bytes and the configured contact-email field.
Prompt text and relevant project text reach your chosen provider on a live build.

A successfully tested key is saved in localStorage until Remove key deletes it.
Scripts on the editor origin and users of the browser profile can read it. Page
load restores it to server memory without contacting a provider. Keys are never
included in project JSON or website exports. Environment-provided keys are the
operator's responsibility; Remove key disables them until restart.

Only explicit connection tests and live builds call the fixed TypeSafe or
OpenRouter endpoint. Provider charges and account spend controls remain your
responsibility. Do not put secrets or private information into a prompt.

Review exported content before publishing. Contact forms prepare mail drafts;
app screens contain temporary visitor state. They provide no connected account,
payment or shared database service. Exported pages use no external runtime assets.

## Private reporting

Use GitHub private vulnerability reporting when enabled, or contact
GPTchatly@gmail.com. Do not post exploit details, real credentials or private
projects in public issues. Include version, impact and a minimal synthetic
reproduction through a private channel.

## Exposure response

Revoke or rotate a leaked credential immediately, review provider usage, remove
it from affected browser profiles and environment settings, and restart affected
processes. Deleting a commit is insufficient. Coordinate cleanup of affected
archives and history, and retain a private incident record without the credential.

The public release gate scans selected bytes and the publication history audit
checks reachable Git objects. Pattern checks supplement manual review. Review
visual assets and their metadata before inclusion; do not distribute recordings
of a personal desktop. No such recording is included in this source release.
