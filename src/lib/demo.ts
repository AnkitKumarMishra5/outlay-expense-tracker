// Sample data for the public landing page. Never touches the database.
import type { CardRow } from "./types";

export const DEMO_CARDS: CardRow[] = [
  {
    "id": "demo-0",
    "bank_id": "hdfc",
    "bank_name": "HDFC Bank",
    "card_label": "Infinia",
    "last4": "6401",
    "first4": "4532",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-1",
    "bank_id": "axis",
    "bank_name": "Axis Bank",
    "card_label": "Atlas",
    "last4": "3096",
    "first4": "4147",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-2",
    "bank_id": "icici",
    "bank_name": "ICICI Bank",
    "card_label": "Amazon Pay",
    "last4": "3317",
    "first4": "4315",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-3",
    "bank_id": "amex",
    "bank_name": "American Express",
    "card_label": "Platinum Travel",
    "last4": "9001",
    "first4": "3763",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-4",
    "bank_id": "hdfc",
    "bank_name": "HDFC Bank",
    "card_label": "Regalia Gold",
    "last4": "8842",
    "first4": "4532",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-5",
    "bank_id": "axis",
    "bank_name": "Axis Bank",
    "card_label": "Magnus",
    "last4": "7712",
    "first4": "5241",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-6",
    "bank_id": "sbi",
    "bank_name": "SBI Card",
    "card_label": "Cashback",
    "last4": "1122",
    "first4": "4006",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-7",
    "bank_id": "axis",
    "bank_name": "Axis Bank",
    "card_label": "Flipkart Axis",
    "last4": "5518",
    "first4": "4363",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-8",
    "bank_id": "idfc",
    "bank_name": "IDFC FIRST",
    "card_label": "Wealth",
    "last4": "4409",
    "first4": "4890",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-9",
    "bank_id": "kotak",
    "bank_name": "Kotak Mahindra",
    "card_label": "League",
    "last4": "5566",
    "first4": "5334",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-10",
    "bank_id": "yes",
    "bank_name": "YES Bank",
    "card_label": "Marquee",
    "last4": "2288",
    "first4": "4147",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-11",
    "bank_id": "indusind",
    "bank_name": "IndusInd Bank",
    "card_label": "Pioneer",
    "last4": "6135",
    "first4": "3562",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-12",
    "bank_id": "rbl",
    "bank_name": "RBL Bank",
    "card_label": "World Safari",
    "last4": "7024",
    "first4": "5218",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-13",
    "bank_id": "sc",
    "bank_name": "Standard Chartered",
    "card_label": "Ultimate",
    "last4": "9470",
    "first4": "4571",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-14",
    "bank_id": "au",
    "bank_name": "AU Small Finance",
    "card_label": "Zenith",
    "last4": "8153",
    "first4": "4890",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-15",
    "bank_id": "federal",
    "bank_name": "Federal Bank",
    "card_label": "Scapia",
    "last4": "2760",
    "first4": "5305",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-16",
    "bank_id": "onecard",
    "bank_name": "OneCard (FPL)",
    "card_label": "OneCard Metal",
    "last4": "4832",
    "first4": "4111",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-17",
    "bank_id": "bobcard",
    "bank_name": "BOBCARD",
    "card_label": "Eterna",
    "last4": "6690",
    "first4": "5241",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "demo-18",
    "bank_id": "hsbc",
    "bank_name": "HSBC",
    "card_label": "Live+",
    "last4": "1974",
    "first4": "4659",
    "has_password": 1,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
];

export interface DemoTxn {
  card: number;
  date: string;
  desc: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
}

export const DEMO_TXNS: DemoTxn[] = [{"card":9,"date":"2026-06-01","desc":"BLINKIT GROCERY","amount":797.02,"type":"debit","category":"Groceries"},{"card":5,"date":"2026-06-02","desc":"BOOKMYSHOW","amount":865.12,"type":"debit","category":"Entertainment"},{"card":8,"date":"2026-06-02","desc":"APOLLO PHARMACY","amount":833.03,"type":"debit","category":"Health"},{"card":0,"date":"2026-06-03","desc":"ADOBE CREATIVE CLOUD","amount":4230.0,"type":"debit","category":"Utilities & Bills"},{"card":0,"date":"2026-06-03","desc":"ZOHO CORPORATION","amount":4645.22,"type":"debit","category":"Utilities & Bills"},{"card":18,"date":"2026-06-03","desc":"SPOTIFY INDIA","amount":147.17,"type":"debit","category":"Entertainment"},{"card":5,"date":"2026-06-04","desc":"ZOMATO ONLINE","amount":490.48,"type":"debit","category":"Food & Dining"},{"card":13,"date":"2026-06-04","desc":"BLINKIT GROCERY","amount":776.59,"type":"debit","category":"Groceries"},{"card":15,"date":"2026-06-04","desc":"SWIGGY BANGALORE","amount":1327.09,"type":"debit","category":"Food & Dining"},{"card":4,"date":"2026-06-05","desc":"MYNTRA DESIGNS","amount":1190.36,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-06-05","desc":"SMOKE HOUSE DELI","amount":1924.68,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-06-05","desc":"ACT FIBERNET","amount":1199.0,"type":"debit","category":"Utilities & Bills"},{"card":7,"date":"2026-06-06","desc":"SWIGGY INSTAMART","amount":718.03,"type":"debit","category":"Groceries"},{"card":5,"date":"2026-06-07","desc":"TOIT BREWPUB","amount":1828.75,"type":"debit","category":"Food & Dining"},{"card":2,"date":"2026-06-08","desc":"AMAZON PRIME VIDEO","amount":299.0,"type":"debit","category":"Entertainment"},{"card":3,"date":"2026-06-09","desc":"INDIGO AIRLINES","amount":3263.12,"type":"debit","category":"Travel"},{"card":6,"date":"2026-06-09","desc":"SWIGGY BANGALORE","amount":328.6,"type":"debit","category":"Food & Dining"},{"card":12,"date":"2026-06-09","desc":"IRCTC RAIL CONNECT","amount":1637.93,"type":"debit","category":"Travel"},{"card":18,"date":"2026-06-09","desc":"APOLLO PHARMACY","amount":371.5,"type":"debit","category":"Health"},{"card":2,"date":"2026-06-10","desc":"AJIO LIFESTYLE","amount":2898.49,"type":"debit","category":"Shopping"},{"card":13,"date":"2026-06-10","desc":"APOLLO PHARMACY","amount":689.13,"type":"debit","category":"Health"},{"card":1,"date":"2026-06-11","desc":"CULT FIT BANGALORE","amount":1499.0,"type":"debit","category":"Health"},{"card":1,"date":"2026-06-11","desc":"BARBEQUE NATION","amount":4046.17,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-06-11","desc":"JIO FIBER BROADBAND","amount":699.64,"type":"debit","category":"Utilities & Bills"},{"card":14,"date":"2026-06-11","desc":"RELIANCE SMART BAZAAR","amount":581.86,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-06-12","desc":"RELIANCE SMART BAZAAR","amount":667.02,"type":"debit","category":"Groceries"},{"card":1,"date":"2026-06-13","desc":"IRCTC RAIL CONNECT","amount":1146.42,"type":"debit","category":"Travel"},{"card":17,"date":"2026-06-13","desc":"SWIGGY BANGALORE","amount":226.73,"type":"debit","category":"Food & Dining"},{"card":0,"date":"2026-06-14","desc":"NETFLIX INDIA","amount":649.0,"type":"debit","category":"Entertainment"},{"card":1,"date":"2026-06-15","desc":"IRCTC RAIL CONNECT","amount":2512.32,"type":"debit","category":"Travel"},{"card":2,"date":"2026-06-15","desc":"BOAT LIFESTYLE","amount":1198.75,"type":"debit","category":"Shopping"},{"card":4,"date":"2026-06-15","desc":"NETFLIX INDIA","amount":441.64,"type":"debit","category":"Entertainment"},{"card":7,"date":"2026-06-15","desc":"BOAT LIFESTYLE","amount":2306.72,"type":"debit","category":"Shopping"},{"card":8,"date":"2026-06-15","desc":"ZOMATO ONLINE","amount":247.47,"type":"debit","category":"Food & Dining"},{"card":17,"date":"2026-06-15","desc":"NETFLIX INDIA","amount":341.7,"type":"debit","category":"Entertainment"},{"card":4,"date":"2026-06-16","desc":"TOIT BREWPUB","amount":1663.89,"type":"debit","category":"Food & Dining"},{"card":8,"date":"2026-06-16","desc":"NETFLIX INDIA","amount":406.6,"type":"debit","category":"Entertainment"},{"card":17,"date":"2026-06-16","desc":"BLINKIT GROCERY","amount":333.25,"type":"debit","category":"Groceries"},{"card":4,"date":"2026-06-17","desc":"SMOKE HOUSE DELI","amount":1237.45,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-06-18","desc":"SWIGGY BANGALORE","amount":674.63,"type":"debit","category":"Food & Dining"},{"card":9,"date":"2026-06-18","desc":"VI POSTPAID PLAN","amount":449.0,"type":"debit","category":"Utilities & Bills"},{"card":2,"date":"2026-06-19","desc":"FLIPKART INTERNET","amount":1326.63,"type":"debit","category":"Shopping"},{"card":8,"date":"2026-06-19","desc":"AMAZON RETAIL INDIA","amount":1106.72,"type":"debit","category":"Shopping"},{"card":16,"date":"2026-06-20","desc":"APOLLO PHARMACY","amount":177.05,"type":"debit","category":"Health"},{"card":2,"date":"2026-06-21","desc":"APOLLO PHARMACY","amount":684.05,"type":"debit","category":"Health"},{"card":4,"date":"2026-06-21","desc":"ZOMATO ONLINE","amount":816.69,"type":"debit","category":"Food & Dining"},{"card":5,"date":"2026-06-21","desc":"SPOTIFY INDIA","amount":119.0,"type":"debit","category":"Entertainment"},{"card":11,"date":"2026-06-22","desc":"PVR CINEMAS","amount":1034.38,"type":"debit","category":"Entertainment"},{"card":16,"date":"2026-06-22","desc":"BLINKIT GROCERY","amount":326.65,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-06-23","desc":"BLINKIT GROCERY","amount":694.19,"type":"debit","category":"Groceries"},{"card":14,"date":"2026-06-23","desc":"RELIANCE SMART BAZAAR","amount":1032.28,"type":"debit","category":"Groceries"},{"card":0,"date":"2026-06-24","desc":"APPLE INDIA ONLINE","amount":2058.23,"type":"debit","category":"Shopping"},{"card":4,"date":"2026-06-25","desc":"TOIT BREWPUB","amount":1725.04,"type":"debit","category":"Food & Dining"},{"card":3,"date":"2026-06-26","desc":"UBER INDIA","amount":607.09,"type":"debit","category":"Travel"},{"card":10,"date":"2026-06-26","desc":"TOIT BREWPUB","amount":1499.67,"type":"debit","category":"Food & Dining"},{"card":11,"date":"2026-06-27","desc":"BOOKMYSHOW","amount":1240.55,"type":"debit","category":"Entertainment"},{"card":16,"date":"2026-06-28","desc":"AIRTEL POSTPAID","amount":569.87,"type":"debit","category":"Utilities & Bills"},{"card":2,"date":"2026-06-29","desc":"FLIPKART INTERNET","amount":1114.41,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-06-29","desc":"ZOMATO ONLINE","amount":1143.53,"type":"debit","category":"Food & Dining"},{"card":10,"date":"2026-06-29","desc":"SMOKE HOUSE DELI","amount":1319.56,"type":"debit","category":"Food & Dining"},{"card":18,"date":"2026-06-29","desc":"BLINKIT GROCERY","amount":377.74,"type":"debit","category":"Groceries"},{"card":3,"date":"2026-06-30","desc":"INDIGO AIRLINES","amount":3365.74,"type":"debit","category":"Travel"},{"card":6,"date":"2026-06-30","desc":"SWIGGY BANGALORE","amount":984.97,"type":"debit","category":"Food & Dining"},{"card":7,"date":"2026-06-30","desc":"NYKAA FASHION","amount":927.86,"type":"debit","category":"Shopping"},{"card":8,"date":"2026-06-30","desc":"MORE SUPERMARKET","amount":776.23,"type":"debit","category":"Groceries"},{"card":13,"date":"2026-06-30","desc":"BLINKIT GROCERY","amount":460.2,"type":"debit","category":"Groceries"},{"card":6,"date":"2026-07-01","desc":"MORE SUPERMARKET","amount":610.81,"type":"debit","category":"Groceries"},{"card":11,"date":"2026-07-01","desc":"ZOMATO ONLINE","amount":961.64,"type":"debit","category":"Food & Dining"},{"card":13,"date":"2026-07-01","desc":"JIO FIBER BROADBAND","amount":798.56,"type":"debit","category":"Utilities & Bills"},{"card":15,"date":"2026-07-01","desc":"DUTY FREE MUMBAI","amount":1423.91,"type":"debit","category":"Shopping"},{"card":17,"date":"2026-07-01","desc":"SPOTIFY INDIA","amount":111.76,"type":"debit","category":"Entertainment"},{"card":0,"date":"2026-07-03","desc":"ADOBE CREATIVE CLOUD","amount":4230.0,"type":"debit","category":"Utilities & Bills"},{"card":2,"date":"2026-07-03","desc":"BOAT LIFESTYLE","amount":2668.45,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-07-04","desc":"TOIT BREWPUB","amount":1697.41,"type":"debit","category":"Food & Dining"},{"card":1,"date":"2026-07-05","desc":"BARBEQUE NATION","amount":2974.02,"type":"debit","category":"Food & Dining"},{"card":1,"date":"2026-07-05","desc":"DUTY FREE MUMBAI","amount":2347.57,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-07-05","desc":"MYNTRA DESIGNS","amount":884.0,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-07-05","desc":"ACT FIBERNET","amount":1199.0,"type":"debit","category":"Utilities & Bills"},{"card":6,"date":"2026-07-05","desc":"ZOMATO ONLINE","amount":362.25,"type":"debit","category":"Food & Dining"},{"card":18,"date":"2026-07-06","desc":"SPOTIFY INDIA","amount":115.73,"type":"debit","category":"Entertainment"},{"card":0,"date":"2026-07-07","desc":"ANNUAL MEMBERSHIP FEE","amount":12500.0,"type":"debit","category":"Fees & Charges"},{"card":2,"date":"2026-07-07","desc":"BOAT LIFESTYLE","amount":1702.05,"type":"debit","category":"Shopping"},{"card":7,"date":"2026-07-07","desc":"SWIGGY INSTAMART","amount":1061.47,"type":"debit","category":"Groceries"},{"card":8,"date":"2026-07-07","desc":"RELIANCE SMART BAZAAR","amount":1246.42,"type":"debit","category":"Groceries"},{"card":12,"date":"2026-07-07","desc":"DUTY FREE MUMBAI","amount":2070.54,"type":"debit","category":"Shopping"},{"card":2,"date":"2026-07-08","desc":"AMAZON PRIME VIDEO","amount":299.0,"type":"debit","category":"Entertainment"},{"card":8,"date":"2026-07-08","desc":"APOLLO PHARMACY","amount":486.47,"type":"debit","category":"Health"},{"card":18,"date":"2026-07-08","desc":"PAYMENT RECEIVED, THANK YOU","amount":864.97,"type":"credit","category":"Payments & Refunds"},{"card":10,"date":"2026-07-09","desc":"PAYMENT RECEIVED, THANK YOU","amount":2819.23,"type":"credit","category":"Payments & Refunds"},{"card":4,"date":"2026-07-10","desc":"SHELL PETROLEUM","amount":1450.49,"type":"debit","category":"Fuel"},{"card":1,"date":"2026-07-11","desc":"CULT FIT BANGALORE","amount":1499.0,"type":"debit","category":"Health"},{"card":16,"date":"2026-07-11","desc":"SWIGGY BANGALORE","amount":222.86,"type":"debit","category":"Food & Dining"},{"card":18,"date":"2026-07-11","desc":"AIRTEL POSTPAID","amount":463.13,"type":"debit","category":"Utilities & Bills"},{"card":7,"date":"2026-07-12","desc":"AMAZON RETAIL INDIA","amount":2100.04,"type":"debit","category":"Shopping"},{"card":10,"date":"2026-07-12","desc":"NETFLIX INDIA","amount":601.34,"type":"debit","category":"Entertainment"},{"card":2,"date":"2026-07-13","desc":"MYNTRA DESIGNS","amount":1120.83,"type":"debit","category":"Shopping"},{"card":3,"date":"2026-07-13","desc":"HP PETROL PUMP","amount":1501.93,"type":"debit","category":"Fuel"},{"card":9,"date":"2026-07-13","desc":"APOLLO PHARMACY","amount":626.3,"type":"debit","category":"Health"},{"card":17,"date":"2026-07-13","desc":"NETFLIX INDIA","amount":341.01,"type":"debit","category":"Entertainment"},{"card":0,"date":"2026-07-14","desc":"NETFLIX INDIA","amount":649.0,"type":"debit","category":"Entertainment"},{"card":3,"date":"2026-07-14","desc":"AIR INDIA EXPRESS","amount":3532.38,"type":"debit","category":"Travel"},{"card":5,"date":"2026-07-14","desc":"ZOMATO ONLINE","amount":1625.02,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-07-14","desc":"APOLLO PHARMACY","amount":1026.4,"type":"debit","category":"Health"},{"card":13,"date":"2026-07-14","desc":"SWIGGY BANGALORE","amount":789.53,"type":"debit","category":"Food & Dining"},{"card":9,"date":"2026-07-15","desc":"APOLLO PHARMACY","amount":847.75,"type":"debit","category":"Health"},{"card":11,"date":"2026-07-15","desc":"BOOKMYSHOW","amount":864.42,"type":"debit","category":"Entertainment"},{"card":14,"date":"2026-07-15","desc":"APOLLO PHARMACY","amount":761.86,"type":"debit","category":"Health"},{"card":0,"date":"2026-07-16","desc":"PAYMENT RECEIVED, THANK YOU","amount":19437.23,"type":"credit","category":"Payments & Refunds"},{"card":3,"date":"2026-07-16","desc":"PAYMENT RECEIVED, THANK YOU","amount":7235.95,"type":"credit","category":"Payments & Refunds"},{"card":8,"date":"2026-07-16","desc":"PAYMENT RECEIVED, THANK YOU","amount":4269.91,"type":"credit","category":"Payments & Refunds"},{"card":9,"date":"2026-07-16","desc":"AIRTEL POSTPAID","amount":531.08,"type":"debit","category":"Utilities & Bills"},{"card":14,"date":"2026-07-16","desc":"AMAZON RETAIL INDIA","amount":605.6,"type":"debit","category":"Shopping"},{"card":18,"date":"2026-07-16","desc":"APOLLO PHARMACY","amount":306.5,"type":"debit","category":"Health"},{"card":4,"date":"2026-07-18","desc":"PAYMENT RECEIVED, THANK YOU","amount":7335.2,"type":"credit","category":"Payments & Refunds"},{"card":9,"date":"2026-07-18","desc":"VI POSTPAID PLAN","amount":449.0,"type":"debit","category":"Utilities & Bills"},{"card":1,"date":"2026-07-19","desc":"IRCTC RAIL CONNECT","amount":1927.6,"type":"debit","category":"Travel"},{"card":6,"date":"2026-07-19","desc":"BLINKIT GROCERY","amount":692.04,"type":"debit","category":"Groceries"},{"card":16,"date":"2026-07-19","desc":"BLINKIT GROCERY","amount":459.32,"type":"debit","category":"Groceries"},{"card":3,"date":"2026-07-20","desc":"HP PETROL PUMP","amount":1726.24,"type":"debit","category":"Fuel"},{"card":11,"date":"2026-07-20","desc":"PAYMENT RECEIVED, THANK YOU","amount":4100.99,"type":"credit","category":"Payments & Refunds"},{"card":2,"date":"2026-07-21","desc":"BIGBASKET DAILY","amount":1368.53,"type":"debit","category":"Groceries"},{"card":5,"date":"2026-07-21","desc":"SPOTIFY INDIA","amount":119.0,"type":"debit","category":"Entertainment"},{"card":5,"date":"2026-07-21","desc":"PAYMENT RECEIVED, THANK YOU","amount":4325.43,"type":"credit","category":"Payments & Refunds"},{"card":8,"date":"2026-07-21","desc":"SWIGGY BANGALORE","amount":606.84,"type":"debit","category":"Food & Dining"},{"card":9,"date":"2026-07-21","desc":"RELIANCE SMART BAZAAR","amount":613.18,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-07-21","desc":"PAYMENT RECEIVED, THANK YOU","amount":1769.49,"type":"credit","category":"Payments & Refunds"},{"card":0,"date":"2026-07-22","desc":"LINKEDIN PREMIUM","amount":1600.0,"type":"debit","category":"Utilities & Bills"},{"card":1,"date":"2026-07-22","desc":"BARBEQUE NATION","amount":2299.98,"type":"debit","category":"Food & Dining"},{"card":1,"date":"2026-07-22","desc":"PAYMENT RECEIVED, THANK YOU","amount":14525.5,"type":"credit","category":"Payments & Refunds"},{"card":8,"date":"2026-07-22","desc":"NETFLIX INDIA","amount":517.04,"type":"debit","category":"Entertainment"},{"card":13,"date":"2026-07-22","desc":"PAYMENT RECEIVED, THANK YOU","amount":1258.76,"type":"credit","category":"Payments & Refunds"},{"card":4,"date":"2026-07-23","desc":"BOOKMYSHOW","amount":351.21,"type":"debit","category":"Entertainment"},{"card":4,"date":"2026-07-23","desc":"NETFLIX INDIA","amount":604.98,"type":"debit","category":"Entertainment"},{"card":17,"date":"2026-07-24","desc":"AIRTEL POSTPAID","amount":453.01,"type":"debit","category":"Utilities & Bills"},{"card":8,"date":"2026-07-25","desc":"AIRTEL POSTPAID","amount":454.38,"type":"debit","category":"Utilities & Bills"},{"card":16,"date":"2026-07-25","desc":"NETFLIX INDIA","amount":346.44,"type":"debit","category":"Entertainment"},{"card":15,"date":"2026-07-27","desc":"PAYMENT RECEIVED, THANK YOU","amount":1423.91,"type":"credit","category":"Payments & Refunds"},{"card":17,"date":"2026-07-27","desc":"PAYMENT RECEIVED, THANK YOU","amount":452.77,"type":"credit","category":"Payments & Refunds"},{"card":5,"date":"2026-07-28","desc":"MYNTRA DESIGNS","amount":1008.12,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-07-29","desc":"MORE SUPERMARKET","amount":931.26,"type":"debit","category":"Groceries"},{"card":12,"date":"2026-07-29","desc":"PAYMENT RECEIVED, THANK YOU","amount":2070.54,"type":"credit","category":"Payments & Refunds"},{"card":14,"date":"2026-07-29","desc":"PAYMENT RECEIVED, THANK YOU","amount":2399.74,"type":"credit","category":"Payments & Refunds"},{"card":4,"date":"2026-07-30","desc":"PVR CINEMAS","amount":1878.99,"type":"debit","category":"Entertainment"},{"card":7,"date":"2026-07-30","desc":"SWIGGY INSTAMART","amount":1260.26,"type":"debit","category":"Groceries"},{"card":2,"date":"2026-07-31","desc":"AJIO LIFESTYLE","amount":829.93,"type":"debit","category":"Shopping"},{"card":4,"date":"2026-07-31","desc":"PVR CINEMAS","amount":1862.15,"type":"debit","category":"Entertainment"},{"card":10,"date":"2026-07-31","desc":"CULT FIT BANGALORE","amount":1734.51,"type":"debit","category":"Health"},{"card":2,"date":"2026-08-01","desc":"PAYMENT RECEIVED, THANK YOU","amount":8273.27,"type":"credit","category":"Payments & Refunds"},{"card":3,"date":"2026-08-01","desc":"MAKEMYTRIP INDIA","amount":4398.1,"type":"debit","category":"Travel"},{"card":4,"date":"2026-08-01","desc":"MYNTRA DESIGNS","amount":743.99,"type":"debit","category":"Shopping"},{"card":8,"date":"2026-08-01","desc":"AIRTEL POSTPAID","amount":470.34,"type":"debit","category":"Utilities & Bills"},{"card":8,"date":"2026-08-01","desc":"APOLLO PHARMACY","amount":1409.94,"type":"debit","category":"Health"},{"card":16,"date":"2026-08-02","desc":"SWIGGY BANGALORE","amount":457.39,"type":"debit","category":"Food & Dining"},{"card":18,"date":"2026-08-02","desc":"SPOTIFY INDIA","amount":111.63,"type":"debit","category":"Entertainment"},{"card":18,"date":"2026-08-02","desc":"REFUND AMAZON RETAIL INDIA","amount":1950.0,"type":"credit","category":"Payments & Refunds"},{"card":0,"date":"2026-08-03","desc":"ADOBE CREATIVE CLOUD","amount":4230.0,"type":"debit","category":"Utilities & Bills"},{"card":0,"date":"2026-08-03","desc":"APPLE INDIA ONLINE","amount":3886.41,"type":"debit","category":"Shopping"},{"card":2,"date":"2026-08-03","desc":"FLIPKART INTERNET","amount":1517.88,"type":"debit","category":"Shopping"},{"card":16,"date":"2026-08-03","desc":"PAYMENT RECEIVED, THANK YOU","amount":1598.49,"type":"credit","category":"Payments & Refunds"},{"card":5,"date":"2026-08-05","desc":"CULT FIT BANGALORE","amount":1693.29,"type":"debit","category":"Health"},{"card":5,"date":"2026-08-05","desc":"NETFLIX INDIA","amount":631.58,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-08-05","desc":"ACT FIBERNET","amount":1199.0,"type":"debit","category":"Utilities & Bills"},{"card":6,"date":"2026-08-05","desc":"ZOMATO ONLINE","amount":797.43,"type":"debit","category":"Food & Dining"},{"card":7,"date":"2026-08-05","desc":"FLIPKART INTERNET","amount":2539.31,"type":"debit","category":"Shopping"},{"card":1,"date":"2026-08-06","desc":"SWIGGY BANGALORE","amount":1488.0,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-08-06","desc":"PAYMENT RECEIVED, THANK YOU","amount":6019.0,"type":"credit","category":"Payments & Refunds"},{"card":7,"date":"2026-08-06","desc":"NYKAA FASHION","amount":848.32,"type":"debit","category":"Shopping"},{"card":7,"date":"2026-08-06","desc":"PAYMENT RECEIVED, THANK YOU","amount":4089.37,"type":"credit","category":"Payments & Refunds"},{"card":0,"date":"2026-08-07","desc":"ZOHO CORPORATION","amount":2675.13,"type":"debit","category":"Utilities & Bills"},{"card":12,"date":"2026-08-07","desc":"BARBEQUE NATION","amount":2048.49,"type":"debit","category":"Food & Dining"},{"card":13,"date":"2026-08-07","desc":"AMAZON RETAIL INDIA","amount":1153.1,"type":"debit","category":"Shopping"},{"card":14,"date":"2026-08-07","desc":"NETFLIX INDIA","amount":543.52,"type":"debit","category":"Entertainment"},{"card":1,"date":"2026-08-08","desc":"AIR INDIA EXPRESS","amount":4768.06,"type":"debit","category":"Travel"},{"card":2,"date":"2026-08-08","desc":"AMAZON PRIME VIDEO","amount":299.0,"type":"debit","category":"Entertainment"},{"card":2,"date":"2026-08-09","desc":"AMAZON PRIME VIDEO","amount":1232.64,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-08-09","desc":"AIRTEL POSTPAID","amount":690.46,"type":"debit","category":"Utilities & Bills"},{"card":10,"date":"2026-08-09","desc":"PAYMENT RECEIVED, THANK YOU","amount":2335.85,"type":"credit","category":"Payments & Refunds"},{"card":18,"date":"2026-08-09","desc":"SWIGGY BANGALORE","amount":183.5,"type":"debit","category":"Food & Dining"},{"card":4,"date":"2026-08-10","desc":"BOOKMYSHOW","amount":531.68,"type":"debit","category":"Entertainment"},{"card":1,"date":"2026-08-11","desc":"CULT FIT BANGALORE","amount":1499.0,"type":"debit","category":"Health"},{"card":1,"date":"2026-08-11","desc":"PAYMENT RECEIVED, THANK YOU","amount":7214.58,"type":"credit","category":"Payments & Refunds"},{"card":15,"date":"2026-08-11","desc":"IRCTC RAIL CONNECT","amount":1300.0,"type":"debit","category":"Travel"},{"card":17,"date":"2026-08-11","desc":"HP PETROL PUMP","amount":615.84,"type":"debit","category":"Fuel"},{"card":8,"date":"2026-08-13","desc":"SWIGGY BANGALORE","amount":748.84,"type":"debit","category":"Food & Dining"},{"card":8,"date":"2026-08-13","desc":"PAYMENT RECEIVED, THANK YOU","amount":3458.54,"type":"credit","category":"Payments & Refunds"},{"card":10,"date":"2026-08-13","desc":"BOOKMYSHOW","amount":493.74,"type":"debit","category":"Entertainment"},{"card":16,"date":"2026-08-13","desc":"APOLLO PHARMACY","amount":256.17,"type":"debit","category":"Health"},{"card":0,"date":"2026-08-14","desc":"NETFLIX INDIA","amount":649.0,"type":"debit","category":"Entertainment"},{"card":4,"date":"2026-08-14","desc":"ZOMATO ONLINE","amount":1199.24,"type":"debit","category":"Food & Dining"},{"card":10,"date":"2026-08-14","desc":"CULT FIT BANGALORE","amount":1882.66,"type":"debit","category":"Health"},{"card":1,"date":"2026-08-15","desc":"AIRBNB PAYMENTS","amount":2432.01,"type":"debit","category":"Travel"},{"card":3,"date":"2026-08-15","desc":"PAYMENT RECEIVED, THANK YOU","amount":11158.65,"type":"credit","category":"Payments & Refunds"},{"card":9,"date":"2026-08-15","desc":"NETFLIX INDIA","amount":604.3,"type":"debit","category":"Entertainment"},{"card":11,"date":"2026-08-16","desc":"DECATHLON SPORTS","amount":1044.2,"type":"debit","category":"Shopping"},{"card":8,"date":"2026-08-17","desc":"NETFLIX INDIA","amount":379.44,"type":"debit","category":"Entertainment"},{"card":8,"date":"2026-08-17","desc":"BLINKIT GROCERY","amount":299.57,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-08-17","desc":"PAYMENT RECEIVED, THANK YOU","amount":2441.01,"type":"credit","category":"Payments & Refunds"},{"card":3,"date":"2026-08-18","desc":"HP PETROL PUMP","amount":1341.5,"type":"debit","category":"Fuel"},{"card":9,"date":"2026-08-18","desc":"VI POSTPAID PLAN","amount":449.0,"type":"debit","category":"Utilities & Bills"},{"card":16,"date":"2026-08-20","desc":"SWIGGY BANGALORE","amount":205.54,"type":"debit","category":"Food & Dining"},{"card":0,"date":"2026-08-21","desc":"PAYMENT RECEIVED, THANK YOU","amount":13040.54,"type":"credit","category":"Payments & Refunds"},{"card":2,"date":"2026-08-21","desc":"AJIO LIFESTYLE","amount":1701.1,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-08-21","desc":"SPOTIFY INDIA","amount":119.0,"type":"debit","category":"Entertainment"},{"card":11,"date":"2026-08-22","desc":"CULT FIT BANGALORE","amount":1545.33,"type":"debit","category":"Health"},{"card":2,"date":"2026-08-23","desc":"NYKAA FASHION","amount":2245.5,"type":"debit","category":"Shopping"},{"card":13,"date":"2026-08-23","desc":"PAYMENT RECEIVED, THANK YOU","amount":1942.63,"type":"credit","category":"Payments & Refunds"},{"card":5,"date":"2026-08-24","desc":"SMOKE HOUSE DELI","amount":1269.75,"type":"debit","category":"Food & Dining"},{"card":5,"date":"2026-08-25","desc":"PVR CINEMAS","amount":1398.26,"type":"debit","category":"Entertainment"},{"card":2,"date":"2026-08-26","desc":"AMAZON RETAIL INDIA","amount":982.24,"type":"debit","category":"Shopping"},{"card":11,"date":"2026-08-26","desc":"PAYMENT RECEIVED, THANK YOU","amount":1044.2,"type":"credit","category":"Payments & Refunds"},{"card":14,"date":"2026-08-26","desc":"PAYMENT RECEIVED, THANK YOU","amount":543.52,"type":"credit","category":"Payments & Refunds"},{"card":17,"date":"2026-08-26","desc":"APOLLO PHARMACY","amount":181.32,"type":"debit","category":"Health"},{"card":2,"date":"2026-08-27","desc":"PAYMENT RECEIVED, THANK YOU","amount":5580.55,"type":"credit","category":"Payments & Refunds"},{"card":4,"date":"2026-08-27","desc":"TOIT BREWPUB","amount":2481.52,"type":"debit","category":"Food & Dining"},{"card":13,"date":"2026-08-27","desc":"APOLLO PHARMACY","amount":482.7,"type":"debit","category":"Health"},{"card":16,"date":"2026-08-27","desc":"NETFLIX INDIA","amount":307.93,"type":"debit","category":"Entertainment"},{"card":9,"date":"2026-08-28","desc":"SWIGGY BANGALORE","amount":273.5,"type":"debit","category":"Food & Dining"},{"card":17,"date":"2026-08-28","desc":"PAYMENT RECEIVED, THANK YOU","amount":1068.85,"type":"credit","category":"Payments & Refunds"},{"card":2,"date":"2026-08-29","desc":"BLINKIT GROCERY","amount":998.63,"type":"debit","category":"Groceries"},{"card":2,"date":"2026-08-30","desc":"APOLLO PHARMACY","amount":440.37,"type":"debit","category":"Health"},{"card":3,"date":"2026-08-30","desc":"DUTY FREE MUMBAI","amount":1435.07,"type":"debit","category":"Shopping"},{"card":7,"date":"2026-08-30","desc":"PAYMENT RECEIVED, THANK YOU","amount":4647.89,"type":"credit","category":"Payments & Refunds"},{"card":9,"date":"2026-08-30","desc":"BLINKIT GROCERY","amount":840.44,"type":"debit","category":"Groceries"},{"card":12,"date":"2026-08-30","desc":"PAYMENT RECEIVED, THANK YOU","amount":2048.49,"type":"credit","category":"Payments & Refunds"},{"card":14,"date":"2026-08-30","desc":"HP PETROL PUMP","amount":886.15,"type":"debit","category":"Fuel"},{"card":16,"date":"2026-08-30","desc":"PAYMENT RECEIVED, THANK YOU","amount":919.1,"type":"credit","category":"Payments & Refunds"},{"card":18,"date":"2026-08-30","desc":"NETFLIX INDIA","amount":535.39,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-08-31","desc":"MORE SUPERMARKET","amount":890.21,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-08-31","desc":"DMART AVENUE SUPERMARTS","amount":823.74,"type":"debit","category":"Groceries"},{"card":17,"date":"2026-08-31","desc":"SWIGGY BANGALORE","amount":350.93,"type":"debit","category":"Food & Dining"},{"card":2,"date":"2026-09-01","desc":"AJIO LIFESTYLE","amount":926.52,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-09-01","desc":"NETFLIX INDIA","amount":600.0,"type":"debit","category":"Entertainment"},{"card":8,"date":"2026-09-01","desc":"BLINKIT GROCERY","amount":350.0,"type":"debit","category":"Groceries"},{"card":10,"date":"2026-09-01","desc":"ZOMATO ONLINE","amount":600.0,"type":"debit","category":"Food & Dining"},{"card":12,"date":"2026-09-01","desc":"SWIGGY BANGALORE","amount":1300.0,"type":"debit","category":"Food & Dining"},{"card":3,"date":"2026-09-02","desc":"BARBEQUE NATION","amount":1300.0,"type":"debit","category":"Food & Dining"},{"card":9,"date":"2026-09-02","desc":"MORE SUPERMARKET","amount":350.0,"type":"debit","category":"Groceries"},{"card":11,"date":"2026-09-02","desc":"BOOKMYSHOW","amount":600.0,"type":"debit","category":"Entertainment"},{"card":13,"date":"2026-09-02","desc":"AMAZON RETAIL INDIA","amount":350.0,"type":"debit","category":"Shopping"},{"card":14,"date":"2026-09-02","desc":"APOLLO PHARMACY","amount":350.0,"type":"debit","category":"Health"},{"card":0,"date":"2026-09-03","desc":"ADOBE CREATIVE CLOUD","amount":4230.0,"type":"debit","category":"Utilities & Bills"},{"card":0,"date":"2026-09-03","desc":"SWIGGY BANGALORE","amount":1600.0,"type":"debit","category":"Food & Dining"},{"card":1,"date":"2026-09-03","desc":"HP PETROL PUMP","amount":1300.0,"type":"debit","category":"Fuel"},{"card":3,"date":"2026-09-03","desc":"PAYMENT RECEIVED, THANK YOU","amount":4076.57,"type":"credit","category":"Payments & Refunds"},{"card":4,"date":"2026-09-03","desc":"BOOKMYSHOW","amount":606.67,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-09-03","desc":"SWIGGY BANGALORE","amount":427.77,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-09-03","desc":"PAYMENT RECEIVED, THANK YOU","amount":3618.15,"type":"credit","category":"Payments & Refunds"},{"card":7,"date":"2026-09-03","desc":"AJIO LIFESTYLE","amount":700.0,"type":"debit","category":"Shopping"},{"card":15,"date":"2026-09-03","desc":"IRCTC RAIL CONNECT","amount":1300.0,"type":"debit","category":"Travel"},{"card":16,"date":"2026-09-03","desc":"SPOTIFY INDIA","amount":165.0,"type":"debit","category":"Entertainment"},{"card":17,"date":"2026-09-03","desc":"SPOTIFY INDIA","amount":165.0,"type":"debit","category":"Entertainment"},{"card":18,"date":"2026-09-03","desc":"APOLLO PHARMACY","amount":165.0,"type":"debit","category":"Health"}];

export interface DemoDue {
  day: string;
  statementDate: string;
  amount: number;
  minDue: number;
  settled: boolean;
  cardLabel: string;
  bankId: string;
  last4: string;
}

export const DEMO_DUES: DemoDue[] = [
  {
    "day": "2026-07-30",
    "statementDate": "2026-07-12",
    "amount": 19437.23,
    "minDue": 971.86,
    "settled": true,
    "cardLabel": "Infinia",
    "bankId": "hdfc",
    "last4": "6401"
  },
  {
    "day": "2026-08-30",
    "statementDate": "2026-08-12",
    "amount": 13040.54,
    "minDue": 652.03,
    "settled": true,
    "cardLabel": "Infinia",
    "bankId": "hdfc",
    "last4": "6401"
  },
  {
    "day": "2026-07-25",
    "statementDate": "2026-07-07",
    "amount": 14525.5,
    "minDue": 726.28,
    "settled": true,
    "cardLabel": "Atlas",
    "bankId": "axis",
    "last4": "3096"
  },
  {
    "day": "2026-08-25",
    "statementDate": "2026-08-07",
    "amount": 7214.58,
    "minDue": 360.73,
    "settled": true,
    "cardLabel": "Atlas",
    "bankId": "axis",
    "last4": "3096"
  },
  {
    "day": "2026-08-08",
    "statementDate": "2026-07-21",
    "amount": 8273.27,
    "minDue": 413.66,
    "settled": true,
    "cardLabel": "Amazon Pay",
    "bankId": "icici",
    "last4": "3317"
  },
  {
    "day": "2026-09-08",
    "statementDate": "2026-08-21",
    "amount": 5580.55,
    "minDue": 279.03,
    "settled": true,
    "cardLabel": "Amazon Pay",
    "bankId": "icici",
    "last4": "3317"
  },
  {
    "day": "2026-07-23",
    "statementDate": "2026-07-03",
    "amount": 7235.95,
    "minDue": 361.8,
    "settled": true,
    "cardLabel": "Platinum Travel",
    "bankId": "amex",
    "last4": "9001"
  },
  {
    "day": "2026-08-23",
    "statementDate": "2026-08-03",
    "amount": 11158.65,
    "minDue": 557.93,
    "settled": true,
    "cardLabel": "Platinum Travel",
    "bankId": "amex",
    "last4": "9001"
  },
  {
    "day": "2026-09-23",
    "statementDate": "2026-09-03",
    "amount": 4076.57,
    "minDue": 203.83,
    "settled": true,
    "cardLabel": "Platinum Travel",
    "bankId": "amex",
    "last4": "9001"
  },
  {
    "day": "2026-07-30",
    "statementDate": "2026-07-12",
    "amount": 7335.2,
    "minDue": 366.76,
    "settled": true,
    "cardLabel": "Regalia Gold",
    "bankId": "hdfc",
    "last4": "8842"
  },
  {
    "day": "2026-08-30",
    "statementDate": "2026-08-12",
    "amount": 5973.0,
    "minDue": 298.65,
    "settled": false,
    "cardLabel": "Regalia Gold",
    "bankId": "hdfc",
    "last4": "8842"
  },
  {
    "day": "2026-08-04",
    "statementDate": "2026-07-17",
    "amount": 4325.43,
    "minDue": 216.27,
    "settled": true,
    "cardLabel": "Magnus",
    "bankId": "axis",
    "last4": "7712"
  },
  {
    "day": "2026-09-04",
    "statementDate": "2026-08-17",
    "amount": 3451.99,
    "minDue": 172.6,
    "settled": false,
    "cardLabel": "Magnus",
    "bankId": "axis",
    "last4": "7712"
  },
  {
    "day": "2026-08-14",
    "statementDate": "2026-07-25",
    "amount": 6019.0,
    "minDue": 300.95,
    "settled": true,
    "cardLabel": "Cashback",
    "bankId": "sbi",
    "last4": "1122"
  },
  {
    "day": "2026-09-14",
    "statementDate": "2026-08-25",
    "amount": 3618.15,
    "minDue": 180.91,
    "settled": true,
    "cardLabel": "Cashback",
    "bankId": "sbi",
    "last4": "1122"
  },
  {
    "day": "2026-08-14",
    "statementDate": "2026-07-27",
    "amount": 4089.37,
    "minDue": 204.47,
    "settled": true,
    "cardLabel": "Flipkart Axis",
    "bankId": "axis",
    "last4": "5518"
  },
  {
    "day": "2026-09-14",
    "statementDate": "2026-08-27",
    "amount": 4647.89,
    "minDue": 232.39,
    "settled": true,
    "cardLabel": "Flipkart Axis",
    "bankId": "axis",
    "last4": "5518"
  },
  {
    "day": "2026-07-27",
    "statementDate": "2026-07-09",
    "amount": 4269.91,
    "minDue": 213.5,
    "settled": true,
    "cardLabel": "Wealth",
    "bankId": "idfc",
    "last4": "4409"
  },
  {
    "day": "2026-08-27",
    "statementDate": "2026-08-09",
    "amount": 3458.54,
    "minDue": 172.93,
    "settled": true,
    "cardLabel": "Wealth",
    "bankId": "idfc",
    "last4": "4409"
  },
  {
    "day": "2026-08-03",
    "statementDate": "2026-07-14",
    "amount": 1769.49,
    "minDue": 100,
    "settled": true,
    "cardLabel": "League",
    "bankId": "kotak",
    "last4": "5566"
  },
  {
    "day": "2026-09-03",
    "statementDate": "2026-08-14",
    "amount": 2441.01,
    "minDue": 122.05,
    "settled": true,
    "cardLabel": "League",
    "bankId": "kotak",
    "last4": "5566"
  },
  {
    "day": "2026-07-23",
    "statementDate": "2026-07-05",
    "amount": 2819.23,
    "minDue": 140.96,
    "settled": true,
    "cardLabel": "Marquee",
    "bankId": "yes",
    "last4": "2288"
  },
  {
    "day": "2026-08-23",
    "statementDate": "2026-08-05",
    "amount": 2335.85,
    "minDue": 116.79,
    "settled": true,
    "cardLabel": "Marquee",
    "bankId": "yes",
    "last4": "2288"
  },
  {
    "day": "2026-08-06",
    "statementDate": "2026-07-19",
    "amount": 4100.99,
    "minDue": 205.05,
    "settled": true,
    "cardLabel": "Pioneer",
    "bankId": "indusind",
    "last4": "6135"
  },
  {
    "day": "2026-09-06",
    "statementDate": "2026-08-19",
    "amount": 1044.2,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Pioneer",
    "bankId": "indusind",
    "last4": "6135"
  },
  {
    "day": "2026-08-07",
    "statementDate": "2026-07-23",
    "amount": 2070.54,
    "minDue": 103.53,
    "settled": true,
    "cardLabel": "World Safari",
    "bankId": "rbl",
    "last4": "7024"
  },
  {
    "day": "2026-09-07",
    "statementDate": "2026-08-23",
    "amount": 2048.49,
    "minDue": 102.42,
    "settled": true,
    "cardLabel": "World Safari",
    "bankId": "rbl",
    "last4": "7024"
  },
  {
    "day": "2026-07-29",
    "statementDate": "2026-07-11",
    "amount": 1258.76,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Ultimate",
    "bankId": "sc",
    "last4": "9470"
  },
  {
    "day": "2026-08-29",
    "statementDate": "2026-08-11",
    "amount": 1942.63,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Ultimate",
    "bankId": "sc",
    "last4": "9470"
  },
  {
    "day": "2026-08-03",
    "statementDate": "2026-07-16",
    "amount": 2399.74,
    "minDue": 119.99,
    "settled": true,
    "cardLabel": "Zenith",
    "bankId": "au",
    "last4": "8153"
  },
  {
    "day": "2026-09-03",
    "statementDate": "2026-08-16",
    "amount": 543.52,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Zenith",
    "bankId": "au",
    "last4": "8153"
  },
  {
    "day": "2026-07-28",
    "statementDate": "2026-07-08",
    "amount": 1423.91,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Scapia",
    "bankId": "federal",
    "last4": "2760"
  },
  {
    "day": "2026-08-13",
    "statementDate": "2026-07-26",
    "amount": 1598.49,
    "minDue": 100,
    "settled": true,
    "cardLabel": "OneCard Metal",
    "bankId": "onecard",
    "last4": "4832"
  },
  {
    "day": "2026-09-13",
    "statementDate": "2026-08-26",
    "amount": 919.1,
    "minDue": 100,
    "settled": true,
    "cardLabel": "OneCard Metal",
    "bankId": "onecard",
    "last4": "4832"
  },
  {
    "day": "2026-08-07",
    "statementDate": "2026-07-20",
    "amount": 452.77,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Eterna",
    "bankId": "bobcard",
    "last4": "6690"
  },
  {
    "day": "2026-09-07",
    "statementDate": "2026-08-20",
    "amount": 1068.85,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Eterna",
    "bankId": "bobcard",
    "last4": "6690"
  },
  {
    "day": "2026-07-24",
    "statementDate": "2026-07-06",
    "amount": 864.97,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Live+",
    "bankId": "hsbc",
    "last4": "1974"
  },
  {
    "day": "2026-08-24",
    "statementDate": "2026-08-06",
    "amount": -1068.74,
    "minDue": 0.0,
    "settled": true,
    "cardLabel": "Live+",
    "bankId": "hsbc",
    "last4": "1974"
  }
];
