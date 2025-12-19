const express = require('express');
const router = express.Router();
const templateService = require('../services/templateService');
const { validateRequest, schemas, sanitizeObject } = require('../utils/validation');

// GET /templates - List all templates
router.get('/', async (req, res) => {
  try {
    const templates = await templateService.getAllTemplates();

    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /templates/:id - Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await templateService.getTemplateById(parseInt(req.params.id));

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /templates - Create new template
router.post('/', async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const validated = validateRequest(schemas.createTemplate, sanitized);

    const template = await templateService.createTemplate(validated);

    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /templates/:id - Update template
router.put('/:id', async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const validated = validateRequest(schemas.createTemplate, sanitized);

    const template = await templateService.updateTemplate(parseInt(req.params.id), validated);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await templateService.deleteTemplate(parseInt(req.params.id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
