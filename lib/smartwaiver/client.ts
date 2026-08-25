const BASE = "https://api.smartwaiver.com";

export class SmartwaiverError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "SmartwaiverError";
  }
}

function apiKey(): string | null {
  return process.env.SMARTWAIVER_API_KEY?.trim() || null;
}

export function isSmartwaiverReady(): boolean {
  return Boolean(apiKey());
}

async function swFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = apiKey();
  if (!key) {
    throw new SmartwaiverError("SMARTWAIVER_API_KEY is not configured.", 503);
  }
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") ?? "60");
    throw new SmartwaiverError("Smartwaiver rate limited.", 429, retryAfter);
  }
  if (!response.ok) {
    const body = await response.text();
    throw new SmartwaiverError(`Smartwaiver ${response.status}: ${body.slice(0, 400)}`, response.status);
  }
  return (await response.json()) as T;
}

export type SmartwaiverParticipant = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  isMinor?: boolean;
  gender?: string;
  phone?: string;
  customParticipantFields?: Record<string, { value?: unknown; displayText?: string }>;
};

export type SmartwaiverGuardian = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  relationship?: string;
};

export type SmartwaiverWaiver = {
  waiverId?: string;
  unique_id?: string;
  templateId?: string;
  title?: string;
  createdOn?: string;
  expirationDate?: string;
  expired?: boolean;
  verified?: boolean;
  firstName?: string;
  lastName?: string;
  dob?: string;
  autoTag?: string;
  email?: string;
  phone?: string;
  marketingAllowed?: boolean;
  participants?: SmartwaiverParticipant[];
  guardian?: SmartwaiverGuardian | null;
  customWaiverFields?: Record<string, { value?: unknown; displayText?: string }>;
};

export async function getWaiver(waiverId: string): Promise<SmartwaiverWaiver> {
  const data = await swFetch<{ waiver?: SmartwaiverWaiver } & SmartwaiverWaiver>(
    `/v4/waivers/${encodeURIComponent(waiverId)}`,
  );
  return data.waiver ?? data;
}

export async function listWaivers(params: {
  limit?: number;
  offset?: number;
  fromDts?: string;
  toDts?: string;
}): Promise<Array<{ waiverId?: string; unique_id?: string }>> {
  const search = new URLSearchParams();
  search.set("limit", String(params.limit ?? 100));
  if (params.offset) search.set("offset", String(params.offset));
  if (params.fromDts) search.set("fromDts", params.fromDts);
  if (params.toDts) search.set("toDts", params.toDts);
  const data = await swFetch<{ waivers?: Array<{ waiverId?: string; unique_id?: string }> }>(
    `/v4/waivers?${search.toString()}`,
  );
  return data.waivers ?? [];
}

export type WebhookQueueMessage = {
  messageId: string;
  payload?: { unique_id?: string; event?: string };
};

export async function getAccountQueueMessage(): Promise<WebhookQueueMessage | null> {
  const data = await swFetch<{
    api_webhook_account_message_get?: WebhookQueueMessage | null;
  }>("/v4/webhooks/queues/account");
  return data.api_webhook_account_message_get ?? null;
}

export async function deleteAccountQueueMessage(messageId: string): Promise<void> {
  await swFetch(`/v4/webhooks/queues/account/${encodeURIComponent(messageId)}`, {
    method: "DELETE",
  });
}
