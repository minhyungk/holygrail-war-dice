"""목업 빌드: 실제 데이터 + 서술 시뮬레이터 대본 + 후유키 타일 이미지를 HTML 한 파일로 묶는다.
실행: python3 prototype/mockup/build.py  →  prototype/mockup/dist/fsn6-mockup.html
대사 JSON을 고치고 다시 실행하면 목업에 반영된다.
"""
import base64, json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SEED = '6'


def load(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return json.load(f)


def data_uri(p):
    with open(os.path.join(ROOT, p), 'rb') as f:
        return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()


def seal_uri(p):
    """영주 이미지: 128px로 줄이고, 소모된 획(검정)을 어두운 배경에서 보이도록 회색으로 바꾼다."""
    from PIL import Image
    import io
    im = Image.open(os.path.join(ROOT, p)).convert('RGBA').resize((128, 128), Image.LANCZOS)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a > 0 and r < 70 and g < 70 and b < 70:
                px[x, y] = (92, 84, 104, a)
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def font_uri(text):
    """Pretendard 가변 폰트를 페이지에 실제로 쓰인 글자만 남겨 woff로 줄인다 (OFL 1.1)."""
    from fontTools import subset
    import io
    opts = subset.Options(); opts.flavor = 'woff'; opts.layout_features = ['*']
    font = subset.load_font(os.path.join(ROOT, 'node_modules', 'pretendard', 'dist', 'public', 'variable', 'PretendardVariable.ttf'), opts)
    chars = set(text) | set(chr(c) for c in range(0x20, 0x7F)) | set('“”‘’…─·×→←▼')
    sub = subset.Subsetter(opts); sub.populate(text=''.join(chars)); sub.subset(font)
    buf = io.BytesIO(); subset.save_font(font, buf, opts)
    return 'data:font/woff;base64,' + base64.b64encode(buf.getvalue()).decode()


def main():
    # 1) 서술 시뮬레이터 대본 (시드 고정)
    tmp = tempfile.NamedTemporaryFile(suffix='.json', delete=False).name
    subprocess.run([sys.executable, os.path.join(ROOT, 'prototype/narrative-sim/narrate_demo.py'), SEED, '--export', tmp],
                   check=True, stdout=subprocess.DEVNULL)
    steps = json.load(open(tmp, encoding='utf-8'))
    os.unlink(tmp)

    # 2) 서번트 (소환 화면)
    order = ['sv_0002_artoria', 'sv_0017_cu_chulainn', 'sv_0011_emiya', 'sv_0023_medusa',
             'sv_0031_medea', 'sv_0039_kojiro', 'sv_0047_heracles']
    servants = []
    for sid in order:
        p = load(f'data/servants/{sid}/profile.json')
        sk = load(f'data/servants/{sid}/skills.json')['skills']
        dl = load(f'data/servants/{sid}/dialogue.json')['tags']
        servants.append({
            'id': sid, 'name': p['name_ko'], 'cls': p['class'], 'ranks': p['ranks'],
            'align': p['alignment_detail'], 'np': p['noble_phantasm'],
            'skills': [f"{s['name_ko']} {s['rank']}" if s['rank'] else s['name_ko'] for s in sk if s['kind'] != 'noble_phantasm'],
            'summon': ' '.join(dl['summon'][0]['text'].split()),
        })

    # 3) 낮 교류: 지형·호감도로 고르는 원본 줄 (목업 안에서 실제로 선택)
    art = load('data/servants/sv_0002_artoria/dialogue.json')['tags']
    nar = load('data/common/narrator.json')['tags']
    bond = {'lines': art['day_bond'], 'narr': nar['day_bond']}

    data = {'servants': servants, 'steps': steps, 'bond': bond, 'tiles': load('data/tiles.json')['tiles'], 'seed': int(SEED)}

    # 호감도 초기값: 레거시 성격별 값 (Q-111 확인). 알트리아 = royal 35
    data['affinity_init'] = 35

    tpl = open(os.path.join(HERE, 'src', 'mockup.html'), encoding='utf-8').read()
    out = tpl.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False))
    out = out.replace('__FONT__', font_uri(out))
    out = (out.replace('__MAP_DAY__', data_uri('public/assets/map/fuyuki_tile_day.jpeg'))
              .replace('__MAP_NIGHT__', data_uri('public/assets/map/fuyuki_tile_night.jpeg'))
              .replace('__SEAL3__', seal_uri('public/assets/seals/seal3.png'))
              .replace('__SEAL2__', seal_uri('public/assets/seals/seal2.png')))
    dst = os.path.join(HERE, 'dist', 'fsn6-mockup.html')
    open(dst, 'w', encoding='utf-8').write(out)
    print(f'built {dst} ({os.path.getsize(dst) // 1024} KB, {len(steps)} script steps)')


main()
