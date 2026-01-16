import type { Env } from "./types";

/**
 * Extract listmonk URL from query parameters
 */
function getListmonkUrl(url: URL): string | null {
  return url.searchParams.get("baseUrl");
}

/**
 * Validate that listmonk URL is provided
 */
function validateListmonkUrl(
  listmonkUrl: string | null,
  corsHeaders: Record<string, string>
): Response | null {
  if (!listmonkUrl) {
    return new Response(
      JSON.stringify({ error: "baseUrl parameter is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  return null;
}

/**
 * Fetch subscription form HTML from Listmonk
 */
async function fetchListmonkForm(listmonkUrl: string): Promise<Response> {
  return fetch(`${listmonkUrl}/subscription/form`, {
    method: "GET",
  });
}

/**
 * Extract nonce from HTML using multiple patterns
 */
function extractNonceFromHtml(html: string): string | null {
  const nonceMatch =
    html.match(/name="nonce"\s+value="([^"]+)"/) ||
    html.match(/<input[^>]*name="nonce"[^>]*value="([^"]+)"/i) ||
    html.match(/name=['"]nonce['"]\s+value=['"]([^'"]+)['"]/i);

  return nonceMatch?.[1] || null;
}

/**
 * Create JSON response with nonce
 */
function createNonceResponse(
  nonce: string | null,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify({ nonce }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Handle nonce request - fetch and extract nonce from Listmonk
 */
async function handleNonceRequest(
  listmonkUrl: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const response = await fetchListmonkForm(listmonkUrl);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `Listmonk returned ${response.status}: ${errorText.substring(0, 200)}`
      );
      // Return empty nonce instead of error - Listmonk can generate it server-side
      return createNonceResponse(null, corsHeaders);
    }

    const html = await response.text();

    if (!html || html.length === 0) {
      console.warn("Empty response from Listmonk");
      // Return empty nonce instead of error - Listmonk can generate it server-side
      return createNonceResponse(null, corsHeaders);
    }

    const nonce = extractNonceFromHtml(html);

    if (nonce) {
      return createNonceResponse(nonce, corsHeaders);
    }

    // Log the HTML snippet for debugging (first 500 chars)
    console.warn(
      "Nonce not found in Listmonk response. HTML snippet:",
      html.substring(0, 500)
    );

    // Return empty nonce instead of error - Listmonk can generate it server-side
    return createNonceResponse(null, corsHeaders);
  } catch (error) {
    console.error("Error fetching nonce from Listmonk:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch nonce" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

/**
 * Extract subscription data from request
 */
async function extractSubscriptionData(
  request: Request,
  url: URL
): Promise<{
  formData: FormData;
  listmonkUrl: string | null;
  templateId: string | null;
  email: string | undefined;
}> {
  const formData = await request.formData();
  const listmonkUrl = url.searchParams.get("baseUrl");
  const templateId = url.searchParams.get("templateId");
  const email = formData.get("email")?.toString();

  return { formData, listmonkUrl, templateId, email };
}

/**
 * Forward subscription to Listmonk
 */
async function forwardSubscriptionToListmonk(
  listmonkUrl: string,
  formData: FormData
): Promise<Response> {
  return fetch(`${listmonkUrl}/subscription/form`, {
    method: "POST",
    body: formData,
  });
}

/**
 * Check if subscription was successful
 */
function isSubscriptionSuccessful(
  response: Response,
  responseText: string
): boolean {
  return (
    response.ok &&
    (responseText.includes("success") ||
      responseText.includes("subscribed") ||
      response.status === 200)
  );
}

/**
 * Create Basic auth credentials
 */
function createBasicAuthCredentials(username: string, apiKey: string): string {
  const credentials = `${username}:${apiKey}`;
  return btoa(credentials);
}

/**
 * Send welcome email via Listmonk transactional API
 */
async function sendWelcomeEmail(
  listmonkUrl: string,
  email: string,
  templateId: string,
  username: string,
  apiKey: string
): Promise<void> {
  const encodedCredentials = createBasicAuthCredentials(username, apiKey);

  const txResponse = await fetch(`${listmonkUrl}/api/tx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({
      subscriber_emails: [email], // Array required for fallback mode
      template_id: parseInt(templateId, 10),
      data: {},
      subscriber_mode: "fallback",
    }),
  });

  if (!txResponse.ok) {
    const errorText = await txResponse.text();
    console.error(
      `Failed to send welcome email (${txResponse.status}):`,
      errorText
    );
    // Log details for debugging
    console.error("Welcome email request details:", {
      url: `${listmonkUrl}/api/tx`,
      templateId: parseInt(templateId, 10),
      email: email,
      hasAuth: !!(username && apiKey),
    });
    // Don't fail the subscription if email sending fails
  } else {
    const txResult = await txResponse.json().catch(() => ({}));
    console.log("Welcome email sent successfully:", txResult);
  }
}

/**
 * Check if welcome email should be sent
 */
function shouldSendWelcomeEmail(
  isSuccess: boolean,
  email: string | undefined,
  templateId: string | null,
  env: Env
): boolean {
  return (
    isSuccess &&
    Boolean(email) &&
    Boolean(templateId) &&
    Boolean(env.LISTMONK_USERNAME) &&
    Boolean(env.LISTMONK_API_KEY)
  );
}

/**
 * Attempt to send welcome email, handling errors gracefully
 */
async function attemptWelcomeEmail(
  isSuccess: boolean,
  email: string | undefined,
  templateId: string | null,
  listmonkUrl: string,
  env: Env
): Promise<void> {
  if (
    !shouldSendWelcomeEmail(isSuccess, email, templateId, env) ||
    !email ||
    !templateId ||
    !env.LISTMONK_USERNAME ||
    !env.LISTMONK_API_KEY
  ) {
    return;
  }

  try {
    await sendWelcomeEmail(
      listmonkUrl,
      email,
      templateId,
      env.LISTMONK_USERNAME,
      env.LISTMONK_API_KEY
    );
  } catch (emailError) {
    console.error("Error sending welcome email:", emailError);
    // Log the full error for debugging
    if (emailError instanceof Error) {
      console.error("Error details:", {
        message: emailError.message,
        stack: emailError.stack,
      });
    }
    // Don't fail the subscription if email sending fails
  }
}

/**
 * Create subscription response
 */
function createSubscriptionResponse(
  isSuccess: boolean,
  statusCode: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      success: isSuccess,
      message: isSuccess
        ? "Successfully subscribed! Please check your email to confirm."
        : "Subscription failed. Please try again.",
    }),
    {
      status: isSuccess ? 200 : statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Handle subscription request - process newsletter subscription
 */
async function handleSubscriptionRequest(
  request: Request,
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { formData, listmonkUrl, templateId, email } =
      await extractSubscriptionData(request, url);

    // Validate listmonk URL
    const validationError = validateListmonkUrl(listmonkUrl, corsHeaders);
    if (validationError) {
      return validationError;
    }

    if (!listmonkUrl) {
      // This shouldn't happen due to validation, but TypeScript needs it
      return createSubscriptionResponse(false, 400, corsHeaders);
    }

    // Forward subscription to Listmonk
    const listmonkResponse = await forwardSubscriptionToListmonk(
      listmonkUrl,
      formData
    );

    const responseText = await listmonkResponse.text();
    const isSuccess = isSubscriptionSuccessful(listmonkResponse, responseText);

    // Attempt to send welcome email (non-blocking)
    await attemptWelcomeEmail(isSuccess, email, templateId, listmonkUrl, env);

    return createSubscriptionResponse(
      isSuccess,
      listmonkResponse.status,
      corsHeaders
    );
  } catch (error) {
    console.error("Error proxying newsletter subscription:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Handle newsletter subscription requests by proxying to Listmonk
 */
export async function handleNewsletterRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);

  // Handle subscription request
  if (request.method === "POST" && url.pathname === "/email-list") {
    return handleSubscriptionRequest(request, url, env, corsHeaders);
  }

  // Method not allowed
  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}
