import type { Env } from "./types";

interface SubscriptionRequest {
  email: string;
  listId: number;
  baseUrl: string;
  templateId?: number;
  website?: string; // Honeypot field
}

interface SubscriptionData {
  email: string;
  listId: number;
  baseUrl: string;
  templateId?: number;
}

/**
 * Check if submission is from a bot (honeypot filled)
 */
function isBot(honeypot: string | undefined): boolean {
  return Boolean(honeypot && honeypot.trim().length > 0);
}

/**
 * Create Basic Auth credentials
 */
function createBasicAuthCredentials(username: string, apiKey: string): string {
  return btoa(`${username}:${apiKey}`);
}

/**
 * Extract and validate subscription data from request
 */
async function extractSubscriptionData(
  request: Request
): Promise<{ data: SubscriptionData; honeypot?: string } | null> {
  const body = (await request.json()) as SubscriptionRequest;
  const { email, listId, baseUrl, templateId, website: honeypot } = body;

  if (!email || !listId || !baseUrl) {
    return null;
  }

  return {
    data: { email, listId, baseUrl, templateId },
    honeypot,
  };
}

/**
 * Validate Listmonk credentials
 */
function validateCredentials(env: Env): boolean {
  return Boolean(env.LISTMONK_USERNAME && env.LISTMONK_API_KEY);
}

/**
 * Get subscriber by email
 */
async function getSubscriberByEmail(
  baseUrl: string,
  email: string,
  username: string,
  apiKey: string
): Promise<number | null> {
  const credentials = createBasicAuthCredentials(username, apiKey);
  const query = `subscribers.email='${encodeURIComponent(email)}'`;

  const response = await fetch(`${baseUrl}/api/subscribers?query=${query}`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    data?: { results?: Array<{ id: number }> };
  };

  return data?.data?.results?.[0]?.id ?? null;
}

/**
 * Add existing subscriber to a list
 */
async function addSubscriberToList(
  baseUrl: string,
  subscriberId: number,
  listId: number,
  username: string,
  apiKey: string
): Promise<boolean> {
  const credentials = createBasicAuthCredentials(username, apiKey);

  const response = await fetch(`${baseUrl}/api/subscribers/lists`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      ids: [subscriberId],
      action: "add",
      target_list_ids: [Number(listId)],
      status: "confirmed",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to add to list (${response.status}):`, errorText);
    return false;
  }

  return true;
}

/**
 * Handle existing subscriber (409 conflict)
 */
async function handleExistingSubscriber(
  baseUrl: string,
  email: string,
  listId: number,
  username: string,
  apiKey: string
): Promise<boolean> {
  const subscriberId = await getSubscriberByEmail(
    baseUrl,
    email,
    username,
    apiKey
  );

  if (!subscriberId) {
    return true; // Can't find them, but they exist - consider success
  }

  return addSubscriberToList(baseUrl, subscriberId, listId, username, apiKey);
}

/**
 * Create a new subscriber via Listmonk API
 */
async function createSubscriber(
  baseUrl: string,
  email: string,
  listId: number,
  username: string,
  apiKey: string
): Promise<{ success: boolean; isNew: boolean }> {
  const credentials = createBasicAuthCredentials(username, apiKey);

  const requestBody = {
    email,
    name: "",
    status: "enabled",
    lists: [Number(listId)],
    preconfirm_subscriptions: true,
  };

  console.log("Creating subscriber:", JSON.stringify(requestBody));

  const response = await fetch(`${baseUrl}/api/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log(`Listmonk response (${response.status}):`, responseText);

  if (response.ok) {
    return { success: true, isNew: true };
  }

  // Subscriber already exists - add them to the list
  if (response.status === 409) {
    const success = await handleExistingSubscriber(
      baseUrl,
      email,
      listId,
      username,
      apiKey
    );
    return { success, isNew: false };
  }

  console.error(
    `Failed to create subscriber (${response.status}):`,
    responseText
  );
  return { success: false, isNew: false };
}

/**
 * Send welcome email via Listmonk transactional API
 */
async function sendWelcomeEmail(
  baseUrl: string,
  email: string,
  templateId: number,
  username: string,
  apiKey: string
): Promise<void> {
  const credentials = createBasicAuthCredentials(username, apiKey);

  const response = await fetch(`${baseUrl}/api/tx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      subscriber_email: email,
      template_id: Number(templateId),
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
 * Create JSON response
 */
function createResponse(
  success: boolean,
  message: string,
  statusCode: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify({ success, message }), {
    status: statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Handle subscription request - main orchestrator
 */
export async function handleSubscriptionRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Extract and validate request data
    const extracted = await extractSubscriptionData(request);

    if (!extracted) {
      return createResponse(
        false,
        "Missing required fields.",
        400,
        corsHeaders
      );
    }

    const { data, honeypot } = extracted;

    // Reject bots silently
    if (isBot(honeypot)) {
      return createResponse(true, "Successfully subscribed!", 200, corsHeaders);
    }

    // Validate credentials
    if (!validateCredentials(env)) {
      console.error("Listmonk credentials not configured");
      return createResponse(
        false,
        "Newsletter service not configured.",
        500,
        corsHeaders
      );
    }

    // Create subscriber (credentials validated above)
    const result = await createSubscriber(
      data.baseUrl,
      data.email,
      data.listId,
      env.LISTMONK_USERNAME!,
      env.LISTMONK_API_KEY!
    );

    if (!result.success) {
      return createResponse(
        false,
        "Subscription failed. Please try again.",
        500,
        corsHeaders
      );
    }

    // Send welcome email (non-blocking failure)
    if (data.templateId) {
      try {
        await sendWelcomeEmail(
          data.baseUrl,
          data.email,
          data.templateId,
          env.LISTMONK_USERNAME!,
          env.LISTMONK_API_KEY!
        );
      } catch (error) {
        console.error("Error sending welcome email:", error);
      }
    }

    return createResponse(true, "Successfully subscribed!", 200, corsHeaders);
  } catch (error) {
    console.error("Error processing subscription:", error);
    return createResponse(
      false,
      "Subscription failed. Please try again.",
      500,
      corsHeaders
    );
  }
}
