//runn command node src/scripts/importBigJson.js
const fs = require('fs');                              
const path = require('path');                       
const { pipeline } = require('stream/promises');      
const { Transform } = require('stream');        
const { parser } = require('stream-json');   // ── Third-party: incremental JSON parser (npm install stream-json) 
const { streamArray } = require('stream-json/streamers/StreamArray')
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Record = require('../models/Record');            

require('dotenv').config();

const FILE_PATH = 'C:/Users/ramehta/Downloads/employees_5-level_1-GB_invalid.json';
const TYPE = 'employee';
const USER_EMAIL = 'import@system';
const BATCH_SIZE = 1000;
const READ_CHUNK_BYTES = 64 * 1024;

function mapToRecord(raw, type, userEmail) {
  return {
    recordId: uuidv4(),          
    userEmail: userEmail,        
    type: type,                 
    data: raw,                  
  };
}

function createBatcher(batchSize) {
  let batch = [];                            

  return new Transform({
    objectMode: true,

    transform(chunk, _encoding, callback) {
      batch.push(chunk.value);                 

      if (batch.length >= batchSize) {
        this.push(batch);                      
        batch = [];                            
      }
      callback(); // ALWAYS call callback() to signal "I'm ready for the next record".
    },

    flush(callback) {         // flush() runs ONCE at the very end, after the last record.
      if (batch.length > 0) {
        this.push(batch);
      }
      batch = [];
      callback();
    },
  });
}

function createDbWriter(stats) {
  return new Transform({
    objectMode: true,
    
    async transform(batch, _encoding, callback) {
      try {
        const result = await Record.collection.insertMany(batch, { ordered: false });
        
        stats.inserted += result.insertedCount || 0;
        stats.processed += batch.length;
        
        console.log(`  processed ${stats.processed} records (inserted: ${stats.inserted})`);
        
        callback();
      } catch (err) {
        // Pass the error to pipeline(), which will stop everything and clean up.
        callback(err);
      }
    },
  });
}

async function importBigJson(filePath, type, userEmail) {
  const stats = { processed: 0, inserted: 0 };
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const totalBytes = fs.statSync(absolutePath).size;
  console.log(`Importing ${absolutePath} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
  
  const readStream = fs.createReadStream(absolutePath, { highWaterMark: READ_CHUNK_BYTES });
  
  const mapStage = new Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      // chunk = { key, value }. Replace value with the mapped record so the
      callback(null, { key: chunk.key, value: mapToRecord(chunk.value, type, userEmail) });

      //So callback(null, X) is shorthand for "I'm done, no error, 
      // // and here's X for the next stage" — equivalent to this.push(X); callback();.
    },
  });
  
  await pipeline(
    readStream,              // 1. raw bytes from disk (max 64KB at a time)
    parser(),                // 2. bytes  -> JSON tokens (understands JSON syntax)
    streamArray(),           // 3. tokens -> one array element at a time
    mapStage,                // 4. shape each element into a Record document
    createBatcher(BATCH_SIZE), // 5. group records into batches of 1000
    createDbWriter(stats),   // 6. bulk-write each batch to MongoDB (the sink)
  );
  
  return stats;
}

async function main() {
  console.log(`Will store every object as type="${TYPE}", userEmail="${USER_EMAIL}"`);
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Add it to your .env file.');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected. Starting import...');
    
    const startedAt = Date.now();
    const stats = await importBigJson(FILE_PATH, TYPE, USER_EMAIL.toLowerCase());
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    
    console.log('--------------------------------------------------');
    console.log(`Done in ${seconds}s`);
    console.log(`  total processed: ${stats.processed}`);
    console.log(`  inserted: ${stats.inserted}`);
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exitCode = 1;                       
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

// Run main() when this file is executed directly (node src/scripts/importBigJson.js).
// Without this line, main() is defined but never called — the script does nothing.
if (require.main === module) {
  main();
}

module.exports = { importBigJson, mapToRecord };

/**
 * WHY a Transform and not a Writable?
 *   It works either way, but using async transform() here lets `pipeline()`
 *   apply backpressure automatically: because we `await` the DB write before
 *   calling callback(), the file reader PAUSES whenever MongoDB is slow. This is
 *   what keeps memory flat — we never read faster than Mongo can store.
 *
 * WHY Record.collection.insertMany (the raw driver) instead of Record.insertMany?
 *   Our documents only have recordId/userEmail/type/data — they intentionally do
 *   NOT have firstName/lastName, which the Mongoose schema marks as required. The
 *   model-level insert would reject them on validation. Using the raw collection
 *   (`Record.collection`) writes straight to MongoDB and SKIPS schema validation,
 *   which is exactly what we want for a "store whatever it is" bulk import.
 *
 *   `ordered: false` tells Mongo to keep going even if one document fails,
 *   instead of aborting the whole batch at the first error.
 * 
 * Callback >> meaning >> im done and im ready to accept and process  the next batch 
 * 
 */