const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Where published schemas are stored
const SCHEMAS_DIR = path.join(__dirname, '..', '..', 'schemas');

// POST /api/schemas — Publish a schema (admin saves the JSON)
// Body: the full JSON schema object { screenName: "vehicle", components: [...] }
router.post('/', async (req, res) => {
    try {
        const schema = req.body;

        // Validate the incoming schema
        if (!schema.screenName || typeof schema.screenName !== 'string') {
            return res.status(400).json({ error: 'screenName is required' });
        }
        if (!schema.components || !Array.isArray(schema.components)) {
            return res.status(400).json({ error: 'components array is required' });
        }

        // Sanitize screenName for safe filename
        const safeName = schema.screenName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

        // Ensure schemas folder exists
        await fs.mkdir(SCHEMAS_DIR, { recursive: true });

        // Save as {screenName}.json
        const filePath = path.join(SCHEMAS_DIR, `${safeName}.json`);
        await fs.writeFile(filePath, JSON.stringify(schema, null, 2), 'utf-8');

        res.status(201).json({
            message: `Schema "${schema.screenName}" published successfully`,
            endpoint: `/forms/${safeName}`
        });
    } catch (error) {
        console.error('Schema publish error:', error);
        res.status(500).json({ error: 'Failed to publish schema' });
    }
});

// GET /api/schemas/:name — Fetch a published schema by name
// Used by the DynamicForm page to know what fields to render
router.get('/:name', async (req, res) => {
    try {
        const safeName = req.params.name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        const filePath = path.join(SCHEMAS_DIR, `${safeName}.json`);

        const content = await fs.readFile(filePath, 'utf-8');
        res.json(JSON.parse(content));
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: `Schema "${req.params.name}" not found` });
        }
        res.status(500).json({ error: 'Failed to load schema' });
    }
});

// GET /api/schemas — List all published schemas
router.get('/', async (req, res) => {
    try {
        await fs.mkdir(SCHEMAS_DIR, { recursive: true });
        const files = await fs.readdir(SCHEMAS_DIR);
        const schemas = files
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));

        res.json({ schemas });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list schemas' });
    }
});

module.exports = router;