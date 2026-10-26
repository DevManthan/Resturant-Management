// Seed mock data for Luxe Dine Owner BI Dashboard
// Faithfully matching PostgreSQL DB Schema: OWNER, MENU_ITEMS, DAILY_REPORTS, REVIEW, ORDERS, etc.

export const initialOwnerData = {
  OWNER_ID: 101,
  OWNER_NAME: "Vikramaditya Singhania",
  EMAIL_ID: "vikram@luxedine.in",
  PHONE_NO: "+91 98765 43210",
  RESTAURANT_NAME: "Luxe Dine & Gastropub",
  ADDRESS: "Level 4, High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013",
  GSTIN: "27AABCL1234F1Z9",
  CURRENCY: "₹",
  GST_RATE: 5, // 5% GST
  STATUS: "OPEN",
  OPEN_TIME: "12:00 PM",
  CLOSE_TIME: "11:30 PM",
};

export const initialMenuItems = [
  {
    MENU_ID: 1,
    ITEM_NAME: "Murgh Malai Kebab",
    CATEGORY: "Starters",
    PRICE: 480,
    COST_PRICE: 160,
    PREP_TIME: 15,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/7/73/Chicken_Tikka.jpg",
    IN_STOCK: true,
    DAILY_SALES: 58,
    DESCRIPTION: "Tender chicken morsels steeped in cream cheese, cardamom, and royal saffron, char-grilled in tandoor."
  },
  {
    MENU_ID: 2,
    ITEM_NAME: "Dahi Ke Kebab & Mint Chutney",
    CATEGORY: "Starters",
    PRICE: 380,
    COST_PRICE: 120,
    PREP_TIME: 12,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Shikampuri_Kabab.JPG",
    IN_STOCK: true,
    DAILY_SALES: 44,
    DESCRIPTION: "Crispy spiced hung curd and paneer patties infused with green cardamom, coriander root, and roasted cumin."
  },
  {
    MENU_ID: 3,
    ITEM_NAME: "Amritsari Crispy Fish Tikka",
    CATEGORY: "Starters",
    PRICE: 550,
    COST_PRICE: 190,
    PREP_TIME: 14,
    DISCOUNT: 5,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Tandoori_Fish_tikka.jpg",
    IN_STOCK: true,
    DAILY_SALES: 39,
    DESCRIPTION: "River sole fish fillets crusted with carom seeds (ajwain), Kashmiri deghi mirch, and lemon drizzle."
  },
  {
    MENU_ID: 4,
    ITEM_NAME: "Tandoori Malai Soya Chaap",
    CATEGORY: "Starters",
    PRICE: 360,
    COST_PRICE: 110,
    PREP_TIME: 15,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Soya_Chaap.JPG",
    IN_STOCK: false,
    DAILY_SALES: 18,
    DESCRIPTION: "Succulent soya chaap smoked over coals in rich cashew cream and aromatic spices."
  },
  {
    MENU_ID: 5,
    ITEM_NAME: "Slow-Simmered Dal Bukhara",
    CATEGORY: "Main Course",
    PRICE: 460,
    COST_PRICE: 120,
    PREP_TIME: 12,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Dal_Makhani.jpg",
    IN_STOCK: true,
    DAILY_SALES: 82,
    DESCRIPTION: "Overnight 18-hour slow-cooked black lentils with sun-ripened plum tomatoes, white churned butter, and fragrant fenugreek."
  },
  {
    MENU_ID: 6,
    ITEM_NAME: "Royal Paneer Lababdar",
    CATEGORY: "Main Course",
    PRICE: 490,
    COST_PRICE: 150,
    PREP_TIME: 18,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Paneer_Butter_Masala.jpg",
    IN_STOCK: true,
    DAILY_SALES: 65,
    DESCRIPTION: "Cottage cheese steeped in roasted tomato-onion gravy finished with grated khoya and ginger juliennes."
  },
  {
    MENU_ID: 7,
    ITEM_NAME: "Awadhi Dum Pukht Chicken Biryani",
    CATEGORY: "Main Course",
    PRICE: 620,
    COST_PRICE: 200,
    PREP_TIME: 25,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Chicken_biryani_02-06-2015_%28India%29.jpg",
    IN_STOCK: true,
    DAILY_SALES: 94,
    DESCRIPTION: "Long-grain aged basmati rice layered with tender country chicken, saffron milk, and fried onions sealed with dough."
  },
  {
    MENU_ID: 8,
    ITEM_NAME: "Slow-Braised Awadhi Nalli Nihari",
    CATEGORY: "Main Course",
    PRICE: 790,
    COST_PRICE: 270,
    PREP_TIME: 22,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/2/24/Nihari.JPG",
    IN_STOCK: true,
    DAILY_SALES: 46,
    DESCRIPTION: "Traditional 12-hour shank braised in 32 aromatic potli spices, rose petals, and bone marrow essence."
  },
  {
    MENU_ID: 9,
    ITEM_NAME: "Classic Old Delhi Butter Chicken",
    CATEGORY: "Main Course",
    PRICE: 580,
    COST_PRICE: 180,
    PREP_TIME: 20,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/4/40/Food_Indian_butter_chicken_%2852843424475%29.jpg",
    IN_STOCK: true,
    DAILY_SALES: 88,
    DESCRIPTION: "Tandoor-smoked pulled chicken in satin tomato velvet sauce with fenugreek and honey glaze."
  },
  {
    MENU_ID: 10,
    ITEM_NAME: "Tandoori Garlic Butter Naan Basket",
    CATEGORY: "Main Course",
    PRICE: 140,
    COST_PRICE: 35,
    PREP_TIME: 8,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Garlic_Naan_%285550511620%29.jpg",
    IN_STOCK: true,
    DAILY_SALES: 112,
    DESCRIPTION: "Flaky leavened clay-oven flatbread brushed with crushed roasted garlic, coriander, and desi ghee."
  },
  {
    MENU_ID: 11,
    ITEM_NAME: "Kesari Angoori Rasmalai",
    CATEGORY: "Desserts",
    PRICE: 260,
    COST_PRICE: 75,
    PREP_TIME: 8,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Ras-Malai.jpg",
    IN_STOCK: true,
    DAILY_SALES: 70,
    DESCRIPTION: "Delicate poached cottage cheese rounds soaked in saffron and cardamom clotted milk with Iranian pistachio slivers."
  },
  {
    MENU_ID: 12,
    ITEM_NAME: "Shahi Tukda with Rabri & Gold Vark",
    CATEGORY: "Desserts",
    PRICE: 310,
    COST_PRICE: 90,
    PREP_TIME: 10,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Shahi_Tukda_-_Dessert_of_India.jpg",
    IN_STOCK: true,
    DAILY_SALES: 52,
    DESCRIPTION: "Ghee-crisped brioche steeped in saffron syrup, layered with slow-reduced thick rabri and 24K edible gold leaf."
  },
  {
    MENU_ID: 13,
    ITEM_NAME: "Warm Gulab Jamun with Malai Kulfi",
    CATEGORY: "Desserts",
    PRICE: 240,
    COST_PRICE: 65,
    PREP_TIME: 6,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/5/56/Gulab_Jamun.jpg",
    IN_STOCK: true,
    DAILY_SALES: 61,
    DESCRIPTION: "Caramelized reduced milk dumplings soaked in rose syrup, paired with artisanal malai kulfi."
  },
  {
    MENU_ID: 14,
    ITEM_NAME: "Alphonso Mango Saffron Lassi",
    CATEGORY: "Beverages",
    PRICE: 220,
    COST_PRICE: 60,
    PREP_TIME: 5,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Mango_Lassi_.jpg",
    IN_STOCK: true,
    DAILY_SALES: 95,
    DESCRIPTION: "Thick churned creamy yogurt blended with Ratnagiri Alphonso mango pulp, Kashmiri saffron, and crushed green pistachios."
  },
  {
    MENU_ID: 15,
    ITEM_NAME: "Kolkata Spiced Kulhad Chai",
    CATEGORY: "Beverages",
    PRICE: 120,
    COST_PRICE: 25,
    PREP_TIME: 8,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/0/04/Masala_Chai.JPG",
    IN_STOCK: true,
    DAILY_SALES: 120,
    DESCRIPTION: "Assam CTC black tea brewed with fresh ginger, crushed green cardamom, cinnamon, and whole buffalo milk in a clay kulhad."
  },
  {
    MENU_ID: 16,
    ITEM_NAME: "Kokum & Cumin Shikanji Spritzer",
    CATEGORY: "Beverages",
    PRICE: 180,
    COST_PRICE: 40,
    PREP_TIME: 5,
    DISCOUNT: 0,
    IMAGEURL: "https://upload.wikimedia.org/wikipedia/commons/8/82/Shikanji-_served_with_pomegranate%2Cgrated_apple_and_mint.jpg",
    IN_STOCK: true,
    DAILY_SALES: 64,
    DESCRIPTION: "Coastal Konkan kokum fruit nectar infused with roasted black cumin, mint sprig, black salt, and chilled soda."
  }
];

export const initialDailyReports = [];

export const initialReviews = [];

// 7-day x 12 hourly intervals revenue heatmap matrix (starts clean at zero)
export const revenueHeatmapMatrix = [
  { day: "Mon", hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { day: "Tue", hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { day: "Wed", hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { day: "Thu", hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { day: "Fri", hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { day: "Sat", hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { day: "Sun", hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

export const heatmapTimeSlots = [
  "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
  "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
];

// Clean floorplan status (all tables available and ready)
export const initialFloorplanStatus = [
  { tableId: 101, seats: 2, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 102, seats: 4, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 103, seats: 4, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 104, seats: 6, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 105, seats: 2, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 106, seats: 4, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 107, seats: 8, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 108, seats: 2, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 109, seats: 4, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 110, seats: 6, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 111, seats: 2, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
  { tableId: 112, seats: 4, status: "AVAILABLE", guests: 0, billTotal: 0, durationMin: 0 },
];
