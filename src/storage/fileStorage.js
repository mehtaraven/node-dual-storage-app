const fs = require('fs').promises;
const path = require('path');

// Root folder where all user data is stored
// __dirname = folder where THIS file lives (src/storage/)
// Going up twice (../..) gets us to the project root, then into /data
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

class FileStorage {

  // Convert email to a safe folder name
  // "alice@example.com" → "alice_at_example_dot_com"
  // Also removes dangerous characters that could allow path traversal attacks
  sanitizeEmail(email) {
    return email
      .replace(/\.\./g, '')      // Remove ".." (path traversal attack)
      .replace(/[/\\]/g, '')     // Remove slashes (can't escape folder)
      .replace(/@/g, '_at_')     // @ → _at_
      .replace(/\./g, '_dot_');  // . → _dot_
  }

  // Build the folder path for a user's records
  // Example: "data/alice_at_example_dot_com/records/"
  getUserFolderPath(userEmail) {
    const sanitized = this.sanitizeEmail(userEmail);
    const userPath = path.join(DATA_DIR, sanitized, 'records');

    // SECURITY: Verify the resolved path is still inside DATA_DIR
    // Prevents any path traversal that might have slipped through sanitization
    const resolved = path.resolve(userPath);
    if (!resolved.startsWith(path.resolve(DATA_DIR))) {
      throw new Error('Invalid path: access denied');
    }

    return userPath;
  }

  // Build full file path for a specific record
  // Example: "data/alice_at_example_dot_com/records/rec-001.json"
  getFilePath(userEmail, id) {
    const folderPath = this.getUserFolderPath(userEmail);
    return path.join(folderPath, `${id}.json`);
  }

  // Create the folder if it doesn't exist yet (first record for this user)
  // Like: Files.createDirectories(path) in Java
  async ensureFolder(folderPath) {
    try {
      await fs.mkdir(folderPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  // CREATE — Write a new record as a JSON file
  async create(userEmail, data) {
    const folderPath = this.getUserFolderPath(userEmail);
    await this.ensureFolder(folderPath);

    const filePath = this.getFilePath(userEmail, data.id);

    // Write the record object as pretty-printed JSON to disk
    // JSON.stringify(data, null, 2) → human-readable with 2-space indent
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    //   The 3 arguments:
    //     updatedData → the object to convert
    //     null        → no filter (include all fields)
    //     2           → indent with 2 spaces (makes it readable when you open the file)
    return { status: 'SUCCESS', data };
  }

  // READ — Read a single record by ID
  // Returns null if not found (caller sends 404)
  async read(userEmail, id) {
    const filePath = this.getFilePath(userEmail, id);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return { status: 'SUCCESS', data };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist = record not found
        return null;
      }
      throw error;
    }
  }

  // READ ALL — Read all records for a user
  // Returns empty array if user has no records yet
  async readAll(userEmail) {
    const folderPath = this.getUserFolderPath(userEmail);

    try {
      const files = await fs.readdir(folderPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const records = [];
      for (const file of jsonFiles) {
        const filePath = path.join(folderPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        records.push(JSON.parse(content));
      }

      return records;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Folder doesn't exist = new user, no records yet
        return [];
      }
      throw error;
    }
  }

  // UPDATE — Overwrite an existing record
  // Returns null if record doesn't exist (can't update what's not there)
  async update(userEmail, id, data) {
    const filePath = this.getFilePath(userEmail, id);

    try {
      // Check file exists first (don't accidentally CREATE via update)
      await fs.access(filePath);

      // Merge new data with the existing id (ensure id is always preserved)
      console.log("FIle path >id ", id);
      console.log("FIle path >id ", id);
      console.log("FIle path >...data ", { ...data });
      const updatedData = { ...data, id };
      console.log("FIle path >updatedData ", updatedData);
      await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

      return { status: 'SUCCESS', data: updatedData };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  // DELETE — Remove a record file
  // Returns null if file doesn't exist (caller sends 404)
  async delete(userEmail, id) {
    const filePath = this.getFilePath(userEmail, id);

    try {
      await fs.unlink(filePath);
      return { status: 'SUCCESS' };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}

module.exports = FileStorage;




// H P SIGNA

// SIGNATure   H + P + SKEY >> 1234567890

// abc.def.ghj


// backend >> new Signature > H + P + SKEY >> 

//check if jwt is neeeded needed 
// need to look  // files   //js  functions look into

