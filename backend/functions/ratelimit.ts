/**
 * Per-IP daily cap for the MCP endpoint.
 *
 * The endpoint is public, so there is no identity to meter against - the
 * client IP is all there is. This is not a security control; anyone
 * determined can change IP. It exists because an MCP client is an agent, and
 * a stuck agentic loop can fire thousands of calls unattended against real
 * Gemini credits. Set to 0 to disable.
 */
export const MCP_DAILY_IP_LIMIT = 100;

/**
 * Counts today's MCP calls from one IP.
 *
 * Reads the same `questions` table the handler already writes to, so there is
 * no extra store to keep. Rows are written after the answer returns, so a
 * fast burst can slip a few calls past the cap - fine for stopping a runaway
 * loop over minutes, not a precise quota.
 */
export async function getIpUsageToday(
  db: D1Database,
  ip: string
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM questions
       WHERE source = 'mcp' AND client_ip = ? AND created_at >= date('now')`
    )
    .bind(ip)
    .first<{ n: number }>();

  return row?.n ?? 0;
}
