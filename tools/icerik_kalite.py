"""6 Eylül içerik denetiminin saf, yeniden üretilebilir son düzeltme katmanı."""
from copy import deepcopy
import json
from pathlib import Path


def tablo_oku():
    with (Path(__file__).parent / 'icerik-kalite.json').open(encoding='utf-8') as f:
        tablo = json.load(f)
    if tablo.get('sema') != 1:
        raise ValueError('icerik-kalite.json: bilinmeyen şema')
    return tablo


def son_kart_duzeltmeleri(kelimeler, ornekler):
    # Yalnız denetimde onaylanan anahtarlar; diğer kaynakların önceliği korunur.
    for en in tablo_oku()['kelimeler']:
        if en not in kelimeler or en not in ornekler:
            raise ValueError('Kalite düzeltmesi kaynağı eksik: ' + en)
        kelimeler[en]['anlamlar'] = deepcopy(ornekler[en])


def son_obek_duzeltmeleri(obekler):
    # Lemma birleştirmesinden sonra: çekimli kaynak eski anlamı geri getiremez.
    for en, anlamlar in tablo_oku()['obekler'].items():
        if en not in obekler:
            raise ValueError('Kalite düzeltmesi öbeği eksik: ' + en)
        obekler[en]['anlamlar'] = deepcopy(anlamlar)


def ek_parti_turlerini_duzelt(kelimeler, partiler, turler):
    # Ana/PDF/modal kayıtlarının mevcut önceliğini değiştirmeden, daha geç
    # eklenen ek parti kayıtlarına da aynı manuel tür tablosunu uygular.
    for parti in partiler:
        for kayit in parti.get('kayitlar', []):
            en = kayit['e']
            if en in turler:
                kelimeler[en]['tip'] = turler[en]
