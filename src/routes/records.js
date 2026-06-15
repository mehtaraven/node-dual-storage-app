const express = require('express');
const recordsService = require('../services/recordsService');

const router = express.Router();

// POST /api/records — Create new record
router.post('/', async (req, res) => {
  try {
    const { email, storage_type } = req.user;

    const validationError = recordsService.validateFields(req.body, req.user.storage_type);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await recordsService.createRecord(email, storage_type, req.body);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Record create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/records — List all records
router.get('/', async (req, res) => {
  try {
    const { email, storage_type } = req.user;
    const result = await recordsService.getAllRecords(email, storage_type);
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Records list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/records/:id — Get single record
router.get('/:id', async (req, res) => {
  try {
    const { email, storage_type } = req.user;
    const result = await recordsService.getRecord(email, storage_type, req.params.id);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Record get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/records/:id — Update record
router.put('/:id', async (req, res) => {
  try {
    const { email, storage_type } = req.user;

    const validationError = recordsService.validateFields(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await recordsService.updateRecord(email, storage_type, req.params.id, req.body);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('Record update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/records/:id — Delete record
router.delete('/:id', async (req, res) => {
  try {
    const { email, storage_type } = req.user;
    const result = await recordsService.deleteRecord(email, storage_type, req.params.id);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(result.status).json({ message: result.message });
  } catch (error) {
    console.error('Record delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
