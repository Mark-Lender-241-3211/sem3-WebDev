const DISHES = [
  // СУПЫ
  {
    keyword: 'norwegian_soup',
    name: 'Норвежский суп',
    price: 270,
    category: 'soup',
    count: '330 г',
    image: 'soups/norwegian_soup',
    kind: 'fish'
  },
  {
    keyword: 'fish_chowder',
    name: 'Рыбный чоудер',
    price: 290,
    category: 'soup',
    count: '340 г',
    image: 'soups/fish_chowder',
    kind: 'fish'
  },
  {
    keyword: 'borscht',
    name: 'Борщ',
    price: 220,
    category: 'soup',
    count: '300 г',
    image: 'soups/borscht',
    kind: 'meat'
  },
  {
    keyword: 'goulash_soup',
    name: 'Гуляш-суп',
    price: 250,
    category: 'soup',
    count: '320 г',
    image: 'soups/goulash_soup',
    kind: 'meat'
  },
  {
    keyword: 'mushroom_soup',
    name: 'Грибной крем-суп',
    price: 190,
    category: 'soup',
    count: '280 г',
    image: 'soups/mushroom_soup',
    kind: 'veg'
  },
  {
    keyword: 'gazpacho',
    name: 'Гаспачо',
    price: 180,
    category: 'soup',
    count: '290 г',
    image: 'soups/gazpacho',
    kind: 'veg'
  },

  // ГЛАВНЫЕ БЛЮДА
  {
    keyword: 'salmon_steak',
    name: 'Стейк из лосося',
    price: 420,
    category: 'main_course',
    count: '260 г',
    image: 'main_course/salmon_steak',
    kind: 'fish'
  },
  {
    keyword: 'trout_with_veg',
    name: 'Форель с овощами',
    price: 390,
    category: 'main_course',
    count: '290 г',
    image: 'main_course/trout_with_veg',
    kind: 'fish'
  },
  {
    keyword: 'lasagna',
    name: 'Лазанья',
    price: 385,
    category: 'main_course',
    count: '310 г',
    image: 'main_course/lasagna',
    kind: 'meat'
  },
  {
    keyword: 'chicken_cutlets',
    name: 'Котлеты из курицы с картофельным пюре',
    price: 225,
    category: 'main_course',
    count: '280 г',
    image: 'main_course/chickencutletsandmashedpotatoes',
    kind: 'meat'
  },
  {
    keyword: 'fried_potatoes',
    name: 'Жареная картошка с грибами',
    price: 150,
    category: 'main_course',
    count: '250 г',
    image: 'main_course/friedpotatoeswithmushrooms1',
    kind: 'veg'
  },
  {
    keyword: 'vegetable_stew',
    name: 'Овощное рагу',
    price: 190,
    category: 'main_course',
    count: '270 г',
    image: 'main_course/vegetable_stew',
    kind: 'veg'
  },

  // НАПИТКИ
  {
    keyword: 'orange_juice',
    name: 'Апельсиновый сок',
    price: 120,
    category: 'beverages',
    count: '300 мл',
    image: 'beverages/orangejuice',
    kind: 'cold'
  },
  {
    keyword: 'apple_juice',
    name: 'Яблочный сок',
    price: 90,
    category: 'beverages',
    count: '300 мл',
    image: 'beverages/applejuice',
    kind: 'cold'
  },
  {
    keyword: 'carrot_juice',
    name: 'Морковный сок',
    price: 110,
    category: 'beverages',
    count: '300 мл',
    image: 'beverages/carrotjuice',
    kind: 'cold'
  },
  {
    keyword: 'green_tea',
    name: 'Зелёный чай',
    price: 80,
    category: 'beverages',
    count: '250 мл',
    image: 'beverages/green_tea',
    kind: 'hot'
  },
  {
    keyword: 'black_coffee',
    name: 'Чёрный кофе',
    price: 130,
    category: 'beverages',
    count: '200 мл',
    image: 'beverages/black_coffee',
    kind: 'hot'
  },
  {
    keyword: 'hot_chocolate',
    name: 'Горячий шоколад',
    price: 150,
    category: 'beverages',
    count: '250 мл',
    image: 'beverages/hot_chocolate',
    kind: 'hot'
  },

  // САЛАТЫ / СТАРТЕРЫ
  {
    keyword: 'caesar_salad',
    name: 'Цезарь с курицей',
    price: 240,
    category: 'starters',
    count: '220 г',
    image: 'starters/caesar_salad',
    kind: 'meat'
  },
  {
    keyword: 'greek_salad',
    name: 'Греческий салат',
    price: 210,
    category: 'starters',
    count: '230 г',
    image: 'starters/greek_salad',
    kind: 'veg'
  },
  {
    keyword: 'bruschetta',
    name: 'Брускетта с томатами',
    price: 180,
    category: 'starters',
    count: '190 г',
    image: 'starters/bruschetta',
    kind: 'veg'
  },
  {
    keyword: 'vegetarian_sushi',
    name: 'Вегетарианские суши',
    price: 280,
    category: 'starters',
    count: '180 г',
    image: 'starters/vegetarian_sushi',
    kind: 'veg'
  },
  {
    keyword: 'salad_saira',
    name: 'Салат с Сайрой',
    price: 190,
    category: 'starters',
    count: '160 г',
    image: 'starters/salad_saira',
    kind: 'fish'
  },
  {
    keyword: 'hummus_with_pita',
    name: 'Хумус с питой',
    price: 170,
    category: 'starters',
    count: '200 г',
    image: 'starters/hummus_with_pita',
    kind: 'veg'
  },

  // ДЕСЕРТЫ
  {
    keyword: 'chocolate_mousse',
    name: 'Шоколадный мусс',
    price: 170,
    category: 'desserts',
    count: '120 г',
    image: 'desserts/chocolate_mousse',
    kind: 'small'
  },
  {
    keyword: 'panna_cotta',
    name: 'Панна-котта',
    price: 160,
    category: 'desserts',
    count: '130 г',
    image: 'desserts/panna_cotta',
    kind: 'small'
  },
  {
    keyword: 'mini_cheesecake',
    name: 'Мини-чизкейк',
    price: 150,
    category: 'desserts',
    count: '100 г',
    image: 'desserts/mini_cheesecake',
    kind: 'small'
  },
  {
    keyword: 'cheesecake',
    name: 'Нью-Йорк чизкейк',
    price: 220,
    category: 'desserts',
    count: '180 г',
    image: 'desserts/cheesecake',
    kind: 'medium'
  },
  {
    keyword: 'tiramisu',
    name: 'Тирамису',
    price: 200,
    category: 'desserts',
    count: '150 г',
    image: 'desserts/tiramisu',
    kind: 'medium'
  },
  {
    keyword: 'apple_pie',
    name: 'Яблочный пирог с мороженым',
    price: 260,
    category: 'desserts',
    count: '220 г',
    image: 'desserts/apple_pie',
    kind: 'large'
  }
];

window.DISHES = DISHES;