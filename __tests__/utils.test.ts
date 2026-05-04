import {parseUrls, validateStatus, isValidCondition} from '../src/utils';

describe('parseUrls', () => {
  test('Single URL', () => {
    expect(parseUrls('https://hooks.slack.com/services/T00/B00/xxx')).toEqual([
      'https://hooks.slack.com/services/T00/B00/xxx'
    ]);
  });

  test('Newline-separated URLs', () => {
    const input =
      'https://hook1.example.com\nhttps://hook2.example.com\nhttps://hook3.example.com';
    expect(parseUrls(input)).toEqual([
      'https://hook1.example.com',
      'https://hook2.example.com',
      'https://hook3.example.com'
    ]);
  });

  test('Comma-separated URLs', () => {
    const input = 'https://hook1.example.com,https://hook2.example.com';
    expect(parseUrls(input)).toEqual([
      'https://hook1.example.com',
      'https://hook2.example.com'
    ]);
  });

  test('Handles whitespace and empty lines', () => {
    const input =
      '  https://hook1.example.com  \n\n  https://hook2.example.com  \n';
    expect(parseUrls(input)).toEqual([
      'https://hook1.example.com',
      'https://hook2.example.com'
    ]);
  });

  test('Empty string returns empty array', () => {
    expect(parseUrls('')).toEqual([]);
  });
});

describe('validateStatus', () => {
  test('Valid statuses', () => {
    expect(validateStatus('success')).toBe('success');
    expect(validateStatus('failure')).toBe('failure');
    expect(validateStatus('cancelled')).toBe('cancelled');
  });

  test('Invalid status throws', () => {
    expect(() => validateStatus('invalid')).toThrow('Invalid type parameter');
  });
});

describe('isValidCondition', () => {
  test('Valid conditions', () => {
    expect(isValidCondition('always')).toBe(true);
    expect(isValidCondition('success')).toBe(true);
    expect(isValidCondition('failure')).toBe(true);
    expect(isValidCondition('cancelled')).toBe(true);
  });

  test('Invalid condition', () => {
    expect(isValidCondition('invalid')).toBe(false);
  });
});
