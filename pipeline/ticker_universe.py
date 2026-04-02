"""
Global Ticker Universe Builder v6
19 Subsectors: Oil & Gas, Uranium & Nuclear, Precious Metals,
               Industrial & Battery Metals, Agriculture & Potash,
               Water & Water Rights, Defense & Aerospace,
               US Manufacturing, REIT, Infrastructure & Construction,
               Data Centers & AI Infrastructure, Shipping & Maritime,
               Healthcare & Biotech, Banks & Financial Services,
               Technology & Software, Consumer & Retail,
               Transportation & Logistics, Electric & Renewable Utilities,
               Other
"""

# =====================================================================
# US STOCKS
# =====================================================================

US_ENERGY = [
    "XOM", "CVX", "COP", "EOG", "SLB", "MPC", "PSX", "VLO", "OXY",
    "DVN", "FANG", "HAL", "BKR", "CTRA", "APA", "OVV", "EQT", "AR",
    "RRC", "SM", "MTDR", "CHRD", "PR", "MGY", "GPOR", "NOG",
    "TRGP", "WMB", "KMI", "OKE", "ET", "EPD", "MPLX", "PAA", "AM", "DTM",
    "HESM", "USAC", "NRP", "DMLP", "CLNE", "REX",
]

US_URANIUM_NUCLEAR = [
    "LEU", "CCJ", "UEC", "UUUU", "DNN", "NXE", "OKLO", "SMR",
    "VST", "CEG", "TLN", "BWXT", "GEV",
]

US_PRECIOUS_METALS = [
    "NEM", "RGLD", "FNV", "WPM", "GOLD", "AEM", "KGC", "BTG",
    "HL", "CDE", "AG", "PAAS", "EXK", "FSM", "USAS", "SVM", "OR",
]

US_INDUSTRIAL_BATTERY_METALS = [
    "FCX", "NUE", "STLD", "CLF", "AA", "RS", "MP", "CENX",
    "LAC", "ALB", "SQM", "TECK", "HBM", "VIST",
]

US_AGRICULTURE = [
    "ADM", "BG", "CTVA", "DE", "AGCO", "ANDE", "INGR", "DAR",
    "CALM", "VITL", "LMNR", "ALCO", "AVD", "SMG",
    "NTR", "MOS", "CF", "FMC", "IPI", "ICL", "RKDA",
]

US_WATER = [
    "AWK", "WTRG", "CWT", "AWR", "HTO", "MSEX", "YORW", "ARTNA", "SBS",
    "XYL", "BMI", "WMS", "MWA", "FERG", "ECL", "A", "PNR",
]

US_DEFENSE = [
    # Prime contractors
    "LMT",    # Lockheed Martin
    "RTX",    # RTX (Raytheon)
    "NOC",    # Northrop Grumman
    "GD",     # General Dynamics
    "BA",     # Boeing
    "LHX",    # L3Harris Technologies
    "HII",    # Huntington Ingalls
    "TDG",    # TransDigm Group
    "HWM",    # Howmet Aerospace
    "TXT",    # Textron
    "LDOS",   # Leidos
    "SAIC",   # Science Applications International
    "BAH",    # Booz Allen Hamilton
    "MRCY",   # Mercury Systems
    "KTOS",   # Kratos Defense & Security
    "AVAV",   # AeroVironment - drones
    "RKLB",   # Rocket Lab - space launch
    "PL",     # Planet Labs - satellite imagery
    "IRDM",   # Iridium Communications - satellite
    "PLTR",   # Palantir - defense AI/analytics
    "AXON",   # Axon Enterprise - law enforcement tech
    # Cybersecurity
    "CRWD",   # CrowdStrike
    "PANW",   # Palo Alto Networks
    "FTNT",   # Fortinet
    "ZS",     # Zscaler
    "S",      # SentinelOne
    "NET",    # Cloudflare
    "CYBR",   # CyberArk
    "MNDT",   # Mandiant (if still listed)
    "TENB",   # Tenable
    "RPD",    # Rapid7
]

US_MANUFACTURING = [
    # Industrial / heavy machinery
    "CAT",    # Caterpillar
    "EMR",    # Emerson Electric
    "ROK",    # Rockwell Automation
    "ETN",    # Eaton Corporation
    "PH",     # Parker Hannifin
    "DOV",    # Dover Corporation
    "ITW",    # Illinois Tool Works
    "GE",     # GE Aerospace
    "HON",    # Honeywell
    "MMM",    # 3M
    "SWK",    # Stanley Black & Decker
    "IR",     # Ingersoll Rand
    "AME",    # AMETEK
    "GNRC",   # Generac Holdings
    "CMI",    # Cummins
    "OSK",    # Oshkosh Corporation
    "TTC",    # Toro Company
    # Semiconductors / chips (US manufacturers)
    "INTC",   # Intel
    "TXN",    # Texas Instruments
    "MU",     # Micron Technology
    "MCHP",   # Microchip Technology
    "ON",     # ON Semiconductor
    "ADI",    # Analog Devices
    "NXPI",   # NXP Semiconductors
    "SWKS",   # Skyworks Solutions
    "QRVO",   # Qorvo
    "GFS",    # GlobalFoundries
    "WOLF",   # Wolfspeed - SiC chips
    "LSCC",   # Lattice Semiconductor
    # Consumer goods manufacturers
    "PG",     # Procter & Gamble
    "CL",     # Colgate-Palmolive
    "KMB",    # Kimberly-Clark
    "CHD",    # Church & Dwight
    "CLX",    # Clorox
    "HELE",   # Helen of Troy
    "SPB",    # Spectrum Brands
    "ENR",    # Energizer Holdings
    "WHR",    # Whirlpool
    "LEG",    # Leggett & Platt
]

US_REITS = [
    "PLD", "AMT", "EQIX", "CCI", "PSA", "SPG", "O", "DLR", "WELL", "VICI",
    "AVB", "EQR", "VTR", "ARE", "ESS", "MAA", "UDR", "CPT", "IRM", "SUI",
    "ELS", "INVH", "CUBE", "EXR", "REG", "FRT", "KIM", "BXP", "VNO",
    "SLG", "HIW", "KRC", "DEI", "CUZ", "OHI", "SBRA", "HR",
    "DOC", "NNN", "EPRT", "ADC", "GTY", "STAG", "WPC", "GLPI", "RHP",
    "HST", "RLJ", "PEB", "XHR", "DRH", "SHO", "APLE",
]

# =====================================================================
# CANADIAN STOCKS
# =====================================================================

CA_ENERGY = [
    "SU.TO", "CNQ.TO", "IMO.TO", "CVE.TO", "TOU.TO", "ARX.TO", "WCP.TO",
    "BTE.TO", "TVE.TO", "PEY.TO", "FRU.TO",
    "BIR.TO", "KEL.TO", "SGY.TO", "AAV.TO",
    "PPL.TO", "TRP.TO", "ENB.TO", "KEY.TO",
]

CA_URANIUM_NUCLEAR = [
    "CCO.TO", "DML.TO", "NXE.TO", "EFR.TO", "URE.TO",
    "FUU.V", "PTU.V",
]

CA_PRECIOUS_METALS = [
    "ABX.TO", "K.TO", "AGI.TO", "WDO.TO", "BTO.TO", "OGC.TO",
    "LUG.TO", "IMG.TO", "EDV.TO", "SII.TO",
]

CA_INDUSTRIAL_BATTERY_METALS = [
    "FM.TO", "HBM.TO", "CS.TO", "LUN.TO", "IVN.TO", "ERO.TO",
    "LAC.TO", "SLI.V", "CNC.V",
]

CA_AGRICULTURE = ["NTR.TO"]

CA_DEFENSE = [
    "CAE.TO",   # CAE Inc - flight simulation/training
    "MDA.TO",   # MDA Space - satellite systems
]

CA_REITS = [
    "REI-UN.TO", "HR-UN.TO", "AP-UN.TO", "CAR-UN.TO", "BEI-UN.TO",
    "DIR-UN.TO", "GRT-UN.TO", "SRU-UN.TO", "CRT-UN.TO",
    "SIA.TO", "IIP-UN.TO", "PLZ-UN.TO", "PMZ-UN.TO",
]

# =====================================================================
# AUSTRALIAN STOCKS
# =====================================================================

AU_ENERGY = ["WDS.AX", "STO.AX", "BPT.AX", "KAR.AX", "STX.AX", "CVN.AX"]

AU_URANIUM_NUCLEAR = [
    "PDN.AX", "BOE.AX", "BMN.AX", "DYL.AX", "LOT.AX",
    "ERA.AX", "AGE.AX", "PEN.AX",
]

AU_PRECIOUS_METALS = ["NST.AX", "EVN.AX", "SBM.AX", "RRL.AX", "CMM.AX"]

AU_INDUSTRIAL_BATTERY_METALS = [
    "BHP.AX", "RIO.AX", "FMG.AX", "S32.AX", "SFR.AX", "29M.AX",
    "MIN.AX", "PLS.AX", "LTR.AX", "IGO.AX", "LYC.AX", "ILU.AX", "SYR.AX",
]

AU_AGRICULTURE = ["GNC.AX", "ELD.AX", "NUF.AX", "AAC.AX"]

AU_REITS = [
    "GMG.AX", "SCG.AX", "GPT.AX", "MGR.AX", "SGP.AX", "DXS.AX",
    "CHC.AX", "CLW.AX", "CIP.AX", "BWP.AX", "CQR.AX", "NSR.AX",
]

# =====================================================================
# SOUTH AFRICAN STOCKS
# =====================================================================

ZA_PRECIOUS_METALS = [
    "ANG.JO", "GFI.JO", "HAR.JO", "DRD.JO", "PAN.JO", "IMP.JO", "SSW.JO",
]

ZA_INDUSTRIAL_BATTERY_METALS = ["KIO.JO", "SOL.JO", "EXX.JO"]
ZA_ENERGY = ["TGA.JO"]

# =====================================================================
# UK / LONDON STOCKS
# =====================================================================

UK_ENERGY = ["SHEL.L", "BP.L", "CNE.L", "TLW.L", "HBR.L", "ENQ.L", "HTG.L"]
UK_PRECIOUS_METALS = ["FRES.L", "HOC.L"]
UK_INDUSTRIAL_BATTERY_METALS = ["RIO.L", "GLEN.L", "AAL.L", "ANTO.L", "BHP.L", "HMSO.L"]

UK_DEFENSE = [
    "BA.L",     # BAE Systems
    "RR.L",     # Rolls-Royce
    "MGGT.L",   # Meggitt (if still listed)
    "QQ.L",     # QinetiQ
]

UK_WATER = ["SVT.L", "UU.L", "PNNL.L"]
UK_REITS = ["LAND.L", "BLND.L", "SGRO.L", "UTG.L", "BBOX.L", "SUPR.L"]

# =====================================================================
# INTERNATIONAL - OTHER
# =====================================================================

DE_AGRICULTURE = ["SDF.DE"]
HK_ENERGY = ["0883.HK", "2688.HK", "0857.HK", "0386.HK"]
HK_INDUSTRIAL_METALS = ["1088.HK", "3993.HK", "1171.HK", "2600.HK"]
HK_OTHER = ["0267.HK", "1208.HK"]
FR_WATER = ["VEOEY"]
BR_AGRICULTURE = ["VALE"]

EU_DEFENSE = [
    "AIR.PA",   # Airbus
    "RHM.DE",   # Rheinmetall
    "HO.PA",    # Thales
    "SAB.MC",   # SAAB (if on Madrid, else SAB-B.ST)
]

# =====================================================================
# NEW SECTORS
# =====================================================================

# --- Infrastructure & Construction ---
US_INFRASTRUCTURE = [
    # Aggregates & building materials
    "VMC",    # Vulcan Materials
    "MLM",    # Martin Marietta
    "CX",     # CEMEX
    "EXP",    # Eagle Materials
    "SMID",   # Smith-Midland
    "SUM",    # Summit Materials
    "USLM",   # US Lime & Minerals
    # Engineering & construction
    "ACM",    # AECOM
    "J",      # Jacobs Solutions
    "FLR",    # Fluor Corporation
    "KBR",    # KBR Inc
    "MTZ",    # MasTec
    "PWR",    # Quanta Services
    "EME",    # EMCOR Group
    "PRIM",   # Primoris Services
    "DY",     # Dycom Industries
    "STRL",   # Sterling Infrastructure
    "GVA",    # Granite Construction
    "ROAD",   # Construction Partners
    "WMS",    # Advanced Drainage Systems
    # Heavy equipment & rental
    "URI",    # United Rentals
    "HRI",    # Herc Holdings
    # Infrastructure focused REITs/funds
    "PAVE",   # Global X Infrastructure ETF (not a stock but useful)
    # Steel & structural
    "ATKR",   # Atkore
    "VMI",    # Valmont Industries
    "AWI",    # Armstrong World Industries
    "BLDR",   # Builders FirstSource
    "FBIN",   # Fortune Brands Innovations
]

CA_INFRASTRUCTURE = [
    "ARE.TO",   # Aecon Group
    "BDT.TO",   # Bird Construction
    "STN.TO",   # Stantec
    "WSP.TO",   # WSP Global
]

EU_INFRASTRUCTURE = [
    "VIE.PA",   # Vinci (France)
    "BN.PA",    # Danone — actually Bouygues
    "HO.PA",    # Bouygues — already in defense, skip
    "STO3.DE",  # Strabag (Austria, traded Frankfurt)
    "FER.MC",   # Ferrovial (Spain)
    "HOLN.SW",  # Holcim (Switzerland)
    "SIE.DE",   # Siemens
    "SGRO.L",   # already in REITs, skip duplicate
]

# --- Data Centers & AI Infrastructure ---
US_DATACENTERS = [
    # Pure-play data center operators
    "DLR",    # Digital Realty — already in REITs but key DC play
    "EQIX",   # Equinix — already in REITs
    # Data center infrastructure
    "VRT",    # Vertiv Holdings — cooling/power for DCs
    "POWL",   # Powell Industries — electrical equipment
    "AAON",   # AAON — HVAC for data centers
    "GEV",    # GE Vernova — already in nuclear, power generation
    # AI/cloud infrastructure
    "NVDA",   # NVIDIA
    "AMD",    # AMD
    "AVGO",   # Broadcom
    "MRVL",   # Marvell Technology
    "ANET",   # Arista Networks — DC networking
    "CDNS",   # Cadence Design Systems
    "SNPS",   # Synopsys
    "SMCI",   # Super Micro Computer — AI servers
    "DELL",   # Dell Technologies
    "HPE",    # Hewlett Packard Enterprise
    # Power for data centers
    "ETN",    # Eaton — already in manufacturing
    "GNRC",   # Generac — already in manufacturing
    "AES",    # AES Corporation — renewable power
    "NEE",    # NextEra Energy
    "SO",     # Southern Company
    "DUK",    # Duke Energy
    # Fiber & connectivity
    "AMT",    # American Tower — already in REITs
    "SBAC",   # SBA Communications
    "UNIT",   # Uniti Group
    "LUMN",   # Lumen Technologies
    # Cloud platforms (for completeness)
    "CRM",    # Salesforce
    "ORCL",   # Oracle — cloud + DC buildout
    "DDOG",   # Datadog — monitoring
]

# --- Shipping & Maritime ---
US_SHIPPING = [
    # Tankers
    "STNG",   # Scorpio Tankers
    "INSW",   # International Seaways
    "FRO",    # Frontline
    "TNK",    # Teekay Tankers
    "NAT",    # Nordic American Tankers
    "DHT",    # DHT Holdings
    "EURN",   # Euronav (now CMB.Tech)
    "ASC",    # Ardmore Shipping
    "TNP",    # Tsakos Energy Navigation
    # Dry bulk
    "GOGL",   # Golden Ocean
    "SBLK",   # Star Bulk Carriers
    "GNK",    # Genco Shipping
    "DSX",    # Diana Shipping
    "SB",     # Safe Bulkers
    "EDRY",   # EuroDry
    # Container
    "ZIM",    # ZIM Integrated Shipping
    "MATX",   # Matson
    "DAC",    # Danaos Corporation
    "TRMD",   # TORM (product tankers)
    # LNG carriers
    "FLNG",   # FLEX LNG
    "GLNG",   # Golar LNG
    "KNOP",   # KNOT Offshore Partners
    # Offshore & marine services
    "TDW",    # Tidewater
    "HLX",    # Helix Energy Solutions
    "CLVR",   # Clever Leaves (not shipping — skip)
    "NMM",    # Navios Maritime Partners
    # Shipbuilding
    "HII",    # Huntington Ingalls — already in defense
    "GD",     # General Dynamics — already in defense
    "KEX",    # Kirby Corporation — inland marine
]

EU_SHIPPING = [
    "HLAG.DE",  # Hapag-Lloyd (Germany)
    "MAERSK-B.CO", # Maersk (Denmark)
]

# --- Healthcare & Biotech ---
US_HEALTHCARE = [
    # Big pharma
    "JNJ",    # Johnson & Johnson
    "PFE",    # Pfizer
    "MRK",    # Merck
    "ABBV",   # AbbVie
    "LLY",    # Eli Lilly
    "BMY",    # Bristol-Myers Squibb
    "AMGN",   # Amgen
    "GILD",   # Gilead Sciences
    "REGN",   # Regeneron
    "VRTX",   # Vertex Pharmaceuticals
    "BIIB",   # Biogen
    "ZTS",    # Zoetis
    # Biotech
    "MRNA",   # Moderna
    "BNTX",   # BioNTech
    "SGEN",   # Seagen (if still listed)
    "ALNY",   # Alnylam Pharmaceuticals
    "SRPT",   # Sarepta Therapeutics
    "RARE",   # Ultragenyx
    "IONS",   # Ionis Pharmaceuticals
    "BMRN",   # BioMarin
    "NBIX",   # Neurocrine Biosciences
    "PCVX",   # Vaxcyte
    "ARGX",   # argenx (Dutch, US-listed)
    # Medical devices
    "MDT",    # Medtronic
    "SYK",    # Stryker
    "BSX",    # Boston Scientific
    "ISRG",   # Intuitive Surgical
    "ABT",    # Abbott Labs
    "EW",     # Edwards Lifesciences
    "BDX",    # Becton Dickinson
    "BAX",    # Baxter International
    "ZBH",    # Zimmer Biomet
    "HOLX",   # Hologic
    # Health services & insurance
    "UNH",    # UnitedHealth
    "ELV",    # Elevance Health
    "CI",     # Cigna
    "HUM",    # Humana
    "CNC",    # Centene — note conflict with CA mining ticker
    "HCA",    # HCA Healthcare
    "THC",    # Tenet Healthcare
    # Healthcare IT
    "VEEV",   # Veeva Systems
    "DOCS",   # Doximity
]

EU_HEALTHCARE = [
    "ROG.SW",   # Roche (Switzerland)
    "NOVN.SW",  # Novartis (Switzerland)
    "AZN.L",    # AstraZeneca (UK)
    "GSK.L",    # GSK (UK)
    "SAN.PA",   # Sanofi (France)
    "NOVO-B.CO", # Novo Nordisk (Denmark)
    "BAYN.DE",  # Bayer (Germany)
]

# --- Banks & Financial Services ---
US_BANKS = [
    # Money center / large banks
    "JPM",    # JPMorgan Chase
    "BAC",    # Bank of America
    "WFC",    # Wells Fargo
    "C",      # Citigroup
    "GS",     # Goldman Sachs
    "MS",     # Morgan Stanley
    "USB",    # US Bancorp
    "TFC",    # Truist Financial
    "PNC",    # PNC Financial
    "COF",    # Capital One
    "BK",     # Bank of New York Mellon
    "STT",    # State Street
    "SCHW",   # Charles Schwab
    # Regional banks (relevant for RE lending)
    "FITB",   # Fifth Third Bank
    "KEY",    # KeyCorp — note conflict with CA energy
    "RF",     # Regions Financial
    "HBAN",   # Huntington Bancshares
    "MTB",    # M&T Bank
    "CFG",    # Citizens Financial
    "ZION",   # Zions Bancorp
    "FHN",    # First Horizon
    "EWBC",   # East West Bancorp
    "WAL",    # Western Alliance
    "PACW",   # PacWest (if still listed)
    "FRC",    # First Republic (if still listed)
    "COLB",   # Columbia Banking
    "SIVB",   # SVB Financial (if still listed)
    "GBCI",   # Glacier Bancorp
    "SFBS",   # ServisFirst Bancshares
    "CADE",   # Cadence Bank
    # Insurance
    "BRK-B",  # Berkshire Hathaway
    "PGR",    # Progressive
    "ALL",    # Allstate
    "TRV",    # Travelers
    "MET",    # MetLife
    "AIG",    # AIG
    "AFL",    # Aflac
    # Asset managers & exchanges
    "BLK",    # BlackRock
    "TROW",   # T. Rowe Price
    "IVZ",    # Invesco
    "BEN",    # Franklin Templeton
    "ICE",    # Intercontinental Exchange
    "CME",    # CME Group
    "NDAQ",   # Nasdaq Inc
]

CA_BANKS = [
    "RY.TO",    # Royal Bank of Canada
    "TD.TO",    # Toronto-Dominion
    "BNS.TO",   # Bank of Nova Scotia
    "BMO.TO",   # Bank of Montreal
    "CM.TO",    # CIBC
    "MFC.TO",   # Manulife
    "SLF.TO",   # Sun Life Financial
]

EU_BANKS = [
    "HSBA.L",   # HSBC (UK)
    "LLOY.L",   # Lloyds Banking Group (UK)
    "BARC.L",   # Barclays (UK)
    "BNP.PA",   # BNP Paribas (France)
    "SAN.MC",   # Santander (Spain) — note conflict with Sanofi
    "DBK.DE",   # Deutsche Bank (Germany)
    "UBSG.SW",  # UBS (Switzerland)
    "CSGN.SW",  # Credit Suisse (if still listed)
    "ING",      # ING Group (US-listed ADR)
]

# --- Technology (Software, SaaS, Mega-Cap) ---
US_TECHNOLOGY = [
    # Mega-cap tech
    "AAPL",   # Apple
    "MSFT",   # Microsoft
    "GOOGL",  # Alphabet
    "META",   # Meta Platforms
    "AMZN",   # Amazon
    "TSLA",   # Tesla
    "NFLX",   # Netflix
    # Enterprise software / SaaS
    "CRM",    # Salesforce — may dupe with DC list
    "ADBE",   # Adobe
    "NOW",    # ServiceNow
    "INTU",   # Intuit
    "WDAY",   # Workday
    "TEAM",   # Atlassian
    "HUBS",   # HubSpot
    "ZM",     # Zoom
    "SNOW",   # Snowflake
    "MDB",    # MongoDB
    "DDOG",   # Datadog — may dupe
    "NET",    # Cloudflare — may dupe with defense
    "SHOP",   # Shopify
    "SQ",     # Block (Square)
    "PYPL",   # PayPal
    "COIN",   # Coinbase
    "HOOD",   # Robinhood
    # Semiconductors (leaders not in manufacturing list)
    "TSM",    # TSMC
    "ASML",   # ASML
    "KLAC",   # KLA Corp
    "LRCX",   # Lam Research
    "AMAT",   # Applied Materials
    # IT services & consulting
    "ACN",    # Accenture
    "IBM",    # IBM
    "CTSH",   # Cognizant
    "EPAM",   # EPAM Systems
    "GLOB",   # Globant
]

# --- Consumer & Retail ---
US_CONSUMER = [
    # Big box / general retail
    "WMT",    # Walmart
    "COST",   # Costco
    "TGT",    # Target
    "DG",     # Dollar General
    "DLTR",   # Dollar Tree
    "BJ",     # BJ's Wholesale
    # Ecommerce / marketplace
    "AMZN",   # Amazon — dupe, will be deduped
    "EBAY",   # eBay
    "ETSY",   # Etsy
    "W",      # Wayfair
    "CHWY",   # Chewy
    # Grocery & staples
    "KR",     # Kroger
    "ACI",    # Albertsons
    "SFM",    # Sprouts Farmers Market
    "GO",     # Grocery Outlet
    # Restaurants & food service
    "MCD",    # McDonald's
    "SBUX",   # Starbucks
    "CMG",    # Chipotle
    "YUM",    # Yum! Brands
    "DPZ",    # Domino's
    "QSR",    # Restaurant Brands (Burger King, Tim Hortons)
    "WING",   # Wingstop
    "CAVA",   # CAVA Group
    "SHAK",   # Shake Shack
    "DIN",    # Dine Brands (Applebees, IHOP)
    "TXRH",   # Texas Roadhouse
    "DENN",   # Denny's
    # Specialty retail
    "HD",     # Home Depot
    "LOW",    # Lowe's
    "TJX",    # TJ Maxx
    "ROST",   # Ross Stores
    "BBY",    # Best Buy
    "ULTA",   # Ulta Beauty
    "NKE",    # Nike
    "LULU",   # Lululemon
    # Consumer brands
    "KO",     # Coca-Cola
    "PEP",    # PepsiCo
    "MNST",   # Monster Beverage
    "STZ",    # Constellation Brands
    "TAP",    # Molson Coors
    "HSY",    # Hershey
    "GIS",    # General Mills
    "K",      # Kellanova — note conflict with CA gold ticker
    "CPB",    # Campbell Soup
]

# --- Transportation & Logistics ---
US_TRANSPORTATION = [
    # Railroads
    "UNP",    # Union Pacific
    "CSX",    # CSX Corporation
    "NSC",    # Norfolk Southern
    "CP",     # Canadian Pacific Kansas City
    # Trucking & freight
    "ODFL",   # Old Dominion Freight Line
    "SAIA",   # Saia Inc
    "XPO",    # XPO Inc
    "SNDR",   # Schneider National
    "WERN",   # Werner Enterprises
    "JBHT",   # J.B. Hunt Transport
    "KNX",    # Knight-Swift
    "LSTR",   # Landstar System
    # Package delivery
    "UPS",    # UPS
    "FDX",    # FedEx
    # Airlines
    "DAL",    # Delta Air Lines
    "UAL",    # United Airlines
    "LUV",    # Southwest Airlines
    "AAL",    # American Airlines
    "JBLU",   # JetBlue
    "ALK",    # Alaska Air
    "RYAAY",  # Ryanair (Ireland, US-listed)
    # Ride-hailing & mobility
    "UBER",   # Uber
    "LYFT",   # Lyft
    # Logistics & supply chain
    "CHRW",   # C.H. Robinson
    "EXPD",   # Expeditors International
    "GXO",    # GXO Logistics
    "FWRD",   # Forward Air
]

CA_TRANSPORTATION = [
    "CNR.TO",   # Canadian National Railway
    "TFI.TO",   # TFI International
    "AC.TO",    # Air Canada
]

# --- Utilities (Electric, Renewable, Multi) ---
US_UTILITIES = [
    # Electric utilities
    "NEE",    # NextEra Energy — may dupe with DC list
    "SO",     # Southern Company — may dupe
    "DUK",    # Duke Energy — may dupe
    "D",      # Dominion Energy
    "AEP",    # American Electric Power
    "EXC",    # Excelion
    "SRE",    # Sempra
    "PCG",    # PG&E
    "ED",     # Consolidated Edison
    "WEC",    # WEC Energy
    "ES",     # Eversource Energy
    "AEE",    # Ameren
    "CMS",    # CMS Energy
    "PPL",    # PPL Corporation
    "FE",     # FirstEnergy
    "NRG",    # NRG Energy
    "ATO",    # Atmos Energy (gas)
    # Renewables
    "ENPH",   # Enphase Energy
    "SEDG",   # SolarEdge
    "FSLR",   # First Solar
    "RUN",    # Sunrun
    "NOVA",   # Sunnova Energy
    "CSIQ",   # Canadian Solar
    "JKS",    # JinkoSolar
    "PLUG",   # Plug Power
    "BE",     # Bloom Energy
    "ARRY",   # Array Technologies
    # Independent power producers
    "VST",    # Vistra — may dupe with nuclear
    "CEG",    # Constellation Energy — may dupe
    "TLN",    # Talen Energy — may dupe
    "ORA",    # Ormat Technologies (geothermal)
]

UK_UTILITIES = [
    "SSE.L",    # SSE
    "NG.L",     # National Grid
]

SG_REITS = [
    "A17U.SI", "N2IU.SI", "ME8U.SI", "C38U.SI", "BUOU.SI",
    "J69U.SI", "M44U.SI", "H78.SI",
]


def build_universe():
    universe = []
    def add(tickers, sector, subsector, exchange):
        for t in tickers:
            universe.append({"ticker": t, "sector": sector, "subsector": subsector, "exchange": exchange})

    # US
    add(US_ENERGY, "Energy", "Oil & Gas", "US")
    add(US_URANIUM_NUCLEAR, "Energy", "Uranium & Nuclear", "US")
    add(US_PRECIOUS_METALS, "Materials", "Precious Metals", "US")
    add(US_INDUSTRIAL_BATTERY_METALS, "Materials", "Industrial & Battery Metals", "US")
    add(US_AGRICULTURE, "Materials", "Agriculture & Potash", "US")
    add(US_WATER, "Utilities", "Water & Water Rights", "US")
    add(US_DEFENSE, "Industrials", "Defense & Aerospace", "US")
    add(US_MANUFACTURING, "Industrials", "US Manufacturing", "US")
    add(US_REITS, "Real Estate", "REIT", "US")

    # Canada
    add(CA_ENERGY, "Energy", "Oil & Gas", "TSX")
    add(CA_URANIUM_NUCLEAR, "Energy", "Uranium & Nuclear", "TSX")
    add(CA_PRECIOUS_METALS, "Materials", "Precious Metals", "TSX")
    add(CA_INDUSTRIAL_BATTERY_METALS, "Materials", "Industrial & Battery Metals", "TSX")
    add(CA_AGRICULTURE, "Materials", "Agriculture & Potash", "TSX")
    add(CA_DEFENSE, "Industrials", "Defense & Aerospace", "TSX")
    add(CA_REITS, "Real Estate", "REIT", "TSX")

    # Australia
    add(AU_ENERGY, "Energy", "Oil & Gas", "ASX")
    add(AU_URANIUM_NUCLEAR, "Energy", "Uranium & Nuclear", "ASX")
    add(AU_PRECIOUS_METALS, "Materials", "Precious Metals", "ASX")
    add(AU_INDUSTRIAL_BATTERY_METALS, "Materials", "Industrial & Battery Metals", "ASX")
    add(AU_AGRICULTURE, "Materials", "Agriculture & Potash", "ASX")
    add(AU_REITS, "Real Estate", "REIT", "ASX")

    # South Africa
    add(ZA_PRECIOUS_METALS, "Materials", "Precious Metals", "JSE")
    add(ZA_INDUSTRIAL_BATTERY_METALS, "Materials", "Industrial & Battery Metals", "JSE")
    add(ZA_ENERGY, "Energy", "Oil & Gas", "JSE")

    # UK
    add(UK_ENERGY, "Energy", "Oil & Gas", "LSE")
    add(UK_PRECIOUS_METALS, "Materials", "Precious Metals", "LSE")
    add(UK_INDUSTRIAL_BATTERY_METALS, "Materials", "Industrial & Battery Metals", "LSE")
    add(UK_DEFENSE, "Industrials", "Defense & Aerospace", "LSE")
    add(UK_WATER, "Utilities", "Water & Water Rights", "LSE")
    add(UK_REITS, "Real Estate", "REIT", "LSE")

    # Europe
    add(EU_DEFENSE, "Industrials", "Defense & Aerospace", "EU")
    add(DE_AGRICULTURE, "Materials", "Agriculture & Potash", "XETRA")

    # New sectors — US
    add(US_INFRASTRUCTURE, "Industrials", "Infrastructure & Construction", "US")
    add(US_DATACENTERS, "Technology", "Data Centers & AI Infrastructure", "US")
    add(US_SHIPPING, "Industrials", "Shipping & Maritime", "US")
    add(US_HEALTHCARE, "Healthcare", "Healthcare & Biotech", "US")
    add(US_BANKS, "Financials", "Banks & Financial Services", "US")

    # New sectors — Canada
    add(CA_INFRASTRUCTURE, "Industrials", "Infrastructure & Construction", "TSX")
    add(CA_BANKS, "Financials", "Banks & Financial Services", "TSX")

    # New sectors — Europe
    add(EU_INFRASTRUCTURE, "Industrials", "Infrastructure & Construction", "EU")
    add(EU_SHIPPING, "Industrials", "Shipping & Maritime", "EU")
    add(EU_HEALTHCARE, "Healthcare", "Healthcare & Biotech", "EU")
    add(EU_BANKS, "Financials", "Banks & Financial Services", "EU")

    # Additional sectors — US
    add(US_TECHNOLOGY, "Technology", "Technology & Software", "US")
    add(US_CONSUMER, "Consumer", "Consumer & Retail", "US")
    add(US_TRANSPORTATION, "Industrials", "Transportation & Logistics", "US")
    add(US_UTILITIES, "Utilities", "Electric & Renewable Utilities", "US")

    # Additional sectors — Canada
    add(CA_TRANSPORTATION, "Industrials", "Transportation & Logistics", "TSX")

    # Additional sectors — UK
    add(UK_UTILITIES, "Utilities", "Electric & Renewable Utilities", "LSE")

    # Other
    add(FR_WATER, "Utilities", "Water & Water Rights", "US")
    add(BR_AGRICULTURE, "Materials", "Agriculture & Potash", "US")
    add(HK_ENERGY, "Energy", "Oil & Gas", "HKEX")
    add(HK_INDUSTRIAL_METALS, "Materials", "Industrial & Battery Metals", "HKEX")
    add(HK_OTHER, "Energy/Materials", "Other", "HKEX")
    add(SG_REITS, "Real Estate", "REIT", "SGX")

    seen = set()
    deduped = []
    for item in universe:
        if item["ticker"] not in seen:
            seen.add(item["ticker"])
            deduped.append(item)
    return deduped


if __name__ == "__main__":
    u = build_universe()
    print(f"Total tickers: {len(u)}")
    from collections import Counter
    for label, key in [("Exchange", "exchange"), ("Subsector", "subsector")]:
        print(f"\nBy {label}:")
        for k, v in Counter(t[key] for t in u).most_common():
            print(f"  {k}: {v}")
