import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

// Define secrets for PayPal credentials (required for v2 functions)
const paypalClientId = defineSecret("PAYPAL_CLIENT_ID");
const paypalSecret = defineSecret("PAYPAL_SECRET");



// PayPal API endpoints
// TODO: Switch to production when ready: "https://api-m.paypal.com"
const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";


interface PayPalAccessTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface PayPalOrderResponse {
    id: string;
    status: string;
    links: Array<{
        href: string;
        rel: string;
        method: string;
    }>;
}

/**
 * Get PayPal OAuth Access Token
 */
async function getPayPalAccessToken(
    clientId: string,
    secret: string
): Promise<string> {
    // Debug: Log credential info (only first 10 chars for security)
    console.log(`[PayPal Debug] Client ID length: ${clientId.length}, starts with: ${clientId.substring(0, 10)}...`);
    console.log(`[PayPal Debug] Secret length: ${secret.length}`);
    console.log(`[PayPal Debug] API Base: ${PAYPAL_API_BASE}`);

    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[PayPal Auth Error] Status:", response.status);
        console.error("[PayPal Auth Error] Response:", errorText);
        try {
            const errorJson = JSON.parse(errorText);
            console.error("[PayPal Auth Error] Parsed:", JSON.stringify(errorJson));
        } catch (e) {
            console.error("[PayPal Auth Error] Raw text:", errorText);
        }
        throw new Error(`PayPal authentication failed: ${response.status} - ${errorText}`);
    }


    const data = await response.json() as PayPalAccessTokenResponse;
    console.log("[PayPal Debug] Successfully obtained access token");
    return data.access_token;
}


/**
 * Create PayPal Order
 * 
 * HTTPS Callable Function to create a PayPal order for Premium subscription
 */

// Pricing configuration (must match frontend billing.ts)
type BillingCycle = "monthly" | "yearly" | "lifetime";

const PLAN_PRICING: Record<BillingCycle, { amount: string; description: string }> = {
    monthly: { amount: "599", description: "Goodi Premium 月費方案" },
    yearly: { amount: "5990", description: "Goodi Premium 年費方案" },
    lifetime: { amount: "19999", description: "Goodi Premium 終身方案" },
};

export const createPaypalOrder = onCall(
    {
        secrets: [paypalClientId, paypalSecret],
    },
    async (request) => {
        const { auth, data } = request;

        // 1. Verify user is authenticated
        if (!auth) {
            throw new HttpsError(
                "unauthenticated",
                "Must be logged in to create an order"
            );
        }

        // 2. Get and validate plan from request
        const { plan } = (data || {}) as { plan?: BillingCycle };
        if (!plan || !PLAN_PRICING[plan]) {
            throw new HttpsError(
                "invalid-argument",
                `Invalid plan: ${plan}. Must be one of: monthly, yearly, lifetime`
            );
        }

        const planConfig = PLAN_PRICING[plan];
        const userId = auth.uid;
        const userEmail = auth.token.email || "";

        console.log(`[createPaypalOrder] Creating order for user: ${userId}, plan: ${plan}, amount: ${planConfig.amount}`);

        try {
            // 3. Get PayPal Access Token using secrets
            const clientId = paypalClientId.value();
            const secret = paypalSecret.value();

            // Debug: Check if secrets are properly loaded
            console.log(`[PayPal Debug] clientId type: ${typeof clientId}, value exists: ${!!clientId}`);
            console.log(`[PayPal Debug] secret type: ${typeof secret}, value exists: ${!!secret}`);
            console.log(`[PayPal Debug] Client ID length: ${clientId?.length || 0}, starts with: ${clientId?.substring(0, 15) || 'N/A'}...`);
            console.log(`[PayPal Debug] Secret length: ${secret?.length || 0}`);


            if (!clientId || !secret) {
                console.error("[PayPal Error] Missing credentials");
                throw new HttpsError("failed-precondition", "PayPal credentials not configured");
            }

            const accessToken = await getPayPalAccessToken(clientId, secret);

            // 4. Create order payload with dynamic pricing
            const orderPayload = {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: "TWD",
                            value: planConfig.amount,
                        },
                        description: planConfig.description,
                        custom_id: `${userId}|${plan}`, // Store userId AND plan for webhook processing
                    },
                ],
                application_context: {
                    brand_name: "Goodi",
                    landing_page: "NO_PREFERENCE",
                    user_action: "PAY_NOW",
                    return_url: `${process.env.APP_URL || "https://goodi-5ec49.web.app"}/payment/success`,
                    cancel_url: `${process.env.APP_URL || "https://goodi-5ec49.web.app"}/payment/cancel`,
                },
            };


            // 4. Call PayPal Create Order API
            const orderResponse = await fetch(
                `${PAYPAL_API_BASE}/v2/checkout/orders`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderPayload),
                }
            );

            if (!orderResponse.ok) {
                const errorText = await orderResponse.text();
                console.error("[PayPal Create Order Error]", orderResponse.status, errorText);
                throw new HttpsError(
                    "internal",
                    `Failed to create PayPal order: ${orderResponse.status}`
                );
            }

            const orderData = await orderResponse.json() as PayPalOrderResponse;
            const approvalUrl = orderData.links.find((link) => link.rel === "approve")?.href;

            console.log(`[createPaypalOrder] Order created successfully: ${orderData.id}`);

            // 5. Return order ID and approval URL
            return {
                success: true,
                orderId: orderData.id,
                approvalUrl,
                status: orderData.status,
            };
        } catch (error: any) {
            console.error("[createPaypalOrder] Error:", error);

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                "internal",
                `Failed to create PayPal order: ${error.message || "Unknown error"}`
            );
        }
    }
);
