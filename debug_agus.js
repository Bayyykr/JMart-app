const db = require('./backend/src/config/db');
const chatController = require('./backend/src/controllers/chatController');

async function test() {
    console.log('--- TESTING AGUS (ID 6) ---');
    const roomId = 'room_5_6';
    const uid = 6;
    
    // Test getChatListItem
    const listItem = await chatController.getChatListItem(uid, roomId);
    console.log('getChatListItem(6, room_5_6):', JSON.stringify(listItem, null, 2));

    // Test direct SQL
    const [rows] = await db.execute(`
            SELECT rc.*,
                   u.id as partnerId,
                   u.name as partnerName,
                   u.profile_image_url as partnerImage,
                   (CASE WHEN rc.user1_id = ? THEN rc.unread_user1 ELSE rc.unread_user2 END) as myUnread
            FROM room_chats rc
            JOIN users u ON u.id = (CASE WHEN rc.user1_id = ? THEN rc.user2_id ELSE rc.user1_id END)
            WHERE rc.id = ?
        `, [uid, uid, roomId]);
    console.log('Direct SQL Output:', JSON.stringify(rows[0], null, 2));

    process.exit(0);
}

test();
