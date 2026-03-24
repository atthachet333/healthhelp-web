// src/lib/line-notify.ts

export const sendLineNotify = async (message: string, imageBlob?: Blob | any) => {
    // โทเคน LINE OA ของคุณ (Channel Access Token)
    const token = "Z/lnDkpFK/FEtwo+vwWxXRv7Ieg4UXikm0Xv/Uejv7h3J9F4j3feZabsfhZ8gxCWDepEORXSHa0fF/UBF9lf25vCeAvkF5h2GP7rShGg2GLgyrClJkRNsFxfsIzPeYpUALC4nJI8esYBztlkXhQ+mgdB04t89/1O/w1cDnyilFU=";

    // 🚨 สำคัญมาก: ต้องใส่ User ID หรือ Group ID ของแอดมินที่จะรับการแจ้งเตือน
    // วิธีหา User ID: ให้แอดมินแอด LINE OA แล้วในหน้า Webhook/Chat จะดู ID ได้ (มักจะขึ้นต้นด้วย U...)
    const adminUserId = "U65a93fda609addf7836487c8b7b60df8";

    // รูปแบบข้อมูลของ LINE Messaging API (LINE OA)
    const payload = {
        to: adminUserId,
        messages: [
            {
                type: "text",
                text: message
            }
        ]
    };

    // หมายเหตุ: LINE OA ส่งรูปภาพผ่าน API push ค่อนข้างซับซ้อน (ต้องใช้ URL รูปที่เป็น HTTPS เท่านั้น)
    // ในเบื้องต้นเราจะส่งเป็นข้อความแจ้งเตือนไปก่อนครับ

    try {
        const response = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorDetail = await response.text();
            console.error("❌ ส่ง LINE OA ไม่สำเร็จ:", errorDetail);
        } else {
            console.log("✅ ส่งแจ้งเตือน LINE OA สำเร็จ!");
        }
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดระบบ LINE OA:", error);
    }
};

// เผื่อโค้ดที่อื่นเรียกใช้ชื่อฟังก์ชันนี้
export const sendLineNotification = sendLineNotify;