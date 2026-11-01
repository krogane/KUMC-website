import campus from "../assets/campus-panorama.jpg";
import flight from "../assets/nf2026/flight.webp";
import treasures from "../assets/nf2026/treasures.webp";
import city from "../assets/nf2026/city.webp";
import cover from "../assets/nf2026/cover.webp";
import clockDesign from "../assets/nf2026/clock-design.webp";
import badgeDesign from "../assets/nf2026/badge-design.webp";
import online from "../assets/nf2026/online.webp";
import onsite from "../assets/nf2026/onsite.webp";
import drift from "../assets/nf2026/drift.webp";
import collaboration from "../assets/nf2026/collaboration.webp";

export const nfImages = {
  campus: { src: campus, alt: "Minecraftで再現した京都大学の時計台と周囲の建物", caption: "Minecraftで再現した京都大学" },
  flight: { src: flight, alt: "体験型ミニゲームで、時計台前をエリトラで滑空するプレイヤー", caption: "体験型ミニゲームのプレイ画面" },
  treasures: { src: treasures, alt: "体験型ミニゲームで、建物の屋上に置かれた青と金のお宝", caption: "屋上で見つけたお宝" },
  city: { src: city, alt: "KUMCメンバーがMinecraftで制作した、青空にそびえる高層ビル群", caption: "KUMCメンバーの建築作品" },
  cover: { src: cover, alt: "京大再現キャンパスと教育をテーマにした記事を紹介する会報誌KU匠 Vol.3の表紙", caption: "KU匠 Vol.3 表紙" },
  clockDesign: { src: clockDesign, alt: "京大の時計台とKUMCの文字をあしらったキーホルダーのデザイン", caption: "時計台キーホルダーのデザイン" },
  badgeDesign: { src: badgeDesign, alt: "KUMCの文字と「挑戦完了！ NF完全攻略」をあしらった缶バッジのデザイン", caption: "進捗バッジのデザイン" },
  onsite: { src: onsite, alt: "「家族と！友だちと！京大マイクラワールド」の文字と、体験会場・建築作品・会報誌を組み合わせたNF紹介画像", caption: "京大マイクラワールドのNF紹介画像" },
  online: { src: online, alt: "京大トレジャーラン、草原での戦闘、白い宮殿を組み合わせたオンライン企画の紹介画像", caption: "オンライン企画の紹介画像" },
  drift: { src: drift, alt: "Driftで、草原のプレイヤーが渦を巻く光のエフェクトを放つゲーム画面", caption: "Driftのプレイ画面" },
  collaboration: { src: collaboration, alt: "むっつんさんの「氷の浮島」。氷の木々と、空中に浮かぶ多面体や輪状の建築", caption: "むっつんさんコラボ展示「氷の浮島」" },
};
export type NfImageName = keyof typeof nfImages;
