const {test}=require('node:test');
const assert=require('node:assert/strict');
const {resolveLocale,translate}=require('../.test-build/i18n/core.js');
test('validated URL preference takes priority, with storage and browser fallbacks',()=>{
 assert.equal(resolveLocale('zh-TW','en','zh-CN'),'zh-TW');
 assert.equal(resolveLocale('../../x','en','zh-CN'),'en');
 assert.equal(resolveLocale(null,null,'zh-HK'),'zh-TW');
 assert.equal(resolveLocale(null,null,'zh-CN'),'zh-CN');
 assert.equal(resolveLocale(null,null,'fr-FR'),'en');
});
test('UI translation preserves whitespace and unknown user text',()=>{
 assert.equal(translate('  合规分析\n','en'),'  Compliance analysis\n');
 assert.equal(translate('用户输入：我需要测试 abc/123','en'),'用户输入：我需要测试 abc/123');
 assert.equal(translate('合规分析','zh-TW'),'合規分析');
});
