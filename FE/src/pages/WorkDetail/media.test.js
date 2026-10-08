// Run: node --test src/pages/WorkDetail/media.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeEmbed, safeHref } from './media.js'

test('safeEmbed allows only https YouTube /embed/ and Vimeo player /video/', () => {
  for (const ok of [
    'https://www.youtube.com/embed/abc',
    'https://youtube.com/embed/abc',
    'https://www.youtube-nocookie.com/embed/abc',
    'https://youtube-nocookie.com/embed/abc',
    'https://player.vimeo.com/video/1',
  ]) assert.ok(safeEmbed(ok), ok)
  for (const bad of [
    'http://www.youtube.com/embed/abc',
    'https://www.youtube.com/watch?v=abc',
    'https://m.youtube.com/embed/abc',
    'https://vimeo.com/1',
    'https://www.vimeo.com/video/1',
    'https://player.vimeo.com/1',
    'https://youtube.com.evil.test/embed/x',
    'https://evilyoutube.com/embed/x',
    'https://evil.test/embed/?u=youtube.com',
    'javascript:alert(1)',
    'not a url',
    undefined,
  ]) assert.equal(safeEmbed(bad), null, String(bad))
})

test('safeHref blocks script, protocol relative and off origin URLs', () => {
  assert.equal(safeHref('/works/x'), '/works/x')
  assert.ok(safeHref('https://github.com/joseandreaslie'))
  assert.ok(safeHref('mailto:a@b.c'))
  for (const bad of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,x',
    '//evil.test',
    '/\\evil.test',
    '/\\/evil.test',
    '/\t/evil.test',
    '',
    null,
  ]) {
    assert.equal(safeHref(bad), null, JSON.stringify(bad))
  }
})
