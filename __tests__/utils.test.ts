import {validateStatus, isValidCondition} from '../src/utils';

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
