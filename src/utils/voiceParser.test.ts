import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVoiceIntent,
  filterProducts,
  extractBudget,
  extractPriceLimit,
  extractPosition,
  extractQuantity,
  extractColor,
  extractProductTypeAndCategory,
  detectLanguage,
} from './voiceParser.ts';
import { SAMPLE_PRODUCTS } from '../data/products.ts';

test('1. "Show me black shoes" -> returns black shoes ONLY (no red, blue, or white shoes)', () => {
  const intent = parseVoiceIntent('Show me black shoes', SAMPLE_PRODUCTS);
  assert.equal(intent.intent, 'search');
  assert.equal(intent.parameters.requestedType, 'shoes');
  assert.equal(intent.parameters.requestedColor, 'black');

  const { matchingProducts, otherColorOptions } = filterProducts(SAMPLE_PRODUCTS, intent);
  assert.ok(matchingProducts.length >= 4, `Should find at least 4 black shoes, got ${matchingProducts.length}`);
  for (const p of matchingProducts) {
    assert.equal(p.productType, 'shoes', `Expected shoes, got ${p.productType} (${p.name})`);
    assert.equal(p.color, 'black', `Expected black color, got ${p.color} (${p.name})`);
    assert.ok(!p.name.toLowerCase().includes('red'), 'Black shoe query must never return red shoes');
    assert.ok(!p.name.toLowerCase().includes('blue'), 'Black shoe query must never return blue shoes');
    assert.ok(!p.name.toLowerCase().includes('white'), 'Black shoe query must never return white shoes');
  }
  // Other colors like red shoes should only appear in otherColorOptions
  assert.ok(otherColorOptions.length > 0, 'Should offer other colors in separate list');
  for (const p of otherColorOptions) {
    assert.notEqual(p.color, 'black', 'otherColorOptions must never contain black');
    assert.equal(p.productType, 'shoes', 'otherColorOptions should be shoes');
  }
});

test('2. "Mujhe blue kurti dikhao" -> returns blue kurtis ONLY (no black or red kurtis)', () => {
  const intent = parseVoiceIntent('Mujhe blue kurti dikhao', SAMPLE_PRODUCTS);
  assert.equal(intent.intent, 'search');
  assert.equal(intent.parameters.requestedType, 'kurti');
  assert.equal(intent.parameters.requestedColor, 'blue');

  const { matchingProducts } = filterProducts(SAMPLE_PRODUCTS, intent);
  assert.ok(matchingProducts.length >= 2, `Should find blue kurtis, got ${matchingProducts.length}`);
  for (const p of matchingProducts) {
    assert.equal(p.productType, 'kurti', `Expected kurti, got ${p.productType} (${p.name})`);
    assert.equal(p.color, 'blue', `Expected blue color, got ${p.color} (${p.name})`);
    assert.notEqual(p.color, 'black', 'Must not return black kurti for blue query');
    assert.notEqual(p.color, 'red', 'Must not return red kurti for blue query');
  }
});

test('3. "Red shoes under 1500" -> every result is red, is a shoe, and costs <= 1500', () => {
  const intent = parseVoiceIntent('Red shoes under 1500', SAMPLE_PRODUCTS);
  assert.equal(intent.intent, 'search');
  assert.equal(intent.parameters.requestedType, 'shoes');
  assert.equal(intent.parameters.requestedColor, 'red');
  assert.equal(intent.parameters.maxPrice, 1500);

  const { matchingProducts } = filterProducts(SAMPLE_PRODUCTS, intent);
  assert.ok(matchingProducts.length >= 2, `Expected at least 2 red shoes under 1500, got ${matchingProducts.length}`);
  for (const p of matchingProducts) {
    assert.equal(p.productType, 'shoes');
    assert.equal(p.color, 'red');
    assert.ok(p.price <= 1500, `Expected price <= 1500, got ${p.price}`);
  }
});

test('4. "Black kurti under 500" -> only qualifying products, or truthful empty state', () => {
  const intent = parseVoiceIntent('Black kurti under 500', SAMPLE_PRODUCTS);
  assert.equal(intent.parameters.requestedType, 'kurti');
  assert.equal(intent.parameters.requestedColor, 'black');
  assert.equal(intent.parameters.maxPrice, 500);

  const { matchingProducts, noMatchMessage } = filterProducts(SAMPLE_PRODUCTS, intent);
  // Black kurtis in catalogue start at 699, so none should match <= 500
  assert.equal(matchingProducts.length, 0);
  assert.ok(noMatchMessage && noMatchMessage.includes('500'), 'Truthful message with budget mentioned');
});

test('5. Colour/category with zero matches (e.g. pink shoes under 500) -> 0 unrelated items', () => {
  const intent = parseVoiceIntent('Show me pink shoes under 500', SAMPLE_PRODUCTS);
  const { matchingProducts, noMatchMessage } = filterProducts(SAMPLE_PRODUCTS, intent);
  assert.equal(matchingProducts.length, 0, 'Must NOT return unrelated products when no match exists');
  assert.ok(noMatchMessage && noMatchMessage.includes('pink'));
});

test('6. "Show me white sneakers" -> returns white sneakers/shoes ONLY', () => {
  const intent = parseVoiceIntent('Show me white sneakers', SAMPLE_PRODUCTS);
  assert.equal(intent.parameters.requestedType, 'shoes');
  assert.equal(intent.parameters.requestedColor, 'white');

  const { matchingProducts } = filterProducts(SAMPLE_PRODUCTS, intent);
  assert.ok(matchingProducts.length >= 2);
  for (const p of matchingProducts) {
    assert.equal(p.productType, 'shoes');
    assert.equal(p.color, 'white');
  }
});

test('7. Spoken actions: Sort by lowest price, Show more, Compare, Clear Cart', () => {
  // Sort lowest price
  const sortIntent = parseVoiceIntent('Sort by lowest price', SAMPLE_PRODUCTS);
  assert.equal(sortIntent.intent, 'sort_price_low');

  // Show more
  const showMoreIntent = parseVoiceIntent('Show more', SAMPLE_PRODUCTS);
  assert.equal(showMoreIntent.intent, 'show_more');

  // Compare
  const compareIntent = parseVoiceIntent('Compare the first two products', SAMPLE_PRODUCTS);
  assert.equal(compareIntent.intent, 'compare');

  // Clear Cart
  const clearIntent = parseVoiceIntent('Clear my cart', SAMPLE_PRODUCTS);
  assert.equal(clearIntent.intent, 'clear_cart');

  // Remove that item
  const removeIntent = parseVoiceIntent('Remove that item', SAMPLE_PRODUCTS);
  assert.equal(removeIntent.intent, 'remove_item');
});

test('8. Multilingual Marathi & Hinglish voice recognition', () => {
  // Marathi: "मला काळी कुर्ती दाखव"
  const mrKurti = parseVoiceIntent('मला काळी कुर्ती दाखव', SAMPLE_PRODUCTS);
  assert.equal(mrKurti.intent, 'search');
  assert.equal(mrKurti.parameters.requestedType, 'kurti');
  assert.equal(mrKurti.parameters.requestedColor, 'black');

  // Roman Marathi: "Mala 1000 rupayanchya aat black kurti dakhav"
  const mrKurtiBudget = parseVoiceIntent('Mala 1000 rupayanchya aat black kurti dakhav', SAMPLE_PRODUCTS);
  assert.equal(mrKurtiBudget.parameters.requestedType, 'kurti');
  assert.equal(mrKurtiBudget.parameters.requestedColor, 'black');
  assert.equal(mrKurtiBudget.parameters.maxPrice, 1000);

  // Position add: "दुसरा प्रॉडक्ट कार्टमध्ये टाक"
  const add2 = parseVoiceIntent('दुसरा प्रॉडक्ट कार्टमध्ये टाक', SAMPLE_PRODUCTS);
  assert.equal(add2.intent, 'add_to_cart');
  assert.equal(add2.parameters.position, 2);
});
