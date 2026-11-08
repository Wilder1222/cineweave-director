"""Lossless review view: suppress exact repeated lines and verified camera recompilations only."""
import json
import pathlib
import sys

root = pathlib.Path(__file__).parent / 'studio-current'
for ix in root.glob('*/index.json'):
    project = json.loads(ix.read_text(encoding='utf8'))
    if project.get('topic') not in sys.argv[1:]:
        continue
    for doc in project['documents']:
        if not doc['title'].endswith('20261031审阅版'):
            continue
        print('\nFILE', project['topic'], doc['file'], doc['title'])
        seen, cards = {}, {}
        for line_no, line in enumerate((ix.parent / doc['file']).read_text(encoding='utf8').splitlines(), 1):
            if not line:
                continue
            if line in seen:
                continue
            seen[line] = line_no
            if line.startswith('## '):
                cards = {}
            for key in ['入态：', '机位：', '摄影机：', '焦点：']:
                if line.startswith(key):
                    cards[key] = line[len(key):]
            if line.startswith('摄影：') and all(key in cards for key in ['机位：', '摄影机：', '焦点：']):
                scale, rest = cards['机位：'].split('；', 1)
                position, layout = rest.split('。', 1)
                expected = '摄影：' + scale + '，' + position + '；' + layout + cards['摄影机：'].split('理由：')[0] + '焦点：' + cards['焦点：']
                if line == expected:
                    print(f'{line_no}: [摄影复制句逐字等于已读本镜卡片的组合]')
                    continue
            print(f'{line_no}: {line}')
