export const VERSION = "2026-10-03.1";
export const OBSERVED_ON = "2026-10-03";
export const MODELS = [
  {
    "id": "cafe",
    "name": "Neighborhood café",
    "lesson": "Measure contribution per order and contribution per scheduled labor hour together. A busy queue does not prove a profitable full day.",
    "evidence": [
      "Published menu and hours",
      "Timed public observation of service flow without personal data",
      "Voluntary merchant-provided aggregate data only if separately authorized"
    ],
    "question": "An independent café faces a bean-cost increase. Compare a menu adjustment, product mix change, and staffing schedule using the same demand scenarios.",
    "questions": [
      "Which assumption changes the result most in this exercise?",
      "When might faster service raise orders without requiring more paid hours?",
      "What evidence would show that a price increase improved total contribution rather than only contribution per order?"
    ],
    "costMode": "percentage",
    "unit": "One mixed beverage / food transaction",
    "shortUnit": "transaction",
    "scaleUnit": "transactions/day",
    "periodLabel": "Operating days per month",
    "breakEvenLabel": "Whole transactions / day at break-even",
    "fields": [
      {
        "key": "sale",
        "label": "Net sale per unit",
        "unit": "USD/unit",
        "default": 7,
        "min": 0,
        "max": 10000,
        "step": 0.01,
        "group": "unit",
        "help": "Exclude pass-through sales taxes; use a hypothetical net receipt.",
        "integer": false
      },
      {
        "key": "variableRate",
        "label": "Listed variable cost share",
        "unit": "% of base net sale",
        "default": 30,
        "min": 0,
        "max": 100,
        "step": 1,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "quantity",
        "label": "Units per operating day",
        "unit": "units/day",
        "default": 180,
        "min": 0,
        "max": 100000,
        "step": 1,
        "group": "scale",
        "help": "Unknown until entered; modeled averages may be fractional.",
        "integer": false
      },
      {
        "key": "periods",
        "label": "Operating days / month",
        "unit": "days/month",
        "default": 26,
        "min": 1,
        "max": 31,
        "step": 1,
        "group": "scale",
        "help": null,
        "integer": true
      },
      {
        "key": "fixed",
        "label": "Fixed monthly budget",
        "unit": "USD/month",
        "default": 19000,
        "min": 0,
        "max": 1000000,
        "step": 100,
        "group": "scale",
        "help": "Include scheduled labor and occupancy; add every fixed cost you intend to model.",
        "integer": false
      }
    ],
    "unitFields": [
      "sale",
      "variableRate"
    ],
    "sampleScale": null,
    "formula": "Monthly units = transactions per day × operating days. Unit contribution = base net sale × (1 − variable cost share). Monthly remainder = unit contribution × monthly units − fixed budget.",
    "exclusions": "Equipment purchase or depreciation, financing, income taxes, owner compensation if not budgeted in the fixed labor amount, and any unlisted cost. All scheduled labor and occupancy must be inside the stated fixed budget; do not add an extra payroll allocation.",
    "scaleHelp": "Café defaults are an invented teaching exercise: $7 ticket, 180 transactions/day, 26 days, 30% variable costs and $19,000 fixed budget including labor and occupancy."
  },
  {
    "id": "roastery",
    "name": "Direct roaster",
    "lesson": "Calculate yield before margin. A lower green-bean quote does not imply the same reduction in cost per sellable roasted pound.",
    "evidence": [
      "Published roast assortment and bag sizes",
      "Public sourcing or processing statements",
      "Published shipping and returns policies"
    ],
    "question": "A roaster can add another origin or increase an existing batch. Compare inventory complexity, freshness risk and capacity use.",
    "questions": [
      "Does the largest unit margin also have the lowest capital need?",
      "How does yield loss change contribution across channels?",
      "What happens when a wholesale customer pays later than the roaster pays suppliers?"
    ],
    "costMode": "coffee",
    "unit": "One 12-ounce roasted bag (0.75 lb)",
    "shortUnit": "12 oz bag",
    "scaleUnit": "bags/day",
    "periodLabel": "Operating days per month",
    "breakEvenLabel": "Whole bags / day at break-even",
    "weightLb": 0.75,
    "fields": [
      {
        "key": "sale",
        "label": "Net sale per unit",
        "unit": "USD/unit",
        "default": 20,
        "min": 0,
        "max": 10000,
        "step": 0.01,
        "group": "unit",
        "help": "Exclude pass-through sales taxes; use a hypothetical net receipt.",
        "integer": false
      },
      {
        "key": "greenCost",
        "label": "Green coffee cost",
        "unit": "USD/green lb",
        "default": 6,
        "min": 0,
        "max": 100,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "yield",
        "label": "Roasting yield",
        "unit": "%",
        "default": 84,
        "min": 1,
        "max": 100,
        "step": 1,
        "group": "unit",
        "help": "84% means 1 lb of green coffee becomes 0.84 lb roasted.",
        "integer": false
      },
      {
        "key": "processing",
        "label": "Processing / bag",
        "unit": "USD/bag",
        "default": 1.1,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "packaging",
        "label": "Packaging / bag",
        "unit": "USD/bag",
        "default": 0.9,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "feeRate",
        "label": "Payment fee rate",
        "unit": "%",
        "default": 3,
        "min": 0,
        "max": 100,
        "step": 0.1,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "feeFixed",
        "label": "Payment fee / unit",
        "unit": "USD/unit",
        "default": 0.1,
        "min": 0,
        "max": 100,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "quantity",
        "label": "Units per operating day",
        "unit": "units/day",
        "default": null,
        "min": 0,
        "max": 100000,
        "step": 1,
        "group": "scale",
        "help": "Unknown until entered; modeled averages may be fractional.",
        "integer": false
      },
      {
        "key": "periods",
        "label": "Operating days / month",
        "unit": "days/month",
        "default": 22,
        "min": 1,
        "max": 31,
        "step": 1,
        "group": "scale",
        "help": null,
        "integer": true
      },
      {
        "key": "fixed",
        "label": "Fixed monthly budget",
        "unit": "USD/month",
        "default": null,
        "min": 0,
        "max": 1000000,
        "step": 100,
        "group": "scale",
        "help": "Include scheduled labor and occupancy; add every fixed cost you intend to model.",
        "integer": false
      }
    ],
    "unitFields": [
      "sale",
      "greenCost",
      "yield",
      "processing",
      "packaging",
      "feeRate",
      "feeFixed"
    ],
    "sampleScale": {
      "quantity": 55,
      "periods": 22,
      "fixed": 11000
    },
    "formula": "Green cost per bag = 0.75 lb ÷ roasting yield × green cost/lb. Listed cost = green cost + processing + packaging + payment fees. Contribution = net sale − listed cost. Monthly remainder = contribution × bags/day × days − fixed budget.",
    "exclusions": "Acquisition, fixed plant and equipment, unsold bags, customer-service overhead and any shipping subsidy. Processing allocation assumes a usable batch size; low utilization changes cost.",
    "scaleHelp": "Unit defaults are invented. Operating volume and fixed budget start unknown. Buyer-paid outbound shipping is treated as neutral."
  },
  {
    "id": "wholesale",
    "name": "Wholesale roaster",
    "lesson": "Compare contribution after delivery and service with cash conversion. Larger volume can require more cash before payment arrives.",
    "evidence": [
      "Merchant's public wholesale offering",
      "Published minimums or service terms where available",
      "Do not infer customer identities or contract prices"
    ],
    "question": "A wholesale account offers more volume at a lower price. Test the order after route cost, capacity and payment terms.",
    "questions": [
      "Does the largest unit margin also have the lowest capital need?",
      "How does yield loss change contribution across channels?",
      "What happens when a wholesale customer pays later than the roaster pays suppliers?"
    ],
    "costMode": "coffee",
    "unit": "One delivered roasted pound",
    "shortUnit": "roasted lb",
    "scaleUnit": "roasted lb/day",
    "periodLabel": "Operating days per month",
    "breakEvenLabel": "Whole roasted lb / day at break-even",
    "weightLb": 1,
    "fields": [
      {
        "key": "sale",
        "label": "Net sale per unit",
        "unit": "USD/unit",
        "default": 12,
        "min": 0,
        "max": 10000,
        "step": 0.01,
        "group": "unit",
        "help": "Exclude pass-through sales taxes; use a hypothetical net receipt.",
        "integer": false
      },
      {
        "key": "greenCost",
        "label": "Green coffee cost",
        "unit": "USD/green lb",
        "default": 6,
        "min": 0,
        "max": 100,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "yield",
        "label": "Roasting yield",
        "unit": "%",
        "default": 84,
        "min": 1,
        "max": 100,
        "step": 1,
        "group": "unit",
        "help": "84% means 1 lb of green coffee becomes 0.84 lb roasted.",
        "integer": false
      },
      {
        "key": "processing",
        "label": "Processing / roasted lb",
        "unit": "USD/lb",
        "default": 1,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "packaging",
        "label": "Bulk packaging / lb",
        "unit": "USD/lb",
        "default": 0.2,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "delivery",
        "label": "Delivery allocation / lb",
        "unit": "USD/lb",
        "default": 0.5,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "collection",
        "label": "Payment + collection allowance",
        "unit": "USD/lb",
        "default": 0.15,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "quantity",
        "label": "Units per operating day",
        "unit": "units/day",
        "default": null,
        "min": 0,
        "max": 100000,
        "step": 1,
        "group": "scale",
        "help": "Unknown until entered; modeled averages may be fractional.",
        "integer": false
      },
      {
        "key": "periods",
        "label": "Operating days / month",
        "unit": "days/month",
        "default": 22,
        "min": 1,
        "max": 31,
        "step": 1,
        "group": "scale",
        "help": null,
        "integer": true
      },
      {
        "key": "fixed",
        "label": "Fixed monthly budget",
        "unit": "USD/month",
        "default": null,
        "min": 0,
        "max": 1000000,
        "step": 100,
        "group": "scale",
        "help": "Include scheduled labor and occupancy; add every fixed cost you intend to model.",
        "integer": false
      }
    ],
    "unitFields": [
      "sale",
      "greenCost",
      "yield",
      "processing",
      "packaging",
      "delivery",
      "collection"
    ],
    "sampleScale": {
      "quantity": 80,
      "periods": 22,
      "fixed": 4000
    },
    "formula": "Green cost = 1 roasted lb ÷ roasting yield × green cost/lb. Listed cost = green + processing + packaging + delivery + collection. Monthly remainder = contribution per lb × lb/day × days − fixed budget.",
    "exclusions": "Fixed plant, sales labor, account support, bad debt beyond the allowance and financing. Payment terms and delivery density must be modeled separately.",
    "scaleHelp": "Unit defaults are invented. Volume and fixed budget start unknown. Payment timing and working capital require their own analysis."
  },
  {
    "id": "subscription",
    "name": "Coffee subscription",
    "lesson": "Separate repeat contribution from acquisition payback. Count actual fulfilled cycles, including skips and refunds, before estimating lifetime value.",
    "evidence": [
      "Published subscription cadence and terms",
      "Bag size and shipping policy",
      "No invented churn or subscriber counts"
    ],
    "question": "Compare a shipping-included subscription with local pickup. Model postage and replacement acquisition separately.",
    "questions": [
      "Does the largest unit margin also have the lowest capital need?",
      "How does yield loss change contribution across channels?",
      "What happens when a wholesale customer pays later than the roaster pays suppliers?"
    ],
    "costMode": "coffee",
    "unit": "One shipping-included, two-bag shipment (1.5 roasted lb)",
    "shortUnit": "shipment",
    "scaleUnit": "active subscribers",
    "periodLabel": "Shipments per subscriber per month",
    "breakEvenLabel": "Whole active subscribers at break-even",
    "weightLb": 1.5,
    "fields": [
      {
        "key": "sale",
        "label": "Net sale per unit",
        "unit": "USD/unit",
        "default": 36,
        "min": 0,
        "max": 10000,
        "step": 0.01,
        "group": "unit",
        "help": "Exclude pass-through sales taxes; use a hypothetical net receipt.",
        "integer": false
      },
      {
        "key": "greenCost",
        "label": "Green coffee cost",
        "unit": "USD/green lb",
        "default": 6,
        "min": 0,
        "max": 100,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "yield",
        "label": "Roasting yield",
        "unit": "%",
        "default": 84,
        "min": 1,
        "max": 100,
        "step": 1,
        "group": "unit",
        "help": "84% means 1 lb of green coffee becomes 0.84 lb roasted.",
        "integer": false
      },
      {
        "key": "processing",
        "label": "Processing / shipment",
        "unit": "USD/shipment",
        "default": 2.2,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "packaging",
        "label": "Product packaging / shipment",
        "unit": "USD/shipment",
        "default": 1.8,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "shipping",
        "label": "Postage / shipment",
        "unit": "USD/shipment",
        "default": 5,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "handling",
        "label": "Fulfillment handling",
        "unit": "USD/shipment",
        "default": 0.8,
        "min": 0,
        "max": 100000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "feeRate",
        "label": "Payment fee rate",
        "unit": "%",
        "default": 3,
        "min": 0,
        "max": 100,
        "step": 0.1,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "feeFixed",
        "label": "Payment fee / unit",
        "unit": "USD/unit",
        "default": 0.1,
        "min": 0,
        "max": 100,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "acquisition",
        "label": "New-subscriber acquisition",
        "unit": "USD/subscriber",
        "default": 20,
        "min": 0,
        "max": 10000,
        "step": 0.01,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "replacement",
        "label": "Replacement rate / cycle",
        "unit": "%",
        "default": 5,
        "min": 0,
        "max": 100,
        "step": 1,
        "group": "unit",
        "help": "Invented lost-member rate for a constant active base; not measured churn.",
        "integer": false
      },
      {
        "key": "quantity",
        "label": "Active subscribers",
        "unit": "subscribers",
        "default": null,
        "min": 0,
        "max": 100000,
        "step": 1,
        "group": "scale",
        "help": "Unknown until entered; modeled averages may be fractional.",
        "integer": false
      },
      {
        "key": "periods",
        "label": "Shipments per subscriber / month",
        "unit": "cycles/month",
        "default": 1,
        "min": 0.25,
        "max": 4,
        "step": 0.25,
        "group": "scale",
        "help": null,
        "integer": false
      },
      {
        "key": "fixed",
        "label": "Fixed monthly budget",
        "unit": "USD/month",
        "default": null,
        "min": 0,
        "max": 1000000,
        "step": 100,
        "group": "scale",
        "help": "Include scheduled labor and occupancy; add every fixed cost you intend to model.",
        "integer": false
      }
    ],
    "unitFields": [
      "sale",
      "greenCost",
      "yield",
      "processing",
      "packaging",
      "shipping",
      "handling",
      "feeRate",
      "feeFixed",
      "acquisition",
      "replacement"
    ],
    "sampleScale": {
      "quantity": 180,
      "periods": 1,
      "fixed": 1800
    },
    "formula": "Green cost = 1.5 roasted lb ÷ yield × green cost/lb. Shipment cost includes processing, packaging, postage, handling and payment. Replacement acquisition = lost-member rate × acquisition cost. Monthly units = active subscribers × shipments/subscriber.",
    "exclusions": "Platform and fixed labor, discounts, skips, refund losses, failed payments and changes in shipping zones. The replacement rates and acquisition cost are invented assumptions, not observed churn or a lifetime-value estimate.",
    "scaleHelp": "Unit defaults are invented. Active subscribers and fixed budget start unknown. Replacement acquisition assumes a constant active base; it is not lifetime value."
  },
  {
    "id": "licensed-retail",
    "name": "Licensed retail lens",
    "unit": "One hypothetical net retail transaction",
    "shortUnit": "transaction",
    "scaleUnit": "transactions/day",
    "periodLabel": "Operating days per month",
    "breakEvenLabel": "Whole transactions / day at break-even",
    "costMode": "percentage",
    "fields": [
      {
        "key": "sale",
        "label": "Net sale per unit",
        "unit": "USD/unit",
        "default": null,
        "min": 0,
        "max": 10000,
        "step": 0.01,
        "group": "unit",
        "help": "Exclude pass-through sales taxes; use a hypothetical net receipt.",
        "integer": false
      },
      {
        "key": "variableRate",
        "label": "Listed variable cost share",
        "unit": "% of base net sale",
        "default": null,
        "min": 0,
        "max": 100,
        "step": 1,
        "group": "unit",
        "help": null,
        "integer": false
      },
      {
        "key": "quantity",
        "label": "Units per operating day",
        "unit": "units/day",
        "default": null,
        "min": 0,
        "max": 100000,
        "step": 1,
        "group": "scale",
        "help": "Unknown until entered; modeled averages may be fractional.",
        "integer": false
      },
      {
        "key": "periods",
        "label": "Operating days / month",
        "unit": "days/month",
        "default": null,
        "min": 1,
        "max": 31,
        "step": 1,
        "group": "scale",
        "help": null,
        "integer": true
      },
      {
        "key": "fixed",
        "label": "Fixed monthly budget",
        "unit": "USD/month",
        "default": null,
        "min": 0,
        "max": 1000000,
        "step": 100,
        "group": "scale",
        "help": "Include scheduled labor and occupancy; add every fixed cost you intend to model.",
        "integer": false
      }
    ],
    "unitFields": [
      "sale",
      "variableRate"
    ],
    "sampleScale": null,
    "lesson": "Compare constraints with coffee using the separately sourced case. A numerical resemblance does not establish similar tax treatment, payment access or license requirements.",
    "question": "Which assumptions can coffee and licensed retail share, and which require different evidence?",
    "questions": [
      "How does license geography change the catchment question?",
      "Which pass-through taxes must be excluded from revenue before making a comparison?",
      "How does a dated assortment differ from live stock?"
    ],
    "evidence": [
      "The separately verified dispensary case and its own license sources",
      "Dated public assortment sources; no stock or shop revenue inference",
      "Applicable public rules and clearly defined net sales and cost assumptions"
    ],
    "formula": "This generic teaching worksheet uses net sale × units, listed variable cost share, and a fixed budget. All inputs start unknown; enter assumptions to inspect the arithmetic. It is not a tax, licensing or payment-eligibility model.",
    "exclusions": "Product and local tax mechanics, financing, payment restrictions, license eligibility and any unlisted compliance cost are not modeled. No coffee-channel cost data is imported. Real regulated-retail questions need the separate case and its sources.",
    "scaleHelp": "All figures start unknown. Enter your own hypothetical assumptions. The separate dispensary case remains a draft; no stock, sales or business-specific figures are supplied here."
  }
];
export const SOURCE_FACTS = [
  {
    "id": "us-retail-coffee-price",
    "title": "U.S. retail coffee prices",
    "display_value": "+6.1% year over year",
    "unit": "percent change",
    "geography": "U.S. city average",
    "period": "August 2025 to August 2026",
    "kind": "official published statistic",
    "source_id": "bls-us-coffee-202608",
    "summary": "The national coffee CPI-U category increased 6.1% over twelve months. Its August month-to-month change was −0.9% before seasonal adjustment.",
    "limitations": "It is not a café menu-price index, wholesale bean quote, dollar price per pound, local demand measure or shop margin.",
    "url": "https://www.bls.gov/news.release/cpi.t02.htm",
    "observed_on": "2026-10-03"
  },
  {
    "id": "la-food-away-price",
    "title": "Los Angeles food service price backdrop",
    "display_value": "+2.4% year over year",
    "unit": "percent change",
    "geography": "Los Angeles–Long Beach–Anaheim; Los Angeles and Orange counties",
    "period": "August 2025 to August 2026",
    "kind": "official published statistic",
    "source_id": "bls-la-cpi-202608",
    "summary": "The area's food-away-from-home CPI-U increased 2.4% over twelve months and was unchanged from July to August.",
    "limitations": "The metro index is broader than coffee, is not seasonally adjusted, and has a smaller sample than the national CPI. It does not measure an El Segundo café or compare price levels between cities.",
    "url": "https://www.bls.gov/regions/west/news-release/consumerpriceindex_losangeles.htm",
    "observed_on": "2026-10-03"
  },
  {
    "id": "california-general-wage-floor",
    "title": "California general wage floor",
    "display_value": "$16.90/hour",
    "unit": "USD per hour",
    "geography": "California",
    "period": "Effective January 1, 2026",
    "kind": "official published rule",
    "source_id": "ca-dir-minimum-wage-2026",
    "summary": "California's general minimum wage is $16.90 per hour for employers outside a higher industry or local wage requirement.",
    "limitations": "Some localities and industries have higher requirements. Do not apply this general floor to every café or chain; verify the workplace and applicable rules. The calculator’s $19,000 fixed budget is an invented teaching assumption, not a statutory wage or reported shop payroll.",
    "url": "https://www.dir.ca.gov/dlse/FAQ_MinimumWage.htm",
    "observed_on": "2026-10-03"
  },
  {
    "id": "el-segundo-resident-context",
    "title": "El Segundo resident context",
    "display_value": "16,379 residents",
    "unit": "estimated residents",
    "geography": "El Segundo city, California",
    "period": "July 1, 2025 estimate (V2025); income period 2020–2024",
    "kind": "official published estimate",
    "source_id": "census-el-segundo-quickfacts",
    "summary": "Census estimates 16,379 city residents on July 1, 2025. The 2020–2024 median household income is $150,737 in 2024 dollars.",
    "limitations": "City residents are not the population of the 25-mile atlas. Household income is not individual purchasing power; neither figure counts café customers, commuters, airport visitors or daytime workers. Five-year income estimates are historical averages.",
    "url": "https://www.census.gov/quickfacts/fact/table/elsegundocitycalifornia/PST045224",
    "observed_on": "2026-10-03"
  },
  {
    "id": "global-coffee-forecast",
    "title": "Global supply outlook",
    "display_value": "189.7m / 179.7m bags",
    "unit": "million 60-kilogram bags",
    "geography": "World",
    "period": "USDA July 2026 forecast for 2026/27",
    "kind": "official forecast",
    "source_id": "usda-coffee-july-2026",
    "summary": "USDA forecasts 2026/27 world coffee production at 189.7 million bags and consumption at 179.7 million bags; each bag is 60 kilograms.",
    "limitations": "Forecasts can change. Marketing-year calendars vary by country. Production minus consumption is not a shop profit, delivered inventory forecast or complete stocks/trade accounting. Do not splice these figures with ICO coffee-year balances without explaining their different periods and methods.",
    "url": "https://apps.fas.usda.gov/psdonline/circulars/coffee.pdf",
    "observed_on": "2026-10-03"
  },
  {
    "id": "green-coffee-indicator",
    "title": "Global green-coffee price signal",
    "display_value": "287.29 US cents/lb",
    "unit": "US cents per pound",
    "geography": "ICO international composite",
    "period": "August 2026 monthly average",
    "kind": "official published market indicator",
    "source_id": "ico-cmr-202608",
    "summary": "ICO's composite green-coffee indicator averaged 287.29 US cents per pound in August, compared with 287.26 in July.",
    "limitations": "The composite is not the invoice price of a specialty lot or roasted bag. Differentials, quality, contracts, currency, freight, yield loss and timing affect a roaster's actual cost.",
    "url": "https://www.ico.org/documents/cy2025-26/cmr-0826-e.pdf",
    "observed_on": "2026-10-03"
  }
];
