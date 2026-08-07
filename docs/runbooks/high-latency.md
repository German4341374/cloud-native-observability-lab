# High Latency Runbook

1. Confirm the P95 alert is sustained and compare it with request volume and error rate.
2. Filter the dashboard by service and route to find the affected boundary.
3. Open a slow trace in Tempo and identify the longest child span.
4. Jump from the trace ID to correlated Loki logs without searching for customer data.
5. Check CPU, event-loop lag, dependency status, saturation, and recent deployments.
6. Mitigate with rollback, concurrency reduction, or dependency isolation as appropriate.
7. Confirm recovery in both the fast and slow SLO windows before closing the incident.

Do not increase the latency threshold merely to clear an alert. Update the SLO only through an
explicit product decision with new evidence.
