import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

interface PayPalWebhookEvent {
    event_type: string;
    resource: {
        id: string;
        status: string;
        purchase_units?: Array<{
            custom_id?: string;
            payments?: {
                captures?: Array<{
                    id: string;
                    status: string;
                }>;
            };
        }>;
        payer?: {
            email_address?: string;
            payer_id?: string;
        };
    };
}

/**
 * Handle PayPal Webhook Events
 * 
 * HTTP Endpoint to receive and process PayPal webhook notifications
 * Webhook ID: 61H13807NE5578944
 */
export const handlePaypalWebhook = onRequest(
    async (req, res) => {
        // 1. Basic validation
        console.log("[Webhook] Received event");

        // 2. Parse event
        const event = req.body as PayPalWebhookEvent;
        console.log(`[Webhook] Event type: ${event.event_type}`);

        // 3. Handle CHECKOUT.ORDER.APPROVED event
        if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
            try {
                const orderId = event.resource.id;
                const payerEmail = event.resource.payer?.email_address;
                const customId = event.resource.purchase_units?.[0]?.custom_id;

                console.log(`[Webhook] Order approved: ${orderId}, payer: ${payerEmail}, customId: ${customId}`);

                if (!customId) {
                    console.error("[Webhook] No custom_id found in order");
                    res.status(400).send("Missing custom_id");
                    return;
                }

                // Parse userId and plan from custom_id (format: "userId|plan")
                const [userId, billingCycle] = customId.split("|");
                if (!userId) {
                    console.error("[Webhook] Invalid custom_id format");
                    res.status(400).send("Invalid custom_id format");
                    return;
                }

                // Default to monthly if plan not specified (backwards compatibility)
                const plan = billingCycle || "monthly";

                console.log(`[Webhook] Parsed userId: ${userId}, plan: ${plan}`);

                // 4. Check for duplicate processing
                const db = getFirestore();
                const processedRef = db.collection("processedPayments").doc(orderId);
                const processedDoc = await processedRef.get();

                if (processedDoc.exists) {
                    console.log(`[Webhook] Order ${orderId} already processed, skipping`);
                    res.status(200).send("Already processed");
                    return;
                }

                // 5. Calculate expiration date based on plan
                const now = Timestamp.now();
                let expiresAt: Timestamp | null = null;

                if (plan === "monthly") {
                    expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
                } else if (plan === "yearly") {
                    expiresAt = Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
                }
                // lifetime = null expiresAt (never expires)

                // 6. Write membership data to Firestore
                const membershipRef = db
                    .collection("users")
                    .doc(userId)
                    .collection("membership")
                    .doc("current");

                await membershipRef.set({
                    plan: "premium",
                    billingCycle: plan,
                    upgradedAt: now,
                    expiresAt,
                    paymentProvider: "paypal",
                    paypalOrderId: orderId,
                    payerEmail,
                    lastUpdated: new Date().toISOString(),
                });

                // 7. Mark payment as processed
                await processedRef.set({
                    orderId,
                    userId,
                    billingCycle: plan,
                    payerEmail,
                    processedAt: now,
                    eventType: event.event_type,
                });

                console.log(`[Webhook] Successfully upgraded user ${userId} to Premium (${plan})`);
                res.status(200).send("Success");

            } catch (error: any) {
                console.error("[Webhook] Error processing order:", error);
                res.status(500).send("Processing error");
            }
        } else {
            // Other event types - log and acknowledge
            console.log(`[Webhook] Unhandled event type: ${event.event_type}`);
            res.status(200).send("Event received");
        }
    }
);
