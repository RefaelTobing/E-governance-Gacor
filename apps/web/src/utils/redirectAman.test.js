import { describe, it, expect } from 'vitest';
import { redirectAman } from './redirectAman';

describe('redirectAman', () => {
  it('mengembalikan null untuk non-string', () => {
    expect(redirectAman(null)).toBeNull();
    expect(redirectAman(undefined)).toBeNull();
    expect(redirectAman(123)).toBeNull();
    expect(redirectAman({})).toBeNull();
  });

  it('mengembalikan null untuk path yang tidak diawali "/"', () => {
    expect(redirectAman('home')).toBeNull();
    expect(redirectAman('https://evil.com')).toBeNull();
    expect(redirectAman('http://evil.com')).toBeNull();
  });

  it('menolak protocol-relative URL "//host" (anti open-redirect)', () => {
    expect(redirectAman('//evil.com')).toBeNull();
    expect(redirectAman('//evil.com/path')).toBeNull();
  });

  it('menolak path yang memuat backslash', () => {
    expect(redirectAman('/path\\to')).toBeNull();
    expect(redirectAman('\\\\evil.com')).toBeNull();
  });

  it('meloloskan path internal yang sah', () => {
    expect(redirectAman('/laporan-saya')).toBe('/laporan-saya');
    expect(redirectAman('/profil')).toBe('/profil');
    expect(redirectAman('/ruang-publik/abc?x=1')).toBe('/ruang-publik/abc?x=1');
  });
});
