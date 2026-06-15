const StorageFactory = require('../storage/storageFactory');
const { v4: uuidv4 } = require('uuid');

class RecordsService {

  validateFields(data, storageType) {
    const errors = [];


    // name is only required for file storage (it becomes the filename)
    if (storageType === 'file') {
      if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push('name is required for file storage');
      } else if (data.name.length > 50) {
        errors.push('name must be at most 50 characters');
      } else if (!/^[a-zA-Z0-9-_ ]+$/.test(data.name)) {
        errors.push('name can only contain letters, numbers, spaces, hyphens, and underscores');
      }
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
    if (data.phone !== undefined && data.phone !== '' && data.phone !== null) {
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

    // Generate record ID based on storage type:
    // File storage: use sanitized name as ID (becomes filename)
    // MongoDB: generate a UUID (name field not required)
    let recordId;
    if (storageType === 'file') {
      recordId = data.name.trim().toLowerCase().replace(/\s+/g, '-');

      // Check if record with this name already exists
      const existing = await handler.read(userEmail, recordId);
      if (existing) {
        return { error: `Record "${data.name}" already exists`, status: 409 };
      }
    } else {
      recordId = uuidv4();
    }

    const recordData = {
      id: recordId,                          // This becomes the filename: {id}.json
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone ? data.phone.trim() : null  // Optional field
    };

    // Only include name for file storage
    if (storageType === 'file') {
      recordData.name = data.name.trim();
    }

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
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone ? data.phone.trim() : null
    };
    // Include name only for file storage
    if (storageType === 'file' && data.name) {
      updateData.name = data.name.trim();
    }

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
