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

export const DEMO_TXNS: DemoTxn[] = [{"card":8,"date":"2026-06-01","desc":"BLINKIT GROCERY","amount":833.45,"type":"debit","category":"Groceries"},{"card":13,"date":"2026-06-01","desc":"JIO FIBER BROADBAND","amount":812.13,"type":"debit","category":"Utilities & Bills"},{"card":13,"date":"2026-06-02","desc":"SWIGGY BANGALORE","amount":185.16,"type":"debit","category":"Food & Dining"},{"card":14,"date":"2026-06-02","desc":"MORE SUPERMARKET","amount":955.33,"type":"debit","category":"Groceries"},{"card":18,"date":"2026-06-02","desc":"NETFLIX INDIA","amount":235.95,"type":"debit","category":"Entertainment"},{"card":0,"date":"2026-06-04","desc":"APPLE INDIA ONLINE","amount":4704.31,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-06-04","desc":"APOLLO PHARMACY","amount":323.09,"type":"debit","category":"Health"},{"card":1,"date":"2026-06-05","desc":"DUTY FREE MUMBAI","amount":1436.87,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-06-05","desc":"NETFLIX INDIA","amount":604.16,"type":"debit","category":"Entertainment"},{"card":5,"date":"2026-06-05","desc":"NETFLIX INDIA","amount":413.83,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-06-05","desc":"ZOMATO ONLINE","amount":506.86,"type":"debit","category":"Food & Dining"},{"card":10,"date":"2026-06-06","desc":"BOOKMYSHOW","amount":2116.85,"type":"debit","category":"Entertainment"},{"card":17,"date":"2026-06-06","desc":"BLINKIT GROCERY","amount":222.17,"type":"debit","category":"Groceries"},{"card":18,"date":"2026-06-06","desc":"APOLLO PHARMACY","amount":281.72,"type":"debit","category":"Health"},{"card":4,"date":"2026-06-07","desc":"PVR CINEMAS","amount":345.97,"type":"debit","category":"Entertainment"},{"card":9,"date":"2026-06-07","desc":"RELIANCE SMART BAZAAR","amount":726.33,"type":"debit","category":"Groceries"},{"card":10,"date":"2026-06-07","desc":"MYNTRA DESIGNS","amount":652.65,"type":"debit","category":"Shopping"},{"card":16,"date":"2026-06-08","desc":"APOLLO PHARMACY","amount":382.91,"type":"debit","category":"Health"},{"card":2,"date":"2026-06-09","desc":"APOLLO PHARMACY","amount":980.09,"type":"debit","category":"Health"},{"card":7,"date":"2026-06-09","desc":"BIGBASKET DAILY","amount":663.63,"type":"debit","category":"Groceries"},{"card":4,"date":"2026-06-10","desc":"SHELL PETROLEUM","amount":1428.85,"type":"debit","category":"Fuel"},{"card":7,"date":"2026-06-10","desc":"BOAT LIFESTYLE","amount":2490.31,"type":"debit","category":"Shopping"},{"card":16,"date":"2026-06-10","desc":"APOLLO PHARMACY","amount":232.72,"type":"debit","category":"Health"},{"card":18,"date":"2026-06-10","desc":"AIRTEL POSTPAID","amount":486.32,"type":"debit","category":"Utilities & Bills"},{"card":1,"date":"2026-06-11","desc":"IRCTC RAIL CONNECT","amount":2560.27,"type":"debit","category":"Travel"},{"card":17,"date":"2026-06-11","desc":"SPOTIFY INDIA","amount":150.4,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-06-12","desc":"NETFLIX INDIA","amount":200.03,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-06-12","desc":"RELIANCE SMART BAZAAR","amount":774.43,"type":"debit","category":"Groceries"},{"card":8,"date":"2026-06-12","desc":"ZOMATO ONLINE","amount":366.85,"type":"debit","category":"Food & Dining"},{"card":0,"date":"2026-06-13","desc":"ZOHO CORPORATION","amount":3611.75,"type":"debit","category":"Utilities & Bills"},{"card":2,"date":"2026-06-13","desc":"MYNTRA DESIGNS","amount":1560.69,"type":"debit","category":"Shopping"},{"card":3,"date":"2026-06-13","desc":"IRCTC RAIL CONNECT","amount":2572.11,"type":"debit","category":"Travel"},{"card":17,"date":"2026-06-13","desc":"SWIGGY BANGALORE","amount":557.65,"type":"debit","category":"Food & Dining"},{"card":2,"date":"2026-06-14","desc":"AJIO LIFESTYLE","amount":1229.63,"type":"debit","category":"Shopping"},{"card":9,"date":"2026-06-14","desc":"AIRTEL POSTPAID","amount":912.91,"type":"debit","category":"Utilities & Bills"},{"card":11,"date":"2026-06-14","desc":"PVR CINEMAS","amount":1625.49,"type":"debit","category":"Entertainment"},{"card":1,"date":"2026-06-15","desc":"BARBEQUE NATION","amount":3470.0,"type":"debit","category":"Food & Dining"},{"card":15,"date":"2026-06-15","desc":"IRCTC RAIL CONNECT","amount":1412.23,"type":"debit","category":"Travel"},{"card":0,"date":"2026-06-16","desc":"SMOKE HOUSE DELI","amount":2084.41,"type":"debit","category":"Food & Dining"},{"card":5,"date":"2026-06-16","desc":"SMOKE HOUSE DELI","amount":1403.43,"type":"debit","category":"Food & Dining"},{"card":12,"date":"2026-06-16","desc":"DUTY FREE MUMBAI","amount":1926.15,"type":"debit","category":"Shopping"},{"card":2,"date":"2026-06-17","desc":"AJIO LIFESTYLE","amount":1759.87,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-06-18","desc":"MYNTRA DESIGNS","amount":1515.95,"type":"debit","category":"Shopping"},{"card":9,"date":"2026-06-21","desc":"AMAZON RETAIL INDIA","amount":542.59,"type":"debit","category":"Shopping"},{"card":4,"date":"2026-06-23","desc":"NETFLIX INDIA","amount":595.95,"type":"debit","category":"Entertainment"},{"card":5,"date":"2026-06-23","desc":"SMOKE HOUSE DELI","amount":1573.6,"type":"debit","category":"Food & Dining"},{"card":8,"date":"2026-06-23","desc":"MORE SUPERMARKET","amount":345.27,"type":"debit","category":"Groceries"},{"card":8,"date":"2026-06-23","desc":"BLINKIT GROCERY","amount":818.21,"type":"debit","category":"Groceries"},{"card":16,"date":"2026-06-23","desc":"AIRTEL POSTPAID","amount":448.54,"type":"debit","category":"Utilities & Bills"},{"card":2,"date":"2026-06-24","desc":"FLIPKART INTERNET","amount":1679.36,"type":"debit","category":"Shopping"},{"card":4,"date":"2026-06-24","desc":"MYNTRA DESIGNS","amount":1390.88,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-06-24","desc":"SWIGGY BANGALORE","amount":793.62,"type":"debit","category":"Food & Dining"},{"card":1,"date":"2026-06-25","desc":"HP PETROL PUMP","amount":3453.55,"type":"debit","category":"Fuel"},{"card":2,"date":"2026-06-25","desc":"APOLLO PHARMACY","amount":1172.04,"type":"debit","category":"Health"},{"card":6,"date":"2026-06-25","desc":"JIO FIBER BROADBAND","amount":1108.03,"type":"debit","category":"Utilities & Bills"},{"card":6,"date":"2026-06-25","desc":"HP PETROL PUMP","amount":880.23,"type":"debit","category":"Fuel"},{"card":0,"date":"2026-06-26","desc":"APPLE INDIA ONLINE","amount":2053.77,"type":"debit","category":"Shopping"},{"card":7,"date":"2026-06-26","desc":"AJIO LIFESTYLE","amount":1358.25,"type":"debit","category":"Shopping"},{"card":3,"date":"2026-06-27","desc":"HP PETROL PUMP","amount":2839.64,"type":"debit","category":"Fuel"},{"card":14,"date":"2026-06-27","desc":"BLINKIT GROCERY","amount":508.7,"type":"debit","category":"Groceries"},{"card":17,"date":"2026-06-27","desc":"APOLLO PHARMACY","amount":296.38,"type":"debit","category":"Health"},{"card":4,"date":"2026-06-28","desc":"PVR CINEMAS","amount":1614.68,"type":"debit","category":"Entertainment"},{"card":11,"date":"2026-06-28","desc":"MYNTRA DESIGNS","amount":1176.68,"type":"debit","category":"Shopping"},{"card":8,"date":"2026-06-29","desc":"JIO FIBER BROADBAND","amount":912.27,"type":"debit","category":"Utilities & Bills"},{"card":13,"date":"2026-06-29","desc":"JIO FIBER BROADBAND","amount":770.67,"type":"debit","category":"Utilities & Bills"},{"card":3,"date":"2026-06-30","desc":"BARBEQUE NATION","amount":3515.46,"type":"debit","category":"Food & Dining"},{"card":4,"date":"2026-06-30","desc":"PVR CINEMAS","amount":1850.96,"type":"debit","category":"Entertainment"},{"card":9,"date":"2026-06-30","desc":"ZOMATO ONLINE","amount":490.91,"type":"debit","category":"Food & Dining"},{"card":5,"date":"2026-07-01","desc":"PVR CINEMAS","amount":417.24,"type":"debit","category":"Entertainment"},{"card":2,"date":"2026-07-03","desc":"FLIPKART INTERNET","amount":1702.06,"type":"debit","category":"Shopping"},{"card":1,"date":"2026-07-04","desc":"BARBEQUE NATION","amount":2091.25,"type":"debit","category":"Food & Dining"},{"card":12,"date":"2026-07-04","desc":"DUTY FREE MUMBAI","amount":2156.31,"type":"debit","category":"Shopping"},{"card":17,"date":"2026-07-04","desc":"NETFLIX INDIA","amount":434.48,"type":"debit","category":"Entertainment"},{"card":18,"date":"2026-07-04","desc":"SPOTIFY INDIA","amount":163.6,"type":"debit","category":"Entertainment"},{"card":13,"date":"2026-07-05","desc":"APOLLO PHARMACY","amount":194.84,"type":"debit","category":"Health"},{"card":0,"date":"2026-07-06","desc":"ANNUAL MEMBERSHIP FEE","amount":12500.0,"type":"debit","category":"Fees & Charges"},{"card":1,"date":"2026-07-06","desc":"SWIGGY BANGALORE","amount":1313.93,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-07-06","desc":"TATA POWER DDL","amount":891.72,"type":"debit","category":"Utilities & Bills"},{"card":4,"date":"2026-07-07","desc":"DECATHLON SPORTS","amount":936.12,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-07-07","desc":"TATA POWER DDL","amount":1036.23,"type":"debit","category":"Utilities & Bills"},{"card":14,"date":"2026-07-07","desc":"JIO FIBER BROADBAND","amount":729.09,"type":"debit","category":"Utilities & Bills"},{"card":16,"date":"2026-07-07","desc":"SPOTIFY INDIA","amount":145.03,"type":"debit","category":"Entertainment"},{"card":17,"date":"2026-07-07","desc":"SPOTIFY INDIA","amount":166.79,"type":"debit","category":"Entertainment"},{"card":16,"date":"2026-07-08","desc":"AIRTEL POSTPAID","amount":465.26,"type":"debit","category":"Utilities & Bills"},{"card":2,"date":"2026-07-09","desc":"NYKAA FASHION","amount":2199.28,"type":"debit","category":"Shopping"},{"card":2,"date":"2026-07-09","desc":"BIGBASKET DAILY","amount":1010.47,"type":"debit","category":"Groceries"},{"card":18,"date":"2026-07-09","desc":"PAYMENT RECEIVED, THANK YOU","amount":649.92,"type":"credit","category":"Payments & Refunds"},{"card":11,"date":"2026-07-10","desc":"TOIT BREWPUB","amount":1590.94,"type":"debit","category":"Food & Dining"},{"card":3,"date":"2026-07-11","desc":"PAYMENT RECEIVED, THANK YOU","amount":8927.21,"type":"credit","category":"Payments & Refunds"},{"card":8,"date":"2026-07-11","desc":"PAYMENT RECEIVED, THANK YOU","amount":2442.6,"type":"credit","category":"Payments & Refunds"},{"card":10,"date":"2026-07-11","desc":"MYNTRA DESIGNS","amount":2004.08,"type":"debit","category":"Shopping"},{"card":13,"date":"2026-07-11","desc":"MORE SUPERMARKET","amount":882.92,"type":"debit","category":"Groceries"},{"card":6,"date":"2026-07-12","desc":"ZOMATO ONLINE","amount":416.82,"type":"debit","category":"Food & Dining"},{"card":1,"date":"2026-07-13","desc":"PAYMENT RECEIVED, THANK YOU","amount":12889.0,"type":"credit","category":"Payments & Refunds"},{"card":6,"date":"2026-07-13","desc":"MORE SUPERMARKET","amount":358.58,"type":"debit","category":"Groceries"},{"card":8,"date":"2026-07-13","desc":"APOLLO PHARMACY","amount":607.54,"type":"debit","category":"Health"},{"card":4,"date":"2026-07-14","desc":"PAYMENT RECEIVED, THANK YOU","amount":6388.59,"type":"credit","category":"Payments & Refunds"},{"card":4,"date":"2026-07-15","desc":"SHELL PETROLEUM","amount":1961.29,"type":"debit","category":"Fuel"},{"card":5,"date":"2026-07-15","desc":"PVR CINEMAS","amount":994.38,"type":"debit","category":"Entertainment"},{"card":8,"date":"2026-07-15","desc":"APOLLO PHARMACY","amount":822.35,"type":"debit","category":"Health"},{"card":8,"date":"2026-07-16","desc":"AIRTEL POSTPAID","amount":515.17,"type":"debit","category":"Utilities & Bills"},{"card":15,"date":"2026-07-16","desc":"HP PETROL PUMP","amount":1320.53,"type":"debit","category":"Fuel"},{"card":15,"date":"2026-07-16","desc":"PAYMENT RECEIVED, THANK YOU","amount":1412.23,"type":"credit","category":"Payments & Refunds"},{"card":3,"date":"2026-07-18","desc":"DUTY FREE MUMBAI","amount":1379.16,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-07-19","desc":"AMAZON RETAIL INDIA","amount":322.55,"type":"debit","category":"Shopping"},{"card":10,"date":"2026-07-19","desc":"PAYMENT RECEIVED, THANK YOU","amount":2769.5,"type":"credit","category":"Payments & Refunds"},{"card":1,"date":"2026-07-20","desc":"AIRBNB PAYMENTS","amount":4501.05,"type":"debit","category":"Travel"},{"card":5,"date":"2026-07-20","desc":"SHELL PETROLEUM","amount":1162.69,"type":"debit","category":"Fuel"},{"card":14,"date":"2026-07-20","desc":"MORE SUPERMARKET","amount":971.75,"type":"debit","category":"Groceries"},{"card":2,"date":"2026-07-21","desc":"AJIO LIFESTYLE","amount":988.56,"type":"debit","category":"Shopping"},{"card":8,"date":"2026-07-21","desc":"RELIANCE SMART BAZAAR","amount":594.8,"type":"debit","category":"Groceries"},{"card":13,"date":"2026-07-21","desc":"PAYMENT RECEIVED, THANK YOU","amount":1848.43,"type":"credit","category":"Payments & Refunds"},{"card":18,"date":"2026-07-21","desc":"AMAZON PRIME VIDEO","amount":465.77,"type":"debit","category":"Entertainment"},{"card":1,"date":"2026-07-22","desc":"DUTY FREE MUMBAI","amount":2147.53,"type":"debit","category":"Shopping"},{"card":7,"date":"2026-07-22","desc":"SWIGGY INSTAMART","amount":1685.21,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-07-22","desc":"ZOMATO ONLINE","amount":502.12,"type":"debit","category":"Food & Dining"},{"card":9,"date":"2026-07-22","desc":"SWIGGY BANGALORE","amount":202.68,"type":"debit","category":"Food & Dining"},{"card":13,"date":"2026-07-22","desc":"JIO FIBER BROADBAND","amount":787.48,"type":"debit","category":"Utilities & Bills"},{"card":0,"date":"2026-07-23","desc":"APPLE INDIA ONLINE","amount":1920.0,"type":"debit","category":"Shopping"},{"card":16,"date":"2026-07-24","desc":"APOLLO PHARMACY","amount":246.32,"type":"debit","category":"Health"},{"card":18,"date":"2026-07-25","desc":"NETFLIX INDIA","amount":281.32,"type":"debit","category":"Entertainment"},{"card":5,"date":"2026-07-26","desc":"PAYMENT RECEIVED, THANK YOU","amount":4501.17,"type":"credit","category":"Payments & Refunds"},{"card":8,"date":"2026-07-26","desc":"SWIGGY BANGALORE","amount":909.29,"type":"debit","category":"Food & Dining"},{"card":3,"date":"2026-07-27","desc":"DUTY FREE MUMBAI","amount":4913.05,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-07-27","desc":"CULT FIT BANGALORE","amount":1416.11,"type":"debit","category":"Health"},{"card":7,"date":"2026-07-27","desc":"MYNTRA DESIGNS","amount":888.85,"type":"debit","category":"Shopping"},{"card":9,"date":"2026-07-27","desc":"DMART AVENUE SUPERMARTS","amount":1200.55,"type":"debit","category":"Groceries"},{"card":11,"date":"2026-07-27","desc":"ZOMATO ONLINE","amount":510.58,"type":"debit","category":"Food & Dining"},{"card":17,"date":"2026-07-27","desc":"NETFLIX INDIA","amount":288.42,"type":"debit","category":"Entertainment"},{"card":0,"date":"2026-07-28","desc":"PAYMENT RECEIVED, THANK YOU","amount":20249.93,"type":"credit","category":"Payments & Refunds"},{"card":4,"date":"2026-07-28","desc":"CULT FIT BANGALORE","amount":1925.14,"type":"debit","category":"Health"},{"card":9,"date":"2026-07-28","desc":"BLINKIT GROCERY","amount":515.54,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-07-28","desc":"PAYMENT RECEIVED, THANK YOU","amount":1033.5,"type":"credit","category":"Payments & Refunds"},{"card":10,"date":"2026-07-28","desc":"PVR CINEMAS","amount":735.92,"type":"debit","category":"Entertainment"},{"card":2,"date":"2026-07-29","desc":"SWIGGY INSTAMART","amount":539.51,"type":"debit","category":"Groceries"},{"card":2,"date":"2026-07-29","desc":"AJIO LIFESTYLE","amount":1943.38,"type":"debit","category":"Shopping"},{"card":4,"date":"2026-07-29","desc":"PVR CINEMAS","amount":588.02,"type":"debit","category":"Entertainment"},{"card":7,"date":"2026-07-29","desc":"BOAT LIFESTYLE","amount":2022.59,"type":"debit","category":"Shopping"},{"card":16,"date":"2026-07-29","desc":"BLINKIT GROCERY","amount":487.02,"type":"debit","category":"Groceries"},{"card":4,"date":"2026-07-30","desc":"PVR CINEMAS","amount":830.11,"type":"debit","category":"Entertainment"},{"card":5,"date":"2026-07-30","desc":"BOOKMYSHOW","amount":2165.28,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-07-30","desc":"RELIANCE SMART BAZAAR","amount":1263.48,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-07-30","desc":"AMAZON RETAIL INDIA","amount":789.36,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-07-31","desc":"NETFLIX INDIA","amount":444.04,"type":"debit","category":"Entertainment"},{"card":11,"date":"2026-07-31","desc":"PAYMENT RECEIVED, THANK YOU","amount":2767.62,"type":"credit","category":"Payments & Refunds"},{"card":17,"date":"2026-07-31","desc":"PAYMENT RECEIVED, THANK YOU","amount":897.65,"type":"credit","category":"Payments & Refunds"},{"card":2,"date":"2026-08-01","desc":"APOLLO PHARMACY","amount":872.04,"type":"debit","category":"Health"},{"card":7,"date":"2026-08-01","desc":"BOAT LIFESTYLE","amount":2090.71,"type":"debit","category":"Shopping"},{"card":7,"date":"2026-08-01","desc":"PAYMENT RECEIVED, THANK YOU","amount":2574.06,"type":"credit","category":"Payments & Refunds"},{"card":14,"date":"2026-08-01","desc":"PAYMENT RECEIVED, THANK YOU","amount":1237.79,"type":"credit","category":"Payments & Refunds"},{"card":2,"date":"2026-08-02","desc":"PAYMENT RECEIVED, THANK YOU","amount":8751.77,"type":"credit","category":"Payments & Refunds"},{"card":6,"date":"2026-08-02","desc":"TATA POWER DDL","amount":1166.96,"type":"debit","category":"Utilities & Bills"},{"card":8,"date":"2026-08-02","desc":"AIRTEL POSTPAID","amount":847.82,"type":"debit","category":"Utilities & Bills"},{"card":18,"date":"2026-08-02","desc":"REFUND AMAZON RETAIL INDIA","amount":1950.0,"type":"credit","category":"Payments & Refunds"},{"card":0,"date":"2026-08-03","desc":"INDIGO AIRLINES","amount":4322.66,"type":"debit","category":"Travel"},{"card":8,"date":"2026-08-03","desc":"NETFLIX INDIA","amount":491.34,"type":"debit","category":"Entertainment"},{"card":8,"date":"2026-08-03","desc":"MORE SUPERMARKET","amount":893.26,"type":"debit","category":"Groceries"},{"card":16,"date":"2026-08-03","desc":"PAYMENT RECEIVED, THANK YOU","amount":856.61,"type":"credit","category":"Payments & Refunds"},{"card":18,"date":"2026-08-03","desc":"AMAZON PRIME VIDEO","amount":566.78,"type":"debit","category":"Entertainment"},{"card":4,"date":"2026-08-04","desc":"ZOMATO ONLINE","amount":826.8,"type":"debit","category":"Food & Dining"},{"card":15,"date":"2026-08-04","desc":"BARBEQUE NATION","amount":1405.49,"type":"debit","category":"Food & Dining"},{"card":0,"date":"2026-08-05","desc":"SWIGGY BANGALORE","amount":1428.77,"type":"debit","category":"Food & Dining"},{"card":2,"date":"2026-08-05","desc":"FLIPKART INTERNET","amount":1267.02,"type":"debit","category":"Shopping"},{"card":4,"date":"2026-08-05","desc":"SMOKE HOUSE DELI","amount":1673.4,"type":"debit","category":"Food & Dining"},{"card":12,"date":"2026-08-05","desc":"PAYMENT RECEIVED, THANK YOU","amount":2156.31,"type":"credit","category":"Payments & Refunds"},{"card":1,"date":"2026-08-06","desc":"BARBEQUE NATION","amount":2215.94,"type":"debit","category":"Food & Dining"},{"card":2,"date":"2026-08-06","desc":"SWIGGY INSTAMART","amount":1170.65,"type":"debit","category":"Groceries"},{"card":16,"date":"2026-08-06","desc":"AIRTEL POSTPAID","amount":769.94,"type":"debit","category":"Utilities & Bills"},{"card":18,"date":"2026-08-06","desc":"SPOTIFY INDIA","amount":190.98,"type":"debit","category":"Entertainment"},{"card":1,"date":"2026-08-07","desc":"AIR INDIA EXPRESS","amount":4002.24,"type":"debit","category":"Travel"},{"card":4,"date":"2026-08-07","desc":"BOOKMYSHOW","amount":1071.46,"type":"debit","category":"Entertainment"},{"card":12,"date":"2026-08-07","desc":"DUTY FREE MUMBAI","amount":2082.25,"type":"debit","category":"Shopping"},{"card":1,"date":"2026-08-08","desc":"MAKEMYTRIP INDIA","amount":4215.15,"type":"debit","category":"Travel"},{"card":2,"date":"2026-08-08","desc":"NYKAA FASHION","amount":1322.52,"type":"debit","category":"Shopping"},{"card":3,"date":"2026-08-08","desc":"AIR INDIA EXPRESS","amount":3712.81,"type":"debit","category":"Travel"},{"card":2,"date":"2026-08-09","desc":"FLIPKART INTERNET","amount":2043.18,"type":"debit","category":"Shopping"},{"card":5,"date":"2026-08-09","desc":"BOOKMYSHOW","amount":1494.1,"type":"debit","category":"Entertainment"},{"card":6,"date":"2026-08-09","desc":"ZOMATO ONLINE","amount":642.88,"type":"debit","category":"Food & Dining"},{"card":14,"date":"2026-08-09","desc":"AMAZON RETAIL INDIA","amount":809.58,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-08-10","desc":"PAYMENT RECEIVED, THANK YOU","amount":3025.9,"type":"credit","category":"Payments & Refunds"},{"card":14,"date":"2026-08-10","desc":"RELIANCE SMART BAZAAR","amount":787.39,"type":"debit","category":"Groceries"},{"card":17,"date":"2026-08-10","desc":"BLINKIT GROCERY","amount":300.89,"type":"debit","category":"Groceries"},{"card":4,"date":"2026-08-11","desc":"SHELL PETROLEUM","amount":1297.01,"type":"debit","category":"Fuel"},{"card":5,"date":"2026-08-11","desc":"NETFLIX INDIA","amount":401.71,"type":"debit","category":"Entertainment"},{"card":17,"date":"2026-08-11","desc":"BLINKIT GROCERY","amount":639.34,"type":"debit","category":"Groceries"},{"card":3,"date":"2026-08-12","desc":"HP PETROL PUMP","amount":1407.31,"type":"debit","category":"Fuel"},{"card":6,"date":"2026-08-12","desc":"AMAZON RETAIL INDIA","amount":523.31,"type":"debit","category":"Shopping"},{"card":9,"date":"2026-08-12","desc":"AIRTEL POSTPAID","amount":437.46,"type":"debit","category":"Utilities & Bills"},{"card":8,"date":"2026-08-14","desc":"NETFLIX INDIA","amount":360.45,"type":"debit","category":"Entertainment"},{"card":11,"date":"2026-08-14","desc":"BOOKMYSHOW","amount":1052.97,"type":"debit","category":"Entertainment"},{"card":10,"date":"2026-08-15","desc":"MYNTRA DESIGNS","amount":1392.76,"type":"debit","category":"Shopping"},{"card":11,"date":"2026-08-15","desc":"PVR CINEMAS","amount":1202.61,"type":"debit","category":"Entertainment"},{"card":9,"date":"2026-08-16","desc":"AMAZON RETAIL INDIA","amount":596.63,"type":"debit","category":"Shopping"},{"card":10,"date":"2026-08-16","desc":"PAYMENT RECEIVED, THANK YOU","amount":2740.0,"type":"credit","category":"Payments & Refunds"},{"card":0,"date":"2026-08-17","desc":"LINKEDIN PREMIUM","amount":2246.84,"type":"debit","category":"Utilities & Bills"},{"card":0,"date":"2026-08-17","desc":"PAYMENT RECEIVED, THANK YOU","amount":7671.43,"type":"credit","category":"Payments & Refunds"},{"card":5,"date":"2026-08-17","desc":"TOIT BREWPUB","amount":1442.88,"type":"debit","category":"Food & Dining"},{"card":8,"date":"2026-08-17","desc":"RELIANCE SMART BAZAAR","amount":861.8,"type":"debit","category":"Groceries"},{"card":16,"date":"2026-08-18","desc":"APOLLO PHARMACY","amount":179.64,"type":"debit","category":"Health"},{"card":17,"date":"2026-08-18","desc":"SPOTIFY INDIA","amount":129.72,"type":"debit","category":"Entertainment"},{"card":9,"date":"2026-08-19","desc":"AMAZON RETAIL INDIA","amount":741.14,"type":"debit","category":"Shopping"},{"card":3,"date":"2026-08-20","desc":"HP PETROL PUMP","amount":2527.09,"type":"debit","category":"Fuel"},{"card":9,"date":"2026-08-20","desc":"PAYMENT RECEIVED, THANK YOU","amount":3647.71,"type":"credit","category":"Payments & Refunds"},{"card":13,"date":"2026-08-20","desc":"BLINKIT GROCERY","amount":311.83,"type":"debit","category":"Groceries"},{"card":14,"date":"2026-08-20","desc":"PAYMENT RECEIVED, THANK YOU","amount":2568.72,"type":"credit","category":"Payments & Refunds"},{"card":18,"date":"2026-08-20","desc":"SPOTIFY INDIA","amount":149.51,"type":"debit","category":"Entertainment"},{"card":13,"date":"2026-08-21","desc":"PAYMENT RECEIVED, THANK YOU","amount":787.48,"type":"credit","category":"Payments & Refunds"},{"card":15,"date":"2026-08-21","desc":"PAYMENT RECEIVED, THANK YOU","amount":2726.02,"type":"credit","category":"Payments & Refunds"},{"card":1,"date":"2026-08-22","desc":"PAYMENT RECEIVED, THANK YOU","amount":12866.76,"type":"credit","category":"Payments & Refunds"},{"card":3,"date":"2026-08-22","desc":"PAYMENT RECEIVED, THANK YOU","amount":6292.21,"type":"credit","category":"Payments & Refunds"},{"card":8,"date":"2026-08-22","desc":"PAYMENT RECEIVED, THANK YOU","amount":5681.57,"type":"credit","category":"Payments & Refunds"},{"card":9,"date":"2026-08-22","desc":"AMAZON RETAIL INDIA","amount":663.73,"type":"debit","category":"Shopping"},{"card":13,"date":"2026-08-22","desc":"AMAZON RETAIL INDIA","amount":575.3,"type":"debit","category":"Shopping"},{"card":2,"date":"2026-08-24","desc":"PAYMENT RECEIVED, THANK YOU","amount":9158.3,"type":"credit","category":"Payments & Refunds"},{"card":6,"date":"2026-08-25","desc":"HP PETROL PUMP","amount":1007.53,"type":"debit","category":"Fuel"},{"card":6,"date":"2026-08-25","desc":"AMAZON RETAIL INDIA","amount":374.39,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-08-25","desc":"APOLLO PHARMACY","amount":334.86,"type":"debit","category":"Health"},{"card":7,"date":"2026-08-25","desc":"BIGBASKET DAILY","amount":1331.63,"type":"debit","category":"Groceries"},{"card":17,"date":"2026-08-25","desc":"PAYMENT RECEIVED, THANK YOU","amount":1358.37,"type":"credit","category":"Payments & Refunds"},{"card":2,"date":"2026-08-26","desc":"AJIO LIFESTYLE","amount":880.14,"type":"debit","category":"Shopping"},{"card":6,"date":"2026-08-26","desc":"SWIGGY BANGALORE","amount":1116.75,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-08-27","desc":"PAYMENT RECEIVED, THANK YOU","amount":5757.45,"type":"credit","category":"Payments & Refunds"},{"card":9,"date":"2026-08-27","desc":"JIO FIBER BROADBAND","amount":947.7,"type":"debit","category":"Utilities & Bills"},{"card":16,"date":"2026-08-27","desc":"SWIGGY BANGALORE","amount":191.46,"type":"debit","category":"Food & Dining"},{"card":13,"date":"2026-08-28","desc":"APOLLO PHARMACY","amount":1003.64,"type":"debit","category":"Health"},{"card":10,"date":"2026-08-29","desc":"ZOMATO ONLINE","amount":1216.08,"type":"debit","category":"Food & Dining"},{"card":0,"date":"2026-08-30","desc":"GOOGLE CLOUD INDIA","amount":4303.39,"type":"debit","category":"Utilities & Bills"},{"card":1,"date":"2026-08-30","desc":"UBER INDIA","amount":951.08,"type":"debit","category":"Travel"},{"card":4,"date":"2026-08-30","desc":"SHELL PETROLEUM","amount":1105.93,"type":"debit","category":"Fuel"},{"card":5,"date":"2026-08-30","desc":"PVR CINEMAS","amount":1628.93,"type":"debit","category":"Entertainment"},{"card":2,"date":"2026-08-31","desc":"AJIO LIFESTYLE","amount":2525.32,"type":"debit","category":"Shopping"},{"card":8,"date":"2026-08-31","desc":"MORE SUPERMARKET","amount":501.3,"type":"debit","category":"Groceries"},{"card":16,"date":"2026-08-31","desc":"PAYMENT RECEIVED, THANK YOU","amount":1436.6,"type":"credit","category":"Payments & Refunds"},{"card":7,"date":"2026-09-01","desc":"BLINKIT GROCERY","amount":468.82,"type":"debit","category":"Groceries"},{"card":10,"date":"2026-09-01","desc":"NETFLIX INDIA","amount":281.66,"type":"debit","category":"Entertainment"},{"card":11,"date":"2026-09-01","desc":"NETFLIX INDIA","amount":240.73,"type":"debit","category":"Entertainment"},{"card":13,"date":"2026-09-01","desc":"APOLLO PHARMACY","amount":176.04,"type":"debit","category":"Health"},{"card":16,"date":"2026-09-01","desc":"APOLLO PHARMACY","amount":151.17,"type":"debit","category":"Health"},{"card":18,"date":"2026-09-01","desc":"SPOTIFY INDIA","amount":78.05,"type":"debit","category":"Entertainment"},{"card":1,"date":"2026-09-02","desc":"HP PETROL PUMP","amount":1241.14,"type":"debit","category":"Fuel"},{"card":2,"date":"2026-09-02","desc":"BIGBASKET DAILY","amount":954.19,"type":"debit","category":"Groceries"},{"card":3,"date":"2026-09-02","desc":"SWIGGY BANGALORE","amount":633.37,"type":"debit","category":"Food & Dining"},{"card":6,"date":"2026-09-02","desc":"BLINKIT GROCERY","amount":413.61,"type":"debit","category":"Groceries"},{"card":11,"date":"2026-09-02","desc":"PAYMENT RECEIVED, THANK YOU","amount":2766.16,"type":"credit","category":"Payments & Refunds"},{"card":15,"date":"2026-09-02","desc":"UBER INDIA","amount":161.74,"type":"debit","category":"Travel"},{"card":0,"date":"2026-09-03","desc":"SHELL PETROLEUM","amount":1264.13,"type":"debit","category":"Fuel"},{"card":3,"date":"2026-09-03","desc":"PAYMENT RECEIVED, THANK YOU","amount":8280.58,"type":"credit","category":"Payments & Refunds"},{"card":4,"date":"2026-09-03","desc":"PVR CINEMAS","amount":757.43,"type":"debit","category":"Entertainment"},{"card":5,"date":"2026-09-03","desc":"PVR CINEMAS","amount":665.7,"type":"debit","category":"Entertainment"},{"card":7,"date":"2026-09-03","desc":"PAYMENT RECEIVED, THANK YOU","amount":5444.93,"type":"credit","category":"Payments & Refunds"},{"card":8,"date":"2026-09-03","desc":"BLINKIT GROCERY","amount":318.82,"type":"debit","category":"Groceries"},{"card":9,"date":"2026-09-03","desc":"SWIGGY BANGALORE","amount":330.35,"type":"debit","category":"Food & Dining"},{"card":12,"date":"2026-09-03","desc":"OLA CABS","amount":235.3,"type":"debit","category":"Travel"},{"card":12,"date":"2026-09-03","desc":"PAYMENT RECEIVED, THANK YOU","amount":2082.25,"type":"credit","category":"Payments & Refunds"},{"card":14,"date":"2026-09-03","desc":"APOLLO PHARMACY","amount":138.16,"type":"debit","category":"Health"},{"card":17,"date":"2026-09-03","desc":"SPOTIFY INDIA","amount":113.76,"type":"debit","category":"Entertainment"}];

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
    "amount": 20249.93,
    "minDue": 1012.5,
    "settled": true,
    "cardLabel": "Infinia",
    "bankId": "hdfc",
    "last4": "6401"
  },
  {
    "day": "2026-08-30",
    "statementDate": "2026-08-12",
    "amount": 7671.43,
    "minDue": 383.57,
    "settled": true,
    "cardLabel": "Infinia",
    "bankId": "hdfc",
    "last4": "6401"
  },
  {
    "day": "2026-07-25",
    "statementDate": "2026-07-07",
    "amount": 12889.0,
    "minDue": 644.45,
    "settled": true,
    "cardLabel": "Atlas",
    "bankId": "axis",
    "last4": "3096"
  },
  {
    "day": "2026-08-25",
    "statementDate": "2026-08-07",
    "amount": 12866.76,
    "minDue": 643.34,
    "settled": true,
    "cardLabel": "Atlas",
    "bankId": "axis",
    "last4": "3096"
  },
  {
    "day": "2026-08-08",
    "statementDate": "2026-07-21",
    "amount": 8751.77,
    "minDue": 437.59,
    "settled": true,
    "cardLabel": "Amazon Pay",
    "bankId": "icici",
    "last4": "3317"
  },
  {
    "day": "2026-09-08",
    "statementDate": "2026-08-21",
    "amount": 9158.3,
    "minDue": 457.91,
    "settled": true,
    "cardLabel": "Amazon Pay",
    "bankId": "icici",
    "last4": "3317"
  },
  {
    "day": "2026-07-23",
    "statementDate": "2026-07-03",
    "amount": 8927.21,
    "minDue": 446.36,
    "settled": true,
    "cardLabel": "Platinum Travel",
    "bankId": "amex",
    "last4": "9001"
  },
  {
    "day": "2026-08-23",
    "statementDate": "2026-08-03",
    "amount": 6292.21,
    "minDue": 314.61,
    "settled": true,
    "cardLabel": "Platinum Travel",
    "bankId": "amex",
    "last4": "9001"
  },
  {
    "day": "2026-09-23",
    "statementDate": "2026-09-03",
    "amount": 8280.58,
    "minDue": 414.03,
    "settled": true,
    "cardLabel": "Platinum Travel",
    "bankId": "amex",
    "last4": "9001"
  },
  {
    "day": "2026-07-30",
    "statementDate": "2026-07-12",
    "amount": 6388.59,
    "minDue": 319.43,
    "settled": true,
    "cardLabel": "Regalia Gold",
    "bankId": "hdfc",
    "last4": "8842"
  },
  {
    "day": "2026-08-30",
    "statementDate": "2026-08-12",
    "amount": 10173.23,
    "minDue": 508.66,
    "settled": false,
    "cardLabel": "Regalia Gold",
    "bankId": "hdfc",
    "last4": "8842"
  },
  {
    "day": "2026-08-04",
    "statementDate": "2026-07-17",
    "amount": 4501.17,
    "minDue": 225.06,
    "settled": true,
    "cardLabel": "Magnus",
    "bankId": "axis",
    "last4": "7712"
  },
  {
    "day": "2026-09-04",
    "statementDate": "2026-08-17",
    "amount": 8082.77,
    "minDue": 404.14,
    "settled": false,
    "cardLabel": "Magnus",
    "bankId": "axis",
    "last4": "7712"
  },
  {
    "day": "2026-08-14",
    "statementDate": "2026-07-25",
    "amount": 3025.9,
    "minDue": 151.3,
    "settled": true,
    "cardLabel": "Cashback",
    "bankId": "sbi",
    "last4": "1122"
  },
  {
    "day": "2026-09-14",
    "statementDate": "2026-08-25",
    "amount": 5757.45,
    "minDue": 287.87,
    "settled": true,
    "cardLabel": "Cashback",
    "bankId": "sbi",
    "last4": "1122"
  },
  {
    "day": "2026-08-14",
    "statementDate": "2026-07-27",
    "amount": 2574.06,
    "minDue": 128.7,
    "settled": true,
    "cardLabel": "Flipkart Axis",
    "bankId": "axis",
    "last4": "5518"
  },
  {
    "day": "2026-09-14",
    "statementDate": "2026-08-27",
    "amount": 5444.93,
    "minDue": 272.25,
    "settled": true,
    "cardLabel": "Flipkart Axis",
    "bankId": "axis",
    "last4": "5518"
  },
  {
    "day": "2026-07-27",
    "statementDate": "2026-07-09",
    "amount": 2442.6,
    "minDue": 122.13,
    "settled": true,
    "cardLabel": "Wealth",
    "bankId": "idfc",
    "last4": "4409"
  },
  {
    "day": "2026-08-27",
    "statementDate": "2026-08-09",
    "amount": 5681.57,
    "minDue": 284.08,
    "settled": true,
    "cardLabel": "Wealth",
    "bankId": "idfc",
    "last4": "4409"
  },
  {
    "day": "2026-08-03",
    "statementDate": "2026-07-14",
    "amount": 1033.5,
    "minDue": 100,
    "settled": true,
    "cardLabel": "League",
    "bankId": "kotak",
    "last4": "5566"
  },
  {
    "day": "2026-09-03",
    "statementDate": "2026-08-14",
    "amount": 3647.71,
    "minDue": 182.39,
    "settled": true,
    "cardLabel": "League",
    "bankId": "kotak",
    "last4": "5566"
  },
  {
    "day": "2026-07-23",
    "statementDate": "2026-07-05",
    "amount": 2769.5,
    "minDue": 138.47,
    "settled": true,
    "cardLabel": "Marquee",
    "bankId": "yes",
    "last4": "2288"
  },
  {
    "day": "2026-08-23",
    "statementDate": "2026-08-05",
    "amount": 2740.0,
    "minDue": 137.0,
    "settled": true,
    "cardLabel": "Marquee",
    "bankId": "yes",
    "last4": "2288"
  },
  {
    "day": "2026-08-06",
    "statementDate": "2026-07-19",
    "amount": 2767.62,
    "minDue": 138.38,
    "settled": true,
    "cardLabel": "Pioneer",
    "bankId": "indusind",
    "last4": "6135"
  },
  {
    "day": "2026-09-06",
    "statementDate": "2026-08-19",
    "amount": 2766.16,
    "minDue": 138.31,
    "settled": true,
    "cardLabel": "Pioneer",
    "bankId": "indusind",
    "last4": "6135"
  },
  {
    "day": "2026-08-07",
    "statementDate": "2026-07-23",
    "amount": 2156.31,
    "minDue": 107.82,
    "settled": true,
    "cardLabel": "World Safari",
    "bankId": "rbl",
    "last4": "7024"
  },
  {
    "day": "2026-09-07",
    "statementDate": "2026-08-23",
    "amount": 2082.25,
    "minDue": 104.11,
    "settled": true,
    "cardLabel": "World Safari",
    "bankId": "rbl",
    "last4": "7024"
  },
  {
    "day": "2026-07-29",
    "statementDate": "2026-07-11",
    "amount": 1848.43,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Ultimate",
    "bankId": "sc",
    "last4": "9470"
  },
  {
    "day": "2026-08-29",
    "statementDate": "2026-08-11",
    "amount": 787.48,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Ultimate",
    "bankId": "sc",
    "last4": "9470"
  },
  {
    "day": "2026-08-03",
    "statementDate": "2026-07-16",
    "amount": 1237.79,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Zenith",
    "bankId": "au",
    "last4": "8153"
  },
  {
    "day": "2026-09-03",
    "statementDate": "2026-08-16",
    "amount": 2568.72,
    "minDue": 128.44,
    "settled": true,
    "cardLabel": "Zenith",
    "bankId": "au",
    "last4": "8153"
  },
  {
    "day": "2026-07-28",
    "statementDate": "2026-07-08",
    "amount": 1412.23,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Scapia",
    "bankId": "federal",
    "last4": "2760"
  },
  {
    "day": "2026-08-28",
    "statementDate": "2026-08-08",
    "amount": 2726.02,
    "minDue": 136.3,
    "settled": true,
    "cardLabel": "Scapia",
    "bankId": "federal",
    "last4": "2760"
  },
  {
    "day": "2026-08-13",
    "statementDate": "2026-07-26",
    "amount": 856.61,
    "minDue": 100,
    "settled": true,
    "cardLabel": "OneCard Metal",
    "bankId": "onecard",
    "last4": "4832"
  },
  {
    "day": "2026-09-13",
    "statementDate": "2026-08-26",
    "amount": 1436.6,
    "minDue": 100,
    "settled": true,
    "cardLabel": "OneCard Metal",
    "bankId": "onecard",
    "last4": "4832"
  },
  {
    "day": "2026-08-07",
    "statementDate": "2026-07-20",
    "amount": 897.65,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Eterna",
    "bankId": "bobcard",
    "last4": "6690"
  },
  {
    "day": "2026-09-07",
    "statementDate": "2026-08-20",
    "amount": 1358.37,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Eterna",
    "bankId": "bobcard",
    "last4": "6690"
  },
  {
    "day": "2026-07-24",
    "statementDate": "2026-07-06",
    "amount": 649.92,
    "minDue": 100,
    "settled": true,
    "cardLabel": "Live+",
    "bankId": "hsbc",
    "last4": "1974"
  },
  {
    "day": "2026-08-24",
    "statementDate": "2026-08-06",
    "amount": -445.15,
    "minDue": 0.0,
    "settled": true,
    "cardLabel": "Live+",
    "bankId": "hsbc",
    "last4": "1974"
  }
];
