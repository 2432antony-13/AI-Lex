const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractFeatures, generateComplianceReport } = require('../.test-build/compliance-engine.js');
const base = { productName: 'Prototype', description: 'A note-taking tool' };
test('missing, blank and unsupported deployment facts remain unknown', () => {
  for (const deploymentRegion of [undefined, '', '   ', 'not-a-region']) {
    assert.equal(extractFeatures({ ...base, deploymentRegion }).deploymentRegion, 'unknown');
  }
  assert.equal(extractFeatures({ ...base, description: '文章比较中国与海外市场' }).deploymentRegion, 'unknown');
});
test('explicit regions survive extraction without being replaced by China', () => {
  for (const deploymentRegion of ['cn', 'cn_and_hk', 'overseas', 'cross_border']) {
    assert.equal(extractFeatures({ ...base, deploymentRegion }).deploymentRegion, deploymentRegion);
  }
  assert.equal(extractFeatures({ ...base, deploymentRegion: '海外' }).deploymentRegion, 'overseas');
  assert.equal(extractFeatures({ ...base, deploymentRegion: '中国境内' }).deploymentRegion, 'cn');
});
test('zero matches cannot approve a product with missing jurisdiction', () => {
  const report = generateComplianceReport(base, []);
  assert.notEqual(report.conclusion, 'approved');
  assert.deepEqual(report.missingFacts, ['deploymentRegion']);
  assert.match(report.conclusionText, /部署区域缺失/);
  assert.deepEqual(generateComplianceReport({ ...base, deploymentRegion: 'cn' }, []).missingFacts, []);
});
