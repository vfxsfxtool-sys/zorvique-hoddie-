import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsAppHref } from './whatsapp';

test('buildWhatsAppHref normalizes Pakistan local and international numbers with prefilled message', () => {
  assert.equal(
    buildWhatsAppHref('03084540977', 'Hi Zorvique'),
    'https://wa.me/923084540977?text=Hi%20Zorvique'
  );
  assert.equal(
    buildWhatsAppHref('0300-1234567', 'Hi Zorvique'),
    'https://wa.me/923001234567?text=Hi%20Zorvique'
  );
  assert.equal(
    buildWhatsAppHref('+92 321 9876543'),
    'https://wa.me/923219876543'
  );
});

test('buildWhatsAppHref preserves existing wa.me URLs and falls back to 03084540977 when empty', () => {
  assert.equal(
    buildWhatsAppHref('https://wa.me/923084540977', 'Help me order'),
    'https://wa.me/923084540977?text=Help+me+order'
  );
  assert.equal(
    buildWhatsAppHref('', 'Need help'),
    'https://wa.me/923084540977?text=Need%20help'
  );
  assert.equal(buildWhatsAppHref(''), 'https://wa.me/923084540977');
});
