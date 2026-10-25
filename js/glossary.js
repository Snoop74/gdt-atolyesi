'use strict';
/* Glossary: ISO 1101 characteristics, modifiers and basic terms */

GDT.glossary = [
  // Form
  { group: 'Form', sym: 'straightness', name: 'Doğrusallık', en: 'Straightness', module: 7,
    def: 'Bir çizgi elemanının, aralığı tolerans değeri kadar olan iki paralel doğru (veya Ø ile bir silindir) arasında kalması.' },
  { group: 'Form', sym: 'flatness', name: 'Düzlemsellik', en: 'Flatness', module: 7,
    def: 'Yüzeyin, aralığı tolerans değeri kadar olan iki paralel düzlem arasında kalması. Datum kullanılmaz.' },
  { group: 'Form', sym: 'circularity', name: 'Dairesellik', en: 'Roundness', module: 7,
    def: 'Her kesitte profilin, yarıçap farkı tolerans değeri kadar olan iki eş merkezli daire arasında kalması.' },
  { group: 'Form', sym: 'cylindricity', name: 'Silindiriklik', en: 'Cylindricity', module: 7,
    def: 'Yüzeyin, yarıçap farkı tolerans değeri kadar olan iki eş eksenli silindir arasında kalması.' },
  // Orientation
  { group: 'Yönelim', sym: 'parallelism', name: 'Paralellik', en: 'Parallelism', module: 8,
    def: 'Elemanın, datuma paralel ve aralığı tolerans değeri kadar olan iki düzlem/doğru arasında kalması.' },
  { group: 'Yönelim', sym: 'perpendicularity', name: 'Diklik', en: 'Perpendicularity', module: 8,
    def: 'Elemanın, datuma dik ve aralığı tolerans değeri kadar olan bölge içinde kalması.' },
  { group: 'Yönelim', sym: 'angularity', name: 'Açısallık (eğiklik)', en: 'Angularity', module: 8,
    def: 'Elemanın, datuma göre teorik tam açıyla duran tolerans bölgesi içinde kalması.' },
  // Location
  { group: 'Konum', sym: 'position', name: 'Konum (pozisyon)', en: 'Position', module: 9,
    def: 'Elemanın, teorik tam ölçülerle (TED) tanımlanan ideal yerine göre tolerans bölgesi içinde kalması.' },
  { group: 'Konum', sym: 'coaxiality', name: 'Eş merkezlilik / eş eksenlilik', en: 'Concentricity / Coaxiality', module: 9,
    def: 'Merkez noktasının (eş merkezlilik) veya ekseninin (eş eksenlilik) datum ekseni etrafındaki Ø bölgede kalması.' },
  { group: 'Konum', sym: 'symmetry', name: 'Simetri', en: 'Symmetry', module: 9,
    def: 'Orta düzlemin, datum düzlemine göre simetrik iki paralel düzlem arasında kalması.' },
  // Runout
  { group: 'Salgı', sym: 'circularRunout', name: 'Dairesel salgı', en: 'Circular run-out', module: 11,
    def: 'Parça datum ekseni etrafında bir tur dönerken, her ölçüm konumunda komparatörün gösterdiği toplam sapma.' },
  { group: 'Salgı', sym: 'totalRunout', name: 'Toplam salgı', en: 'Total run-out', module: 11,
    def: 'Parça dönerken komparatör yüzey boyunca da gezdirilir; bütün yüzey için tek toplam sapma.' },
  // Profile
  { group: 'Profil', sym: 'lineProfile', name: 'Çizgi profili', en: 'Line profile', module: 10,
    def: 'Her kesitteki profil çizgisinin, ideal profile göre tolerans değeri genişliğinde bir bant içinde kalması.' },
  { group: 'Profil', sym: 'surfaceProfile', name: 'Yüzey profili', en: 'Surface profile', module: 10,
    def: 'Yüzeyin, ideal yüzeye göre tolerans değeri kalınlığında bir kabuk içinde kalması. Datumlu veya datumsuz.' },
  // Modifiers
  { group: 'Değiştiriciler', circled: 'M', name: 'Maksimum malzeme gerekliliği (MMR)', en: 'Maximum material requirement', module: 12,
    def: 'ISO 2692. Eleman maksimum malzeme boyutundan uzaklaştıkça ek tolerans kazanılır; montaj garantisi için.' },
  { group: 'Değiştiriciler', circled: 'L', name: 'Minimum malzeme gerekliliği (LMR)', en: 'Least material requirement', module: 12,
    def: 'ISO 2692. Minimum et kalınlığını korumak için; eleman minimum malzemeden uzaklaştıkça ek tolerans.' },
  { group: 'Değiştiriciler', circled: 'E', name: 'Zarf gerekliliği', en: 'Envelope requirement', module: 12,
    def: 'ISO 14405-1. Eleman, maksimum malzeme boyutundaki kusursuz formlu zarfı aşamaz.' },
  { group: 'Değiştiriciler', circled: 'P', name: 'İzdüşümlü tolerans bölgesi', en: 'Projected tolerance zone', module: 9,
    def: 'Tolerans bölgesi elemanın dışına, karşı parçanın içine uzatılır (ör. cıvata delikleri).' },
  { group: 'Değiştiriciler', circled: 'F', name: 'Serbest durum', en: 'Free state', module: 12,
    def: 'Esnek parçalarda gereklilik, parça bağlanmadan serbest haldeyken geçerlidir.' },
  { group: 'Değiştiriciler', text: 'CZ', name: 'Ortak bölge', en: 'Combined zone', module: 7,
    def: 'Birden çok eleman için ayrı ayrı değil, tek ortak tolerans bölgesi.' },
  { group: 'Değiştiriciler', text: 'UZ', name: 'Kaydırılmış bölge', en: 'Unequal / offset zone', module: 10,
    def: 'ISO 1101:2017. Profil bandı ideal profile göre belirtilen miktar kadar kaydırılır.' },
  { group: 'Değiştiriciler', text: '[30]', name: 'Teorik tam ölçü (TED)', en: 'Theoretically exact dimension', module: 5,
    def: 'Çerçeve içindeki ölçü. Kendi toleransı yoktur; ideal geometriyi tanımlar, sapmayı çerçevedeki tolerans sınırlar.' },
  // Basic terms
  { group: 'Temel terimler', text: 'Ø20', name: 'Nominal ölçü', en: 'Nominal size', module: 1,
    def: 'Sınır ölçülerinin sapmalarla tanımlandığı ideal ölçü. Parçanın gerçekte bu ölçüde olması beklenmez.' },
  { group: 'Temel terimler', text: '±', name: 'Tolerans', en: 'Tolerance', module: 0,
    def: 'Üst ve alt sınır ölçüsü arasındaki fark: izin verilen toplam değişim miktarı.' },
  { group: 'Temel terimler', text: 'IT7', name: 'IT tolerans kalitesi', en: 'Standard tolerance grade', module: 3,
    def: 'ISO 286. Nominal ölçü aralığına göre tolerans genişliği; küçük sayı = dar tolerans.' },
  { group: 'Temel terimler', text: 'm', name: 'Genel tolerans', en: 'General tolerance', module: 2,
    def: 'ISO 2768. Resimde ayrıca toleransı yazılmamış ölçüler için antetteki sınıf (f, m, c, v).' },
  { group: 'Temel terimler', text: 'A', name: 'Datum', en: 'Datum', module: 6,
    def: 'Tolerans bölgelerinin yerini ve yönünü belirleyen referans: düzlem, eksen veya nokta.' },
  { group: 'Temel terimler', text: 'σ', name: 'Süreç dağılımı', en: 'Process spread', module: 0,
    def: 'Aynı süreçte üretilen parçaların ölçülerinin yayılımı; genellikle normal dağılım ve standart sapma (σ) ile anlatılır.' },
];

GDT.glossaryIcon = (g, size = 26) => {
  if (g.sym) return GDT.sym(g.sym, size);
  if (g.circled) return GDT.circled(g.circled, size);
  return `<span class="gl-text mono">${g.text}</span>`;
};
