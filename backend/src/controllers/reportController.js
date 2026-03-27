const db = require('../config/db');

const submitReport = async (req, res) => {
    const { reported_user_id, order_id, reason, description } = req.body;
    const reporter_id = req.user.id;

    console.log('[REPORT] Submitting report:', { reporter_id, reported_user_id, order_id, reason });

    if (!reported_user_id || !reason) {
        return res.status(400).json({ message: 'Penerima laporan dan alasan wajib diisi.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO reports (reporter_id, reported_user_id, order_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [reporter_id, reported_user_id, order_id || null, reason, description || '', 'pending']
        );

        console.log('[REPORT] Success:', result.insertId);

        res.status(201).json({ 
            message: 'Laporan berhasil dikirim. Terima kasih atas kerja samanya.',
            reportId: result.insertId 
        });
    } catch (error) {
        console.error('[REPORT] Error:', error);
        res.status(500).json({ message: 'Gagal mengirim laporan. Terjadi kesalahan pada server: ' + error.message });
    }
};

const getMyReports = async (req, res) => {
    const reporter_id = req.user.id;

    try {
        const [reports] = await db.query(
            'SELECT * FROM reports WHERE reporter_id = ? ORDER BY createdAt DESC',
            [reporter_id]
        );
        res.json(reports);
    } catch (error) {
        console.error('[REPORT] Fetch Error:', error);
        res.status(500).json({ message: 'Gagal mengambil data laporan.' });
    }
};

module.exports = {
    submitReport,
    getMyReports
};
