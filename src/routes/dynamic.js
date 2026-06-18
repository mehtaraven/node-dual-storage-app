const express = require('express');
const { v4: uuidv4 } = require('uuid');
const StorageFactory = require('../storage/storageFactory');

const router = express.Router();

// Submit data from a dynamic form
// POST /api/dynamic/:type >> :type = the screenName/schemaName  
router.post('/:type', async (req, res) => {
    try {
        const { email, storage_type } = req.user;
        const type = req.params.type.trim().toLowerCase();
        const formData = req.body;

        if (!formData || Object.keys(formData).length === 0) {  // Basic validation: body should not be empty
            return res.status(400).json({ error: 'Form data cannot be empty' });
        }

        const handler = StorageFactory.createHandler(storage_type);
        const recordId = uuidv4();

        const recordData = {
            id: recordId,
            type: type,
            firstName: formData.firstName || type,
            lastName: formData.lastName || recordId.slice(0, 8),
            phone: formData.phone || null,
            data: formData
        };

        const result = await handler.create(email, recordData);  // email used separately in file system 

        res.status(201).json({
            message: `${type} record created`,
            data: result.data
        });
    } catch (error) {
        console.error('Dynamic form submit error:', error);
        res.status(500).json({ error: 'Failed to save form data' });
    }
});

// GET /api/dynamic/:type — Get all records of a specific type for this user
router.get('/:type', async (req, res) => {
    try {
        const { email, storage_type } = req.user;
        const type = req.params.type.trim().toLowerCase();

        const handler = StorageFactory.createHandler(storage_type);
        const allRecords = await handler.readAll(email);

        // Filter by type
        const filtered = allRecords.filter(r => r.type === type);

        res.json(filtered);
    } catch (error) {
        console.error('Dynamic form list error:', error);
        res.status(500).json({ error: 'Failed to load records' });
    }
});

module.exports = router;