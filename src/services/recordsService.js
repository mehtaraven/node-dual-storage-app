const StorageFactory = require('../storage/storageFactory');

class RecordsService {

  validateFields(data) {
    const errors = [];

    // name is REQUIRED — this becomes the record identifier and filename
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('name is required and must be a non-empty string');
    } else if (data.name.length > 50) {
      errors.push('name must be at most 50 characters');
    } else if (!/^[a-zA-Z0-9-_ ]+$/.test(data.name)) {
      // Only allow safe characters for filename
      errors.push('name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim() === '') {
      errors.push('firstName is required and must be a non-empty string');
    } else if (data.firstName.length > 50) {
      errors.push('firstName must be at most 50 characters');
    }

    if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim() === '') {
      errors.push('lastName is required and must be a non-empty string');
    } else if (data.lastName.length > 50) {
      errors.push('lastName must be at most 50 characters');
    }

    // phone is OPTIONAL — validate only if provided
    if (data.phone !== undefined && data.phone !== '') {
      if (typeof data.phone !== 'string') {
        errors.push('phone must be a string');
      } else if (data.phone.length > 20) {
        errors.push('phone must be at most 20 characters');
      }
    }

    return errors.length > 0 ? errors.join('; ') : null;
  }

  async createRecord(userEmail, storageType, data) {
    const handler = StorageFactory.createHandler(storageType);

    // Use the name as the record ID (sanitized for safe filenames)
    const recordId = data.name.trim().toLowerCase().replace(/\s+/g, '-');

    // Check if record with this name already exists
    const existing = await handler.read(userEmail, recordId);
    if (existing) {
      return { error: `Record "${data.name}" already exists`, status: 409 };
    }

    const recordData = {
      id: recordId,                          // This becomes the filename: {id}.json
      name: data.name.trim(),                // Original name as entered by user
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone ? data.phone.trim() : null  // Optional field
    };

    const result = await handler.create(userEmail, recordData);
    return { data: result.data, status: 201 };
  }

  async getRecord(userEmail, storageType, id) {
    const handler = StorageFactory.createHandler(storageType);
    const result = await handler.read(userEmail, id);

    if (!result) {
      return { error: 'Record not found', status: 404 };
    }

    return { data: result.data, status: 200 };
  }

  async getAllRecords(userEmail, storageType) {
    const handler = StorageFactory.createHandler(storageType);
    const records = await handler.readAll(userEmail);
    return { data: records, status: 200 };
  }

  async updateRecord(userEmail, storageType, id, data) {
    const handler = StorageFactory.createHandler(storageType);

    const updateData = {
      name: data.name ? data.name.trim() : undefined,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone ? data.phone.trim() : null
    };

    const result = await handler.update(userEmail, id, updateData);

    if (!result) {
      return { error: 'Record not found', status: 404 };
    }

    return { data: result.data, status: 200 };
  }

  async deleteRecord(userEmail, storageType, id) {
    const handler = StorageFactory.createHandler(storageType);
    const result = await handler.delete(userEmail, id);

    if (!result) {
      return { error: 'Record not found', status: 404 };
    }

    return { message: 'Record deleted successfully', status: 200 };
  }
}

module.exports = new RecordsService();
