/**
 * Biblioteca de placeholders semânticos (Pexels CDN) para evitar imagens quebradas.
 * Você pode trocar item a item depois pelos uploads reais.
 */
const IMAGE_BY_TOPIC: Record<string, string> = {
  "airplane wing sky travel":
    "https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "decorative table lamp interior":
    "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "wine cooler fridge":
    "https://images.pexels.com/photos/1407858/pexels-photo-1407858.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "electric grill barbecue":
    "https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "romantic dinner table":
    "https://images.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg?auto=compress&cs=tinysrgb&w=1200",
  "breakfast tray coffee croissant":
    "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "boat tour ocean":
    "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "hotel room bed":
    "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "tropical beach honeymoon":
    "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "honeymoon sunset beach":
    "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "luxury honeymoon resort":
    "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "bed bath linens towels":
    "https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "cookware pots pans set":
    "https://images.pexels.com/photos/6996086/pexels-photo-6996086.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "espresso coffee machine":
    "https://images.pexels.com/photos/2074122/pexels-photo-2074122.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "air fryer appliance kitchen":
    "https://images.pexels.com/photos/6996329/pexels-photo-6996329.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "stick vacuum cleaner home":
    "https://images.pexels.com/photos/4108714/pexels-photo-4108714.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "blender kitchen appliance":
    "https://images.pexels.com/photos/3669638/pexels-photo-3669638.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "wine glasses set":
    "https://images.pexels.com/photos/273508/pexels-photo-273508.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "dinnerware plate set":
    "https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "nightstand bedroom furniture":
    "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "home decor minimalist":
    "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "gift box wedding":
    "https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "fergabe-couple-story":
    "https://images.pexels.com/photos/2055229/pexels-photo-2055229.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "fergabe-hero-bg":
    "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600",
};

export function giftImageUrl(topic: string): string {
  return (
    IMAGE_BY_TOPIC[topic] ??
    "https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=1200"
  );
}
