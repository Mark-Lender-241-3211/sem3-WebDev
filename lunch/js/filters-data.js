const FILTERS_DATA = {
  soup: {
    gridId: 'soupsGrid',
    filterId: 'soupsFilters',
    filters: [
      { label: 'рыбный', kind: 'fish' },
      { label: 'мясной', kind: 'meat' },
      { label: 'вегетарианский', kind: 'veg' },
    ],
  },
  main_course: {
    gridId: 'mainsGrid',
    filterId: 'mainsFilters',
    filters: [
      { label: 'рыбное', kind: 'fish' },
      { label: 'мясное', kind: 'meat' },
      { label: 'вегетарианское', kind: 'veg' },
    ],
  },
  beverages: {
    gridId: 'beveragesGrid',
    filterId: 'beveragesFilters',
    filters: [
      { label: 'холодный', kind: 'cold' },
      { label: 'горячий', kind: 'hot' },
    ],
  },
  starters: {
    gridId: 'startersGrid',
    filterId: 'startersFilters',
    filters: [
      { label: 'рыбный', kind: 'fish' },
      { label: 'мясной', kind: 'meat' },
      { label: 'вегетарианский', kind: 'veg' },
    ],
  },
  desserts: {
    gridId: 'dessertsGrid',
    filterId: 'dessertsFilters',
    filters: [
      { label: 'маленькая порция', kind: 'small' },
      { label: 'средняя порция', kind: 'medium' },
      { label: 'большая порция', kind: 'large' },
    ],
  },
};

window.FILTERS_DATA = FILTERS_DATA;