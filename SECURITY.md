# Security Policy

Use GitHub private vulnerability reporting for suspected vulnerabilities. Never attach production
logs, traces, tokens, cookies, or customer identifiers to an issue.

The local Alloy container reads Docker metadata through a read-only socket mount. That access is
still highly privileged and must not be copied into an untrusted multi-tenant host. Production
deployments should use a scoped collector or platform-native log pipeline.
