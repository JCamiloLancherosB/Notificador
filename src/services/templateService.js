const db = require('../utils/database');

class TemplateService {
  async getAllTemplates() {
    const templates = await db.query('SELECT * FROM templates WHERE is_active = true ORDER BY name');
    return templates.map(t => this.formatTemplate(t));
  }

  async getTemplateById(id) {
    const templates = await db.query('SELECT * FROM templates WHERE id = ?', [id]);
    return templates.length > 0 ? this.formatTemplate(templates[0]) : null;
  }

  async getTemplateByName(name) {
    const templates = await db.query('SELECT * FROM templates WHERE name = ?', [name]);
    return templates.length > 0 ? this.formatTemplate(templates[0]) : null;
  }

  async createTemplate(templateData) {
    const { name, description, channels, content_whatsapp, content_sms, 
            content_email_subject, content_email_body, variables, is_active } = templateData;

    const result = await db.query(
      `INSERT INTO templates (name, description, channels, content_whatsapp, content_sms, 
       content_email_subject, content_email_body, variables, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        JSON.stringify(channels),
        content_whatsapp || null,
        content_sms || null,
        content_email_subject || null,
        content_email_body || null,
        JSON.stringify(variables || []),
        is_active !== undefined ? is_active : true
      ]
    );

    return await this.getTemplateById(result.insertId);
  }

  async updateTemplate(id, templateData) {
    const { name, description, channels, content_whatsapp, content_sms, 
            content_email_subject, content_email_body, variables, is_active } = templateData;

    await db.query(
      `UPDATE templates SET name = ?, description = ?, channels = ?, 
       content_whatsapp = ?, content_sms = ?, content_email_subject = ?, 
       content_email_body = ?, variables = ?, is_active = ? WHERE id = ?`,
      [
        name,
        description || null,
        JSON.stringify(channels),
        content_whatsapp || null,
        content_sms || null,
        content_email_subject || null,
        content_email_body || null,
        JSON.stringify(variables || []),
        is_active !== undefined ? is_active : true,
        id
      ]
    );

    return await this.getTemplateById(id);
  }

  async deleteTemplate(id) {
    const result = await db.query('DELETE FROM templates WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  renderTemplate(template, channel, variables) {
    let content = '';
    
    switch (channel) {
      case 'whatsapp':
        content = template.content_whatsapp || '';
        break;
      case 'sms':
        content = template.content_sms || '';
        break;
      case 'email':
        // For email, we'll handle subject and body separately
        return {
          subject: this.replaceVariables(template.content_email_subject || '', variables),
          body: this.replaceVariables(template.content_email_body || '', variables)
        };
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }

    if (!content) {
      throw new Error(`Template ${template.name} does not support channel ${channel}`);
    }

    return this.replaceVariables(content, variables);
  }

  replaceVariables(content, variables) {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    return result;
  }

  validateTemplateVariables(template, variables) {
    const missingVars = [];
    const requiredVars = template.variables || [];

    for (const varName of requiredVars) {
      if (!(varName in variables) || variables[varName] === undefined || variables[varName] === null) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }
  }

  formatTemplate(template) {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      channels: typeof template.channels === 'string' ? JSON.parse(template.channels) : template.channels,
      content_whatsapp: template.content_whatsapp,
      content_sms: template.content_sms,
      content_email_subject: template.content_email_subject,
      content_email_body: template.content_email_body,
      variables: typeof template.variables === 'string' ? JSON.parse(template.variables) : template.variables,
      is_active: template.is_active,
      created_at: template.created_at,
      updated_at: template.updated_at
    };
  }
}

module.exports = new TemplateService();
