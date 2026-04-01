"""
Global Ticker Universe Builder v3
Subsectors: Oil & Gas, Uranium & Nuclear, Precious Metals,
            Industrial & Battery Metals, Agriculture & Potash,
            Water & Water Rights, REIT
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
    "LEU",    # Centrus Energy - uranium enrichment
    "CCJ",    # Cameco (US listing)
    "UEC",    # Uranium Energy Corp
    "UUUU",   # Energy Fuels
    "DNN",    # Denison Mines (US listing)
    "NXE",    # NexGen Energy (US listing)
    "OKLO",   # Oklo - advanced nuclear
    "SMR",    # NuScale Power - small modular reactors
    "VST",    # Vistra (nuclear fleet operator)
    "CEG",    # Constellation Energy (largest US nuclear fleet)
    "TLN",    # Talen Energy (nuclear)
    "BWXT",   # BWX Technologies - nuclear components
    "GEV",    # GE Vernova - nuclear turbines/services
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
    # Diversified ag & grain
    "ADM", "BG", "CTVA", "DE", "AGCO", "ANDE", "INGR", "DAR",
    "CALM", "VITL", "LMNR", "ALCO", "AVD", "SMG",
    # Potash & fertilizer (primary focus)
    "NTR",    # Nutrien - world's largest potash producer
    "MOS",    # Mosaic - potash & phosphate
    "CF",     # CF Industries - nitrogen fertilizer
    "FMC",    # FMC Corp - crop chemicals
    "IPI",    # Intrepid Potash - only US pure-play potash producer
    "ICL",    # ICL Group - potash, phosphate (Israel, US-listed)
    "RKDA",   # Arcadia Biosciences - crop traits
    "AMAM",   # Amergent Hospitality (formerly K+S AG exposure via ADR)
]

US_WATER = [
    # Water utilities
    "AWK",    # American Water Works - largest US water utility
    "WTRG",   # Essential Utilities - water & wastewater
    "CWT",    # California Water Service - drought-exposed regions
    "AWR",    # American States Water - water utility + military contracts
    "HTO",    # H2O America (fka SJW Group) - Silicon Valley water
    "MSEX",   # Middlesex Water - NJ/DE water utility
    "YORW",   # York Water - oldest US water utility (est. 1816)
    "ARTNA",  # Artesian Resources - DE/MD/PA water
    "SBS",    # Sabesp - Brazilian water utility (US ADR)
    # Water technology & infrastructure
    "XYL",    # Xylem - water tech, pumps, treatment
    "BMI",    # Badger Meter - smart water metering
    "WMS",    # Advanced Drainage Systems - stormwater mgmt
    "MWA",    # Mueller Water Products - water infrastructure
    "FERG",   # Ferguson - plumbing/water distribution
    "ECL",    # Ecolab - water treatment chemicals
    "A",      # Agilent Technologies - water quality testing
    "WDDD",   # Consolidated Water - Caribbean/US desalination
    "PNR",    # Pentair - water treatment & filtration
    # Water rights / land with water
    "PICO",   # PICO Holdings - water rights in Nevada/Arizona
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

CA_AGRICULTURE = [
    "NTR.TO",   # Nutrien - HQ'd in Saskatoon, world's largest potash
    "POT.TO",   # (legacy ticker, may not resolve - Nutrien absorbed it)
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

AU_PRECIOUS_METALS = [
    "NST.AX", "EVN.AX", "SBM.AX", "RRL.AX", "CMM.AX",
]

AU_INDUSTRIAL_BATTERY_METALS = [
    "BHP.AX", "RIO.AX", "FMG.AX", "S32.AX", "SFR.AX", "29M.AX",
    "MIN.AX", "PLS.AX", "LTR.AX", "IGO.AX", "LYC.AX", "ILU.AX", "SYR.AX",
]

AU_AGRICULTURE = [
    "GNC.AX", "ELD.AX", "NUF.AX", "AAC.AX",
    "IPL.AX",   # Incitec Pivot - fertilizer & explosives
]

AU_REITS = [
    "GMG.AX", "SCG.AX", "GPT.AX", "MGR.AX", "SGP.AX", "DXS.AX",
    "CHC.AX", "CLW.AX", "CIP.AX", "BWP.AX", "CQR.AX", "NSR.AX",
]

# =====================================================================
# SOUTH AFRICAN STOCKS
# =====================================================================

ZA_PRECIOUS_METALS = [
    "ANG.JO", "GFI.JO", "HAR.JO", "DRD.JO", "PAN.JO",
    "IMP.JO", "SSW.JO",
]

ZA_INDUSTRIAL_BATTERY_METALS = ["KIO.JO", "SOL.JO", "EXX.JO"]
ZA_ENERGY = ["TGA.JO"]

# =====================================================================
# UK / LONDON STOCKS
# =====================================================================

UK_ENERGY = ["SHEL.L", "BP.L", "CNE.L", "TLW.L", "HBR.L", "ENQ.L", "HTG.L"]

UK_PRECIOUS_METALS = ["FRES.L", "HOC.L"]

UK_INDUSTRIAL_BATTERY_METALS = [
    "RIO.L", "GLEN.L", "AAL.L", "ANTO.L", "BHP.L", "HMSO.L",
]

UK_WATER = [
    "SVT.L",    # Severn Trent - major UK water utility
    "UU.L",     # United Utilities - NW England water
    "PNNL.L",   # Pennon Group - SW England water
]

UK_REITS = ["LAND.L", "BLND.L", "SGRO.L", "UTG.L", "BBOX.L", "SUPR.L"]

# =====================================================================
# INTERNATIONAL - OTHER
# =====================================================================

# Israel - potash
IL_AGRICULTURE = [
    "ICL",      # ICL Group - potash/phosphate (also in US list, deduped)
]

# Germany - potash
DE_AGRICULTURE = [
    "SDF.DE",   # K+S AG - major European potash producer
]

# Hong Kong
HK_ENERGY = ["0883.HK", "2688.HK", "0857.HK", "0386.HK"]
HK_INDUSTRIAL_METALS = ["1088.HK", "3993.HK", "1171.HK", "2600.HK"]
HK_OTHER = ["0267.HK", "1208.HK"]

# France - water
FR_WATER = [
    "VEOEY",    # Veolia - world's largest water company (US ADR)
]

# Singapore REITs
SG_REITS = [
    "A17U.SI", "N2IU.SI", "ME8U.SI", "C38U.SI", "BUOU.SI",
    "J69U.SI", "M44U.SI", "H78.SI",
]

# Brazil - potash
BR_AGRICULTURE = [
    "VALE",     # Vale - exploring potash in Brazil
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
    add(US_REITS, "Real Estate", "REIT", "US")

    # Canada
    add(CA_ENERGY, "Energy", "Oil & Gas", "TSX")
    add(CA_URANIUM_NUCLEAR, "Energy", "Uranium & Nuclear", "TSX")
    add(CA_PRECIOUS_METALS, "Materials", "Precious Metals", "TSX")
    add(CA_INDUSTRIAL_BATTERY_METALS, "Materials", "Industrial & Battery Metals", "TSX")
    add(CA_AGRICULTURE, "Materials", "Agriculture & Potash", "TSX")
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
    add(UK_WATER, "Utilities", "Water & Water Rights", "LSE")
    add(UK_REITS, "Real Estate", "REIT", "LSE")

    # Germany
    add(DE_AGRICULTURE, "Materials", "Agriculture & Potash", "XETRA")

    # France
    add(FR_WATER, "Utilities", "Water & Water Rights", "US")

    # Brazil
    add(BR_AGRICULTURE, "Materials", "Agriculture & Potash", "US")

    # Hong Kong
    add(HK_ENERGY, "Energy", "Oil & Gas", "HKEX")
    add(HK_INDUSTRIAL_METALS, "Materials", "Industrial & Battery Metals", "HKEX")
    add(HK_OTHER, "Energy/Materials", "Mixed", "HKEX")

    # Singapore
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
