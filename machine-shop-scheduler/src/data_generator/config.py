SEED = 20260821

TOTAL_MACHINES = 14
TOTAL_OPERATORS = 40
TARGET_ORDERS = 25

MACHINE_TYPES = {
    "CNC_LATHE": {"count": 5, "hourly_cost": 800, "mtbf_hrs_range": (100, 200), "mttr_hrs_range": (1, 3)},
    "MILLING":   {"count": 4, "hourly_cost": 950, "mtbf_hrs_range": (150, 250), "mttr_hrs_range": (2, 4)},
    "DRILL":     {"count": 4, "hourly_cost": 400, "mtbf_hrs_range": (250, 350), "mttr_hrs_range": (0.5, 1.5)},
    "GRINDING":  {"count": 1, "hourly_cost": 1200, "mtbf_hrs_range": (100, 140), "mttr_hrs_range": (6, 10)}
}

SHIFTS = {
    "A": {"start": "06:00", "end": "14:30"},
    "B": {"start": "14:30", "end": "23:00"}
}
GRINDER_CERTIFIED_COUNT = 3
ABSENTEEISM_PROBABILITY_RANGE = (0.01, 0.05)
GRINDER_TARGET_UTILIZATION_RANGE = (0.90, 0.96)

GRINDER_CAPACITY_HOURS = 204

ORDER_QTY_RANGE = (200, 5000)
ROUTING_OPS_RANGE = (3, 6)
ROUTING_NEEDS_GRINDER_PROB = 0.85 

TIER_1_PROBABILITY = 0.28  

TIER_1_MULTIPLIERS = {
    "volume_skew": 2.5,        
    "unit_margin_range": (35, 50),
    "daily_penalty_range": (10000, 50000)
}

TIER_2_MULTIPLIERS = {
    "volume_skew": 1.0,        
    "unit_margin_range": (55, 85),
    "daily_penalty_range": (0, 2000)
}

PART_FAMILIES = ["FAM_A", "FAM_B", "FAM_C", "FAM_D"]
SAME_FAMILY_SETUP_MINS = 20
CROSS_FAMILY_SETUP_MINS_RANGE = (120, 180)

REPLAN_CHANGE_PENALTY_LAMBDA = 500 
DIESEL_GENERATOR_MULTIPLIER = 3.0
OVERTIME_MULTIPLIER = 1.5