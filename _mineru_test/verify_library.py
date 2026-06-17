import json, re, sys, codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

with open('D:/FINAL AND FINAL/毕业最后了/AI Lex/_mineru_test/excel_export.json', 'r', encoding='utf-8') as f:
    excel = json.load(f)

with open('D:/FINAL AND FINAL/毕业最后了/AI Lex/src/lib/regulatory-library.ts', 'r', encoding='utf-8') as f:
    lib_content = f.read()

lib_titles_raw = re.findall(r'title:\s*"([^"]+)"', lib_content)
lib_full_titles = [t for t in lib_titles_raw if not t.startswith('[') and len(t) > 8]

print(f'Library: {len(lib_full_titles)} regulations')
excel_entries = excel['全量清单'][1:]
print(f'Excel: {len(excel_entries)} entries')

def norm(s):
    return s.replace('（','(').replace('）',')').replace(' ','').replace('\u3000','').replace('(','').replace(')','')

issues = []
matched = 0
for row in excel_entries:
    excel_title = row[1]
    norm_excel = norm(excel_title)
    
    found = False
    for lib_title in lib_full_titles:
        if norm_excel in norm(lib_title) or norm(lib_title) in norm_excel:
            found = True
            break
    if found:
        matched += 1
    else:
        issues.append(f'  [{row[0]}] NOT FOUND: {excel_title}')

print(f'\nMatched: {matched}/{len(excel_entries)}')

if issues:
    print(f'\nUNMATCHED ({len(issues)}):')
    for iss in issues:
        print(iss)
else:
    print('\nAll entries matched!')

appendix = [
    '消费者权益保护法',
    '广告法',
    '未成年人保护法',
]
extra = []
for lib_title in lib_full_titles:
    norm_lib = norm(lib_title)
    found = False
    for row in excel_entries:
        if norm_lib in norm(row[1]) or norm(row[1]) in norm_lib:
            found = True
            break
    if not found:
        is_app = any(a in lib_title for a in appendix)
        extra.append(f'  [{"附录" if is_app else "UNEXPECTED"}] {lib_title}')

if extra:
    print(f'\nExtra in library ({len(extra)}):')
    for e in extra:
        print(e)

# Write full report to file
with open('D:/FINAL AND FINAL/毕业最后了/AI Lex/_mineru_test/verify_report.json', 'w', encoding='utf-8') as f:
    json.dump({
        'library_count': len(lib_full_titles),
        'excel_count': len(excel_entries),
        'matched': matched,
        'unmatched': issues,
        'extra': extra
    }, f, ensure_ascii=False, indent=2)
print('\nReport saved to verify_report.json')
