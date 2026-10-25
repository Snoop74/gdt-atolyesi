# GD&T Atölyesi

Genel toleranslardan ileri GD&T'ye kadar her konuyu kurcalayarak öğreten, ISO GPS tabanlı interaktif müfredat. Tarayıcıda çalışır, kurulum gerektirmez.

**Canlı:** https://snoop74.github.io/gdt-atolyesi/

## Müfredat

Her modül dört adımdan oluşur: **Sezgi → Kavram → Oyna → Sına**. İlerleme, XP ve yıldızlar tarayıcıda saklanır.

| Bölüm | Modül | İnteraktif araç | Durum |
|---|---|---|---|
| A · Temeller | 0 Neden tolerans? | Montaj simülatörü | ✅ |
| | 1 Boyutlandırma temelleri | Ölçü okuma oyunu | ✅ |
| | 2 Genel toleranslar (ISO 2768) | Muayene masası | ✅ |
| | 3 Geçmeler (ISO 286) | Geçme görselleştirici | ✅ |
| B · GD&T'ye geçiş | 4 ± sisteminin sınırları | Delik konumu muayenesi | ✅ |
| | 5 Tolerans çerçevesi (ISO 1101) | Çerçeve kurucu | ✅ |
| | 6 Datumlar (ISO 5459) | 3B serbestlik dedektifi | ✅ |
| C · Geometrik karakteristikler | 7 Form toleransları | Form laboratuvarı (minimum bölge) | ✅ |
| | 8 Yönelim toleransları | Komparatörlü ölçüm tezgâhı | ✅ |
| | 9 Konum toleransları | Delik deseni muayenesi | ✅ |
| | 10 Profil toleransları | Profil muayenesi (UZ, renk haritası) | ✅ |
| | 11 Salgı toleransları | Salgı tezgâhı | ✅ |
| D · İleri konular | 12–14 Malzeme gereklilikleri, tolerans zinciri, final | | yakında |

## Çalıştırma

Sayfa saf HTML/CSS/JS'dir, derleme adımı yoktur. Yerelde bir HTTP sunucusuyla açın:

```bash
python -m http.server 8765
```

Sonra http://localhost:8765 adresine gidin. Yazı tipleri ve Modül 6'daki 3B sahneler (three.js r128) CDN'den yüklenir.

## Yapı

- `index.html`: sayfa iskeleti
- `css/gdt.css`: açık/koyu tema, bütün stiller
- `js/core.js`: durum, XP, yönlendirme, modül çerçevesi, quiz ve ortak bileşenler
- `js/curriculum.js`, `js/glossary.js`, `js/main.js`: müfredat haritası, sözlük, ana sayfa
- `js/iso.js`: ISO 2768 ve ISO 286 tabloları
- `js/geo.js`: minimum bölge hesapları (doğrusallık, düzlemsellik, dairesellik) ve desen en iyi oturtma
- `js/scene3d.js`: three.js yardımcısı
- `js/mN.js`: her modülün içeriği (`js/sim0.js`: Modül 0 simülasyonu)

Sayısal örnekler eğitim amaçlıdır; tasarımda ilgili standardın güncel baskısına bakın.
