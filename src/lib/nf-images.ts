import campus from "../assets/campus-panorama.jpg";
import flight from "../assets/nf2026/flight.webp";
import treasures from "../assets/nf2026/treasures.webp";
import city from "../assets/nf2026/city.webp";
import cover from "../assets/nf2026/cover.webp";
import clockDesign from "../assets/nf2026/clock-design.webp";
import badgeDesign from "../assets/nf2026/badge-design.webp";
import online from "../assets/nf2026/online.webp";

export const nfImages = {
  campus: { src: campus, alt: "Minecraftで再現した京都大学の時計台と周囲の建物", caption: "Minecraftで再現した京都大学" },
  flight: { src: flight, alt: "京大トレジャーランの配布版で、時計台前をエリトラで滑空するプレイヤー", caption: "京大トレジャーランのプレイ画面（配布版）" },
  treasures: { src: treasures, alt: "京大トレジャーランの配布版で、建物の屋上に置かれた青と金のお宝", caption: "屋上で見つけたお宝（配布版）" },
  city: { src: city, alt: "KUMCメンバーがMinecraftで制作した、青空にそびえる高層ビル群", caption: "KUMCメンバーの建築作品" },
  cover: { src: cover, alt: "京大再現キャンパスと教育をテーマにした記事を紹介する会報誌KU匠 Vol.3の表紙", caption: "KU匠 Vol.3 表紙" },
  clockDesign: { src: clockDesign, alt: "京大の時計台とKUMCの文字をあしらったグッズのデザイン", caption: "時計台のデザイン" },
  badgeDesign: { src: badgeDesign, alt: "KUMCの文字と「挑戦完了！ NF完全攻略」をあしらった缶バッジのデザイン", caption: "進捗バッジのデザイン" },
  online: { src: online, alt: "オンライン企画の紹介素材に収録された、草原で敵と戦うMinecraftのゲーム画面", caption: "オンライン企画の紹介画像" },
};
export type NfImageName = keyof typeof nfImages;
