import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import type { Env } from "./types";
import { getTrustedClientIP } from "./http";
import { MCP_DAILY_IP_LIMIT, getIpUsageToday } from "./ratelimit";
import {
  RESPONSE_LENGTH,
  runAIPipeline,
  saveQuestionToDatabase,
} from "./pipeline";

/**
 * Remote MCP server exposing the digital twin as a single tool.
 *
 * Public - no authentication. Stateless too: the 2026-07-28 spec dropped the
 * session requirement, so this needs no Durable Object and no session store.
 */

export const MCP_ROUTE = "/mcp";

/**
 * Host and Origin allowlists.
 *
 * The handler only derives defaults for localhost and workers.dev. On a custom
 * domain it would skip Host validation entirely, and its default Origin list
 * would reject a browser-origin request outright - so both are set explicitly.
 */
const ALLOWED_HOSTNAMES = [
  "twin.ivanovyordan.com",
  "ivanovyordan-com-backend.ivanovyordan.workers.dev",
  "localhost",
  "127.0.0.1",
];

const ALLOWED_ORIGIN_HOSTNAMES = [
  ...ALLOWED_HOSTNAMES,
  "claude.ai",
  "www.claude.ai",
];

/**
 * Tells the calling model whose voice it is relaying, so answers get attributed
 * to Yordan rather than absorbed and paraphrased as the assistant's own view.
 *
 * This lives in the tool description rather than the server `instructions`
 * field. The 2026-07-28 stateless core dropped the initialize handshake, and
 * `instructions` went with it - verified against tools/list, whose `_meta`
 * carries `serverInfo` only. Tool descriptions are what every modern client
 * actually reads.
 */
const TOOL_GUIDANCE = `Relay the answer as Yordan's own position, not your analysis:
- Attribute it: "Yordan's take is..." / "According to Yordan...".
- Preserve his voice: direct, pragmatic, commercially focused. Do not soften or pad it.
- Relay rather than rewrite. Summarise only if asked.
- Include the source URL when one is returned.
- If it reports no information on a topic, say so plainly. Never substitute your own general knowledge and present it as Yordan's view.`;

function textResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

function createServer(env: Env, ctx: ExecutionContext, clientIp?: string) {
  const server = new McpServer({
    name: "ivanovyordan-digital-twin",
    title: "Yordan Ivanov's Digital Twin",
    version: "1.0.0",
  });

  server.registerTool(
    "ask_yordan",
    {
      title: "Ask Yordan",
      description:
        "Ask Yordan Ivanov — Head of Data Engineering and author of the Data " +
        "Gibberish newsletter — what he thinks. Covers data engineering " +
        "leadership, team structure and hiring, architecture, data contracts " +
        "and quality, and aligning data work with business outcomes.\n\n" +
        "Answers come from Yordan's own published writing, in his voice. " +
        "Questions outside that corpus are declined rather than answered from " +
        "general knowledge.\n\n" +
        TOOL_GUIDANCE,
      inputSchema: { question: z.string().min(1).max(1000) },
    },
    async ({ question }: { question: string }) => {
      // Guards against a runaway agentic loop, not against readers - nobody
      // asking questions by hand gets near this.
      if (MCP_DAILY_IP_LIMIT > 0 && clientIp) {
        const used = await getIpUsageToday(env.DB, clientIp);
        if (used >= MCP_DAILY_IP_LIMIT) {
          return textResult(
            `Daily limit of ${MCP_DAILY_IP_LIMIT} questions reached. It resets at 00:00 UTC.`,
            true
          );
        }
      }

      try {
        const { responseText, knowledgeFound, articleInfo } =
          await runAIPipeline(question, env, RESPONSE_LENGTH.mcp);

        ctx.waitUntil(
          saveQuestionToDatabase(env.DB, {
            query: question,
            knowledgeFound,
            articleUrl: articleInfo.url,
            articleSection: articleInfo.section,
            responseText,
            clientIp,
            source: "mcp",
          }).catch((err) => {
            console.error("Database save failed:", err);
          })
        );

        const citation = articleInfo.url ? `\n\nSource: ${articleInfo.url}` : "";
        return textResult(`${responseText}${citation}`);
      } catch (error: any) {
        console.error("MCP ask_yordan failed:", error);
        if (error?.status === 429) {
          return textResult(
            "The digital twin has reached its usage limit. Try again later.",
            true
          );
        }
        return textResult(
          "The digital twin could not answer that right now. Try again later.",
          true
        );
      }
    }
  );

  return server;
}

export function handleMcpRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // Trusted only - this value both meters and is stored, so a forgeable
  // header here would make the cap opt-out.
  const clientIp = getTrustedClientIP(request);
  const handler = createMcpHandler(() => createServer(env, ctx, clientIp), {
    route: MCP_ROUTE,
    allowedHostnames: ALLOWED_HOSTNAMES,
    allowedOriginHostnames: ALLOWED_ORIGIN_HOSTNAMES,
  });
  return handler(request, env, ctx);
}
