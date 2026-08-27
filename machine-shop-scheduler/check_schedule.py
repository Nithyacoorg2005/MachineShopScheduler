import json, sys
sys.path.insert(0, '.')
from src.engine import Dispatcher
from src.models.machine import Machine
from src.models.operator import Operator
from src.models.order import Order
from src.models.routing import RoutingStep
from datetime import datetime
from collections import Counter

with open('data/generated/baseline.json') as f:
    data = json.load(f)

machines  = [Machine(**m) for m in data['machines']]
operators = [Operator(**o) for o in data['operators']]
orders = []
for od in data['orders']:
    steps = [RoutingStep(**s) for s in od['routing']]
    clean = {k: v for k, v in od.items() if k != 'routing'}
    orders.append(Order(**clean, routing=steps))
config = dict(data.get('shop_config', {}))
config['changeover_matrix'] = data.get('changeover_matrix', {})
config['replan_change_penalty_lambda'] = config.get('replan_change_penalty_lambda', 500)

dispatcher = Dispatcher(machines, operators, orders, config)
schedule = dispatcher.dispatch()

current_time = datetime.fromisoformat('2026-08-27T06:00:00+00:00')
future = [op for op in schedule if datetime.fromisoformat(op['start_time'].replace('Z', '+00:00')) > current_time]
mill_drill = [op for op in future if op['machine_id'] in ('MILL-01', 'DRILL-02')]

print('MILL-01 / DRILL-02 ops after cutoff:')
for op in mill_drill:
    print(f"  {op['machine_id']}  {op['order_id']}  {op['start_time']} -> {op['end_time']}")

print()
print('Machine distribution of all 36 future ops:')
counts = Counter(op['machine_id'] for op in future)
for machine, count in sorted(counts.items(), key=lambda x: x[0] or ''):
    print(f'  {machine}: {count}')