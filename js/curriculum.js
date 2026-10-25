'use strict';
/* Curriculum map: sections and module metadata (ISO GPS based) */

GDT.SECTIONS = [
  { id: 'A', title: 'Temeller', sub: 'Ölçü, tolerans ve geçmeler' },
  { id: 'B', title: "GD&T'ye geçiş", sub: '± sisteminin sınırları, tolerans çerçevesi, datumlar' },
  { id: 'C', title: 'Geometrik karakteristikler', sub: 'Form, yönelim, konum, profil, salgı' },
  { id: 'D', title: 'İleri konular', sub: 'Malzeme gereklilikleri, tolerans zinciri, final projesi' },
];

GDT.curriculum = [
  {
    id: 0, section: 'A', title: 'Neden tolerans?', tool: 'Montaj simülatörü',
    lead: 'Hiçbir parça tam ölçüsünde üretilmez. Tolerans, ne kadar sapmanın kabul edildiğini söyleyen sözleşmedir.',
    goals: ['“Tam ölçü” diye bir şey olmadığını görmek', 'Süreç dağılımı ile tolerans ilişkisini kurmak', 'Toleransın maliyet ve fonksiyon dengesi olduğunu deneyerek öğrenmek'],
  },
  {
    id: 1, section: 'A', title: 'Boyutlandırma temelleri', tool: 'Ölçü okuma oyunu',
    lead: 'Nominal ölçü, sınır ölçüleri, sapmalar ve tolerans yazım biçimleri.',
    goals: ['Nominal, üst/alt sınır ölçüsü ve sapma kavramları', 'Çift yönlü, tek yönlü ve sınır ölçüsüyle yazım', 'Ölçülendirmenin temel kuralları (ISO 129-1)'],
  },
  {
    id: 2, section: 'A', title: 'Genel toleranslar (ISO 2768)', tool: 'Tolerans hesaplayıcı',
    lead: 'Resimde toleransı yazılmamış her ölçü yine de toleranslıdır: antet notu ne diyorsa o.',
    goals: ['ISO 2768-1 sınıfları: f, m, c, v', 'ISO 2768-2 geometrik genel toleranslar: H, K, L', 'Antet notunu okuma ve doğru sınıfı seçme'],
  },
  {
    id: 3, section: 'A', title: 'Geçmeler (ISO 286)', tool: 'Geçme görselleştirici',
    lead: 'Delik ve mil toleranslarının birlikte oluşturduğu boşluk ya da sıkılık.',
    goals: ['IT tolerans kaliteleri ve temel sapmalar', 'Delik tabanlı / mil tabanlı sistem', 'Boşluklu, geçiş ve sıkı geçme: H7/g6, H7/k6, H7/p6'],
  },
  {
    id: 4, section: 'B', title: '± sisteminin sınırları', tool: 'Delik konumu karşılaştırma',
    lead: 'Koordinat toleransları kare bölge üretir; fonksiyon ise çoğu zaman dairedir.',
    goals: ['Kare ve dairesel tolerans bölgesi (%57 fazla alan)', '± toleranslarının belirsizlikleri: hangi yüzeyden ölçülür?', 'GD&T neden gerekli?'],
  },
  {
    id: 5, section: 'B', title: 'Tolerans çerçevesi', tool: 'Sürükle-bırak çerçeve kurucu',
    lead: 'ISO 1101 tolerans çerçevesinin bölmeleri ve nasıl okunduğu.',
    goals: ['Sembol, tolerans değeri, Ø ve değiştiriciler', 'Datum referans bölmeleri ve sırası', 'Teorik tam ölçüler (TED)'],
  },
  {
    id: 6, section: 'B', title: 'Datumlar (ISO 5459)', tool: '3B datum sahnesi',
    lead: 'Ölçümün başladığı referans: parçayı uzayda nasıl kilitleriz?',
    goals: ['6 serbestlik derecesi', 'Birincil, ikincil, üçüncül datum ve datum sistemi', 'Datum hedefleri ve ortak datumlar (A-B)'],
  },
  {
    id: 7, section: 'C', title: 'Form toleransları', tool: 'Yüzey tarayıcı',
    lead: 'Datumsuz, yalnızca elemanın kendi şekli: doğrusallık, düzlemsellik, dairesellik, silindiriklik.',
    goals: ['Dört form karakteristiğinin tolerans bölgeleri', 'Minimum bölge (Chebyshev) değerlendirmesi', 'Form ile boyut toleransı ilişkisi'],
  },
  {
    id: 8, section: 'C', title: 'Yönelim toleransları', tool: 'Bölge döndürücü',
    lead: 'Bir datuma göre açı: paralellik, diklik, açısallık.',
    goals: ['Datuma bağlı tolerans bölgeleri', 'Yüzey ve eksen için yönelim', 'Yönelimin formu da sınırlaması'],
  },
  {
    id: 9, section: 'C', title: 'Konum toleransları', tool: 'Delik deseni muayenesi',
    lead: 'Teorik tam yerinden sapma: konum, eş eksenlilik, simetri.',
    goals: ['Konum toleransı ve TED ile birlikte kullanımı', 'Ölçülen koordinatlardan konum sapması hesabı', 'Eş eksenlilik ve simetri (ISO yorumu)'],
  },
  {
    id: 10, section: 'C', title: 'Profil toleransları', tool: 'Profil bandı',
    lead: 'Herhangi bir şeklin ideal profile göre bandı: çizgi ve yüzey profili.',
    goals: ['Datumlu ve datumsuz profil', 'Simetrik bant ve UZ ile kaydırılmış bant', 'Kalıp yüzeylerinde profil kullanımı'],
  },
  {
    id: 11, section: 'C', title: 'Salgı toleransları', tool: 'Komparatör simülasyonu',
    lead: 'Parça datum ekseni etrafında dönerken komparatörün gösterdiği toplam sapma.',
    goals: ['Dairesel salgı ve toplam salgı', 'Radyal ve eksenel salgı ölçümü', 'Salgının form, konum ve yönelimle ilişkisi'],
  },
  {
    id: 12, section: 'D', title: 'Malzeme gereklilikleri', tool: 'Bonus tolerans laboratuvarı',
    lead: 'ISO 2692: maksimum/minimum malzeme gereklilikleri, zarf ve bağımsızlık ilkesi.',
    goals: ['Bağımsızlık ilkesi (ISO 8015) ve Ⓔ zarf gerekliliği', 'Ⓜ / Ⓛ ile ek tolerans ve sanal boyut', 'Fonksiyonel mastar tasarımı'],
  },
  {
    id: 13, section: 'D', title: 'Tolerans zinciri', tool: 'Yığılım tezgâhı',
    lead: 'Parçaların toleransları montajda toplanır: en kötü durum, RSS ve Monte Carlo.',
    goals: ['Ölçü zinciri kurma', 'En kötü durum ve istatistiksel (RSS) yöntem', 'Monte Carlo simülasyonu ile montaj dağılımı'],
  },
  {
    id: 14, section: 'D', title: 'Final projesi', tool: 'Muayene görevi',
    lead: 'Gerçek bir teknik resmi baştan sona oku, ölçüm verisiyle her gerekliliği değerlendir.',
    goals: ['Bütün tolerans çerçevelerini okuma', 'Ölçüm raporundan kabul/ret kararı', 'Puanlı muayene raporu'],
  },
];
