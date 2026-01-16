import type { Env } from "./types";

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
 * Send welcome email via Listmonk transactional API
 */
async function sendWelcomeEmail(
  listmonkUrl: string,
  email: string,
  templateId: string,
  username: string,
  apiKey: string
): Promise<void> {
  const credentials = btoa(`${username}:${apiKey}`);

  const response = await fetch(`${listmonkUrl}/api/tx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      subscriber_email: email,
      template_id: parseInt(templateId, 10),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to send welcome email (${response.status}):`,
      errorText
    );
  }
}

/**
 * Attempt to send welcome email if conditions are met
 */
async function attemptWelcomeEmail(
  email: string | undefined,
  templateId: string | null,
  listmonkUrl: string,
  env: Env
): Promise<void> {
  if (
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
  } catch (error) {
    console.error("Error sending welcome email:", error);
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

    const validationError = validateListmonkUrl(listmonkUrl, corsHeaders);
    if (validationError) {
      return validationError;
    }

    if (!listmonkUrl) {
      return createSubscriptionResponse(false, 400, corsHeaders);
    }

    const listmonkResponse = await forwardSubscriptionToListmonk(
      listmonkUrl,
      formData
    );

    const responseText = await listmonkResponse.text();
    const isSuccess = isSubscriptionSuccessful(listmonkResponse, responseText);

    if (isSuccess) {
      await attemptWelcomeEmail(email, templateId, listmonkUrl, env);
    }

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

  if (request.method === "POST" && url.pathname === "/email-list") {
    return handleSubscriptionRequest(request, url, env, corsHeaders);
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}
