// UNIT TEST: recordsService.validateFields()
//   - null      when data is valid
//   - a string  (errors joined by "; ") when something is wrong

const { expect } = require('chai');
const recordsService = require('../../src/services/recordsService');

describe('recordsService.validateFields', () => {

  const validData = () => ({
    name: 'My Record',
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: '1234567890',
  });

  it('returns null when all fields are valid (file storage)', () => {
    const data = validData();
    const result = recordsService.validateFields(data, 'file');
    expect(result).to.be.null;
  });

  it('requires name for file storage', () => {
    const data = validData();
    delete data.name;
    const result = recordsService.validateFields(data, 'file');
    expect(result).to.be.a('string');
    expect(result).to.include('name is required');
  });

  it('does NOT require name for mongodb storage', () => {
    const data = validData();
    delete data.name;
    const result = recordsService.validateFields(data, 'mongodb');
    expect(result).to.be.null;
  });

  ['@', '#', '$', '%', '!', '/', '.', '\t'].forEach((badChar) => {
    it(`rejects a name containing "${badChar}" (file)`, () => {
      const data = validData();
      data.name = `bad${badChar}name`;
      const result = recordsService.validateFields(data, 'file');
      expect(result).to.be.a('string');
      expect(result).to.include('name can only contain');
    });
  });

  ['my-record', 'my_record', 'My Record 123'].forEach((goodName) => {
    it(`accepts a valid name "${goodName}" (file)`, () => {
      const data = validData();
      data.name = goodName;
      const result = recordsService.validateFields(data, 'file');
      expect(result).to.be.null;
    });
  });

  ['file', 'mongodb'].forEach((storageType) => {
    it(`rejects a missing firstName (${storageType})`, () => {
      const data = validData();
      delete data.firstName;
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('firstName is required');
    });
  });

  ['file', 'mongodb'].forEach((storageType) => {
    it(`rejects a missing lastName (${storageType})`, () => {
      const data = validData();
      delete data.lastName;
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('lastName is required');
    });
  });

  ['file', 'mongodb'].forEach((storageType) => {
    it(`rejects firstName longer than 50 characters (${storageType})`, () => {
      const data = validData();
      data.firstName = 'a'.repeat(51);
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('firstName must be at most 50 characters');
    });
  });

  ['file', 'mongodb'].forEach((storageType) => {
    it(`allows phone to be omitted (${storageType})`, () => {
      const data = validData();
      delete data.phone;
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.null;
    });
  });

  ['file', 'mongodb'].forEach((storageType) => {
    it(`rejects phone longer than 20 characters (${storageType})`, () => {
      const data = validData();
      data.phone = '3'.repeat(21);
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('phone must be at most 20 characters');
    });
  });

  ['file', 'mongodb'].forEach((storageType) => {
    it(`reports MULTIPLE errors joined together (${storageType})`, () => {
      const data = validData();
      delete data.firstName;
      delete data.lastName;
      data.phone = '3'.repeat(21);
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('firstName is required');
      expect(result).to.include('lastName is required');
      expect(result).to.include('; ');
      expect(result).to.include('phone must be at most 20 characters');
    });
  });
  
  it('rejects a name longer than 50 characters (file)', () => {
    const data = validData();
    data.name = 'a'.repeat(51);
    const result = recordsService.validateFields(data, "file");
    expect(result).to.be.a('string');
    expect(result).to.include('name must be at most 50 characters');
  });
  
  ['file', 'mongodb'].forEach((storageType) => {
    it(`rejects lastName longer than 50 characters (${storageType})`, () => {
      const data = validData();
      data.lastName = 'a'.repeat(51);
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('lastName must be at most 50 characters');
    });
  });
  
  ['file', 'mongodb'].forEach((storageType) => {
    it(`rejects a phone that is not a string (${storageType})`, () => {
      const data = validData();
      data.phone = 123;
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('phone must be a string');
    });
  });
  
  ['file', 'mongodb'].forEach((storageType) => {
    it(`rejects firstName that is an empty string (${storageType})`, () => {
      const data = validData();
      data.firstName = '';
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('firstName is required and must be a non-empty string');
    });
  });
  
  ['file', 'mongodb'].forEach((storageType) => {
    it(`rejects firstName that is only whitespace (${storageType})`, () => {
      const data = validData();
      data.firstName = '      ';
      const result = recordsService.validateFields(data, storageType);
      expect(result).to.be.a('string');
      expect(result).to.include('firstName is required and must be a non-empty string');
    });
  });

});
