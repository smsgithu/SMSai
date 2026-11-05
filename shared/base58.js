const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encodeBase58(source) {
  const bytes = source instanceof Uint8Array ? source : Uint8Array.from(source || []);
  if (bytes.length === 0) return '';

  const digits = [0];
  for (let i = 0; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let encoded = '';
  for (let k = 0; bytes[k] === 0 && k < bytes.length - 1; k += 1) encoded += '1';
  for (let q = digits.length - 1; q >= 0; q -= 1) encoded += ALPHABET[digits[q]];
  return encoded;
}

export function decodeBase58(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Invalid base58');
  }

  const bytes = [0];
  for (let i = 0; i < value.length; i += 1) {
    const code = ALPHABET.indexOf(value[i]);
    if (code < 0) throw new Error('Invalid base58');
    let carry = code;
    for (let j = 0; j < bytes.length; j += 1) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (let k = 0; value[k] === '1' && k < value.length - 1; k += 1) bytes.push(0);
  return Uint8Array.from(bytes.reverse());
}
