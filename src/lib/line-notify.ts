const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export async function sendLineNotification(message: string) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;

    if (!token || !userId) {
        console.warn("LINE_CHANNEL_ACCESS_TOKEN or LINE_USER_ID is not set. Skipping LINE push notification.");
        return false;
    }

    try {
        const response = await fetch(LINE_PUSH_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                to: userId,
                messages: [
                    {
                        type: "text",
                        text: message,
                    },
                ],
            }),
        });

        if (!response.ok) {
            console.error("Failed to send LINE Messaging API push:", await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error sending LINE Messaging API push:", error);
        return false;
    }
}

// Keep the old export name as an alias so existing callers continue to work.
export const sendLineNotify = sendLineNotification;
