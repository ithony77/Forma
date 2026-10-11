# Local distribution and static publication

The supported editor runtime is local and single-user. Run it from a complete
source extraction on a supported patched Node.js LTS release. Keep its loopback
binding and local API checks. The editor API is not a public web service.

Static website exports can be deployed to a host of your choice after reviewing
copy, media rights, contact recipients, links and app-screen limitations. Upload
all HTML pages together so relative page links work. Exported files need no app
server, provider key or external runtime assets. Review project.json for private
content before including it in a public website download.

For a source release: finish the change phase, run the documented unit/browser,
syntax and release checks, create the selected source ZIP, then extract it into
a fresh directory and verify startup, demo, saving and export. Confirm every
manifest hash against the extracted bytes and scan the final archive independently.

The publication repository must be prepared from the audited source selection.
Use the approved identity for author, committer and annotated tagger, and audit
all reachable objects. Never merge original development history or unreviewed
recordings. Review exact publication bytes and metadata before owner-authorized
publication. Public repository safeguards and reporting channels are configured
at publication time. Re-run the history and artifact checks after that operation.
